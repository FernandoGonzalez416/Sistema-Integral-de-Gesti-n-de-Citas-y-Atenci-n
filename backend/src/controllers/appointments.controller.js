import Appointment, {
  ESTADOS_CITA,
  TRANSICIONES_CITA,
  ESTADOS_CITA_ACTIVOS
} from '../models/Appointment.js';
import AppointmentRequest from '../models/AppointmentRequest.js';
import Payment from '../models/Payment.js';
import Patient from '../models/Patient.js';
import Professional from '../models/Professional.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import PatientResponsible from '../models/PatientResponsible.js';
import mongoose from 'mongoose';
import { paginacion } from '../utils/consulta.js';
import { calcularSaldo } from '../utils/saldo.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function fechaValida(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function esDiaLaborable(fecha, horarios) {
  const diaSemana = fecha.getDay(); // 0=dom...6=sab
  const horario = horarios.find((h) => h.dia === diaSemana && h.activo);
  if (!horario) return { ok: false, motivo: 'El centro no atiende ese día' };
  const inicio = new Date(fecha);
  const [hi, mi] = horario.horaInicio.split(':').map(Number);
  const [hf, mf] = horario.horaFin.split(':').map(Number);
  inicio.setHours(hi, mi, 0, 0);
  const fin = new Date(inicio);
  fin.setHours(hf, mf, 0, 0);
  return { ok: true, inicioDia: inicio, finDia: fin };
}

// RN-01 y RN-13: solo las citas PENDIENTE/CONFIRMADA ocupan horario.
function hayTraslape(profesionalId, inicio, fin, excluirId = null) {
  const filtro = {
    profesional: profesionalId,
    estado: { $in: ESTADOS_CITA_ACTIVOS },
    $or: [{ inicio: { $lt: fin }, fin: { $gt: inicio } }]
  };
  if (excluirId) filtro._id = { $ne: excluirId };
  return Appointment.exists(filtro);
}

// RN-02, RN-11, RN-12 y RN-13.
async function validarDisponibilidad(profesionalId, inicio, fin, excluirId = null) {
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return { ok: false, mensaje: 'Fecha u hora inválida' };
  }
  if (inicio < new Date()) {
    return { ok: false, mensaje: 'No se pueden programar citas en fechas u horas pasadas' };
  }
  const horarios = await Schedule.find({ activo: true }).lean();
  const dia = esDiaLaborable(inicio, horarios);
  if (!dia.ok) return { ok: false, mensaje: dia.motivo };
  if (inicio < dia.inicioDia || fin > dia.finDia) {
    return { ok: false, mensaje: 'La cita está fuera del horario de atención del día' };
  }
  const traslape = await hayTraslape(profesionalId, inicio, fin, excluirId);
  if (traslape) return { ok: false, mensaje: 'El profesional ya tiene una cita en ese horario' };
  return { ok: true };
}

function validarTransicion(estadoActual, nuevoEstado) {
  const permitidas = TRANSICIONES_CITA[estadoActual] || [];
  if (!permitidas.includes(nuevoEstado)) {
    return `Transición no permitida: ${estadoActual} → ${nuevoEstado}`;
  }
  return null;
}

// RN-03, RN-04 y RN-14: paciente activo y, si es menor, responsable activo.
async function validarPacienteParaCita(paciente) {
  if (!paciente || !paciente.activo) {
    return { ok: false, mensaje: 'Paciente no encontrado o inactivo' };
  }
  if (paciente.edad !== null && paciente.edad < 18) {
    const tieneResp = await PatientResponsible.exists({ paciente: paciente._id, activo: true });
    if (!tieneResp) {
      return { ok: false, mensaje: 'Paciente menor de 18 años debe tener al menos un responsable activo' };
    }
  }
  return { ok: true };
}

function poblarCita(id) {
  return Appointment.findById(id)
    .populate('paciente', 'nombre apellido telefono email')
    .populate('profesional', 'nombre apellido especialidad')
    .populate('servicio', 'nombre precioCentavos duracionMinutos');
}

