import CarouselSlide from '../models/CarouselSlide.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function urlImagenValida(valor) {
  if (valor.startsWith('/')) return true;
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Valida el estado final (crear o después de combinar los cambios de un PUT).
function validar({ imagenUrl, titulo, orden, activo }) {
  if (typeof imagenUrl !== 'string' || !imagenUrl.trim()) {
    return 'La imagen es obligatoria';
  }
  if (imagenUrl.trim().length > 1000 || !urlImagenValida(imagenUrl.trim())) {
    return 'La imagen debe ser una URL http(s) o una ruta local que empiece con /';
  }
  if (typeof titulo !== 'string' || titulo.trim().length < 2) {
    return 'El título debe tener al menos 2 caracteres';
  }
  if (titulo.trim().length > 120) {
    return 'El título admite máximo 120 caracteres';
  }
  if (!Number.isInteger(orden) || orden < 0 || orden > 9999) {
    return 'El orden debe ser un entero entre 0 y 9999';
  }
  if (typeof activo !== 'boolean') {
    return 'activo debe ser verdadero o falso';
  }
  return null;
}

// GET /api/contenido/carrusel — solo activas, ordenadas. Público.
export async function listarPublico(req, res, next) {
  try {
    const diapositivas = await CarouselSlide.find({ activo: true }).sort({ orden: 1, createdAt: 1 });
    res.json({ ok: true, diapositivas });
  } catch (e) {
    next(e);
  }
}

// GET /api/contenido/carrusel/admin/todos — activas e inactivas. Solo ADMIN.
export async function listarTodos(req, res, next) {
  try {
    const diapositivas = await CarouselSlide.find().sort({ orden: 1, createdAt: 1 });
    res.json({ ok: true, diapositivas });
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
    const datos = {
      imagenUrl: body.imagenUrl,
      titulo: body.titulo,
      orden: body.orden === undefined ? 0 : body.orden,
      activo: body.activo === undefined ? true : body.activo
    };
    const error = validar(datos);
    if (error) return res.status(400).json({ ok: false, message: error });

    const diapositiva = new CarouselSlide({
      imagenUrl: datos.imagenUrl.trim(),
      titulo: datos.titulo.trim(),
      orden: datos.orden,
      activo: datos.activo
    });
    await diapositiva.save();
    res.status(201).json({ ok: true, diapositiva });
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Datos de la diapositiva inválidos' });
    }
    next(e);
  }
}

export async function actualizar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Diapositiva no encontrada' });
    }
    const diapositiva = await CarouselSlide.findById(req.params.id);
    if (!diapositiva) {
      return res.status(404).json({ ok: false, message: 'Diapositiva no encontrada' });
    }
    const body = req.body || {};
    if (!esObjeto(body)) {
      return res.status(400).json({ ok: false, message: 'El cuerpo debe ser un objeto' });
    }

    const combinado = {
      imagenUrl: body.imagenUrl !== undefined ? body.imagenUrl : diapositiva.imagenUrl,
      titulo: body.titulo !== undefined ? body.titulo : diapositiva.titulo,
      orden: body.orden !== undefined ? body.orden : diapositiva.orden,
      activo: body.activo !== undefined ? body.activo : diapositiva.activo
    };
    const error = validar(combinado);
    if (error) return res.status(400).json({ ok: false, message: error });

    diapositiva.imagenUrl = combinado.imagenUrl.trim();
    diapositiva.titulo = combinado.titulo.trim();
    diapositiva.orden = combinado.orden;
    diapositiva.activo = combinado.activo;
    await diapositiva.save();
    res.json({ ok: true, diapositiva });
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Datos de la diapositiva inválidos' });
    }
    next(e);
  }
}

export async function eliminar(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Diapositiva no encontrada' });
    }
    const diapositiva = await CarouselSlide.findByIdAndDelete(req.params.id);
    if (!diapositiva) {
      return res.status(404).json({ ok: false, message: 'Diapositiva no encontrada' });
    }
    res.json({ ok: true, message: 'Diapositiva eliminada' });
  } catch (e) {
    next(e);
  }
}
