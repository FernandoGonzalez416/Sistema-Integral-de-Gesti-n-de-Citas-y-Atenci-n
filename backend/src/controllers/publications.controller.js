import Publication, { TIPOS_PUBLICACION } from '../models/Publication.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function validar({ titulo, descripcion, tipo }) {
  if (!titulo || !descripcion || !tipo) {
    return 'Título, descripción y tipo requeridos';
  }
  if (!TIPOS_PUBLICACION.includes(tipo)) {
    return `Tipo inválido. Válidos: ${TIPOS_PUBLICACION.join(', ')}`;
  }
  return null;
}

// GET /api/publicaciones?tipo=EDUCATIVO — solo activas. Público.
export async function listarPublico(req, res, next) {
  try {
    const filtro = { activo: true };
    if (req.query.tipo) {
      if (!TIPOS_PUBLICACION.includes(req.query.tipo)) {
        return res.status(400).json({ ok: false, message: 'Tipo inválido' });
      }
      filtro.tipo = req.query.tipo;
    }
    const publicaciones = await Publication.find(filtro).sort({ fecha: -1 });
    res.json({ ok: true, publicaciones });
  } catch (e) {
    next(e);
  }
}

// GET /api/publicaciones/admin/todas — activas e inactivas. Solo ADMINISTRADOR.
export async function listarTodas(req, res, next) {
  try {
    const publicaciones = await Publication.find().sort({ fecha: -1 });
    res.json({ ok: true, publicaciones });
  } catch (e) {
    next(e);
  }
}

export async function obtener(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Publicación no encontrada' });
    }
    const publicacion = await Publication.findById(req.params.id);
    if (!publicacion) {
      return res.status(404).json({ ok: false, message: 'Publicación no encontrada' });
    }
    res.json({ ok: true, publicacion });
  } catch (e) {
    next(e);
  }
}

export async function crear(req, res, next) {
  try {
    const error = validar(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const { titulo, descripcion, tipo, fecha, imagenUrl, enlace } = req.body;
    const publicacion = new Publication({
      titulo: String(titulo).trim(),
      descripcion,
      tipo,
      fecha: fecha ? new Date(fecha) : undefined,
      imagenUrl: imagenUrl || '',
      enlace: enlace || ''
    });
    await publicacion.save();
    res.status(201).json({ ok: true, publicacion });
  } catch (e) {
    next(e);
  }
}

export async function actualizar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Publicación no encontrada' });
    }
    const publicacion = await Publication.findById(req.params.id);
    if (!publicacion) {
      return res.status(404).json({ ok: false, message: 'Publicación no encontrada' });
    }
    const { titulo, descripcion, tipo, fecha, imagenUrl, enlace, activo } = req.body || {};
    const combinado = {
      titulo: titulo ?? publicacion.titulo,
      descripcion: descripcion ?? publicacion.descripcion,
      tipo: tipo ?? publicacion.tipo
    };
    const error = validar(combinado);
    if (error) return res.status(400).json({ ok: false, message: error });
    Object.assign(publicacion, { ...combinado });
    if (fecha !== undefined) publicacion.fecha = new Date(fecha);
    if (imagenUrl !== undefined) publicacion.imagenUrl = imagenUrl;
    if (enlace !== undefined) publicacion.enlace = enlace;
    if (activo !== undefined) publicacion.activo = !!activo;
    await publicacion.save();
    res.json({ ok: true, publicacion });
  } catch (e) {
    next(e);
  }
}
