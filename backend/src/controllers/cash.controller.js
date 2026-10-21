import CashSession, { ESTADOS_CAJA } from '../models/CashSession.js';
import Payment, { ESTADOS_PAGO, METODOS_PAGO } from '../models/Payment.js';
import mongoose from 'mongoose';
import { paginacion } from '../utils/consulta.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function esAdmin(req) {
  return req.usuario?.rol === 'ADMINISTRADOR';
}

function esPropietario(req, caja) {
  return caja?.abiertaPor && String(caja.abiertaPor._id || caja.abiertaPor) === String(req.usuario?._id);
}

// ADMINISTRADOR: todas las cajas. RECEPCIONISTA: solo las propias (RF-11).
function puedeAccederCaja(req, caja) {
  return esAdmin(req) || esPropietario(req, caja);
}

// Caja ABIERTA del usuario indicado (RN-22: como máximo una).
export async function cajaAbiertaDe(usuarioId) {
  if (!usuarioId) return null;
  return CashSession.findOne({ estado: 'ABIERTA', abiertaPor: usuarioId });
}

// Totales en vivo de una caja a partir de sus pagos: solo REGISTRADO suma
// (RN-19). Devuelve el desglose por método y el total de ingresos válidos.
export async function calcularTotalesCaja(cajaId) {
  const pagos = await Payment.find({ caja: cajaId }).select('montoCentavos metodo estado');
  const totales = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  let totalIngresosCentavos = 0;
  let totalAnuladoCentavos = 0;
  let cantidadPagos = 0;

  for (const p of pagos) {
    cantidadPagos += 1;
    if (p.estado !== 'REGISTRADO') {
      totalAnuladoCentavos += p.montoCentavos;
      continue;
    }
    if (totales[p.metodo] === undefined) totales[p.metodo] = 0;
    totales[p.metodo] += p.montoCentavos;
    totalIngresosCentavos += p.montoCentavos;
  }

  return { totales, totalIngresosCentavos, totalAnuladoCentavos, cantidadPagos };
}

// GET /api/cajas/actual — caja ABIERTA del usuario autenticado (o null).
export async function obtenerCajaActual(req, res, next) {
  try {
    const caja = await CashSession.findOne({ estado: 'ABIERTA', abiertaPor: req.usuario?._id })
      .populate('abiertaPor', 'nombre email');
    if (!caja) return res.json({ ok: true, caja: null, resumen: null });

    const resumen = await calcularTotalesCaja(caja._id);
    res.json({ ok: true, caja, resumen });
  } catch (e) {
    next(e);
  }
}

export async function listarCajas(req, res, next) {
  try {
    const { estado, desde, hasta, usuario } = req.query;
    const filtro = {};

    // RECEPCIONISTA solo consulta sus propias cajas; ADMINISTRADOR todas.
    if (esAdmin(req)) {
      if (usuario !== undefined && usuario !== '') {
        if (!idValido(usuario)) {
          return res.status(400).json({ ok: false, message: 'usuario inválido' });
        }
        filtro.abiertaPor = usuario;
      }
    } else {
      filtro.abiertaPor = req.usuario?._id;
    }

    if (estado !== undefined && estado !== '') {
      if (!ESTADOS_CAJA.includes(estado)) {
        return res.status(400).json({ ok: false, message: `estado inválido. Válidos: ${ESTADOS_CAJA.join(', ')}` });
      }
      filtro.estado = estado;
    }
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
    if (!puedeAccederCaja(req, caja)) {
      return res.status(403).json({ ok: false, message: 'Solo puede consultar sus propias cajas' });
    }
    const resumen = await calcularTotalesCaja(caja._id);
    res.json({ ok: true, caja, resumen });
  } catch (e) {
    next(e);
  }
}

