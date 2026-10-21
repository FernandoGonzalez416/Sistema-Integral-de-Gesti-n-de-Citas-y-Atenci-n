import User, { TIPOS_SANGRE, SEXOS } from '../models/User.js';
import { firmarToken } from '../utils/jwt.js';

// Vista pública BÁSICA (la usa también users.controller para listados: sin foto ni datos de salud).
export function publico(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo
  };
}

function fechaISO(valor) {
  return valor ? new Date(valor).toISOString().slice(0, 10) : '';
}

export function serializarPerfil(p = {}) {
  const ce = p.contactoEmergencia || {};
  return {
    telefono: p.telefono || '',
    fechaNacimiento: fechaISO(p.fechaNacimiento),
    sexo: p.sexo || '',
    pesoKg: p.pesoKg ?? null,
    estaturaCm: p.estaturaCm ?? null,
    tipoSangre: p.tipoSangre || '',
    alergias: [...(p.alergias || [])],
    condiciones: [...(p.condiciones || [])],
    contactoEmergencia: { nombre: ce.nombre || '', telefono: ce.telefono || '' }
  };
}

// Vista COMPLETA del propio usuario (login, registro, /me y perfil). Nunca incluye el hash.
export function perfilCompleto(usuario) {
  return {
    ...publico(usuario),
    foto: usuario.foto || '',
    perfil: serializarPerfil(usuario.perfil || {}),
    creadoEn: usuario.createdAt
  };
}

/* ---------------------------- Validaciones ---------------------------- */

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_NOMBRE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;
const RE_TELEFONO = /^[0-9+()\-\s]{0,20}$/;
const RE_FOTO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const FOTO_MAX = 300000;

const limpiar = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

export function validarNombre(valor) {
  const nombre = limpiar(valor);
  if (nombre.length < 5 || nombre.length > 120 || !RE_NOMBRE.test(nombre) || nombre.split(' ').length < 2) {
    return { error: 'Escribe tu nombre completo (nombre y apellido)' };
  }
  return { valor: nombre };
}

export function validarPassword(valor) {
  if (typeof valor !== 'string' || valor.length < 8 || valor.length > 72 || !/[A-Za-z]/.test(valor) || !/\d/.test(valor)) {
    return { error: 'La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número' };
  }
  return { valor };
}

export function validarFoto(valor) {
  if (valor === '' || valor === null) return { valor: '' }; // quitar foto
  if (typeof valor !== 'string' || valor.length > FOTO_MAX || !RE_FOTO.test(valor)) {
    return { error: 'La foto debe ser una imagen PNG, JPG o WEBP de tamaño reducido' };
  }
  return { valor };
}

function numeroEnRango(valor, min, max, etiqueta) {
  if (valor === '' || valor === null) return { valor: null };
  const n = Number(valor);
  if (!Number.isFinite(n) || n < min || n > max) return { error: `${etiqueta} debe estar entre ${min} y ${max}` };
  return { valor: Math.round(n * 10) / 10 };
}

function lista(valor, etiqueta) {
  if (!Array.isArray(valor) || valor.length > 20) return { error: `${etiqueta}: máximo 20 elementos` };
  const vistos = new Set();
  const salida = [];
  for (const item of valor) {
    const t = limpiar(item);
    if (!t) continue;
    if (t.length > 40) return { error: `${etiqueta}: cada elemento admite máximo 40 caracteres` };
    if (!vistos.has(t.toLowerCase())) {
      vistos.add(t.toLowerCase());
      salida.push(t);
    }
  }
  return { valor: salida };
}

