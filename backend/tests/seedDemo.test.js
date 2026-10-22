// Pruebas del seed de demostración B5.
//
// Aislamiento: base DEDICADA y DESECHABLE `sigca_test_seed` y puerto 3993.
// NO tocan la base de desarrollo `sigca` ni otras bases `sigca_test_*`.
// Al terminar se elimina la base de pruebas.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const URI = 'mongodb://localhost:27017/sigca_test_seed';
const PORT = 3993;
const BASE = `http://localhost:${PORT}`;

// Debe fijarse ANTES de importar la app, env, modelos y seed.
process.env.MONGO_URI = URI;

const { default: app } = await import('../src/app.js');
const { env } = await import('../src/config/env.js');
const { seedDemo, regexMarcador } = await import('../src/utils/seedDemo.js');

const User = (await import('../src/models/User.js')).default;
const Service = (await import('../src/models/Service.js')).default;
const Professional = (await import('../src/models/Professional.js')).default;
const Patient = (await import('../src/models/Patient.js')).default;
const Responsible = (await import('../src/models/Responsible.js')).default;
const PatientResponsible = (await import('../src/models/PatientResponsible.js')).default;
const EducationalMaterial = (await import('../src/models/EducationalMaterial.js')).default;
const PatientMaterial = (await import('../src/models/PatientMaterial.js')).default;
const AppointmentRequest = (await import('../src/models/AppointmentRequest.js')).default;
const Appointment = (await import('../src/models/Appointment.js')).default;
const Payment = (await import('../src/models/Payment.js')).default;
const CashSession = (await import('../src/models/CashSession.js')).default;
const Receipt = (await import('../src/models/Receipt.js')).default;
const Counter = (await import('../src/models/Counter.js')).default;

const MODELOS = {
  users: User,
  services: Service,
  professionals: Professional,
  patients: Patient,
  responsibles: Responsible,
  patientResponsibles: PatientResponsible,
  materials: EducationalMaterial,
  patientMaterials: PatientMaterial,
  appointmentRequests: AppointmentRequest,
  appointments: Appointment,
  payments: Payment,
  cashSessions: CashSession,
  receipts: Receipt
};

let server;
let resultadoSeed;

