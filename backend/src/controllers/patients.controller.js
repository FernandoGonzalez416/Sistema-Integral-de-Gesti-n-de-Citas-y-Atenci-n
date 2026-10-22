import Patient from '../models/Patient.js';
import mongoose from 'mongoose';
import { regexBusqueda, paginacion } from '../utils/consulta.js';
import { soloCampos, aplicarCamposPermitidos } from '../utils/campos.js';
import {
  CAMPOS_PACIENTE_PROFESIONAL,
  idsPacientesDelProfesional,
  pacienteDelProfesional,
  profesionalDelUsuario
} from '../utils/profesional.js';

// Campos que un cliente puede actualizar (evita asignación masiva).
const CAMPOS_PACIENTE = [
  'nombre', 'apellido', 'fechaNacimiento', 'sexo', 'telefono', 'email', 'direccion', 'fotoUrl',
  'fechaInicioProceso', 'observacionesAdministrativas', 'activo'
];
// En el alta NO se acepta `activo`: el registro siempre nace activo (su estado
// se cambia después con PATCH).
const CAMPOS_PACIENTE_CREAR = CAMPOS_PACIENTE.filter((campo) => campo !== 'activo');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// Normaliza la fecha vacía a null (permite limpiarla en una actualización).
function normalizar(datos) {
  const d = { ...datos };
  if (d.fechaInicioProceso === '') d.fechaInicioProceso = null;
  return d;
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
  if (telefono && (typeof telefono !== 'string' || telefono.trim().length < 6)) {
    return 'Teléfono muy corto';
  }
  if (datos.email !== undefined && datos.email !== '' && datos.email !== null) {
    if (typeof datos.email !== 'string' || !EMAIL_RE.test(datos.email.trim())) {
      return 'Email inválido';
    }
  }
  if (datos.fechaInicioProceso !== undefined && datos.fechaInicioProceso !== null) {
    const fecha = new Date(datos.fechaInicioProceso);
    if (isNaN(fecha.getTime())) return 'fechaInicioProceso inválida';
    if (fecha.getTime() > Date.now()) return 'fechaInicioProceso no puede estar en el futuro';
  }
  if (datos.observacionesAdministrativas !== undefined) {
    if (typeof datos.observacionesAdministrativas !== 'string') {
      return 'observacionesAdministrativas debe ser texto';
    }
    if (datos.observacionesAdministrativas.length > 2000) {
      return 'observacionesAdministrativas no puede superar 2000 caracteres';
    }
  }
  if (datos.fotoUrl !== undefined && typeof datos.fotoUrl !== 'string') {
    return 'fotoUrl debe ser texto';
  }
  if (datos.direccion !== undefined && typeof datos.direccion !== 'string') {
    return 'direccion debe ser texto';
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

    let esProfesional = false;
    if (req.usuario?.rol === 'PROFESIONAL') {
      esProfesional = true;
      const profesional = await profesionalDelUsuario(req.usuario);
      if (!profesional) {
        return res.status(403).json({
          ok: false,
          message: 'El usuario PROFESIONAL no tiene un profesional activo vinculado'
        });
      }
      const ids = await idsPacientesDelProfesional(profesional._id);
      filtro._id = { $in: ids };
    }

    const { page, limit, skip } = paginacion(req.query);
    let consulta = Patient.find(filtro);
    // Un PROFESIONAL solo ve los datos básicos de sus propios pacientes (RF-02).
    if (esProfesional) consulta = consulta.select(CAMPOS_PACIENTE_PROFESIONAL);
    const [pacientes, total] = await Promise.all([
      consulta.sort({ apellido: 1, nombre: 1 }).skip(skip).limit(limit),
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
    let paciente;
    if (req.usuario?.rol === 'PROFESIONAL') {
      const profesional = await profesionalDelUsuario(req.usuario);
      if (!profesional) {
        return res.status(403).json({
          ok: false,
          message: 'El usuario PROFESIONAL no tiene un profesional activo vinculado'
        });
      }
      const tieneCita = await pacienteDelProfesional(profesional._id, req.params.id);
      if (!tieneCita) {
        return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
      }
      paciente = await Patient.findById(req.params.id).select(CAMPOS_PACIENTE_PROFESIONAL);
    } else {
      paciente = await Patient.findById(req.params.id);
    }
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
    const error = validarPaciente(normalizar(req.body || {}));
    if (error) return res.status(400).json({ ok: false, message: error });
    const paciente = new Patient(soloCampos(normalizar(req.body), CAMPOS_PACIENTE_CREAR));
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
    const datos = normalizar(req.body || {});
    const error = validarPaciente(datos, true);
    if (error) return res.status(400).json({ ok: false, message: error });
    aplicarCamposPermitidos(paciente, datos, CAMPOS_PACIENTE);
    await paciente.save();
    res.json({ ok: true, paciente });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/pacientes/:id/estado — activación/desactivación lógica.
// Acepta { activo: boolean } o { estado: 'ACTIVO' | 'INACTIVO' }.
export async function cambiarEstadoPaciente(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const body = req.body || {};
    let activo;
    if (typeof body.activo === 'boolean') {
      activo = body.activo;
    } else if (body.estado === 'ACTIVO' || body.estado === 'INACTIVO') {
      activo = body.estado === 'ACTIVO';
    } else {
      return res.status(400).json({
        ok: false,
        message: "Indique activo (booleano) o estado ('ACTIVO'|'INACTIVO')"
      });
    }
    const paciente = await Patient.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    paciente.activo = activo;
    await paciente.save();
    res.json({ ok: true, paciente });
  } catch (e) {
    next(e);
  }
}