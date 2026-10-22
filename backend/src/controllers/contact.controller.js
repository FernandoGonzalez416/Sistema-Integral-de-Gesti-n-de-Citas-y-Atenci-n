import ContactMessage from '../models/ContactMessage.js';
import mongoose from 'mongoose';

// POST /api/contacto — público. Guarda el mensaje del portal.
export async function crear(req, res, next) {
  try {
    const { nombre, email, telefono, asunto, mensaje } = req.body || {};
    if (!nombre || !email || !telefono || !asunto || !mensaje) {
      return res.status(400).json({ ok: false, message: 'Nombre, email, teléfono, asunto y mensaje requeridos' });
    }
    // Sin coerción: un tipo inválido (objeto, número…) no se convierte a "[object Object]".
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof telefono !== 'string'
      || typeof asunto !== 'string' || typeof mensaje !== 'string') {
      return res.status(400).json({ ok: false, message: 'Los campos del formulario deben ser texto' });
    }
    if (nombre.trim().length < 2 || nombre.trim().length > 100) {
      return res.status(400).json({ ok: false, message: 'El nombre debe tener entre 2 y 100 caracteres' });
    }
    if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    const digitos = telefono.replace(/\D/g, '');
    if (!/^[\d\s+()-]+$/.test(telefono.trim()) || digitos.length < 7 || digitos.length > 15) {
      return res.status(400).json({ ok: false, message: 'Teléfono inválido' });
    }
    if (asunto.trim().length < 3 || asunto.trim().length > 120) {
      return res.status(400).json({ ok: false, message: 'El asunto debe tener entre 3 y 120 caracteres' });
    }
    if (mensaje.trim().length < 10) {
      return res.status(400).json({ ok: false, message: 'Mensaje mínimo de 10 caracteres' });
    }
    if (mensaje.length > 2000) {
      return res.status(400).json({ ok: false, message: 'Mensaje máximo de 2000 caracteres' });
    }
    const msg = new ContactMessage({
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      asunto: asunto.trim(),
      mensaje: mensaje.trim()
    });
    await msg.save();
    res.status(201).json({ ok: true, mensaje: 'Mensaje recibido. Te contactaremos pronto.' });
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Datos del mensaje inválidos' });
    }
    next(e);
  }
}

function filtroLeido(req, res) {
  if (req.query.leido === undefined) return { filtro: {} };
  if (req.query.leido !== 'true' && req.query.leido !== 'false') {
    return { error: 'El filtro leido debe ser true o false' };
  }
  return { filtro: { leido: req.query.leido === 'true' } };
}

// GET /api/contacto?leido=true|false — solo ADMINISTRADOR. Incluye el total sin leer.
export async function listar(req, res, next) {
  try {
    const { filtro, error } = filtroLeido(req, res);
    if (error) return res.status(400).json({ ok: false, message: error });
    const [mensajes, noLeidos] = await Promise.all([
      ContactMessage.find(filtro).sort({ createdAt: -1 }),
      ContactMessage.countDocuments({ leido: false })
    ]);
    res.json({ ok: true, mensajes, noLeidos });
  } catch (e) {
    next(e);
  }
}

// GET /api/contacto/contador — solo ADMINISTRADOR. Contador del menú.
export async function contador(req, res, next) {
  try {
    const noLeidos = await ContactMessage.countDocuments({ leido: false });
    res.json({ ok: true, noLeidos });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/contacto/:id — marcar leído/no leído. Solo ADMINISTRADOR.
export async function marcar(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Mensaje no encontrado' });
    }
    if (typeof req.body?.leido !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'leido debe ser verdadero o falso' });
    }
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: { leido: req.body.leido } },
      { new: true, runValidators: true }
    );
    if (!msg) {
      return res.status(404).json({ ok: false, message: 'Mensaje no encontrado' });
    }
    res.json({ ok: true, mensaje: msg });
  } catch (e) {
    next(e);
  }
}
