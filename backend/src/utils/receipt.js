import Counter from '../models/Counter.js';
import Receipt from '../models/Receipt.js';

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

// Emite el comprobante de un pago (idempotente: un comprobante por pago).
// Si el pago ya está anulado, el comprobante nace ANULADO.
export async function emitirComprobante(pago) {
  const existente = await Receipt.findOne({ pago: pago._id });
  if (existente) return existente;

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
    if (e.code === 11000) return Receipt.findOne({ pago: pago._id });
    throw e;
  }
  return comprobante;
}
