import Professional from '../models/Professional.js';
import mongoose from 'mongoose';
import { regexBusqueda, paginacion } from '../utils/consulta.js';
import { soloCampos, aplicarCamposPermitidos } from '../utils/campos.js';

// Campos que un cliente puede actualizar (evita asignación masiva).
const CAMPOS_PROFESIONAL = [
  'nombre', 'apellido', 'especialidad', 'telefono', 'email', 'dni', 'matricula', 'activo'
];
// En el alta NO se acepta `activo`: el registro siempre nace activo (su estado
// se cambia después con PATCH).
const CAMPOS_PROFESIONAL_CREAR = CAMPOS_PROFESIONAL.filter((campo) => campo !== 'activo');

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function validarProfesional(datos, esActualizacion = false) {
  const { nombre, apellido, especialidad, telefono, dni, matricula } = datos;
  if (!esActualizacion) {
    if (!nombre || !apellido || !especialidad || !telefono || !dni || !matricula) {
      return 'Nombre, apellido, especialidad, teléfono, DNI y matrícula requeridos';
    }
  }
  if (telefono && (typeof telefono !== 'string' || telefono.trim().length < 6)) {
    return 'Teléfono muy corto';
  }
  return null;
}

export async function listarProfesionales(req, res, next) {
  try {
    const { q, activo, especialidad } = req.query;
    const filtro = {};
    if (activo !== undefined) filtro.activo = activo === 'true';
    if (especialidad) filtro.especialidad = especialidad;
    const regex = regexBusqueda(q);
    if (regex) {
      filtro.$or = [
        { nombre: regex },
        { apellido: regex },
        { especialidad: regex },
        { telefono: regex },
        { email: regex },
        { dni: regex },
        { matricula: regex }
      ];
    }
    const { page, limit, skip } = paginacion(req.query);
    const [profesionales, total] = await Promise.all([
      Professional.find(filtro).sort({ apellido: 1, nombre: 1 }).skip(skip).limit(limit),
      Professional.countDocuments(filtro)
    ]);
    res.json({ ok: true, profesionales, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function obtenerProfesional(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Profesional no encontrado' });
    }
    const profesional = await Professional.findById(req.params.id);
    if (!profesional) {
      return res.status(404).json({ ok: false, message: 'Profesional no encontrado' });
    }
    res.json({ ok: true, profesional });
  } catch (e) {
    next(e);
  }
}

export async function crearProfesional(req, res, next) {
  try {
    const error = validarProfesional(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const profesional = new Professional(soloCampos(req.body, CAMPOS_PROFESIONAL_CREAR));
    await profesional.save();
    res.status(201).json({ ok: true, profesional });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'DNI o matrícula ya registrados' });
    }
    next(e);
  }
}

export async function actualizarProfesional(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Profesional no encontrado' });
    }
    const profesional = await Professional.findById(req.params.id);
    if (!profesional) {
      return res.status(404).json({ ok: false, message: 'Profesional no encontrado' });
    }
    const error = validarProfesional(req.body || {}, true);
    if (error) return res.status(400).json({ ok: false, message: error });
    aplicarCamposPermitidos(profesional, req.body, CAMPOS_PROFESIONAL);
    await profesional.save();
    res.json({ ok: true, profesional });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'DNI o matrícula ya registrados' });
    }
    next(e);
  }
}

export async function desactivarProfesional(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Profesional no encontrado' });
    }
    const profesional = await Professional.findById(req.params.id);
    if (!profesional) {
      return res.status(404).json({ ok: false, message: 'Profesional no encontrado' });
    }
    profesional.activo = false;
    await profesional.save();
    res.json({ ok: true, profesional });
  } catch (e) {
    next(e);
  }
}