// Valida y normaliza un cambio PARCIAL del perfil. Solo el CLIENTE puede guardar datos de salud.
export function sanitizarPerfil(entrada, rol) {
  const salida = {};
  const err = (message) => ({ error: message });
  if (!entrada || typeof entrada !== 'object') return err('Datos de perfil inválidos');

  if (entrada.telefono !== undefined) {
    const t = limpiar(entrada.telefono);
    if (!RE_TELEFONO.test(t)) return err('Teléfono inválido');
    salida.telefono = t;
  }
  if (rol !== 'CLIENTE') return { valor: salida };

  if (entrada.fechaNacimiento !== undefined) {
    if (!entrada.fechaNacimiento) salida.fechaNacimiento = null;
    else {
      const f = new Date(`${entrada.fechaNacimiento}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.fechaNacimiento) || Number.isNaN(f.getTime()) || f > new Date() || f.getUTCFullYear() < 1900) {
        return err('Fecha de nacimiento inválida');
      }
      salida.fechaNacimiento = f;
    }
  }
  if (entrada.sexo !== undefined) {
    if (entrada.sexo !== '' && !SEXOS.includes(entrada.sexo)) return err('Sexo inválido');
    salida.sexo = entrada.sexo;
  }
  if (entrada.tipoSangre !== undefined) {
    if (entrada.tipoSangre !== '' && !TIPOS_SANGRE.includes(entrada.tipoSangre)) return err('Tipo de sangre inválido');
    salida.tipoSangre = entrada.tipoSangre;
  }
  if (entrada.pesoKg !== undefined) {
    const r = numeroEnRango(entrada.pesoKg, 1, 500, 'El peso (kg)');
    if (r.error) return r;
    salida.pesoKg = r.valor;
  }
  if (entrada.estaturaCm !== undefined) {
    const r = numeroEnRango(entrada.estaturaCm, 30, 260, 'La estatura (cm)');
    if (r.error) return r;
    salida.estaturaCm = r.valor;
  }
  for (const [campo, etiqueta] of [['alergias', 'Alergias'], ['condiciones', 'Condiciones']]) {
    if (entrada[campo] !== undefined) {
      const r = lista(entrada[campo], etiqueta);
      if (r.error) return r;
      salida[campo] = r.valor;
    }
  }
  if (entrada.contactoEmergencia !== undefined) {
    const c = entrada.contactoEmergencia || {};
    const nombre = limpiar(c.nombre);
    const telefono = limpiar(c.telefono);
    if (nombre.length > 80 || !RE_TELEFONO.test(telefono)) return err('Contacto de emergencia inválido');
    salida.contactoEmergencia = { nombre, telefono };
  }
  return { valor: salida };
}

/* ------------------------------ Endpoints ------------------------------ */

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email y password requeridos' });
    }
    const usuario = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }
    const coincide = await usuario.compararPassword(String(password));
    if (!coincide) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }
    res.json({ ok: true, token: firmarToken(usuario), usuario: perfilCompleto(usuario) });
  } catch (e) {
    next(e);
  }
}

// POST /api/auth/register — registro público. SIEMPRE crea rol CLIENTE (el rol nunca viene del cliente).
export async function registrar(req, res, next) {
  try {
    const { nombre, email, password, foto } = req.body || {};
    const n = validarNombre(nombre);
    if (n.error) return res.status(400).json({ ok: false, message: n.error });
    const correo = String(email || '').toLowerCase().trim();
    if (!RE_EMAIL.test(correo) || correo.length > 120) {
      return res.status(400).json({ ok: false, message: 'Correo electrónico inválido' });
    }
    const p = validarPassword(password);
    if (p.error) return res.status(400).json({ ok: false, message: p.error });
    const f = validarFoto(foto ?? '');
    if (f.error) return res.status(400).json({ ok: false, message: f.error });

    const usuario = new User({ nombre: n.valor, email: correo, password, rol: 'CLIENTE', foto: f.valor });
    await usuario.save();
    res.status(201).json({ ok: true, token: firmarToken(usuario), usuario: perfilCompleto(usuario) });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Ya existe una cuenta con ese correo' });
    }
    next(e);
  }
}

export async function me(req, res) {
  res.json({ ok: true, usuario: perfilCompleto(req.usuario) });
}

// PATCH /api/auth/perfil — el usuario edita SU propio perfil (cambio parcial: nombre, foto, perfil{...}).
export async function actualizarPerfil(req, res, next) {
  try {
    const { nombre, foto, perfil } = req.body || {};
    const usuario = req.usuario;

    if (nombre !== undefined) {
      const n = validarNombre(nombre);
      if (n.error) return res.status(400).json({ ok: false, message: n.error });
      usuario.nombre = n.valor;
    }
    if (foto !== undefined) {
      const f = validarFoto(foto);
      if (f.error) return res.status(400).json({ ok: false, message: f.error });
      usuario.foto = f.valor;
    }
    if (perfil !== undefined) {
      const r = sanitizarPerfil(perfil, usuario.rol);
      if (r.error) return res.status(400).json({ ok: false, message: r.error });
      const actual = usuario.perfil?.toObject ? usuario.perfil.toObject() : usuario.perfil || {};
      usuario.perfil = { ...actual, ...r.valor };
    }
    await usuario.save();
    res.json({ ok: true, usuario: perfilCompleto(usuario) });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/auth/password — cambio de contraseña con verificación de la actual.
export async function cambiarPassword(req, res, next) {
  try {
    const { actual, nueva } = req.body || {};
    const usuario = await User.findById(req.usuario._id).select('+password');
    if (!actual || !(await usuario.compararPassword(String(actual)))) {
      return res.status(400).json({ ok: false, message: 'La contraseña actual no es correcta' });
    }
    const p = validarPassword(nueva);
    if (p.error) return res.status(400).json({ ok: false, message: p.error });
    if (nueva === actual) {
      return res.status(400).json({ ok: false, message: 'La nueva contraseña debe ser distinta a la actual' });
    }
    usuario.password = nueva; // el hook pre-save genera el hash
    await usuario.save();
    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (e) {
    next(e);
  }
}