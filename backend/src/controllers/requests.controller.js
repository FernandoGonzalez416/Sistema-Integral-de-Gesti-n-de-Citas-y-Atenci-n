import AppointmentRequest, { ESTADOS_SOLICITUD } from '../models/AppointmentRequest.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import mongoose from 'mongoose';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FRANJAS = ['', 'MANANA', 'TARDE'];
const MAX_DIAS_ADELANTE = 90;

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// POST /api/solicitudes-cita — público. Guarda la solicitud del portal.
// Las reglas se validan aquí también: el formulario del portal no es la única puerta.
// B4: email y servicio son obligatorios (el personal necesita ambos para contactar
// al solicitante y convertir la solicitud en cita).
export async function crear(req, res, next) {
  try {
    const { nombre, telefono, email, servicio, fechaPreferida, mensaje, franja, primeraVez } = req.body || {};
    // Sin coerción: los campos de texto deben ser texto (no se convierten a "[object Object]").
    for (const [campo, valor] of [['nombre', nombre], ['telefono', telefono], ['email', email], ['mensaje', mensaje]]) {
      if (valor !== undefined && typeof valor !== 'string') {
        return res.status(400).json({ ok: false, message: `El campo ${campo} debe ser texto` });
      }
    }
    const nombreLimpio = (nombre ?? '').trim();
    const telefonoLimpio = (telefono ?? '').trim();
    if (!nombreLimpio || !telefonoLimpio) {
      return res.status(400).json({ ok: false, message: 'Nombre y teléfono requeridos' });
    }
    if (nombreLimpio.length < 2 || nombreLimpio.length > 80) {
      return res.status(400).json({ ok: false, message: 'El nombre debe tener entre 2 y 80 caracteres' });
    }
    const digitos = telefonoLimpio.replace(/\D/g, '');
    if (!/^[\d\s+()-]+$/.test(telefonoLimpio) || digitos.length < 7 || digitos.length > 15) {
      return res.status(400).json({ ok: false, message: 'Teléfono inválido' });
    }
    const emailLimpio = (email ?? '').trim();
    if (!emailLimpio) {
      return res.status(400).json({ ok: false, message: 'Email requerido' });
    }
    if (emailLimpio.length > 254 || !EMAIL_RE.test(emailLimpio)) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    if (mensaje && mensaje.length > 1000) {
      return res.status(400).json({ ok: false, message: 'El mensaje no puede superar 1000 caracteres' });
    }
    if (franja !== undefined && !FRANJAS.includes(franja)) {
      return res.status(400).json({ ok: false, message: 'Franja horaria inválida' });
    }
    if (!servicio) {
      return res.status(400).json({ ok: false, message: 'Servicio requerido' });
    }
    if (!idValido(servicio)) {
      return res.status(400).json({ ok: false, message: 'Servicio inválido' });
    }
    const servicioExiste = await Service.findOne({ _id: servicio, activo: true });
    if (!servicioExiste) {
      return res.status(400).json({ ok: false, message: 'Servicio no disponible' });
    }
    let fecha = null;
    if (fechaPreferida) {
      fecha = new Date(fechaPreferida);
      if (isNaN(fecha)) {
        return res.status(400).json({ ok: false, message: 'Fecha preferida inválida' });
      }
      // Solo se valida contra el calendario cuando llega como AAAA-MM-DD (lo que envía el portal).
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(fechaPreferida))) {
        const hoy = new Date();
        const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const dias = Math.round((fecha.getTime() - hoyUtc) / 86400000);
        if (dias < 0) {
          return res.status(400).json({ ok: false, message: 'La fecha preferida no puede estar en el pasado' });
        }
        if (dias > MAX_DIAS_ADELANTE) {
          return res.status(400).json({ ok: false, message: `La fecha preferida no puede superar ${MAX_DIAS_ADELANTE} días` });
        }
        const horario = await Schedule.findOne({ dia: fecha.getUTCDay() });
        const hayHorarios = await Schedule.exists({ activo: true });
        if (hayHorarios && (!horario || !horario.activo)) {
          return res.status(400).json({ ok: false, message: 'Ese día no hay atención. Elige un día del horario de atención' });
        }
      }
    }
    const solicitud = new AppointmentRequest({
      nombre: nombreLimpio,
      telefono: telefonoLimpio,
      email: emailLimpio.toLowerCase(),
      servicio,
      fechaPreferida: fecha,
      franja: franja || '',
      primeraVez: primeraVez === true,
      mensaje: mensaje || ''
    });
    await solicitud.save();
    res.status(201).json({
      ok: true,
      mensaje: 'Solicitud recibida. Te contactaremos para confirmar.',
      referencia: `SOL-${String(solicitud._id).slice(-6).toUpperCase()}`
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/solicitudes-cita — personal autorizado (recepción y admin la atienden).
// B4: filtro por estado (validado) para la bandeja de solicitudes.
export async function listar(req, res, next) {
  try {
    const { estado } = req.query;
    if (estado && !ESTADOS_SOLICITUD.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Válidos: ${ESTADOS_SOLICITUD.join(', ')}`
      });
    }
    const filtro = {};
    if (estado) filtro.estado = estado;
    const solicitudes = await AppointmentRequest.find(filtro)
      .populate('servicio', 'nombre')
      .populate('citaGenerada', 'inicio fin estado')
      .populate('atendidaPor', 'nombre email')
      .sort({ createdAt: -1 });
    res.json({ ok: true, solicitudes });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/solicitudes-cita/:id/estado — contrato legado de B1.
// Se conserva para no romper clientes existentes; el rechazo formal con motivo
// se hace con PATCH /:id/rechazar.
export async function cambiarEstado(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    const solicitud = await AppointmentRequest.findById(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    const { estado } = req.body || {};
    if (!ESTADOS_SOLICITUD.includes(estado)) {
      return res.status(400).json({ ok: false, message: `Estado inválido. Válidos: ${ESTADOS_SOLICITUD.join(', ')}` });
    }
    solicitud.estado = estado;
    await solicitud.save();
    res.json({ ok: true, solicitud });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/solicitudes-cita/:id/rechazar — rechazo explícito y atómico.
// Solo una solicitud PENDIENTE puede rechazarse; el motivo es obligatorio.
export async function rechazar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    const { motivoRechazo } = req.body || {};
    if (typeof motivoRechazo !== 'string' || !motivoRechazo.trim()) {
      return res.status(400).json({ ok: false, message: 'motivoRechazo es obligatorio' });
    }
    if (motivoRechazo.trim().length > 1000) {
      return res.status(400).json({ ok: false, message: 'motivoRechazo no puede superar 1000 caracteres' });
    }
    const solicitud = await AppointmentRequest.findById(req.params.id).select('estado');
    if (!solicitud) {
      return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    }
    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(409).json({ ok: false, message: 'Solo se pueden rechazar solicitudes PENDIENTES' });
    }
    const actualizada = await AppointmentRequest.findOneAndUpdate(
      { _id: req.params.id, estado: 'PENDIENTE' },
      {
        $set: {
          estado: 'RECHAZADA',
          motivoRechazo: motivoRechazo.trim(),
          citaGenerada: null,
          atendidaPor: req.usuario?._id || null,
          fechaAtencion: new Date()
        }
      },
      { new: true }
    )
      .populate('servicio', 'nombre')
      .populate('citaGenerada', 'inicio fin estado')
      .populate('atendidaPor', 'nombre email');
    if (!actualizada) {
      return res.status(409).json({ ok: false, message: 'Solo se pueden rechazar solicitudes PENDIENTES' });
    }
    res.json({ ok: true, solicitud: actualizada });
  } catch (e) {
    next(e);
  }
}
