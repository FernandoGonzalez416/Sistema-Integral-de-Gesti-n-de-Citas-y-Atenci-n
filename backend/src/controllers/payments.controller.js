import Payment, { METODOS_PAGO } from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import Receipt from '../models/Receipt.js';
import { cajaCerradaQueContiene, cajaAbiertaActual } from './cash.controller.js';
import { emitirComprobante } from '../utils/receipt.js';
import { calcularSaldo } from '../utils/saldo.js';
import mongoose from 'mongoose';
import { paginacion } from '../utils/consulta.js';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

export async function listarPagos(req, res, next) {
  try {
    const { cita, paciente, metodo, estado, desde, hasta } = req.query;
    const filtro = {};
    if (cita) filtro.cita = cita;
    if (paciente) filtro.paciente = paciente;
    if (metodo) filtro.metodo = metodo;
    if (estado) filtro.estado = estado;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    const { page, limit, skip } = paginacion(req.query);
    const [pagos, total] = await Promise.all([
      Payment.find(filtro)
        .populate('paciente', 'nombre apellido')
        .populate('cita', 'inicio estado precioCentavos')
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filtro)
    ]);
    res.json({ ok: true, pagos, total, page, limit });
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
      .populate('registradoPor', 'nombre email');
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
      .populate('cita', 'inicio fin estado precioCentavos')
      .populate('pago', 'montoCentavos metodo fecha estado');
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
    const fechaPago = fecha ? new Date(fecha) : new Date();
    if (Number.isNaN(fechaPago.getTime())) {
      return res.status(400).json({ ok: false, message: 'Fecha de pago inválida' });
    }
    // RN-20/RN-21: B1 conserva el bloqueo por caja abierta y ventana cerrada.
    // B2 reemplaza esta lógica por una referencia explícita pago→caja.
    const cajaAbierta = await cajaAbiertaActual();
    if (!cajaAbierta) {
      return res.status(409).json({
        ok: false,
        message: 'No hay una caja abierta. Debe abrir una caja antes de registrar pagos.'
      });
    }
    const cajaCerrada = await cajaCerradaQueContiene(fechaPago);
    if (cajaCerrada) {
      return res.status(409).json({
        ok: false,
        message: 'La caja de ese período ya está cerrada; no se pueden registrar pagos retroactivos'
      });
    }
    const pago = new Payment({
      cita: citaId,
      paciente: cita.paciente,
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
      .populate('cita', 'inicio estado precioCentavos');
    const saldoActualizado = await calcularSaldo(citaId);
    res.status(201).json({ ok: true, pago: poblado, saldo: saldoActualizado });
  } catch (e) {
    next(e);
  }
}

// Anulación lógica: el pago queda en el histórico con motivo (RN-19, RN-26).
export async function anularPago(req, res, next) {
  try {
    if (!idValido(req.params.id)) {
      return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    }
    const { motivoAnulacion } = req.body || {};
    if (typeof motivoAnulacion !== 'string' || !motivoAnulacion.trim()) {
      return res.status(400).json({ ok: false, message: 'motivoAnulacion requerido' });
    }
    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ ok: false, message: 'Pago no encontrado' });
    if (pago.estado === 'ANULADO') {
      return res.status(409).json({ ok: false, message: 'El pago ya está anulado' });
    }
    // B1: bloqueo por ventana de caja cerrada. B2 lo cambia a pago.caja explícita.
    const cajaCerrada = await cajaCerradaQueContiene(pago.fecha);
    if (cajaCerrada) {
      return res.status(409).json({
        ok: false,
        message: 'La caja de ese período ya está cerrada; no se puede anular un pago de una caja cerrada'
      });
    }
    pago.estado = 'ANULADO';
    pago.motivoAnulacion = motivoAnulacion.trim();
    pago.anuladoEn = new Date();
    await pago.save();
    await Receipt.updateOne({ pago: pago._id }, { $set: { estado: 'ANULADO' } });
    const saldoActualizado = await calcularSaldo(pago.cita);
    res.json({ ok: true, pago, saldo: saldoActualizado });
  } catch (e) {
    next(e);
  }
}
