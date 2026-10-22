import Counter from '../models/Counter.js';
import Receipt from '../models/Receipt.js';
import Payment from '../models/Payment.js';

const SECUENCIA_COMPROBANTE = 'comprobante';

// Devuelve el siguiente número de secuencia de forma atómica (a prueba de concurrencia).
async function siguienteSecuencia(nombre) {
  const contador = await Counter.findByIdAndUpdate(
    nombre,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return contador.seq;
}

// Formatea el número de comprobante: REC-AAAA-000001.
function formatearNumero(seq, fecha) {
  const year = new Date(fecha || Date.now()).getFullYear();
  return `REC-${year}-${String(seq).padStart(6, '0')}`;
}

// Copia el número del comprobante al pago (idempotente y no destructivo).
async function sincronizarNumero(pago, comprobante) {
  if (!comprobante?.numero) return;
  await Payment.updateOne(
    { _id: pago._id, numeroComprobante: { $ne: comprobante.numero } },
    { $set: { numeroComprobante: comprobante.numero } }
  );
}

// Emite el comprobante de un pago (idempotente: un comprobante por pago).
// Si el pago ya está anulado, el comprobante nace ANULADO.
// El número se copia al pago para que RF-10 lo exponga en el propio pago;
// la fuente de verdad sigue siendo Receipt.
export async function emitirComprobante(pago) {
  const existente = await Receipt.findOne({ pago: pago._id });
  if (existente) {
    await sincronizarNumero(pago, existente);
    return existente;
  }

  const seq = await siguienteSecuencia(SECUENCIA_COMPROBANTE);
  const comprobante = new Receipt({
    numero: formatearNumero(seq, pago.fecha),
    pago: pago._id,
    cita: pago.cita || null,
    paciente: pago.paciente || null,
    montoCentavos: pago.montoCentavos,
    metodo: pago.metodo,
    fecha: pago.fecha || null,
    estado: pago.estado === 'ANULADO' ? 'ANULADO' : 'EMITIDO'
  });

  try {
    await comprobante.save();
  } catch (e) {
    // Carrera con otra emisión simultánea: devolvemos el ya existente.
    if (e.code === 11000) {
      const otro = await Receipt.findOne({ pago: pago._id });
      await sincronizarNumero(pago, otro);
      return otro;
    }
    throw e;
  }
  await sincronizarNumero(pago, comprobante);
  return comprobante;
}
