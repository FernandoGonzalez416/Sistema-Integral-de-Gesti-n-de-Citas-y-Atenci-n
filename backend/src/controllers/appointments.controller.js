import Appointment, { ESTADOS_CITA, TRANSICIONES_CITA } from '../models/Appointment.js';
import AppointmentRequest from '../models/AppointmentRequest.js';
import Payment from '../models/Payment.js';
import Patient from '../models/Patient.js';
import Professional from '../models/Professional.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import PatientResponsible from '../models/PatientResponsible.js';
import mongoose from 'mongoose';
import { paginacion } from '../utils/consulta.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function esDiaLaborable(fecha, horarios) {
  const diaSemana = fecha.getDay(); // 0=dom...6=sab
  const horario = horarios.find(h => h.dia === diaSemana && h.activo);
  if (!horario) return { ok: false, motivo: 'El profesional no atiende ese día' };
  const inicio = new Date(fecha);
  const [hi, mi] = horario.horaInicio.split(':').map(Number);
  const [hf, mf] = horario.horaFin.split(':').map(Number);
  inicio.setHours(hi, mi, 0, 0);
  const fin = new Date(inicio);
  fin.setHours(hf, mf, 0, 0);
  return { ok: true, inicioDia: inicio, finDia: fin };
}

function hayTraslape(profesionalId, inicio, fin, excluirId = null) {
  const filtro = {
    profesional: profesionalId,
    estado: { $in: ['PROGRAMADA', 'CONFIRMADA', 'REPROGRAMADA'] },
    $or: [{ inicio: { $lt: fin }, fin: { $gt: inicio } }]
  };
  if (excluirId) filtro._id = { $ne: excluirId };
  return Appointment.exists(filtro);
}

async function validarDisponibilidad(profesionalId, inicio, fin, excluirId = null) {
  // 1. No fecha/hora pasada
  if (inicio < new Date()) {
    return { ok: false, mensaje: 'No se pueden programar citas en fechas u horas pasadas' };
  }
  // 2. Horarios de atención del profesional
  const horarios = await Schedule.find({ activo: true }).lean();
  const dia = esDiaLaborable(inicio, horarios);
  if (!dia.ok) return { ok: false, mensaje: dia.motivo };
  if (inicio < dia.inicioDia || fin > dia.finDia) {
    return { ok: false, mensaje: 'La cita está fuera del horario de atención del día' };
  }
  // 3. No traslape
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

export async function listarCitas(req, res, next) {
  try {
    const { paciente, profesional, servicio, estado, desde, hasta } = req.query;
    const filtro = {};
    if (paciente) filtro.paciente = paciente;
    if (profesional) filtro.profesional = profesional;
    if (servicio) filtro.servicio = servicio;
    if (estado) filtro.estado = estado;
    if (desde || hasta) {
      filtro.inicio = {};
      if (desde) filtro.inicio.$gte = new Date(desde);
      if (hasta) filtro.inicio.$lte = new Date(hasta);
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
    const cita = await Appointment.findById(req.params.id)
      .populate('paciente', 'nombre apellido telefono email')
      .populate('profesional', 'nombre apellido especialidad')
      .populate('servicio', 'nombre precioCentavos duracionMinutos');
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    res.json({ ok: true, cita });
  } catch (e) {
    next(e);
  }
}

// Crear cita directa (sin pasar por solicitud)
export async function crearCita(req, res, next) {
  try {
    const { pacienteId, profesionalId, servicioId, inicio, observaciones } = req.body || {};
    if (!pacienteId || !profesionalId || !servicioId || !inicio) {
      return res.status(400).json({ ok: false, message: 'pacienteId, profesionalId, servicioId e inicio requeridos' });
    }
    if (!idValido(pacienteId) || !idValido(profesionalId) || !idValido(servicioId)) {
      return res.status(400).json({ ok: false, message: 'IDs inválidos' });
    }
    const [paciente, profesional, servicio] = await Promise.all([
      Patient.findById(pacienteId),
      Professional.findById(profesionalId),
      Service.findById(servicioId)
    ]);
    if (!paciente || !paciente.activo) return res.status(400).json({ ok: false, message: 'Paciente no encontrado o inactivo' });
    if (!profesional || !profesional.activo) return res.status(400).json({ ok: false, message: 'Profesional no encontrado o inactivo' });
    if (!servicio || !servicio.activo) return res.status(400).json({ ok: false, message: 'Servicio no encontrado o inactivo' });
    // Validar menor de edad
    if (paciente.edad !== null && paciente.edad < 18) {
      const tieneResp = await PatientResponsible.exists({ paciente: pacienteId, activo: true });
      if (!tieneResp) return res.status(400).json({ ok: false, message: 'Paciente menor de 18 años debe tener al menos un responsable activo' });
    }
    const inicioDt = new Date(inicio);
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
      estado: 'PROGRAMADA',
      observaciones: observaciones || ''
    });
    await cita.save();
    const poblada = await Appointment.findById(cita._id)
      .populate('paciente', 'nombre apellido')
      .populate('profesional', 'nombre apellido especialidad')
      .populate('servicio', 'nombre');
    res.status(201).json({ ok: true, cita: poblada });
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
    // El servicio puede venir en el cuerpo o tomarse de la solicitud.
    const servicioFinalId = servicioId || solicitud.servicio;
    if (!servicioFinalId) {
      return res.status(400).json({ ok: false, message: 'La solicitud no tiene servicio; indique servicioId para atenderla' });
    }
    if (!idValido(servicioFinalId)) {
      return res.status(400).json({ ok: false, message: 'servicioId inválido' });
    }
    const [paciente, profesional, servicio] = await Promise.all([
      Patient.findById(pacienteId),
      Professional.findById(profesionalId),
      Service.findById(servicioFinalId)
    ]);
    if (!paciente || !paciente.activo) return res.status(400).json({ ok: false, message: 'Paciente no encontrado o inactivo' });
    if (!profesional || !profesional.activo) return res.status(400).json({ ok: false, message: 'Profesional no disponible' });
    if (!servicio || !servicio.activo) return res.status(400).json({ ok: false, message: 'Servicio no disponible' });
    // Validar menor de edad: debe tener al menos un responsable activo.
    if (paciente.edad !== null && paciente.edad < 18) {
      const tieneResp = await PatientResponsible.exists({ paciente: paciente._id, activo: true });
      if (!tieneResp) return res.status(400).json({ ok: false, message: 'Paciente menor de 18 años debe tener al menos un responsable activo' });
    }
    const inicioDt = new Date(inicio);
    if (isNaN(inicioDt)) {
      return res.status(400).json({ ok: false, message: 'Fecha/hora de inicio inválida' });
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
      estado: 'PROGRAMADA',
      observaciones: observaciones || '',
      solicitudOrigen: solicitudId
    });
    await cita.save();
    solicitud.estado = 'ATENDIDA';
    await solicitud.save();
    const poblada = await Appointment.findById(cita._id)
      .populate('paciente', 'nombre apellido')
      .populate('profesional', 'nombre apellido especialidad')
      .populate('servicio', 'nombre');
    res.status(201).json({ ok: true, cita: poblada, solicitud });
  } catch (e) {
    next(e);
  }
}

