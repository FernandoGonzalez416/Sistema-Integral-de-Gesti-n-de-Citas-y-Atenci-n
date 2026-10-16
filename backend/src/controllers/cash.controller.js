import CashSession from '../models/CashSession.js';
import Payment, { METODOS_PAGO } from '../models/Payment.js';
import mongoose from 'mongoose';
import { paginacion } from '../utils/consulta.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// Suma los pagos ACTIVO por método en un rango de fechas.
export async function calcularTotalesPorMetodo(desde, hasta) {
  const pagos = await Payment.find({
    estado: 'ACTIVO',
    fecha: { $gte: desde, $lte: hasta }
  });
  const totales = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0, OTRO: 0 };
  for (const p of pagos) {
    if (totales[p.metodo] === undefined) totales[p.metodo] = 0;
    totales[p.metodo] += p.montoCentavos;
  }
  const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);
  return { totales, totalGeneral };
}

// GET /api/caja/abierta
export async function obtenerCajaAbierta(req, res, next) {
  try {
    const caja = await CashSession.findOne({ estado: 'ABIERTA' })
      .populate('abiertaPor', 'nombre email');
    res.json({ ok: true, caja: caja || null });
  } catch (e) {
    next(e);
  }
}

export async function listarCajas(req, res, next) {
  try {
    const { estado, desde, hasta } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (desde || hasta) {
      filtro.fechaApertura = {};
      if (desde) filtro.fechaApertura.$gte = new Date(desde);
      if (hasta) filtro.fechaApertura.$lte = new Date(hasta);
    }
    const { page, limit, skip } = paginacion(req.query);
    const [cajas, total] = await Promise.all([
      CashSession.find(filtro)
        .populate('abiertaPor', 'nombre email')
        .populate('cerradaPor', 'nombre email')
        .sort({ fechaApertura: -1 })
        .skip(skip)
        .limit(limit),
      CashSession.countDocuments(filtro)
    ]);
    res.json({ ok: true, cajas, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function obtenerCaja(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    }
    const caja = await CashSession.findById(req.params.id)
      .populate('abiertaPor', 'nombre email')
      .populate('cerradaPor', 'nombre email');
    if (!caja) return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    res.json({ ok: true, caja });
  } catch (e) {
    next(e);
  }
}

// POST /api/caja/abrir
export async function abrirCaja(req, res, next) {
  try {
    const { montoInicialCentavos = 0, observacionesApertura } = req.body || {};
    if (!Number.isInteger(montoInicialCentavos) || montoInicialCentavos < 0) {
      return res.status(400).json({ ok: false, message: 'montoInicialCentavos debe ser un entero >= 0' });
    }
    const abierta = await CashSession.findOne({ estado: 'ABIERTA' });
    if (abierta) {
      return res.status(409).json({ ok: false, message: 'Ya hay una caja abierta. Debe cerrarla antes de abrir otra.' });
    }
    const caja = new CashSession({
      estado: 'ABIERTA',
      abiertaPor: req.usuario?._id || null,
      montoInicialCentavos,
      observacionesApertura: observacionesApertura || ''
    });
    await caja.save();
    const poblada = await CashSession.findById(caja._id).populate('abiertaPor', 'nombre email');
    res.status(201).json({ ok: true, caja: poblada });
  } catch (e) {
    next(e);
  }
}

// POST /api/caja/:id/cerrar
export async function cerrarCaja(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    }
    const { totalRealCentavos, observacionesCierre } = req.body || {};
    if (!Number.isInteger(totalRealCentavos) || totalRealCentavos < 0) {
      return res.status(400).json({ ok: false, message: 'totalRealCentavos debe ser un entero >= 0' });
    }
    const caja = await CashSession.findById(req.params.id);
    if (!caja) return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    if (caja.estado !== 'ABIERTA') {
      return res.status(409).json({ ok: false, message: 'La caja ya está cerrada' });
    }
    const fechaCierre = new Date();
    const { totales, totalGeneral } = await calcularTotalesPorMetodo(caja.fechaApertura, fechaCierre);
    // El total esperado suma el monto inicial (efectivo de apertura) más lo cobrado.
    const totalEsperadoCentavos = caja.montoInicialCentavos + totalGeneral;
    caja.totalesPorMetodo = totales;
    caja.totalEsperadoCentavos = totalEsperadoCentavos;
    caja.totalRealCentavos = totalRealCentavos;
    caja.diferenciaCentavos = totalRealCentavos - totalEsperadoCentavos;
    caja.observacionesCierre = observacionesCierre || '';
    caja.estado = 'CERRADA';
    caja.cerradaPor = req.usuario?._id || null;
    caja.fechaCierre = fechaCierre;
    await caja.save();
    const poblada = await CashSession.findById(caja._id)
      .populate('abiertaPor', 'nombre email')
      .populate('cerradaPor', 'nombre email');
    res.json({ ok: true, caja: poblada });
  } catch (e) {
    next(e);
  }
}

// Devuelve la sesión CERRADA cuyo rango [fechaApertura, fechaCierre] contiene la fecha dada.
// Se usa para bloquear pagos/anulaciones posteriores al cierre de esa caja.
export async function cajaCerradaQueContiene(fecha) {
  return CashSession.findOne({
    estado: 'CERRADA',
    fechaApertura: { $lte: fecha },
    fechaCierre: { $gte: fecha }
  });
}

// Devuelve la sesión de caja ABIERTA (o null). Por diseño solo puede existir una a la vez.
// Se usa para exigir una caja abierta antes de registrar pagos.
export async function cajaAbiertaActual() {
  return CashSession.findOne({ estado: 'ABIERTA' });
}

export { METODOS_PAGO };