export async function listarCitas(req, res, next) {
  try {
    const { paciente, profesional, servicio, estado, desde, hasta } = req.query;
    if (estado && !ESTADOS_CITA.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Válidos: ${ESTADOS_CITA.join(', ')}`
      });
    }
    const filtro = {};
    if (paciente) filtro.paciente = paciente;
    if (profesional) filtro.profesional = profesional;
    if (servicio) filtro.servicio = servicio;
    if (estado) filtro.estado = estado;
    if (desde || hasta) {
      filtro.inicio = {};
      if (desde) {
        const d = fechaValida(desde);
        if (!d) return res.status(400).json({ ok: false, message: 'Fecha desde inválida' });
        filtro.inicio.$gte = d;
      }
      if (hasta) {
        const h = fechaValida(hasta);
        if (!h) return res.status(400).json({ ok: false, message: 'Fecha hasta inválida' });
        filtro.inicio.$lte = h;
      }
    }
    const { page, limit, skip } = paginacion(req.query);
    const [citas, total] = await Promise.all([
      Appointment.find(filtro)
        .populate('paciente', 'nombre apellido')
        .populate('profesional', 'nombre apellido especialidad')
        .populate('servicio', 'nombre')
        .sort({ inicio: 1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filtro)
    ]);
    res.json({ ok: true, citas, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function obtenerCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const cita = await poblarCita(req.params.id);
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    res.json({ ok: true, cita });
  } catch (e) {
    next(e);
  }
}

// GET /api/citas/:id/pagos — historial de pagos de una cita + saldo actual.
export async function listarPagosCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const cita = await Appointment.findById(req.params.id).select('_id');
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const [pagos, saldo] = await Promise.all([
      Payment.find({ cita: cita._id })
        .populate('registradoPor', 'nombre email')
        .sort({ fecha: -1 }),
      calcularSaldo(cita._id)
    ]);
    res.json({ ok: true, pagos, saldo });
  } catch (e) {
    next(e);
  }
}

// GET /api/citas/:id/saldo — estado financiero calculado desde pagos válidos.
export async function obtenerSaldoCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const saldo = await calcularSaldo(req.params.id);
    if (!saldo) return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    res.json({ ok: true, saldo });
  } catch (e) {
    next(e);
  }
}

// POST /api/citas — crear cita directa. Nace PENDIENTE (RF-07).
export async function crearCita(req, res, next) {
  try {
    const { pacienteId, profesionalId, servicioId, inicio, observaciones } = req.body || {};
    if (!pacienteId || !profesionalId || !servicioId || !inicio) {
      return res.status(400).json({
        ok: false,
        message: 'pacienteId, profesionalId, servicioId e inicio requeridos'
      });
    }
    if (!idValido(pacienteId) || !idValido(profesionalId) || !idValido(servicioId)) {
      return res.status(400).json({ ok: false, message: 'IDs inválidos' });
    }
    if (observaciones !== undefined && typeof observaciones !== 'string') {
      return res.status(400).json({ ok: false, message: 'observaciones debe ser texto' });
    }
    const inicioDt = fechaValida(inicio);
    if (!inicioDt) {
      return res.status(400).json({ ok: false, message: 'Fecha/hora de inicio inválida' });
    }
    const [paciente, profesional, servicio] = await Promise.all([
      Patient.findById(pacienteId),
      Professional.findById(profesionalId),
      Service.findById(servicioId)
    ]);
    const pacienteOk = await validarPacienteParaCita(paciente);
    if (!pacienteOk.ok) return res.status(400).json({ ok: false, message: pacienteOk.mensaje });
    if (!profesional || !profesional.activo) {
      return res.status(400).json({ ok: false, message: 'Profesional no encontrado o inactivo' });
    }
    if (!servicio || !servicio.activo) {
      return res.status(400).json({ ok: false, message: 'Servicio no encontrado o inactivo' });
    }
    // RN-12: la hora de fin se calcula con la duración del servicio.
    const finDt = new Date(inicioDt.getTime() + servicio.duracionMinutos * 60000);
    const disp = await validarDisponibilidad(profesionalId, inicioDt, finDt);
    if (!disp.ok) return res.status(400).json({ ok: false, message: disp.mensaje });
    const cita = new Appointment({
      paciente: pacienteId,
      profesional: profesionalId,
      servicio: servicioId,
      inicio: inicioDt,
      fin: finDt,
      precioCentavos: servicio.precioCentavos,
      duracionMinutos: servicio.duracionMinutos,
      estado: 'PENDIENTE',
      observaciones: observaciones || ''
    });
    await cita.save();
    res.status(201).json({ ok: true, cita: await poblarCita(cita._id) });
  } catch (e) {
    next(e);
  }
}

// PUT /api/citas/:id — editar/reprogramar conservando el estado.
// RN-06: una cita COMPLETADA no puede reprogramarse. CANCELADA es terminal.
// Si cambia paciente/profesional/servicio/inicio se revalidan todas las reglas.
export async function actualizarCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const { pacienteId, profesionalId, servicioId, inicio, observaciones } = req.body || {};
    if (
      pacienteId === undefined &&
      profesionalId === undefined &&
      servicioId === undefined &&
      inicio === undefined &&
      observaciones === undefined
    ) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar' });
    }
    if (observaciones !== undefined && typeof observaciones !== 'string') {
      return res.status(400).json({ ok: false, message: 'observaciones debe ser texto' });
    }
    for (const [campo, valor] of [
      ['pacienteId', pacienteId],
      ['profesionalId', profesionalId],
      ['servicioId', servicioId]
    ]) {
      if (valor !== undefined && !idValido(valor)) {
        return res.status(400).json({ ok: false, message: `${campo} inválido` });
      }
    }
    const cita = await Appointment.findById(req.params.id);
    if (!cita) return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    if (cita.estado === 'COMPLETADA') {
      return res.status(409).json({ ok: false, message: 'Una cita COMPLETADA no puede reprogramarse (RN-06)' });
    }
    if (cita.estado === 'CANCELADA') {
      return res.status(409).json({ ok: false, message: 'Una cita CANCELADA no puede modificarse' });
    }

    const pacienteCambio = pacienteId !== undefined && String(pacienteId) !== String(cita.paciente);
    const profesionalCambio = profesionalId !== undefined && String(profesionalId) !== String(cita.profesional);
    const servicioCambio = servicioId !== undefined && String(servicioId) !== String(cita.servicio);

    if (pacienteCambio) {
      const paciente = await Patient.findById(pacienteId);
      const pacienteOk = await validarPacienteParaCita(paciente);
      if (!pacienteOk.ok) return res.status(400).json({ ok: false, message: pacienteOk.mensaje });
    }
    if (profesionalCambio) {
      const profesional = await Professional.findById(profesionalId);
      if (!profesional || !profesional.activo) {
        return res.status(400).json({ ok: false, message: 'Profesional no encontrado o inactivo' });
      }
    }
    let servicio = null;
    if (servicioCambio) {
      servicio = await Service.findById(servicioId);
      if (!servicio || !servicio.activo) {
        return res.status(400).json({ ok: false, message: 'Servicio no encontrado o inactivo' });
      }
    }

    // Si cambia el servicio se actualiza el snapshot histórico de precio/duración.
    // Si no cambia, la cita conserva el precio y la duración originales (RF-07).
    const duracionFinal = servicioCambio ? servicio.duracionMinutos : cita.duracionMinutos;
    let inicioFinal = cita.inicio;
    if (inicio !== undefined) {
      const inicioDt = fechaValida(inicio);
      if (!inicioDt) {
        return res.status(400).json({ ok: false, message: 'Fecha/hora de inicio inválida' });
      }
      inicioFinal = inicioDt;
    }
    const finFinal = new Date(inicioFinal.getTime() + duracionFinal * 60000);
    const cambioHorario = inicio !== undefined || profesionalCambio || servicioCambio;
    if (cambioHorario) {
      const disp = await validarDisponibilidad(
        profesionalCambio ? profesionalId : cita.profesional,
        inicioFinal,
        finFinal,
        cita._id
      );
      if (!disp.ok) return res.status(400).json({ ok: false, message: disp.mensaje });
    }

    if (pacienteId !== undefined) cita.paciente = pacienteId;
    if (profesionalId !== undefined) cita.profesional = profesionalId;
    if (servicioCambio) {
      cita.servicio = servicioId;
      cita.precioCentavos = servicio.precioCentavos;
      cita.duracionMinutos = servicio.duracionMinutos;
    }
    if (inicio !== undefined) cita.inicio = inicioFinal;
    cita.fin = finFinal;
    if (observaciones !== undefined) cita.observaciones = observaciones;
    // El estado se conserva: reprogramar ya no cambia el estado.
    await cita.save();
    res.json({ ok: true, cita: await poblarCita(cita._id) });
  } catch (e) {
    next(e);
  }
}

// Atender solicitud: convertir en cita a partir de un paciente ya registrado.
// Body: { pacienteId, profesionalId, servicioId?, inicio, observaciones? }
// El servicio, si no se indica, se toma de la propia solicitud.
export async function atenderSolicitud(req, res, next) {
  try {
    const { solicitudId } = req.params;
    const { pacienteId, profesionalId, servicioId, inicio, observaciones } = req.body || {};
    if (!idValido(solicitudId)) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    if (!pacienteId || !profesionalId || !inicio) {
      return res.status(400).json({ ok: false, message: 'pacienteId, profesionalId e inicio requeridos' });
    }
    if (!idValido(pacienteId) || !idValido(profesionalId)) {
      return res.status(400).json({ ok: false, message: 'IDs inválidos' });
    }
    const solicitud = await AppointmentRequest.findById(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(400).json({ ok: false, message: 'Solo se pueden atender solicitudes PENDIENTES' });
    }
    const servicioFinalId = servicioId || solicitud.servicio;
    if (!servicioFinalId) {
      return res.status(400).json({
        ok: false,
        message: 'La solicitud no tiene servicio; indique servicioId para atenderla'
      });
    }
    if (!idValido(servicioFinalId)) {
      return res.status(400).json({ ok: false, message: 'servicioId inválido' });
    }
    const inicioDt = fechaValida(inicio);
    if (!inicioDt) {
      return res.status(400).json({ ok: false, message: 'Fecha/hora de inicio inválida' });
    }
    const [paciente, profesional, servicio] = await Promise.all([
      Patient.findById(pacienteId),
      Professional.findById(profesionalId),
      Service.findById(servicioFinalId)
    ]);
    const pacienteOk = await validarPacienteParaCita(paciente);
    if (!pacienteOk.ok) return res.status(400).json({ ok: false, message: pacienteOk.mensaje });
    if (!profesional || !profesional.activo) {
      return res.status(400).json({ ok: false, message: 'Profesional no disponible' });
    }
    if (!servicio || !servicio.activo) {
      return res.status(400).json({ ok: false, message: 'Servicio no disponible' });
    }
    const finDt = new Date(inicioDt.getTime() + servicio.duracionMinutos * 60000);
    const disp = await validarDisponibilidad(profesionalId, inicioDt, finDt);
    if (!disp.ok) return res.status(400).json({ ok: false, message: disp.mensaje });
    const cita = new Appointment({
      paciente: paciente._id,
      profesional: profesionalId,
      servicio: servicioFinalId,
      inicio: inicioDt,
      fin: finDt,
      precioCentavos: servicio.precioCentavos,
      duracionMinutos: servicio.duracionMinutos,
      estado: 'PENDIENTE',
      observaciones: observaciones || '',
      solicitudOrigen: solicitudId
    });
    await cita.save();
    solicitud.estado = 'ATENDIDA';
    await solicitud.save();
    res.status(201).json({ ok: true, cita: await poblarCita(cita._id), solicitud });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/citas/:id/estado — únicas transiciones válidas (RF-07, RN-05).
export async function cambiarEstadoCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const { estado } = req.body || {};
    if (!estado || !ESTADOS_CITA.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Válidos: ${ESTADOS_CITA.join(', ')}`
      });
    }
    const cita = await Appointment.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const error = validarTransicion(cita.estado, estado);
    if (error) return res.status(400).json({ ok: false, message: error });
    // RN-27: no se cancela una cita con pagos válidos; primero se anulan.
    if (estado === 'CANCELADA') {
      const pagosValidos = await Payment.countDocuments({ cita: cita._id, estado: 'REGISTRADO' });
      if (pagosValidos > 0) {
        return res.status(409).json({
          ok: false,
          message: 'No se puede cancelar una cita con pagos válidos. Anule los pagos primero (RN-27).'
        });
      }
    }
    cita.estado = estado;
    await cita.save();
    res.json({ ok: true, cita: await poblarCita(cita._id) });
  } catch (e) {
    next(e);
  }
}
