import Responsible from '../models/Responsible.js';
import mongoose from 'mongoose';
import { regexBusqueda, paginacion } from '../utils/consulta.js';
import { soloCampos, aplicarCamposPermitidos } from '../utils/campos.js';

// Campos que un cliente puede actualizar (evita asignación masiva).
const CAMPOS_RESPONSABLE = ['nombre', 'apellido', 'telefono', 'email', 'parentesco', 'activo'];
// En el alta NO se acepta `activo`: el registro siempre nace activo (su estado
// se cambia después con PATCH).
const CAMPOS_RESPONSABLE_CREAR = CAMPOS_RESPONSABLE.filter((campo) => campo !== 'activo');

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function validarResponsable(datos, esActualizacion = false) {
  const { nombre, apellido, telefono, parentesco } = datos;
  if (!esActualizacion) {
    if (!nombre || !apellido || !telefono || !parentesco) {
      return 'Nombre, apellido, teléfono y parentesco requeridos';
    }
  }
  if (telefono && (typeof telefono !== 'string' || telefono.trim().length < 6)) {
    return 'Teléfono muy corto';
  }
  return null;
}

export async function listarResponsables(req, res, next) {
  try {
    const { q, activo } = req.query;
    const filtro = {};
    if (activo !== undefined) filtro.activo = activo === 'true';
    const regex = regexBusqueda(q);
    if (regex) {
      filtro.$or = [
        { nombre: regex },
        { apellido: regex },
        { telefono: regex },
        { email: regex },
        { parentesco: regex }
      ];
    }
    const { page, limit, skip } = paginacion(req.query);
    const [responsables, total] = await Promise.all([
      Responsible.find(filtro).sort({ apellido: 1, nombre: 1 }).skip(skip).limit(limit),
      Responsible.countDocuments(filtro)
    ]);
    res.json({ ok: true, responsables, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function obtenerResponsable(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Responsable no encontrado' });
    }
    const responsable = await Responsible.findById(req.params.id);
    if (!responsable) {
      return res.status(404).json({ ok: false, message: 'Responsable no encontrado' });
    }
    res.json({ ok: true, responsable });
  } catch (e) {
    next(e);
  }
}

export async function crearResponsable(req, res, next) {
  try {
    const error = validarResponsable(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const responsable = new Responsible(soloCampos(req.body, CAMPOS_RESPONSABLE_CREAR));
    await responsable.save();
    res.status(201).json({ ok: true, responsable });
  } catch (e) {
    next(e);
  }
}

export async function actualizarResponsable(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Responsable no encontrado' });
    }
    const responsable = await Responsible.findById(req.params.id);
    if (!responsable) {
      return res.status(404).json({ ok: false, message: 'Responsable no encontrado' });
    }
    const error = validarResponsable(req.body || {}, true);
    if (error) return res.status(400).json({ ok: false, message: error });
    aplicarCamposPermitidos(responsable, req.body, CAMPOS_RESPONSABLE);
    await responsable.save();
    res.json({ ok: true, responsable });
  } catch (e) {
    next(e);
  }
}