// Cambiar estado de cita
export async function cambiarEstadoCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const { estado } = req.body || {};
    if (!estado || !ESTADOS_CITA.includes(estado)) {
      return res.status(400).json({ ok: false, message: `Estado inválido. Válidos: ${ESTADOS_CITA.join(', ')}` });
    }
    const cita = await Appointment.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const error = validarTransicion(cita.estado, estado);
    if (error) return res.status(400).json({ ok: false, message: error });
    // Regla de integridad financiera: no se puede cancelar una cita con pagos ACTIVO.
    // Primero deben anularse los pagos (anulación lógica con motivo).
    if (estado === 'CANCELADA') {
      const pagosActivos = await Payment.countDocuments({ cita: cita._id, estado: 'ACTIVO' });
      if (pagosActivos > 0) {
        return res.status(409).json({
          ok: false,
          message: 'No se puede cancelar una cita con pagos activos. Anule los pagos primero.'
        });
      }
    }
    cita.estado = estado;
    await cita.save();
    res.json({ ok: true, cita });
  } catch (e) {
    next(e);
  }
}

// Reprogramar cita (cambiar inicio)
export async function reprogramarCita(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const { inicio } = req.body || {};
    if (!inicio) {
      return res.status(400).json({ ok: false, message: 'Nueva fecha/hora de inicio requerida' });
    }
    const cita = await Appointment.findById(req.params.id).populate('servicio');
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada' });
    }
    const error = validarTransicion(cita.estado, 'REPROGRAMADA');
    if (error) return res.status(400).json({ ok: false, message: error });
    const inicioDt = new Date(inicio);
    const finDt = new Date(inicioDt.getTime() + cita.duracionMinutos * 60000);
    const disp = await validarDisponibilidad(cita.profesional, inicioDt, finDt, cita._id);
    if (!disp.ok) return res.status(400).json({ ok: false, message: disp.mensaje });
    cita.inicio = inicioDt;
    cita.fin = finDt;
    cita.estado = 'REPROGRAMADA';
    await cita.save();
    res.json({ ok: true, cita });
  } catch (e) {
    next(e);
  }
}