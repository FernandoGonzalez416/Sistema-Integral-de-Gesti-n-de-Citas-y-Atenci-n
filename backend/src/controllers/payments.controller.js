import Payment, { METODOS_PAGO } from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import CashSession from '../models/CashSession.js';
import Receipt from '../models/Receipt.js';
import { cajaAbiertaDe } from './cash.controller.js';
import { emitirComprobante } from '../utils/receipt.js';
import { calcularSaldo } from '../utils/saldo.js';
import mongoose from 'mongoose';
import { paginacion } from '../utils/consulta.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

function esAdmin(req) {
  return req.usuario?.rol === 'ADMINISTRADOR';
}

// Convierte un filtro de fecha. Si llega solo la fecha (AAAA-MM-DD), "desde"
// empieza a las 00:00 y "hasta" termina a las 23:59:59.999 del día local.
function parseFechaFiltro(valor, finDelDia) {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (partes) {
    const [, anio, mes, dia] = partes;
    return new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia),
      finDelDia ? 23 : 0,
      finDelDia ? 59 : 0,
      finDelDia ? 59 : 0,
      finDelDia ? 999 : 0
    );
  }
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// Margen para relojes desfasados al validar la fecha del pago.
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

export async function listarPagos(req, res, next) {
  try {
    const { cita, paciente, caja, metodo, estado, desde, hasta } = req.query;
    const filtro = {};
    for (const [campo, valor] of Object.entries({ cita, paciente, caja })) {
      if (!valor) continue;
      if (!idValido(valor)) {
        return res.status(400).json({ ok: false, message: `Filtro ${campo} inválido` });
      }
      filtro[campo] = valor;
    }
    if (metodo) filtro.metodo = metodo;
    if (estado) filtro.estado = estado;
    if (desde || hasta) {
      const fechaDesde = desde ? parseFechaFiltro(desde, false) : null;
      const fechaHasta = hasta ? parseFechaFiltro(hasta, true) : null;
      if ((desde && !fechaDesde) || (hasta && !fechaHasta)) {
        return res.status(400).json({ ok: false, message: 'Rango de fechas inválido' });
      }
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.$gte = fechaDesde;
      if (fechaHasta) filtro.fecha.$lte = fechaHasta;
    }

    // `aggregate` no aplica el casting de Mongoose: los ObjectId se convierten
    // explícitamente para que los totales usen exactamente el mismo filtro.
    const filtroTotales = { ...filtro };
    for (const campo of ['cita', 'paciente', 'caja']) {
      if (filtroTotales[campo]) filtroTotales[campo] = new mongoose.Types.ObjectId(filtroTotales[campo]);
    }

    const { page, limit, skip } = paginacion(req.query);
    const [pagos, total, agrupado] = await Promise.all([
      Payment.find(filtro)
        .populate('paciente', 'nombre apellido')
        .populate('cita', 'inicio estado precioCentavos')
        .populate('caja', 'fechaApertura estado montoInicialCentavos')
        .populate('anuladoPor', 'nombre email')
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filtro),
      Payment.aggregate([
        { $match: filtroTotales },
        {
          $group: {
            _id: '$estado',
            cantidad: { $sum: 1 },
            montoCentavos: { $sum: '$montoCentavos' }
          }
        }
      ])
    ]);

    // RF-10/RN-19: solo los pagos REGISTRADO suman; los ANULADO se informan aparte.
    const resumen = {
      registrado: { cantidad: 0, montoCentavos: 0 },
      anulado: { cantidad: 0, montoCentavos: 0 }
    };
    for (const fila of agrupado) {
      const clave = fila._id === 'ANULADO' ? 'anulado' : 'registrado';
      resumen[clave] = { cantidad: fila.cantidad, montoCentavos: fila.montoCentavos };
    }

    res.json({ ok: true, pagos, total, page, limit, resumen });
  } catch (e) {
    next(e);
  }
}

export async function obtenerPago(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    }
    const pago = await Payment.findById(req.params.id)
      .populate('paciente', 'nombre apellido')
      .populate('cita', 'inicio estado precioCentavos')
      .populate('caja', 'fechaApertura fechaCierre estado montoInicialCentavos')
      .populate('registradoPor', 'nombre email')
      .populate('anuladoPor', 'nombre email');
    if (!pago) return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    res.json({ ok: true, pago });
  } catch (e) {
    next(e);
  }
}

// GET /api/pagos/:id/comprobante — devuelve el comprobante del pago (lo emite si faltara).
export async function obtenerComprobantePago(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    }
    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    await emitirComprobante(pago);
    const comprobante = await Receipt.findOne({ pago: pago._id })
      .populate('paciente', 'nombre apellido telefono email')
      .populate({
        path: 'cita',
        select: 'inicio fin estado precioCentavos servicio profesional',
        populate: [
          { path: 'servicio', select: 'nombre duracionMinutos' },
          { path: 'profesional', select: 'nombre apellido' }
        ]
      })
      .populate({
        path: 'pago',
        select: 'montoCentavos metodo fecha estado notas motivoAnulacion anuladoEn registradoPor anuladoPor',
        populate: [
          { path: 'registradoPor', select: 'nombre email' },
          { path: 'anuladoPor', select: 'nombre email' }
        ]
      });
    res.json({ ok: true, comprobante });
  } catch (e) {
    next(e);
  }
}

