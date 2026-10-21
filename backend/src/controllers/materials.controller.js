import EducationalMaterial, { TIPOS_MATERIAL } from '../models/EducationalMaterial.js';
import mongoose from 'mongoose';
import { regexBusqueda, paginacion } from '../utils/consulta.js';
import { aplicarCamposPermitidos } from '../utils/campos.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// Campos que un cliente puede crear/actualizar. Cualquier otra clave del body
// se ignora (evita asignación masiva de _id, fechas de sistema, __v, etc.).
const CAMPOS_MATERIAL = ['titulo', 'descripcion', 'tipo', 'url', 'archivoNombre', 'activo'];

// Valida tipos además de obligatoriedad. En actualización solo se validan los
// campos presentes; en creación se exigen titulo, descripcion y tipo.
function validarMaterial(datos, esActualizacion = false) {
  const { titulo, descripcion, tipo, url, archivoNombre, activo } = datos;
  if (!esActualizacion || titulo !== undefined) {
    if (typeof titulo !== 'string' || titulo.trim() === '') {
      return 'Título requerido (texto no vacío)';
    }
  }
  if (!esActualizacion || descripcion !== undefined) {
    if (typeof descripcion !== 'string' || descripcion.trim() === '') {
      return 'Descripción requerida (texto no vacío)';
    }
  }
  if (!esActualizacion || tipo !== undefined) {
    if (!TIPOS_MATERIAL.includes(tipo)) {
      return `Tipo inválido. Válidos: ${TIPOS_MATERIAL.join(', ')}`;
    }
  }
  if (url !== undefined && typeof url !== 'string') {
    return 'URL inválida (debe ser texto)';
  }
  if (archivoNombre !== undefined && typeof archivoNombre !== 'string') {
    return 'archivoNombre inválido (debe ser texto)';
  }
  if (activo !== undefined && typeof activo !== 'boolean') {
    return 'Activo debe ser booleano';
  }
  return null;
}

export async function listarMateriales(req, res, next) {
  try {
    const { q, tipo, activo } = req.query;
    const filtro = {};
    if (activo !== undefined) filtro.activo = activo === 'true';
    if (tipo) filtro.tipo = tipo;
    const regex = regexBusqueda(q);
    if (regex) {
      filtro.$or = [
        { titulo: regex },
        { descripcion: regex }
      ];
    }
    const { page, limit, skip } = paginacion(req.query);
    const [materiales, total] = await Promise.all([
      EducationalMaterial.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limit),
      EducationalMaterial.countDocuments(filtro)
    ]);
    res.json({ ok: true, materiales, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function obtenerMaterial(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Material no encontrado' });
    }
    const material = await EducationalMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ ok: false, message: 'Material no encontrado' });
    }
    res.json({ ok: true, material });
  } catch (e) {
    next(e);
  }
}

export async function crearMaterial(req, res, next) {
  try {
    const error = validarMaterial(req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const { titulo, descripcion, tipo, url, archivoNombre } = req.body;
    const material = new EducationalMaterial({
      titulo: titulo.trim(),
      descripcion,
      tipo,
      url: url || '',
      archivoNombre: archivoNombre || ''
    });
    await material.save();
    res.status(201).json({ ok: true, material });
  } catch (e) {
    next(e);
  }
}

export async function actualizarMaterial(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Material no encontrado' });
    }
    const material = await EducationalMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ ok: false, message: 'Material no encontrado' });
    }
    const error = validarMaterial(req.body || {}, true);
    if (error) return res.status(400).json({ ok: false, message: error });
    // Solo se aplican los campos permitidos (ignora _id, createdAt, etc.).
    aplicarCamposPermitidos(material, req.body, CAMPOS_MATERIAL);
    if (req.body.titulo !== undefined) material.titulo = req.body.titulo.trim();
    await material.save();
    res.json({ ok: true, material });
  } catch (e) {
    next(e);
  }
}
