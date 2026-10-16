import AppointmentRequest, { ESTADOS_SOLICITUD } from '../models/AppointmentRequest.js';
import Service from '../models/Service.js';
import mongoose from 'mongoose';

// POST /api/solicitudes — público. Guarda la solicitud del portal.
export async function crear(req, res, next) {
  try {
    const { nombre, telefono, email, servicio, fechaPreferida, mensaje } = req.body || {};
    if (!nombre || !telefono) {
      return res.status(400).json({ ok: false, message: 'Nombre y teléfono requeridos' });
    }
    if (email && !/.+@.+\..+/.test(String(email))) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    let servicioId = null;
    if (servicio) {
      if (!mongoose.isValidObjectId(servicio)) {
        return res.status(400).json({ ok: false, message: 'Servicio inválido' });
      }
      const existe = await Service.findOne({ _id: servicio, activo: true });
      if (!existe) {
        return res.status(400).json({ ok: false, message: 'Servicio no disponible' });
      }
      servicioId = servicio;
    }
    let fecha = null;
    if (fechaPreferida) {
      fecha = new Date(fechaPreferida);
      if (isNaN(fecha)) {
        return res.status(400).json({ ok: false, message: 'Fecha preferida inválida' });
      }
    }
    const solicitud = new AppointmentRequest({
      nombre: String(nombre).trim(),
      telefono: String(telefono).trim(),
      email: email || '',
      servicio: servicioId,
      fechaPreferida: fecha,
      mensaje: mensaje || ''
    });
    await solicitud.save();
    res.status(201).json({ ok: true, mensaje: 'Solicitud recibida. Te contactaremos para confirmar.' });
  } catch (e) {
    next(e);
  }
}

// GET /api/solicitudes — personal autorizado (recepción y admin la atienden).
export async function listar(req, res, next) {
  try {
    const solicitudes = await AppointmentRequest.find()
      .populate('servicio', 'nombre')
      .sort({ createdAt: -1 });
    res.json({ ok: true, solicitudes });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/solicitudes/:id — cambia estado. Personal autorizado.
export async function cambiarEstado(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
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
