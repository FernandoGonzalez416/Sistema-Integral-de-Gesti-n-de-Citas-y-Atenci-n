import Publication, { TIPOS_PUBLICACION } from '../models/Publication.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function validar({ titulo, descripcion, tipo }) {
  if (typeof titulo !== 'string' || !titulo.trim() || typeof descripcion !== 'string' || !descripcion.trim() || !tipo) {
    return 'Título, descripción y tipo requeridos';
  }
  if (!TIPOS_PUBLICACION.includes(tipo)) {
    return `Tipo inválido. Válidos: ${TIPOS_PUBLICACION.join(', ')}`;
  }
  if (titulo.trim().length > 160) return 'El título admite máximo 160 caracteres';
  if (descripcion.trim().length > 5000) return 'La descripción admite máximo 5000 caracteres';
  return null;
}

function urlPermitida(valor, campo) {
  if (!valor) return true;
  if (valor.startsWith('/')) return true;
  try {
    const url = new URL(valor);
    const protocolos = campo === 'enlace'
      ? ['http:', 'https:', 'mailto:', 'tel:']
      : ['http:', 'https:'];
    return protocolos.includes(url.protocol);
  } catch {
    return false;
  }
}

function textoOpcional(valor, campo, max = 1000) {
  if (typeof valor !== 'string') return { error: `${campo} debe ser texto` };
  const texto = valor.trim();
  if (texto.length > max) return { error: `${campo} admite máximo ${max} caracteres` };
  if (!urlPermitida(texto, campo)) {
    return {
      error: campo === 'enlace'
        ? 'El enlace debe ser http(s), mailto, tel o una ruta local que empiece con /'
        : 'La imagen debe ser una URL http(s) o una ruta local que empiece con /'
    };
  }
  return { valor: texto };
}

function leerFecha(valor) {
  if (valor === undefined) return {};
  if (valor === null || valor === '') return { fecha: new Date() };
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return { error: 'Fecha inválida' };
  return { fecha };
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
    const body = req.body || {};
    if (!esObjeto(body)) {
      return res.status(400).json({ ok: false, message: 'El cuerpo debe ser un objeto' });
    }
    const error = validar(body);
    if (error) return res.status(400).json({ ok: false, message: error });

    const imagen = textoOpcional(body.imagenUrl ?? '', 'imagenUrl');
    if (imagen.error) return res.status(400).json({ ok: false, message: imagen.error });
    const enlace = textoOpcional(body.enlace ?? '', 'enlace');
    if (enlace.error) return res.status(400).json({ ok: false, message: enlace.error });
    const fecha = leerFecha(body.fecha);
    if (fecha.error) return res.status(400).json({ ok: false, message: fecha.error });
    if (body.activo !== undefined && typeof body.activo !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'activo debe ser verdadero o falso' });
    }

    const publicacion = new Publication({
      titulo: body.titulo.trim(),
      descripcion: body.descripcion.trim(),
      tipo: body.tipo,
      fecha: fecha.fecha,
      imagenUrl: imagen.valor,
      enlace: enlace.valor,
      activo: body.activo === undefined ? true : body.activo
    });
    await publicacion.save();
    res.status(201).json({ ok: true, publicacion });
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Datos de la publicación inválidos' });
    }
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
    const body = req.body || {};
    if (!esObjeto(body)) {
      return res.status(400).json({ ok: false, message: 'El cuerpo debe ser un objeto' });
    }

    const combinado = {
      titulo: body.titulo !== undefined ? body.titulo : publicacion.titulo,
      descripcion: body.descripcion !== undefined ? body.descripcion : publicacion.descripcion,
      tipo: body.tipo !== undefined ? body.tipo : publicacion.tipo
    };
    const error = validar(combinado);
    if (error) return res.status(400).json({ ok: false, message: error });

    if (typeof combinado.titulo !== 'string' || typeof combinado.descripcion !== 'string') {
      return res.status(400).json({ ok: false, message: 'Título y descripción deben ser texto' });
    }
    if (body.imagenUrl !== undefined) {
      const imagen = textoOpcional(body.imagenUrl, 'imagenUrl');
      if (imagen.error) return res.status(400).json({ ok: false, message: imagen.error });
      publicacion.imagenUrl = imagen.valor;
    }
    if (body.enlace !== undefined) {
      const enlace = textoOpcional(body.enlace, 'enlace');
      if (enlace.error) return res.status(400).json({ ok: false, message: enlace.error });
      publicacion.enlace = enlace.valor;
    }
    if (body.fecha !== undefined) {
      const fecha = leerFecha(body.fecha);
      if (fecha.error) return res.status(400).json({ ok: false, message: fecha.error });
      publicacion.fecha = fecha.fecha;
    }
    if (body.activo !== undefined) {
      if (typeof body.activo !== 'boolean') {
        return res.status(400).json({ ok: false, message: 'activo debe ser verdadero o falso' });
      }
      publicacion.activo = body.activo;
    }

    publicacion.titulo = combinado.titulo.trim();
    publicacion.descripcion = combinado.descripcion.trim();
    publicacion.tipo = combinado.tipo;
    await publicacion.save();
    res.json({ ok: true, publicacion });
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Datos de la publicación inválidos' });
    }
    next(e);
  }
}
