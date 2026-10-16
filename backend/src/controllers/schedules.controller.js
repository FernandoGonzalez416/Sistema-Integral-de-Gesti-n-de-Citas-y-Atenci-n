import Schedule from '../models/Schedule.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function validar({ dia, horaInicio, horaFin }) {
  if (dia === undefined || !horaInicio || !horaFin) {
    return 'Día, horaInicio y horaFin requeridos';
  }
  if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
    return 'Día debe ser entero de 0 (domingo) a 6 (sábado)';
  }
  const formato = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!formato.test(horaInicio) || !formato.test(horaFin)) {
    return 'Horas en formato HH:MM de 00:00 a 23:59';
  }
  if (horaInicio >= horaFin) {
    return 'horaInicio debe ser menor que horaFin';
  }
  return null;
}

// GET /api/horarios — solo activos. Público (lo usará el portal y la Fase 7).
export async function listarPublico(req, res, next) {
  try {
    const horarios = await Schedule.find({ activo: true }).sort({ dia: 1 });
    res.json({ ok: true, horarios });
  } catch (e) {
    next(e);
  }
}

// GET /api/horarios/admin/todos — activos e inactivos. Solo ADMINISTRADOR.
export async function listarTodos(req, res, next) {
  try {
    const horarios = await Schedule.find().sort({ dia: 1 });
    res.json({ ok: true, horarios });
  } catch (e) {
    next(e);
  }
}

export async function crear(req, res, next) {
  try {
    const error = validar(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const { dia, horaInicio, horaFin } = req.body;
    const horario = new Schedule({ dia, horaInicio, horaFin });
    await horario.save();
    res.status(201).json({ ok: true, horario });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Ese día ya tiene horario' });
    }
    next(e);
  }
}

export async function actualizar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Horario no encontrado' });
    }
    const horario = await Schedule.findById(req.params.id);
    if (!horario) {
      return res.status(404).json({ ok: false, message: 'Horario no encontrado' });
    }
    const { horaInicio, horaFin, activo } = req.body || {};
    const combinado = {
      dia: horario.dia,
      horaInicio: horaInicio ?? horario.horaInicio,
      horaFin: horaFin ?? horario.horaFin
    };
    const error = validar(combinado);
    if (error) return res.status(400).json({ ok: false, message: error });
    horario.horaInicio = combinado.horaInicio;
    horario.horaFin = combinado.horaFin;
    if (activo !== undefined) horario.activo = !!activo;
    await horario.save();
    res.json({ ok: true, horario });
  } catch (e) {
    next(e);
  }
}
