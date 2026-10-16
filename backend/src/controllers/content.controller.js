import InstitutionalContent from '../models/InstitutionalContent.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/contenidos — solo activos. Público (lo usa el portal).
export async function listarPublico(req, res, next) {
  try {
    const contenidos = await InstitutionalContent.find({ activo: true }).sort({ clave: 1 });
    res.json({ ok: true, contenidos });
  } catch (e) {
    next(e);
  }
}

// GET /api/contenidos/:clave — un bloque por clave. Público.
export async function obtenerPorClave(req, res, next) {
  try {
    const contenido = await InstitutionalContent.findOne({
      clave: String(req.params.clave).toLowerCase(),
      activo: true
    });
    if (!contenido) {
      return res.status(404).json({ ok: false, message: 'Contenido no encontrado' });
    }
    res.json({ ok: true, contenido });
  } catch (e) {
    next(e);
  }
}

// GET /api/contenidos/admin/todos — activos e inactivos. Solo ADMINISTRADOR.
export async function listarTodos(req, res, next) {
  try {
    const contenidos = await InstitutionalContent.find().sort({ clave: 1 });
    res.json({ ok: true, contenidos });
  } catch (e) {
    next(e);
  }
}

export async function crear(req, res, next) {
  try {
    const { clave, titulo, cuerpo } = req.body || {};
    if (!clave || !titulo || !cuerpo) {
      return res.status(400).json({ ok: false, message: 'Clave, título y cuerpo requeridos' });
    }
    if (typeof clave !== 'string' || typeof titulo !== 'string' || typeof cuerpo !== 'string') {
      return res.status(400).json({ ok: false, message: 'Clave, título y cuerpo deben ser texto' });
    }
    const contenido = new InstitutionalContent({
      clave: clave.toLowerCase().trim(),
      titulo: titulo.trim(),
      cuerpo
    });
    await contenido.save();
    res.status(201).json({ ok: true, contenido });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Clave ya registrada' });
    }
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Clave inválida (solo minúsculas, números y guiones)' });
    }
    next(e);
  }
}

export async function actualizar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Contenido no encontrado' });
    }
    const contenido = await InstitutionalContent.findById(req.params.id);
    if (!contenido) {
      return res.status(404).json({ ok: false, message: 'Contenido no encontrado' });
    }
    const { titulo, cuerpo, activo } = req.body || {};
    if (titulo !== undefined) {
      if (typeof titulo !== 'string' || !titulo.trim()) {
        return res.status(400).json({ ok: false, message: 'titulo debe ser texto no vacío' });
      }
      contenido.titulo = titulo.trim();
    }
    if (cuerpo !== undefined) {
      if (typeof cuerpo !== 'string' || !cuerpo.trim()) {
        return res.status(400).json({ ok: false, message: 'cuerpo debe ser texto no vacío' });
      }
      contenido.cuerpo = cuerpo;
    }
    if (activo !== undefined) contenido.activo = !!activo;
    await contenido.save();
    res.json({ ok: true, contenido });
  } catch (e) {
    next(e);
  }
}