export async function registrarPago(req, res, next) {
  try {
    const { citaId, montoCentavos, metodo, fecha, notas } = req.body || {};
    if (!citaId || montoCentavos === undefined || !metodo) {
      return res.status(400).json({ ok: false, message: 'citaId, montoCentavos y metodo requeridos' });
    }
    if (!idValido(citaId)) {
      return res.status(400).json({ ok: false, message: 'citaId inválido' });
    }
    if (!Number.isInteger(montoCentavos) || montoCentavos <= 0) {
      return res.status(400).json({ ok: false, message: 'montoCentavos debe ser un entero positivo' });
    }
    if (!METODOS_PAGO.includes(metodo)) {
      return res.status(400).json({
        ok: false,
        message: `Método inválido. Válidos: ${METODOS_PAGO.join(', ')}`
      });
    }
    if (notas !== undefined && typeof notas !== 'string') {
      return res.status(400).json({ ok: false, message: 'notas debe ser texto' });
    }

    const cita = await Appointment.findById(citaId);
    if (!cita) return res.status(400).json({ ok: false, message: 'Cita no encontrada' });
    if (cita.estado === 'CANCELADA') {
      return res.status(400).json({ ok: false, message: 'No se puede registrar un pago sobre una cita cancelada' });
    }
    const saldo = await calcularSaldo(citaId);
    if (montoCentavos > saldo.saldoCentavos) {
      return res.status(400).json({
        ok: false,
        message: `El monto supera el saldo pendiente (${saldo.saldoCentavos} centavos)`
      });
    }

    // RN-20/RN-22: el pago se asocia a la caja ABIERTA del usuario que lo registra.
    const caja = await cajaAbiertaDe(req.usuario?._id);
    if (!caja) {
      return res.status(409).json({
        ok: false,
        message: 'No tiene una caja abierta. Debe abrir su propia caja antes de registrar pagos.'
      });
    }

    const fechaPago = fecha ? new Date(fecha) : new Date();
    if (Number.isNaN(fechaPago.getTime())) {
      return res.status(400).json({ ok: false, message: 'Fecha de pago inválida' });
    }
    if (fechaPago.getTime() < new Date(caja.fechaApertura).getTime()) {
      return res.status(409).json({
        ok: false,
        message: 'La fecha del pago es anterior a la apertura de la caja; no se aceptan pagos retroactivos'
      });
    }
    if (fechaPago.getTime() > Date.now() + TOLERANCIA_FUTURO_MS) {
      return res.status(400).json({ ok: false, message: 'La fecha del pago no puede estar en el futuro' });
    }

    const pago = new Payment({
      cita: citaId,
      paciente: cita.paciente,
      caja: caja._id,
      montoCentavos,
      metodo,
      fecha: fechaPago,
      notas: notas || '',
      registradoPor: req.usuario?._id || null
    });
    await pago.save();
    // Comprobante automático (1:1 con el pago, número único).
    await emitirComprobante(pago);
    const poblado = await Payment.findById(pago._id)
      .populate('paciente', 'nombre apellido')
      .populate('cita', 'inicio estado precioCentavos')
      .populate('caja', 'fechaApertura estado')
      .populate('registradoPor', 'nombre email');
    const saldoActualizado = await calcularSaldo(citaId);
    res.status(201).json({ ok: true, pago: poblado, saldo: saldoActualizado });
  } catch (e) {
    next(e);
  }
}

// Anulación lógica: el pago queda en el histórico con motivo y usuario que anula
// (RN-19, RN-26, RN-29). Solo se permite mientras la caja del pago esté ABIERTA.
export async function anularPago(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    }
    const { motivoAnulacion } = req.body || {};
    if (typeof motivoAnulacion !== 'string' || !motivoAnulacion.trim()) {
      return res.status(400).json({ ok: false, message: 'motivoAnulacion requerido' });
    }
    if (motivoAnulacion.trim().length > 500) {
      return res.status(400).json({ ok: false, message: 'motivoAnulacion no puede superar 500 caracteres' });
    }

    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    if (pago.estado === 'ANULADO') {
      return res.status(409).json({ ok: false, message: 'El pago ya está anulado' });
    }
    if (!pago.caja) {
      return res.status(409).json({
        ok: false,
        message: 'El pago no está asociado a una caja; regularícelo antes de anularlo'
      });
    }

    const caja = await CashSession.findById(pago.caja);
    if (!caja) {
      return res.status(409).json({ ok: false, message: 'La caja del pago no existe' });
    }
    if (caja.estado !== 'ABIERTA') {
      return res.status(409).json({
        ok: false,
        message: 'Solo pueden anularse pagos de cajas abiertas'
      });
    }
    if (!esAdmin(req) && String(caja.abiertaPor) !== String(req.usuario?._id)) {
      return res.status(403).json({ ok: false, message: 'Solo puede anular pagos de su propia caja' });
    }

    pago.estado = 'ANULADO';
    pago.motivoAnulacion = motivoAnulacion.trim();
    pago.anuladoEn = new Date();
    pago.anuladoPor = req.usuario?._id || null;
    await pago.save();
    await Receipt.updateOne({ pago: pago._id }, { $set: { estado: 'ANULADO' } });
    const saldoActualizado = await calcularSaldo(pago.cita);
    const poblado = await Payment.findById(pago._id)
      .populate('paciente', 'nombre apellido')
      .populate('cita', 'inicio estado precioCentavos')
      .populate('caja', 'fechaApertura estado')
      .populate('anuladoPor', 'nombre email');
    res.json({ ok: true, pago: poblado, saldo: saldoActualizado });
  } catch (e) {
    next(e);
  }
}
