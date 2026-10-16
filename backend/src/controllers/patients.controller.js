import Patient from '../models/Patient.js';
import mongoose from 'mongoose';
import { regexBusqueda, paginacion } from '../utils/consulta.js';
import { soloCampos, aplicarCamposPermitidos } from '../utils/campos.js';

// Campos que un cliente puede actualizar (evita asignación masiva).
const CAMPOS_PACIENTE = [
  'nombre', 'apellido', 'fechaNacimiento', 'sexo', 'telefono', 'email', 'direccion', 'fotoUrl', 'activo'
];
// En el alta NO se acepta `activo`: el registro siempre nace activo (su estado
// se cambia después con PATCH).
const CAMPOS_PACIENTE_CREAR = CAMPOS_PACIENTE.filter((campo) => campo !== 'activo');

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function validarPaciente(datos, esActualizacion = false) {
  const { nombre, apellido, fechaNacimiento, sexo, telefono } = datos;
  if (!esActualizacion) {
    if (!nombre || !apellido || !fechaNacimiento || !sexo || !telefono) {
      return 'Nombre, apellido, fechaNacimiento, sexo y teléfono requeridos';
    }
  }
  if (fechaNacimiento && isNaN(new Date(fechaNacimiento))) {
    return 'fechaNacimiento inválida';
  }
  if (sexo && !['M', 'F', 'Otro'].includes(sexo)) {
    return "sexo debe ser 'M', 'F' o 'Otro'";
  }
  if (telefono && String(telefono).trim().length < 6) {
    return 'Teléfono muy corto';
  }
  return null;
}

export async function listarPacientes(req, res, next) {
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
        { email: regex }
      ];
    }
    const { page, limit, skip } = paginacion(req.query);
    const [pacientes, total] = await Promise.all([
      Patient.find(filtro).sort({ apellido: 1, nombre: 1 }).skip(skip).limit(limit),
      Patient.countDocuments(filtro)
    ]);
    res.json({ ok: true, pacientes, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function obtenerPaciente(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const paciente = await Patient.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    res.json({ ok: true, paciente });
  } catch (e) {
    next(e);
  }
}

export async function crearPaciente(req, res, next) {
  try {
    const error = validarPaciente(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const paciente = new Patient(soloCampos(req.body, CAMPOS_PACIENTE_CREAR));
    await paciente.save();
    res.status(201).json({ ok: true, paciente });
  } catch (e) {
    next(e);
  }
}

export async function actualizarPaciente(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const paciente = await Patient.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const error = validarPaciente(req.body || {}, true);
    if (error) return res.status(400).json({ ok: false, message: error });
    aplicarCamposPermitidos(paciente, req.body, CAMPOS_PACIENTE);
    await paciente.save();
    res.json({ ok: true, paciente });
  } catch (e) {
    next(e);
  }
}

export async function desactivarPaciente(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const paciente = await Patient.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    paciente.activo = false;
    await paciente.save();
    res.json({ ok: true, paciente });
  } catch (e) {
    next(e);
  }
}