async function snapshot() {
  const datos = {};
  for (const [nombre, modelo] of Object.entries(MODELOS)) {
    datos[nombre] = await modelo.countDocuments();
  }
  const counter = await Counter.findById('comprobante').lean();
  datos.counterSeq = counter ? counter.seq : 0;
  return datos;
}

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function edadEnAnios(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

before(async () => {
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();

  // Los índices únicos parciales son parte de las garantías B4/B5.
  await Promise.all([
    User.createIndexes(),
    Appointment.createIndexes(),
    Professional.createIndexes(),
    Payment.createIndexes(),
    Receipt.createIndexes(),
    PatientResponsible.createIndexes(),
    PatientMaterial.createIndexes()
  ]);

  server = app.listen(PORT);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('B5. Seed de demostración', () => {
  test('1. dry-run no escribe nada y produce un plan', async () => {
    const antes = await snapshot();
    const dry = await seedDemo({ dryRun: true });

    assert.equal(dry.creados.length, 0);
    assert.equal(dry.omitidos.length, 0);
    assert.ok(dry.plan.length > 0, 'el plan debe mostrar registros');
    assert.deepEqual(await snapshot(), antes, 'el dry-run no debe modificar la base');
  });

  test('2. aplica el seed completo en una base limpia', async () => {
    resultadoSeed = await seedDemo();
    assert.ok(resultadoSeed.creados.length > 0);
    assert.equal(resultadoSeed.omitidos.length, 0);
  });

  test('3. usuarios y profesionales: roles exactos y vínculos distintos', async () => {
    const porRol = await User.aggregate([{ $group: { _id: '$rol', total: { $sum: 1 } } }]);
    const roles = Object.fromEntries(porRol.map((r) => [r._id, r.total]));

    assert.equal(roles.ADMINISTRADOR, 1);
    assert.equal(roles.RECEPCIONISTA, 2);
    assert.equal(roles.PROFESIONAL, 3);
    assert.equal(roles.CLIENTE || 0, 0);
    assert.equal(await User.countDocuments(), 6);

    assert.ok(await User.exists({ email: 'recepcion2.demo@demo.sigca', rol: 'RECEPCIONISTA' }));
    assert.ok(await User.exists({ email: 'valentina.ortiz@demo.sigca', rol: 'PROFESIONAL' }));

    const profesionales = await Professional.find().populate('usuario');
    assert.equal(profesionales.length, 3);
    const usuariosVinculados = profesionales.map((p) => String(p.usuario?._id));
    assert.equal(new Set(usuariosVinculados).size, 3, 'cada profesional debe tener un usuario distinto');
    assert.equal(usuariosVinculados.includes('undefined'), false);
    for (const profesional of profesionales) {
      assert.ok(profesional.usuario, `el profesional ${profesional.dni} debe tener usuario`);
      assert.equal(profesional.usuario.rol, 'PROFESIONAL');
    }
  });

  test('4. conteos exactos de pacientes, responsables, servicios y materiales', async () => {
    assert.equal(await Patient.countDocuments(), 10);
    assert.equal(await Responsible.countDocuments(), 5);
    assert.equal(await Service.countDocuments(), 5);
    assert.equal(await EducationalMaterial.countDocuments(), 5);
    assert.equal(await PatientMaterial.countDocuments(), 5);
    assert.equal(await AppointmentRequest.countDocuments(), 5);
    assert.equal(await Appointment.countDocuments(), 15);
    assert.equal(await Payment.countDocuments(), 10);
    assert.equal(await CashSession.countDocuments(), 3);
    assert.equal(await Receipt.countDocuments(), 10);
    assert.equal(await PatientResponsible.countDocuments({ activo: true }), 5);

    assert.equal(await Service.countDocuments({ activo: false }), 1);
    const evaluacion = await Service.findOne({ nombre: 'Evaluación inicial' });
    assert.ok(evaluacion);
    assert.equal(evaluacion.precioCentavos, 15000);
    assert.equal(evaluacion.duracionMinutos, 30);
    assert.equal(evaluacion.activo, false);

    assert.equal(await PatientMaterial.countDocuments({ asignadoPor: null }), 0);

    const pacientes = await Patient.find().lean();
    const menores = pacientes.filter((p) => edadEnAnios(p.fechaNacimiento) < 18);
    assert.ok(menores.length >= 2);
    const idsMenores = new Set(menores.map((p) => String(p._id)));
    const enlaces = await PatientResponsible.find({ activo: true }).lean();
    const menoresConResponsable = new Set(
      enlaces.map((e) => String(e.paciente)).filter((id) => idsMenores.has(id))
    );
    assert.ok(menoresConResponsable.size >= 2, 'al menos dos menores deben tener responsable activo');

    const responsablesConEnlace = new Set(enlaces.map((e) => String(e.responsable)));
    assert.equal(responsablesConEnlace.size, 5, 'todos los responsables deben tener al menos un vínculo');
  });

  test('5. citas: estados, precio/duración, futuro y sin solapamientos', async () => {
    const citas = await Appointment.find().populate('servicio');
    assert.equal(citas.length, 15);

    const estadosPermitidos = new Set(['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA']);
    const ahora = new Date();

    for (const cita of citas) {
      assert.ok(estadosPermitidos.has(cita.estado), `estado inválido: ${cita.estado}`);
      assert.ok(cita.servicio, 'la cita debe referenciar un servicio existente');
      assert.equal(cita.precioCentavos, cita.servicio.precioCentavos);
      assert.equal(cita.duracionMinutos, cita.servicio.duracionMinutos);
      assert.equal(
        new Date(cita.fin).getTime() - new Date(cita.inicio).getTime(),
        cita.duracionMinutos * 60000
      );

      if (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') {
        assert.ok(new Date(cita.inicio) > ahora, `la cita activa ${cita._id} debe ser futura`);
      }
    }

    const porProfesional = new Map();
    for (const cita of citas) {
      const clave = String(cita.profesional);
      if (!porProfesional.has(clave)) porProfesional.set(clave, []);
      porProfesional.get(clave).push({
        inicio: new Date(cita.inicio).getTime(),
        fin: new Date(cita.fin).getTime(),
        id: String(cita._id)
      });
    }

    for (const [profesional, intervalos] of porProfesional) {
      intervalos.sort((a, b) => a.inicio - b.inicio);
      for (let i = 1; i < intervalos.length; i++) {
        assert.ok(
          intervalos[i - 1].fin <= intervalos[i].inicio,
          `solapamiento del profesional ${profesional} entre ${intervalos[i - 1].id} y ${intervalos[i].id}`
        );
      }
    }
  });

  test('6. solicitudes: estados mixtos y enlaces bidireccionales únicos', async () => {
    const solicitudes = await AppointmentRequest.find().lean();
    assert.equal(solicitudes.length, 5);

    const porEstado = solicitudes.reduce((acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {});
    assert.equal(porEstado.PENDIENTE, 2);
    assert.equal(porEstado.ATENDIDA, 2);
    assert.equal(porEstado.RECHAZADA, 1);

    for (const solicitud of solicitudes) {
      if (solicitud.estado === 'ATENDIDA') {
        assert.ok(solicitud.citaGenerada, 'toda solicitud ATENDIDA debe tener cita generada');
      }
      if (solicitud.citaGenerada) {
        const cita = await Appointment.findById(solicitud.citaGenerada).lean();
        assert.ok(cita, 'la cita generada debe existir');
        assert.equal(String(cita.solicitudOrigen), String(solicitud._id));
      }
    }

    const citas = await Appointment.find({ solicitudOrigen: { $ne: null } }).lean();
    const origenes = new Set(citas.map((c) => String(c.solicitudOrigen)));
    assert.equal(origenes.size, citas.length, 'cada solicitudOrigen debe ser única');
    assert.ok(citas.length >= 1);

    for (const cita of citas) {
      const solicitud = await AppointmentRequest.findById(cita.solicitudOrigen).lean();
      assert.ok(solicitud, 'la solicitud de origen debe existir');
      assert.equal(String(solicitud.citaGenerada), String(cita._id));
    }
  });

  test('7. pagos y comprobantes: caja/usuario, 1:1, únicos y ANULADO', async () => {
    const pagos = await Payment.find().lean();
    assert.equal(pagos.length, 10);

    const metodos = new Set(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']);
    const estados = new Set(['REGISTRADO', 'ANULADO']);
    for (const pago of pagos) {
      assert.ok(pago.cita);
      assert.ok(pago.paciente);
      assert.ok(pago.caja, 'todo pago debe tener caja');
      assert.ok(pago.registradoPor, 'todo pago debe tener registradoPor');
      assert.ok(metodos.has(pago.metodo), `método inválido: ${pago.metodo}`);
      assert.ok(estados.has(pago.estado), `estado inválido: ${pago.estado}`);
    }

    const recibos = await Receipt.find().lean();
    assert.equal(recibos.length, 10);
    assert.equal(new Set(recibos.map((r) => String(r.pago))).size, 10, 'un comprobante por pago');
    assert.equal(new Set(recibos.map((r) => r.numero)).size, 10, 'números de comprobante únicos');

    const pagoPorId = new Map(pagos.map((p) => [String(p._id), p]));
    for (const recibo of recibos) {
      assert.match(recibo.numero, /^REC-\d{4}-\d{6}$/);
      const pago = pagoPorId.get(String(recibo.pago));
      assert.ok(pago, 'el comprobante debe apuntar a un pago existente');
      assert.equal(pago.numeroComprobante, recibo.numero, 'el número debe estar sincronizado en el pago');
      assert.equal(recibo.montoCentavos, pago.montoCentavos);
      assert.equal(recibo.metodo, pago.metodo);
    }

    const pagoAnulado = await Payment.findOne({ notas: regexMarcador('pago-04') }).lean();
    assert.ok(pagoAnulado);
    assert.equal(pagoAnulado.estado, 'ANULADO');
    assert.ok(pagoAnulado.motivoAnulacion);
    assert.ok(pagoAnulado.anuladoEn);
    assert.ok(pagoAnulado.anuladoPor);
    const reciboAnulado = await Receipt.findOne({ pago: pagoAnulado._id }).lean();
    assert.ok(reciboAnulado);
    assert.equal(reciboAnulado.estado, 'ANULADO');
  });

  test('8. finanzas por cita: completos, parciales, pendientes y canceladas sin pagos', async () => {
    const citas = await Appointment.find().lean();
    const pagos = await Payment.find({ estado: 'REGISTRADO' }).lean();

    const pagadoPorCita = new Map();
    for (const pago of pagos) {
      const clave = String(pago.cita);
      pagadoPorCita.set(clave, (pagadoPorCita.get(clave) || 0) + pago.montoCentavos);
    }

    let completas = 0;
    let parciales = 0;
    let pendientes = 0;
    for (const cita of citas) {
      const pagado = pagadoPorCita.get(String(cita._id)) || 0;
      assert.ok(pagado <= cita.precioCentavos, 'los pagos válidos no deben superar el precio');
      if (pagado === 0) pendientes++;
      else if (pagado === cita.precioCentavos) completas++;
      else parciales++;
    }

    assert.ok(completas >= 1, 'debe existir al menos una cita pagada por completo');
    assert.ok(parciales >= 1, 'debe existir al menos una cita con pago parcial');
    assert.ok(pendientes >= 1, 'debe existir al menos una cita sin pagos');

    const canceladaSinPagos = citas.some(
      (c) => c.estado === 'CANCELADA' && (pagadoPorCita.get(String(c._id)) || 0) === 0
    );
    assert.ok(canceladaSinPagos, 'debe existir una cita CANCELADA sin pagos válidos');

    const activaConPagos = citas.some(
      (c) =>
        (c.estado === 'CONFIRMADA' || c.estado === 'PENDIENTE') &&
        (pagadoPorCita.get(String(c._id)) || 0) > 0
    );
    assert.ok(activaConPagos, 'debe existir una cita activa con pagos válidos');
  });

  test('9. cajas: totales, esperado, real y diferencia coherentes', async () => {
    const pagos = await Payment.find({ estado: 'REGISTRADO' }).lean();
    const caja1 = await CashSession.findOne({ observacionesApertura: regexMarcador('caja-01') }).lean();
    const caja2 = await CashSession.findOne({ observacionesApertura: regexMarcador('caja-02') }).lean();
    const caja3 = await CashSession.findOne({ observacionesApertura: regexMarcador('caja-03') }).lean();

    assert.ok(caja1 && caja2 && caja3);

    assert.equal(caja1.estado, 'CERRADA');
    assert.equal(caja1.montoInicialCentavos, 20000);
    assert.equal(caja1.totalesPorMetodo.EFECTIVO, 25000);
    assert.equal(caja1.totalesPorMetodo.TARJETA, 10000);
    assert.equal(caja1.totalesPorMetodo.TRANSFERENCIA, 0);
    assert.equal(caja1.totalIngresosCentavos, 35000);
    assert.equal(caja1.totalEsperadoCentavos, 45000);
    assert.equal(caja1.totalRealCentavos, 44500);
    assert.equal(caja1.diferenciaCentavos, -500);

    assert.equal(caja2.estado, 'ABIERTA');
    assert.equal(caja2.montoInicialCentavos, 10000);
    assert.equal(caja2.totalesPorMetodo.EFECTIVO, 5000);
    assert.equal(caja2.totalesPorMetodo.TARJETA, 10000);
    assert.equal(caja2.totalesPorMetodo.TRANSFERENCIA, 5000);
    assert.equal(caja2.totalIngresosCentavos, 20000);
    assert.equal(caja2.totalEsperadoCentavos, 15000);
    assert.equal(caja2.fechaCierre, null, 'una caja abierta no debe tener fecha de cierre');
    assert.equal(caja2.cerradaPor, null, 'una caja abierta no debe tener usuario de cierre');

    assert.equal(caja3.estado, 'CERRADA');
    assert.equal(caja3.montoInicialCentavos, 15000);
    assert.equal(caja3.totalesPorMetodo.EFECTIVO, 40000);
    assert.equal(caja3.totalesPorMetodo.TARJETA, 8000);
    assert.equal(caja3.totalesPorMetodo.TRANSFERENCIA, 18000);
    assert.equal(caja3.totalIngresosCentavos, 66000);
    assert.equal(caja3.totalEsperadoCentavos, 55000);
    assert.equal(caja3.totalRealCentavos, 55000);
    assert.equal(caja3.diferenciaCentavos, 0);

    // Recalcular desde los pagos REGISTRADO de cada caja.
    for (const caja of [caja1, caja3]) {
      const deLaCaja = pagos.filter((p) => String(p.caja) === String(caja._id));
      const totales = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
      let total = 0;
      for (const pago of deLaCaja) {
        totales[pago.metodo] += pago.montoCentavos;
        total += pago.montoCentavos;
      }
      assert.equal(caja.totalesPorMetodo.EFECTIVO, totales.EFECTIVO);
      assert.equal(caja.totalesPorMetodo.TARJETA, totales.TARJETA);
      assert.equal(caja.totalesPorMetodo.TRANSFERENCIA, totales.TRANSFERENCIA);
      assert.equal(caja.totalIngresosCentavos, total);
      assert.equal(caja.totalEsperadoCentavos, caja.montoInicialCentavos + totales.EFECTIVO);
      assert.equal(caja.diferenciaCentavos, caja.totalRealCentavos - caja.totalEsperadoCentavos);
    }

    assert.equal(await CashSession.countDocuments({ diferenciaCentavos: { $lt: 0 } }), 1);
  });

  test('10. segunda ejecución: idempotente, sin altas ni cambios de comprobantes/contador', async () => {
    const antes = await snapshot();
    const recibosAntes = await Receipt.find()
      .select('numero pago estado montoCentavos metodo')
      .sort({ numero: 1 })
      .lean();

    const segundo = await seedDemo();

    assert.equal(segundo.creados.length, 0, 'la segunda ejecución no debe crear registros');
    assert.deepEqual(await snapshot(), antes, 'la segunda ejecución no debe cambiar los conteos');
    assert.deepEqual(
      await Receipt.find().select('numero pago estado montoCentavos metodo').sort({ numero: 1 }).lean(),
      recibosAntes,
      'los comprobantes no deben cambiar'
    );
    assert.equal(await Payment.countDocuments({ notas: /^\[seedDemo:pago-/ }), 10);
  });

  test('11. PATCH a CANCELADA de una cita con pagos válidos → 409', async () => {
    const cita = await Appointment.findOne({ observaciones: regexMarcador('cita-01') }).lean();
    assert.ok(cita);
    assert.ok(['PENDIENTE', 'CONFIRMADA'].includes(cita.estado));
    const pagosValidos = await Payment.countDocuments({ cita: cita._id, estado: 'REGISTRADO' });
    assert.ok(pagosValidos > 0, 'la cita elegida debe tener pagos válidos');

    const login = await api('POST', '/api/auth/login', {
      body: { email: env.adminEmail, password: env.adminPassword }
    });
    assert.equal(login.status, 200);
    assert.ok(login.json?.token);

    const respuesta = await api('PATCH', `/api/citas/${cita._id}/estado`, {
      token: login.json.token,
      body: { estado: 'CANCELADA' }
    });
    assert.equal(respuesta.status, 409);

    const despues = await Appointment.findById(cita._id).lean();
    assert.equal(despues.estado, cita.estado, 'la cita no debe cambiar de estado');
  });
});
