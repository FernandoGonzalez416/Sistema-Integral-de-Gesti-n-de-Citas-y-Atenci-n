import Service from '../models/Service.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function validar(datos) {
  const { nombre, precioCentavos, duracionMinutos } = datos;
  if (!nombre || precioCentavos === undefined || duracionMinutos === undefined) {
    return 'Nombre, precioCentavos y duracionMinutos requeridos';
  }
  if (!Number.isInteger(precioCentavos) || precioCentavos < 0) {
    return 'precioCentavos debe ser entero mayor o igual a 0';
  }
  if (!Number.isInteger(duracionMinutos) || duracionMinutos < 1) {
    return 'duracionMinutos debe ser entero mayor o igual a 1';
  }
  return null;
}

// GET /api/services — solo activos. Público (lo usará el portal).
export async function listarPublico(req, res, next) {
  try {
    const servicios = await Service.find({ activo: true }).sort({ nombre: 1 });
    res.json({ ok: true, servicios });
  } catch (e) {
    next(e);
  }
}

// GET /api/services/admin/todos — activos e inactivos. Solo ADMINISTRADOR.
export async function listarTodos(req, res, next) {
  try {
    const servicios = await Service.find().sort({ nombre: 1 });
    res.json({ ok: true, servicios });
  } catch (e) {
    next(e);
  }
}

export async function obtener(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }
    const servicio = await Service.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }
    res.json({ ok: true, servicio });
  } catch (e) {
    next(e);
  }
}

export async function crear(req, res, next) {
  try {
    const error = validar(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const { nombre, descripcion, precioCentavos, duracionMinutos } = req.body;
    const servicio = new Service({ nombre, descripcion, precioCentavos, duracionMinutos });
    await servicio.save();
    res.status(201).json({ ok: true, servicio });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Nombre de servicio ya registrado' });
    }
    next(e);
  }
}

export async function actualizar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }
    const servicio = await Service.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }
    const { nombre, descripcion, precioCentavos, duracionMinutos, activo } = req.body || {};
    const combinado = {
      nombre: nombre ?? servicio.nombre,
      precioCentavos: precioCentavos ?? servicio.precioCentavos,
      duracionMinutos: duracionMinutos ?? servicio.duracionMinutos
    };
    const error = validar(combinado);
    if (error) return res.status(400).json({ ok: false, message: error });
    Object.assign(servicio, { ...combinado, descripcion: descripcion ?? servicio.descripcion });
    if (activo !== undefined) servicio.activo = !!activo;
    await servicio.save();
    res.json({ ok: true, servicio });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Nombre de servicio ya registrado' });
    }
    next(e);
  }
}
