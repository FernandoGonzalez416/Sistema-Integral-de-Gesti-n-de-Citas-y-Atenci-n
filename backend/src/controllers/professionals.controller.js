import Professional from '../models/Professional.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { regexBusqueda, paginacion } from '../utils/consulta.js';
import { soloCampos, aplicarCamposPermitidos } from '../utils/campos.js';

// Campos que un cliente puede actualizar (evita asignación masiva).
const CAMPOS_PROFESIONAL = [
  'nombre', 'apellido', 'especialidad', 'telefono', 'email', 'dni', 'matricula', 'usuario', 'activo'
];
// En el alta NO se acepta `activo`: el registro siempre nace activo (su estado
// se cambia después con PATCH).
const CAMPOS_PROFESIONAL_CREAR = CAMPOS_PROFESIONAL.filter((campo) => campo !== 'activo');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// Normaliza `usuarioId` (nombre usado en la API) al campo `usuario` del modelo.
function datosProfesional(body) {
  const datos = soloCampos(body || {}, CAMPOS_PROFESIONAL);
  if (body && body.usuarioId !== undefined) datos.usuario = body.usuarioId;
  return datos;
}

// RF-02/PENDIENTES 3: el profesional debe vincularse a un usuario activo con
// rol PROFESIONAL y ese usuario no puede representar a dos profesionales.
async function validarVinculo(usuarioId, profesionalId = null) {
  if (!usuarioId) {
    return { status: 400, message: 'usuarioId (usuario del sistema con rol PROFESIONAL) requerido' };
  }
  if (!idValido(usuarioId)) {
    return { status: 400, message: 'usuarioId inválido' };
  }
  const usuario = await User.findById(usuarioId);
  if (!usuario) return { status: 400, message: 'Usuario no encontrado' };
  if (usuario.rol !== 'PROFESIONAL') {
    return { status: 400, message: 'El usuario vinculado debe tener rol PROFESIONAL' };
  }
  if (!usuario.activo) return { status: 400, message: 'El usuario vinculado está inactivo' };

  const filtro = { usuario: usuario._id };
  if (profesionalId) filtro._id = { $ne: profesionalId };
  const vinculado = await Professional.findOne(filtro).select('nombre apellido');
  if (vinculado) {
    return {
      status: 409,
      message: `Ese usuario ya está vinculado al profesional ${vinculado.nombre} ${vinculado.apellido}`
    };
  }
  return null;
}

function validarProfesional(datos, esActualizacion = false) {
  const { nombre, apellido, especialidad, telefono, dni, matricula, email } = datos;
  if (!esActualizacion) {
    if (!nombre || !apellido || !especialidad || !telefono || !dni || !matricula) {
      return 'Nombre, apellido, especialidad, teléfono, DNI y matrícula requeridos';
    }
  }
  if (telefono && (typeof telefono !== 'string' || telefono.trim().length < 6)) {
    return 'Teléfono muy corto';
  }
  if (email !== undefined && email !== '' && (typeof email !== 'string' || !EMAIL_RE.test(email.trim()))) {
    return 'Email inválido';
  }
  return null;
}

function poblado(id) {
  return Professional.findById(id).populate('usuario', 'nombre email rol activo');
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
      Professional.find(filtro)
        .populate('usuario', 'nombre email rol activo')
        .sort({ apellido: 1, nombre: 1 })
        .skip(skip)
        .limit(limit),
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
    const profesional = await poblado(req.params.id);
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
    const datos = datosProfesional(req.body);
    const error = validarProfesional(datos);
    if (error) return res.status(400).json({ ok: false, message: error });

    const errorVinculo = await validarVinculo(datos.usuario);
    if (errorVinculo) {
      return res.status(errorVinculo.status).json({ ok: false, message: errorVinculo.message });
    }

    const profesional = new Professional(datos);
    await profesional.save();
    res.status(201).json({ ok: true, profesional: await poblado(profesional._id) });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'DNI, matrícula o usuario ya registrados' });
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
    const datos = datosProfesional(req.body);
    const error = validarProfesional(datos, true);
    if (error) return res.status(400).json({ ok: false, message: error });

    // Solo valida el vínculo si el cuerpo intenta cambiarlo.
    if (datos.usuario !== undefined) {
      if (datos.usuario === null || datos.usuario === '') {
        return res.status(400).json({ ok: false, message: 'El profesional debe tener un usuario vinculado' });
      }
      const errorVinculo = await validarVinculo(datos.usuario, profesional._id);
      if (errorVinculo) {
        return res.status(errorVinculo.status).json({ ok: false, message: errorVinculo.message });
      }
    }

    aplicarCamposPermitidos(profesional, datos, CAMPOS_PROFESIONAL);
    await profesional.save();
    res.json({ ok: true, profesional: await poblado(profesional._id) });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'DNI, matrícula o usuario ya registrados' });
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
    res.json({ ok: true, profesional: await poblado(profesional._id) });
  } catch (e) {
    next(e);
  }
}