// POST /api/cajas/abrir — abre la caja del usuario; una sola ABIERTA por usuario.
export async function abrirCaja(req, res, next) {
  try {
    const { montoInicialCentavos = 0, observacionesApertura } = req.body || {};
    if (!Number.isInteger(montoInicialCentavos) || montoInicialCentavos < 0) {
      return res.status(400).json({ ok: false, message: 'montoInicialCentavos debe ser un entero >= 0' });
    }
    if (observacionesApertura !== undefined && typeof observacionesApertura !== 'string') {
      return res.status(400).json({ ok: false, message: 'observacionesApertura debe ser texto' });
    }

    const abierta = await cajaAbiertaDe(req.usuario?._id);
    if (abierta) {
      return res.status(409).json({
        ok: false,
        message: 'Ya tiene una caja abierta. Debe cerrarla antes de abrir otra.'
      });
    }

    const caja = new CashSession({
      estado: 'ABIERTA',
      abiertaPor: req.usuario?._id || null,
      montoInicialCentavos,
      observacionesApertura: observacionesApertura || ''
    });
    try {
      await caja.save();
    } catch (e) {
      // Índice único parcial: otra apertura simultánea del mismo usuario.
      if (e.code === 11000) {
        return res.status(409).json({
          ok: false,
          message: 'Ya tiene una caja abierta. Debe cerrarla antes de abrir otra.'
        });
      }
      throw e;
    }

    const poblada = await CashSession.findById(caja._id).populate('abiertaPor', 'nombre email');
    res.status(201).json({ ok: true, caja: poblada });
  } catch (e) {
    next(e);
  }
}

// POST /api/cajas/:id/cerrar — snapshot de totales, efectivo esperado y diferencia.
export async function cerrarCaja(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    }
    const { totalRealCentavos, observacionesCierre } = req.body || {};
    if (!Number.isInteger(totalRealCentavos) || totalRealCentavos < 0) {
      return res.status(400).json({ ok: false, message: 'totalRealCentavos debe ser un entero >= 0' });
    }
    if (observacionesCierre !== undefined && typeof observacionesCierre !== 'string') {
      return res.status(400).json({ ok: false, message: 'observacionesCierre debe ser texto' });
    }

    const caja = await CashSession.findById(req.params.id);
    if (!caja) return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    if (!puedeAccederCaja(req, caja)) {
      return res.status(403).json({ ok: false, message: 'Solo puede cerrar sus propias cajas' });
    }
    if (caja.estado !== 'ABIERTA') {
      return res.status(409).json({ ok: false, message: 'La caja ya está cerrada' });
    }

    const { totales, totalIngresosCentavos } = await calcularTotalesCaja(caja._id);
    // RF-11: efectivo esperado = monto inicial + ingresos en efectivo.
    const totalEsperadoCentavos = caja.montoInicialCentavos + totales.EFECTIVO;
    const diferenciaCentavos = totalRealCentavos - totalEsperadoCentavos;

    caja.totalesPorMetodo = totales;
    caja.totalIngresosCentavos = totalIngresosCentavos;
    caja.totalEsperadoCentavos = totalEsperadoCentavos;
    caja.totalRealCentavos = totalRealCentavos;
    caja.diferenciaCentavos = diferenciaCentavos;
    caja.observacionesCierre = observacionesCierre || '';
    caja.estado = 'CERRADA';
    caja.cerradaPor = req.usuario?._id || null;
    caja.fechaCierre = new Date();
    await caja.save();

    const poblada = await CashSession.findById(caja._id)
      .populate('abiertaPor', 'nombre email')
      .populate('cerradaPor', 'nombre email');
    res.json({ ok: true, caja: poblada });
  } catch (e) {
    next(e);
  }
}

// GET /api/cajas/:id/movimientos — detalle de pagos y totales de la caja.
export async function movimientosCaja(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    }
    const caja = await CashSession.findById(req.params.id)
      .populate('abiertaPor', 'nombre email')
      .populate('cerradaPor', 'nombre email');
    if (!caja) return res.status(404).json({ ok: false, message: 'Caja no encontrada' });
    if (!puedeAccederCaja(req, caja)) {
      return res.status(403).json({ ok: false, message: 'Solo puede consultar sus propias cajas' });
    }

    const filtro = { caja: caja._id };
    const { estado } = req.query;
    if (estado !== undefined && estado !== '') {
      if (!ESTADOS_PAGO.includes(estado)) {
        return res.status(400).json({ ok: false, message: `estado inválido. Válidos: ${ESTADOS_PAGO.join(', ')}` });
      }
      filtro.estado = estado;
    }

    const [movimientos, resumen] = await Promise.all([
      Payment.find(filtro)
        .populate('paciente', 'nombre apellido')
        .populate('cita', 'inicio estado precioCentavos')
        .populate('registradoPor', 'nombre email')
        .populate('anuladoPor', 'nombre email')
        .sort({ fecha: 1 }),
      calcularTotalesCaja(caja._id)
    ]);

    res.json({ ok: true, caja, movimientos, resumen });
  } catch (e) {
    next(e);
  }
}

export { METODOS_PAGO };
