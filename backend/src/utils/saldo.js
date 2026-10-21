import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';

// Calcula el saldo de una cita a partir de sus pagos válidos (REGISTRADO).
// Estados financieros (RF-10): PENDIENTE, PARCIAL, PAGADO. No se almacenan.
export async function calcularSaldo(citaId) {
  const cita = await Appointment.findById(citaId);
  if (!cita) return null;

  const pagos = await Payment.find({ cita: citaId, estado: 'REGISTRADO' });
  const pagadoCentavos = pagos.reduce((acc, p) => acc + p.montoCentavos, 0);
  const precioCentavos = cita.precioCentavos;
  const saldoCentavos = Math.max(precioCentavos - pagadoCentavos, 0);

  let estadoSaldo = 'PENDIENTE';
  if (precioCentavos === 0 || pagadoCentavos >= precioCentavos) estadoSaldo = 'PAGADO';
  else if (pagadoCentavos > 0) estadoSaldo = 'PARCIAL';

  return {
    citaId: cita._id,
    precioCentavos,
    pagadoCentavos,
    saldoCentavos,
    estadoSaldo
  };
}
