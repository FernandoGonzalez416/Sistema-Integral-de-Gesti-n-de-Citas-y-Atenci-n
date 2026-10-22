// Pruebas de reglas clave de SIGCA — contrato B1/B2.
//
// Ejecución:  npm test        (equivale a: node --test tests/)
//
// Aislamiento: usan una base de datos DEDICADA y DESECHABLE (`sigca_test_rules`)
// y un puerto propio (3992). NO tocan la base de desarrollo `sigca`.
// Al terminar, la base de pruebas se elimina.
//
// Cobertura:
//   A. Roles y seguridad (401/403) y rutas nuevas.
//   B. Citas: disponibilidad, estados PENDIENTE/CONFIRMADA/COMPLETADA/CANCELADA.
//   C. Paciente menor: exige responsable activo.
//   D. Pagos: saldo (PENDIENTE/PARCIAL/PAGADO), métodos y caja propia obligatoria.
//   E. Comprobante de pago (número único, idempotente y 1:1).
//   F. Anulación de pagos y cancelación con pagos válidos (RN-27).
//   G. Caja: una abierta por usuario, permisos, movimientos y arqueo (B2).
//   H. Atender solicitud de cita.
//   I. Materiales: lectura vs gestión por rol.
//   J. Contrato B1: PUT/PATCH de rutas alineadas y rutas antiguas retiradas.
//   K. Edición/reprogramación de citas y endpoints de pagos/saldo por cita.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const URI = 'mongodb://localhost:27017/sigca_test_rules';
const PORT = 3992;
const BASE = `http://localhost:${PORT}`;

// Debe fijarse ANTES de importar la app (env.js lee process.env al cargarse).
process.env.MONGO_URI = URI;

const { default: app } = await import('../src/app.js');
const User = (await import('../src/models/User.js')).default;
const Service = (await import('../src/models/Service.js')).default;
const Professional = (await import('../src/models/Professional.js')).default;
const Patient = (await import('../src/models/Patient.js')).default;
const Responsible = (await import('../src/models/Responsible.js')).default;
const Schedule = (await import('../src/models/Schedule.js')).default;
const AppointmentRequest = (await import('../src/models/AppointmentRequest.js')).default;
const Appointment = (await import('../src/models/Appointment.js')).default;
const Payment = (await import('../src/models/Payment.js')).default;

const PASS = 'Test1234';
const tok = {};
let server;
let servicio, servicioLargo, profesional, profesionalOtro, paciente, menor, responsable;
let profUser, profLinkUser, profOtroUser;
let lunesBase, martes, miercoles, jueves, viernes;
let citaB7, citaD, citaE, pagoP1, pagoP2, pagoP3, cajaC1, cajaRecep, pagoRecep, cajaG4, solicitudH1;

function proximoDia(numeroDia) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  let add = (numeroDia - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

function proximoLunes() {
  return proximoDia(1);
}

// Fecha ISO (misma máquina ⇒ round-trip seguro) para una hora del día base.
function slot(hora, min = 0, base = lunesBase) {
  const d = new Date(base);
  d.setHours(hora, min, 0, 0);
  return d.toISOString();
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

function datosCita(inicio, pacienteId = paciente._id, servicioId = servicio._id) {
  return {
    pacienteId: String(pacienteId),
    profesionalId: String(profesional._id),
    servicioId: String(servicioId),
    inicio
  };
}

const crearCita = (inicio, pacienteId = paciente._id) =>
  api('POST', '/api/citas', { token: tok.admin, body: datosCita(inicio, pacienteId) });

const registrarPago = (citaId, montoCentavos, metodo = 'EFECTIVO', extra = {}) =>
  api('POST', '/api/pagos', {
    token: tok.admin,
    body: { citaId: String(citaId), montoCentavos, metodo, ...extra }
  });

const cambiarEstado = (citaId, estado) =>
  api('PATCH', `/api/citas/${citaId}/estado`, { token: tok.admin, body: { estado } });

before(async () => {
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
  // Los índices únicos parciales son parte de la garantía B4: se crean antes de
  // las pruebas (Mongoose autoIndex no es determinista en un arranque de test).
  await Promise.all([
    Appointment.createIndexes(),
    Professional.createIndexes(),
    Payment.createIndexes(),
    User.createIndexes()
  ]);

  await Schedule.insertMany(
    [1, 2, 3, 4, 5].map((dia) => ({ dia, horaInicio: '08:00', horaFin: '17:00' }))
  );

  await new User({ nombre: 'Admin', email: 'admin.test@sigca.test', password: PASS, rol: 'ADMINISTRADOR' }).save();
  await new User({ nombre: 'Recep', email: 'recep.test@sigca.test', password: PASS, rol: 'RECEPCIONISTA' }).save();
  await new User({ nombre: 'Prof', email: 'prof.test@sigca.test', password: PASS, rol: 'PROFESIONAL' }).save();
  profUser = await new User({ nombre: 'Prof Dos', email: 'prof.dos@sigca.test', password: PASS, rol: 'PROFESIONAL' }).save();
  profLinkUser = await new User({ nombre: 'Prof Link', email: 'prof.link@sigca.test', password: PASS, rol: 'PROFESIONAL' }).save();
  profOtroUser = await new User({ nombre: 'Prof Otro', email: 'prof.otro@sigca.test', password: PASS, rol: 'PROFESIONAL' }).save();

  servicio = await new Service({
    nombre: 'Consulta test', precioCentavos: 10000, duracionMinutos: 30
  }).save();
  servicioLargo = await new Service({
    nombre: 'Consulta larga test', precioCentavos: 20000, duracionMinutos: 60
  }).save();
  profesional = await new Professional({
    nombre: 'Prof', apellido: 'Base', especialidad: 'General',
    telefono: '5551000', email: 'prof.base@test', dni: '70000001', matricula: 'MP-70001',
    usuario: profLinkUser._id
  }).save();
  profesionalOtro = await new Professional({
    nombre: 'Prof', apellido: 'Otro', especialidad: 'General',
    telefono: '5551010', email: 'prof.otro@test', dni: '70000011', matricula: 'MP-70011',
    usuario: profOtroUser._id
  }).save();
  paciente = await new Patient({
    nombre: 'Pac', apellido: 'Adulto', fechaNacimiento: new Date('1990-01-01'),
    sexo: 'M', telefono: '5552000'
  }).save();
  menor = await new Patient({
    nombre: 'Meno', apellido: 'Edad', fechaNacimiento: new Date('2015-01-01'),
    sexo: 'M', telefono: '5553000'
  }).save();
  responsable = await new Responsible({
    nombre: 'Resp', apellido: 'Menor', telefono: '5554000', parentesco: 'Madre',
    email: 'resp.menor@test.local', direccion: 'Calle de prueba 123'
  }).save();

  lunesBase = proximoLunes();
  martes = proximoDia(2);
  miercoles = proximoDia(3);
  jueves = proximoDia(4);
  viernes = proximoDia(5);

  server = app.listen(PORT);
  const login = async (email) =>
    (await api('POST', '/api/auth/login', { body: { email, password: PASS } })).json.token;
  tok.admin = await login('admin.test@sigca.test');
  tok.recep = await login('recep.test@sigca.test');
  tok.prof = await login('prof.test@sigca.test');
  tok.profLink = await login('prof.link@sigca.test');
  tok.profOtro = await login('prof.otro@sigca.test');
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('A. Roles y seguridad', () => {
  test('A1 POST /api/citas sin token → 401', async () => {
    const r = await api('POST', '/api/citas', { body: datosCita(slot(9)) });
    assert.equal(r.status, 401);
  });

  test('A2 POST /api/usuarios con token PROFESIONAL → 403', async () => {
    const r = await api('POST', '/api/usuarios', {
      token: tok.prof,
      body: { nombre: 'X', email: 'x@test.local', password: '123456', rol: 'RECEPCIONISTA' }
    });
    assert.equal(r.status, 403);
  });

  test('A3 GET /api/pagos con token PROFESIONAL → 403', async () => {
    assert.equal((await api('GET', '/api/pagos', { token: tok.prof })).status, 403);
  });

  test('A4 GET /api/health es público → 200', async () => {
    assert.equal((await api('GET', '/api/health')).status, 200);
  });
});

describe('B. Citas: disponibilidad y transiciones', () => {
  test('B1 cita en el pasado → 400', async () => {
    const pasado = new Date(lunesBase);
    pasado.setDate(pasado.getDate() - 7);
    const r = await crearCita(slot(10, 0, pasado));
    assert.equal(r.status, 400);
  });

  test('B2 cita en un día sin horario (sábado) → 400', async () => {
    const sabado = new Date(lunesBase);
    sabado.setDate(sabado.getDate() + 5);
    const r = await crearCita(slot(10, 0, sabado));
    assert.equal(r.status, 400);
  });

  test('B3 cita válida → 201 PENDIENTE', async () => {
    const r = await crearCita(slot(9));
    assert.equal(r.status, 201);
    assert.equal(r.json.cita.estado, 'PENDIENTE');
  });

  test('B4 cita en horario ya ocupado (traslape) → 400', async () => {
    const r = await crearCita(slot(9));
    assert.equal(r.status, 400);
  });

  test('B5 transición inválida (CANCELADA→CONFIRMADA) → 400', async () => {
    const c = await crearCita(slot(10));
    assert.equal((await cambiarEstado(c.json.cita._id, 'CANCELADA')).status, 200);
    const r = await cambiarEstado(c.json.cita._id, 'CONFIRMADA');
    assert.equal(r.status, 400);
  });

  test('B6 reprogramar por PUT conserva el estado CONFIRMADA', async () => {
    const c = await crearCita(slot(11));
    assert.equal((await cambiarEstado(c.json.cita._id, 'CONFIRMADA')).status, 200);
    const r = await api('PUT', `/api/citas/${c.json.cita._id}`, {
      token: tok.admin,
      body: { inicio: slot(12) }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.estado, 'CONFIRMADA');
  });

  test('B7 cancelar cita sin pagos → 200 CANCELADA', async () => {
    const c = await crearCita(slot(13));
    citaB7 = c.json.cita;
    const r = await cambiarEstado(citaB7._id, 'CANCELADA');
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.estado, 'CANCELADA');
  });

  test('B8 PENDIENTE→COMPLETADA directa → 400', async () => {
    const c = await crearCita(slot(13, 30));
    const r = await cambiarEstado(c.json.cita._id, 'COMPLETADA');
    assert.equal(r.status, 400);
  });
});

describe('C. Paciente menor de edad', () => {
  test('C1 cita de un menor sin responsable activo → 400', async () => {
    const r = await crearCita(slot(14), menor._id);
    assert.equal(r.status, 400);
  });

  test('C2 asociar un responsable al menor → 201', async () => {
    const r = await api('POST', `/api/pacientes/${menor._id}/responsables`, {
      token: tok.admin,
      body: { responsableId: String(responsable._id) }
    });
    assert.equal(r.status, 201);
  });

  test('C3 cita del menor con responsable → 201 PENDIENTE', async () => {
    const r = await crearCita(slot(15), menor._id);
    assert.equal(r.status, 201);
    assert.equal(r.json.cita.estado, 'PENDIENTE');
  });
});

describe('D. Pagos: saldo, métodos y caja obligatoria', () => {
  test('D1 sin caja abierta, registrar pago → 409', async () => {
    const c = await crearCita(slot(16));
    citaD = c.json.cita;
    const r = await registrarPago(citaD._id, 1000);
    assert.equal(r.status, 409);
  });

  test('D2 abrir caja → 201', async () => {
    const r = await api('POST', '/api/cajas/abrir', {
      token: tok.admin,
      body: { montoInicialCentavos: 1000 }
    });
    assert.equal(r.status, 201);
    cajaC1 = r.json.caja;
    assert.ok(cajaC1._id);
  });

  test('D3 pago que supera el saldo → 400', async () => {
    const r = await registrarPago(citaD._id, 20000);
    assert.equal(r.status, 400);
  });

  test('D4 pago parcial → 201 y saldo PARCIAL', async () => {
    const r = await registrarPago(citaD._id, 3000);
    assert.equal(r.status, 201);
    assert.equal(r.json.saldo.estadoSaldo, 'PARCIAL');
    assert.equal(r.json.saldo.saldoCentavos, 7000);
    assert.equal(r.json.pago.estado, 'REGISTRADO');
    pagoP1 = r.json.pago;
  });

  test('D5 segundo pago completa el saldo → PAGADO', async () => {
    const r = await registrarPago(citaD._id, 7000);
    assert.equal(r.status, 201);
    assert.equal(r.json.saldo.estadoSaldo, 'PAGADO');
    assert.equal(r.json.saldo.saldoCentavos, 0);
    pagoP2 = r.json.pago;
  });

  test('D6 método de pago inválido (BITCOIN) → 400', async () => {
    const r = await registrarPago(citaD._id, 100, 'BITCOIN');
    assert.equal(r.status, 400);
  });

  test('D6b método OTRO eliminado por RF-10 → 400', async () => {
    const r = await registrarPago(citaD._id, 100, 'OTRO');
    assert.equal(r.status, 400);
  });

  test('D7 pago sobre una cita CANCELADA → 400', async () => {
    const r = await registrarPago(citaB7._id, 100);
    assert.equal(r.status, 400);
  });

  test('D8 monto no entero → 400', async () => {
    const r = await registrarPago(citaD._id, 10.5);
    assert.equal(r.status, 400);
  });

  test('D9 fecha de pago inválida → 400', async () => {
    const r = await registrarPago(citaD._id, 100, 'EFECTIVO', { fecha: 'no-es-fecha' });
    assert.equal(r.status, 400);
  });
});

describe('E. Comprobante de pago (RF-10)', () => {
  test('E1 el pago tiene comprobante con número único y referencia 1:1', async () => {
    const r = await api('GET', `/api/pagos/${pagoP1._id}/comprobante`, { token: tok.admin });
    assert.equal(r.status, 200);
    assert.match(r.json.comprobante.numero, /^REC-\d{4}-\d{6}$/);
    assert.equal(String(r.json.comprobante.pago._id || r.json.comprobante.pago), String(pagoP1._id));
  });

  test('E2 consultar el comprobante es idempotente', async () => {
    const a = await api('GET', `/api/pagos/${pagoP1._id}/comprobante`, { token: tok.admin });
    const b = await api('GET', `/api/pagos/${pagoP1._id}/comprobante`, { token: tok.admin });
    assert.equal(a.json.comprobante.numero, b.json.comprobante.numero);
  });

  test('E3 dos pagos tienen números distintos y secuenciales', async () => {
    const a = await api('GET', `/api/pagos/${pagoP1._id}/comprobante`, { token: tok.admin });
    const b = await api('GET', `/api/pagos/${pagoP2._id}/comprobante`, { token: tok.admin });
    assert.notEqual(a.json.comprobante.numero, b.json.comprobante.numero);
    const n1 = Number(a.json.comprobante.numero.split('-')[2]);
    const n2 = Number(b.json.comprobante.numero.split('-')[2]);
    assert.equal(n2, n1 + 1);
  });

  test('E4 el pago expone el mismo numeroComprobante que su recibo', async () => {
    const recibo = await api('GET', `/api/pagos/${pagoP1._id}/comprobante`, { token: tok.admin });
    const pago = await api('GET', `/api/pagos/${pagoP1._id}`, { token: tok.admin });
    assert.equal(pago.status, 200);
    assert.equal(pago.json.pago.numeroComprobante, recibo.json.comprobante.numero);
  });
});

describe('F. Anulación de pagos y cancelación con pagos válidos', () => {
  test('F1 no se puede cancelar una cita con pagos REGISTRADO → 409', async () => {
    const r = await cambiarEstado(citaD._id, 'CANCELADA');
    assert.equal(r.status, 409);
  });

  test('F2 anular sin motivo → 400', async () => {
    const r = await api('PATCH', `/api/pagos/${pagoP2._id}/anular`, {
      token: tok.admin,
      body: { motivoAnulacion: '   ' }
    });
    assert.equal(r.status, 400);
  });

  test('F3 anular un pago → 200 y recalcula el saldo a PARCIAL', async () => {
    const r = await api('PATCH', `/api/pagos/${pagoP2._id}/anular`, {
      token: tok.admin,
      body: { motivoAnulacion: 'Prueba de anulación' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.pago.estado, 'ANULADO');
    assert.equal(r.json.saldo.estadoSaldo, 'PARCIAL');
  });

  test('F4 con un pago aún válido, cancelar sigue bloqueado → 409', async () => {
    assert.equal((await cambiarEstado(citaD._id, 'CANCELADA')).status, 409);
  });

  test('F5 anular el pago restante → 200 y saldo PENDIENTE', async () => {
    const r = await api('PATCH', `/api/pagos/${pagoP1._id}/anular`, {
      token: tok.admin,
      body: { motivoAnulacion: 'Segunda anulación' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.saldo.estadoSaldo, 'PENDIENTE');
  });

  test('F6 sin pagos válidos, cancelar la cita → 200 CANCELADA', async () => {
    const r = await cambiarEstado(citaD._id, 'CANCELADA');
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.estado, 'CANCELADA');
  });

  test('F7 el comprobante del pago anulado queda en estado ANULADO', async () => {
    const r = await api('GET', `/api/pagos/${pagoP1._id}/comprobante`, { token: tok.admin });
    assert.equal(r.status, 200);
    assert.equal(r.json.comprobante.estado, 'ANULADO');
  });
});

describe('G. Caja: caja por usuario, movimientos y arqueo', () => {
  test('G1 GET /api/cajas/actual devuelve la caja ABIERTA del usuario', async () => {
    const r = await api('GET', '/api/cajas/actual', { token: tok.admin });
    assert.equal(r.status, 200);
    assert.equal(String(r.json.caja._id), String(cajaC1._id));
    assert.equal(r.json.caja.abiertaPor.email, 'admin.test@sigca.test');
    assert.ok(r.json.resumen);
  });

  test('G2 un segundo usuario puede abrir su propia caja → 201', async () => {
    const r = await api('POST', '/api/cajas/abrir', {
      token: tok.recep,
      body: { montoInicialCentavos: 500 }
    });
    assert.equal(r.status, 201);
    cajaRecep = r.json.caja;
    assert.equal(cajaRecep.abiertaPor.email, 'recep.test@sigca.test');
  });

  test('G3 el mismo usuario no puede abrir una segunda caja → 409', async () => {
    const r = await api('POST', '/api/cajas/abrir', { token: tok.admin, body: { montoInicialCentavos: 0 } });
    assert.equal(r.status, 409);
  });

  test('G4 registrar un pago válido para el arqueo (TARJETA, caja del admin)', async () => {
    const c = await crearCita(slot(16, 30, martes));
    citaE = c.json.cita;
    const r = await registrarPago(citaE._id, 5000, 'TARJETA');
    assert.equal(r.status, 201);
    pagoP3 = r.json.pago;
    assert.equal(String(pagoP3.caja._id), String(cajaC1._id));
  });

  test('G5 el pago queda asociado a la caja abierta del usuario que lo registra', async () => {
    const c = await crearCita(slot(13, 0, martes));
    const r = await api('POST', '/api/pagos', {
      token: tok.recep,
      body: { citaId: String(c.json.cita._id), montoCentavos: 2000, metodo: 'EFECTIVO' }
    });
    assert.equal(r.status, 201);
    pagoRecep = r.json.pago;
    assert.equal(String(pagoRecep.caja._id), String(cajaRecep._id));
    assert.equal(pagoRecep.registradoPor.email, 'recep.test@sigca.test');
  });

  test('G6 el ADMINISTRADOR ve todas las cajas; el RECEPCIONISTA solo las suyas', async () => {
    const admin = await api('GET', '/api/cajas?limit=50', { token: tok.admin });
    assert.equal(admin.status, 200);
    assert.ok(admin.json.cajas.length >= 2);
    const recep = await api('GET', '/api/cajas?limit=50', { token: tok.recep });
    assert.equal(recep.status, 200);
    assert.ok(recep.json.cajas.length >= 1);
    for (const c of recep.json.cajas) {
      assert.equal(c.abiertaPor.email, 'recep.test@sigca.test');
    }
  });

  test('G7 el RECEPCIONISTA no puede consultar la caja de otro → 403', async () => {
    assert.equal((await api('GET', `/api/cajas/${cajaC1._id}`, { token: tok.recep })).status, 403);
    const admin = await api('GET', `/api/cajas/${cajaRecep._id}`, { token: tok.admin });
    assert.equal(admin.status, 200);
  });

  test('G8 GET /api/cajas/:id/movimientos devuelve detalle y totales válidos', async () => {
    const propio = await api('GET', `/api/cajas/${cajaRecep._id}/movimientos`, { token: tok.recep });
    assert.equal(propio.status, 200);
    assert.equal(propio.json.movimientos.length, 1);
    assert.equal(propio.json.resumen.totales.EFECTIVO, 2000);
    assert.equal(propio.json.resumen.totalIngresosCentavos, 2000);

    const ajeno = await api('GET', `/api/cajas/${cajaC1._id}/movimientos`, { token: tok.recep });
    assert.equal(ajeno.status, 403);

    const admin = await api('GET', `/api/cajas/${cajaRecep._id}/movimientos`, { token: tok.admin });
    assert.equal(admin.status, 200);
  });

  test('G9 el RECEPCIONISTA no puede cerrar la caja de otro → 403', async () => {
    const r = await api('POST', `/api/cajas/${cajaC1._id}/cerrar`, {
      token: tok.recep,
      body: { totalRealCentavos: 0 }
    });
    assert.equal(r.status, 403);
  });

  test('G10 un pago con fecha anterior a la apertura de la caja → 409', async () => {
    const antes = new Date(new Date(cajaRecep.fechaApertura).getTime() - 60 * 60 * 1000).toISOString();
    const r = await api('POST', '/api/pagos', {
      token: tok.recep,
      body: { citaId: String(citaE._id), montoCentavos: 100, metodo: 'EFECTIVO', fecha: antes }
    });
    assert.equal(r.status, 409);
  });

  test('G11 cerrar la caja → totales, efectivo esperado y diferencia', async () => {
    // Caja: inicial 1000, pagos REGISTRADO 5000 TARJETA (los anulados no suman).
    const r = await api('POST', `/api/cajas/${cajaC1._id}/cerrar`, {
      token: tok.admin,
      body: { totalRealCentavos: 6500 }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.caja.totalesPorMetodo.EFECTIVO, 0);
    assert.equal(r.json.caja.totalesPorMetodo.TARJETA, 5000);
    assert.equal(r.json.caja.totalesPorMetodo.TRANSFERENCIA, 0);
    assert.equal(r.json.caja.totalIngresosCentavos, 5000);
    assert.equal(r.json.caja.totalEsperadoCentavos, 1000);
    assert.equal(r.json.caja.totalRealCentavos, 6500);
    assert.equal(r.json.caja.diferenciaCentavos, 5500);
    assert.equal(r.json.caja.estado, 'CERRADA');
    assert.equal(r.json.caja.cerradaPor.email, 'admin.test@sigca.test');
    cajaC1 = r.json.caja;
  });

  test('G12 un pago de una caja cerrada no se puede anular → 409', async () => {
    const r = await api('PATCH', `/api/pagos/${pagoP3._id}/anular`, {
      token: tok.admin,
      body: { motivoAnulacion: 'Intento sobre caja cerrada' }
    });
    assert.equal(r.status, 409);
  });

  test('G13 anular un pago de caja abierta registra al usuario que anula', async () => {
    const c = await crearCita(slot(14, 0, martes));
    const alta = await api('POST', '/api/pagos', {
      token: tok.recep,
      body: { citaId: String(c.json.cita._id), montoCentavos: 1000, metodo: 'EFECTIVO' }
    });
    assert.equal(alta.status, 201);
    const r = await api('PATCH', `/api/pagos/${alta.json.pago._id}/anular`, {
      token: tok.recep,
      body: { motivoAnulacion: 'Anulación de prueba' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.pago.estado, 'ANULADO');
    assert.equal(r.json.pago.anuladoPor.email, 'recep.test@sigca.test');
    assert.ok(r.json.pago.anuladoEn);
  });

  test('G14 abrir una caja nueva tras el cierre → 201', async () => {
    const r = await api('POST', '/api/cajas/abrir', { token: tok.admin, body: { montoInicialCentavos: 0 } });
    assert.equal(r.status, 201);
    cajaG4 = r.json.caja;
  });
});

describe('H. Atender solicitud de cita', () => {
  test('H1 atender una solicitud PENDIENTE con paciente registrado → 201', async () => {
    await api('POST', '/api/solicitudes-cita', {
      body: {
        nombre: 'Solicitante', telefono: '5559999', email: 'solicitante.h1@test.local',
        servicio: String(servicio._id), mensaje: 'h1-demo'
      }
    });
    solicitudH1 = await AppointmentRequest.findOne({ mensaje: 'h1-demo' });
    assert.ok(solicitudH1, 'la solicitud pública debe persistir');

    const r = await api('POST', `/api/citas/solicitudes/${solicitudH1._id}/atender`, {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesional._id),
        inicio: slot(9, 0, martes)
      }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.cita.estado, 'PENDIENTE');
    const refrescada = await AppointmentRequest.findById(solicitudH1._id);
    assert.equal(refrescada.estado, 'ATENDIDA');
    assert.equal(String(refrescada.citaGenerada), String(r.json.cita._id));
    assert.equal(String(refrescada.atendidaPor), String((await User.findOne({ email: 'admin.test@sigca.test' }))._id));
    assert.ok(refrescada.fechaAtencion);
  });

  test('H2 atender una solicitud histórica sin servicio y sin servicioId → 400', async () => {
    // La API pública ya exige servicio; se simula una solicitud histórica sin él.
    const sol = await new AppointmentRequest({
      nombre: 'Sin servicio', telefono: '5558888', email: 'sinservicio@test.local', mensaje: 'h2-demo'
    }).save();
    const r = await api('POST', `/api/citas/solicitudes/${sol._id}/atender`, {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesional._id),
        inicio: slot(10, 0, martes)
      }
    });
    assert.equal(r.status, 400);
  });

  test('H3 no se puede atender dos veces la misma solicitud → 409 y una sola cita', async () => {
    const r = await api('POST', `/api/citas/solicitudes/${solicitudH1._id}/atender`, {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesional._id),
        inicio: slot(11, 0, martes)
      }
    });
    assert.equal(r.status, 409);
    assert.equal(await Appointment.countDocuments({ solicitudOrigen: solicitudH1._id }), 1);
  });
});

describe('I. Materiales: lectura vs gestión por rol', () => {
  test('I1 PROFESIONAL puede consultar el catálogo → 200', async () => {
    assert.equal((await api('GET', '/api/materiales', { token: tok.prof })).status, 200);
  });

  test('I2 PROFESIONAL no puede crear material → 403', async () => {
    const r = await api('POST', '/api/materiales', {
      token: tok.prof,
      body: { titulo: 'No permitido', descripcion: 'x', tipo: 'DOCUMENTO' }
    });
    assert.equal(r.status, 403);
  });

  test('I3 RECEPCIONISTA sí puede crear material → 201', async () => {
    const r = await api('POST', '/api/materiales', {
      token: tok.recep,
      body: { titulo: 'Material test', descripcion: 'x', tipo: 'DOCUMENTO' }
    });
    assert.equal(r.status, 201);
  });
});

describe('J. Contrato B1: rutas y métodos alineados', () => {
  test('J1 ruta antigua /api/users → 404', async () => {
    assert.equal((await api('GET', '/api/users', { token: tok.admin })).status, 404);
  });

  test('J2 PUT /api/usuarios/:id actualiza sin exponer hash', async () => {
    const alta = await api('POST', '/api/usuarios', {
      token: tok.admin,
      body: { nombre: 'Usuario B1', email: 'usuario.b1@sigca.test', password: PASS, rol: 'RECEPCIONISTA' }
    });
    assert.equal(alta.status, 201);
    const r = await api('PUT', `/api/usuarios/${alta.json.usuario.id}`, {
      token: tok.admin,
      body: { nombre: 'Usuario B1 Editado' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.usuario.nombre, 'Usuario B1 Editado');
    assert.equal(r.json.usuario.password, undefined);
  });

  test('J3 PUT /api/servicios/:id actualiza precio y estado', async () => {
    const alta = await api('POST', '/api/servicios', {
      token: tok.admin,
      body: { nombre: 'Servicio B1', precioCentavos: 12345, duracionMinutos: 45 }
    });
    assert.equal(alta.status, 201);
    const r = await api('PUT', `/api/servicios/${alta.json.servicio._id}`, {
      token: tok.admin,
      body: { precioCentavos: 15000, activo: false }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.servicio.precioCentavos, 15000);
    assert.equal(r.json.servicio.activo, false);
  });

  test('J4 PUT /api/pacientes/:id y PATCH /api/pacientes/:id/estado', async () => {
    const alta = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Paciente', apellido: 'B1', fechaNacimiento: '1991-02-03',
        sexo: 'F', telefono: '5557777'
      }
    });
    assert.equal(alta.status, 201);
    const id = alta.json.paciente._id;
    const edit = await api('PUT', `/api/pacientes/${id}`, {
      token: tok.admin,
      body: { direccion: 'Zona 1' }
    });
    assert.equal(edit.status, 200);
    assert.equal(edit.json.paciente.direccion, 'Zona 1');

    const baja = await api('PATCH', `/api/pacientes/${id}/estado`, {
      token: tok.admin,
      body: { activo: false }
    });
    assert.equal(baja.status, 200);
    assert.equal(baja.json.paciente.activo, false);

    const altaEstado = await api('PATCH', `/api/pacientes/${id}/estado`, {
      token: tok.admin,
      body: { estado: 'ACTIVO' }
    });
    assert.equal(altaEstado.status, 200);
    assert.equal(altaEstado.json.paciente.activo, true);
  });

  test('J5 PUT /api/responsables/:id actualiza', async () => {
    const alta = await api('POST', '/api/responsables', {
      token: tok.admin,
      body: {
        nombre: 'Resp', apellido: 'B1', telefono: '5556666', parentesco: 'Padre',
        email: 'resp.b1@test.local', direccion: 'Avenida B1, casa 5'
      }
    });
    assert.equal(alta.status, 201);
    const r = await api('PUT', `/api/responsables/${alta.json.responsable._id}`, {
      token: tok.admin,
      body: { nombre: 'Resp Editado' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.responsable.nombre, 'Resp Editado');
  });

  test('J6 PUT /api/materiales/:id actualiza y desactiva', async () => {
    const alta = await api('POST', '/api/materiales', {
      token: tok.admin,
      body: { titulo: 'Material B1', descripcion: 'x', tipo: 'DOCUMENTO' }
    });
    assert.equal(alta.status, 201);
    const r = await api('PUT', `/api/materiales/${alta.json.material._id}`, {
      token: tok.admin,
      body: { titulo: 'Material B1 editado', activo: false }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.material.titulo, 'Material B1 editado');
    assert.equal(r.json.material.activo, false);
  });

  test('J7 PUT /api/contenido/:id actualiza', async () => {
    const alta = await api('POST', '/api/contenido', {
      token: tok.admin,
      body: { clave: 'b1-test', titulo: 'Título B1', cuerpo: 'Cuerpo B1' }
    });
    assert.equal(alta.status, 201);
    const r = await api('PUT', `/api/contenido/${alta.json.contenido._id}`, {
      token: tok.admin,
      body: { titulo: 'Título B1 editado' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.contenido.titulo, 'Título B1 editado');
  });

  test('J8 PATCH /api/materiales/:id (método antiguo) → 404', async () => {
    const lista = await api('GET', '/api/materiales', { token: tok.admin });
    const id = lista.json.materiales[0]._id;
    const r = await api('PATCH', `/api/materiales/${id}`, {
      token: tok.admin,
      body: { titulo: 'No debe aplicarse' }
    });
    assert.equal(r.status, 404);
  });

  test('J9 PATCH /api/solicitudes-cita/:id/estado permite RECHAZADA', async () => {
    const alta = await api('POST', '/api/solicitudes-cita', {
      body: {
        nombre: 'Solicitud B1', telefono: '5551234', email: 'solicitud.b1@test.local',
        servicio: String(servicio._id)
      }
    });
    assert.equal(alta.status, 201);
    const sol = await AppointmentRequest.findOne({ nombre: 'Solicitud B1' });
    const r = await api('PATCH', `/api/solicitudes-cita/${sol._id}/estado`, {
      token: tok.admin,
      body: { estado: 'RECHAZADA' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.solicitud.estado, 'RECHAZADA');
  });

  test('J10 ruta antigua /api/solicitudes → 404', async () => {
    assert.equal((await api('GET', '/api/solicitudes', { token: tok.admin })).status, 404);
  });
});

describe('K. Edición de citas, pagos y saldo por cita', () => {
  test('K1 PUT reprograma y conserva el estado CONFIRMADA', async () => {
    const c = await crearCita(slot(9, 0, miercoles));
    assert.equal((await cambiarEstado(c.json.cita._id, 'CONFIRMADA')).status, 200);
    const r = await api('PUT', `/api/citas/${c.json.cita._id}`, {
      token: tok.admin,
      body: { inicio: slot(10, 0, miercoles) }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.estado, 'CONFIRMADA');
  });

  test('K2 PUT con traslape → 400', async () => {
    const a = await crearCita(slot(11, 0, miercoles));
    const b = await crearCita(slot(12, 0, miercoles));
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    const r = await api('PUT', `/api/citas/${a.json.cita._id}`, {
      token: tok.admin,
      body: { inicio: slot(12, 0, miercoles) }
    });
    assert.equal(r.status, 400);
  });

  test('K3 PUT a una fecha pasada → 400', async () => {
    const c = await crearCita(slot(13, 0, miercoles));
    const pasado = new Date(lunesBase);
    pasado.setDate(pasado.getDate() - 7);
    const r = await api('PUT', `/api/citas/${c.json.cita._id}`, {
      token: tok.admin,
      body: { inicio: slot(10, 0, pasado) }
    });
    assert.equal(r.status, 400);
  });

  test('K4 PUT sobre COMPLETADA → 409 (RN-06)', async () => {
    const c = await crearCita(slot(14, 0, miercoles));
    assert.equal((await cambiarEstado(c.json.cita._id, 'CONFIRMADA')).status, 200);
    assert.equal((await cambiarEstado(c.json.cita._id, 'COMPLETADA')).status, 200);
    const r = await api('PUT', `/api/citas/${c.json.cita._id}`, {
      token: tok.admin,
      body: { inicio: slot(15, 0, miercoles) }
    });
    assert.equal(r.status, 409);
  });

  test('K5 PUT cambio de servicio recalcula precio y duración', async () => {
    const c = await crearCita(slot(15, 0, miercoles));
    const r = await api('PUT', `/api/citas/${c.json.cita._id}`, {
      token: tok.admin,
      body: { servicioId: String(servicioLargo._id) }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.precioCentavos, 20000);
    assert.equal(r.json.cita.duracionMinutos, 60);
    const minutos = (new Date(r.json.cita.fin) - new Date(r.json.cita.inicio)) / 60000;
    assert.equal(minutos, 60);
  });

  test('K6 GET /api/citas/:id/pagos devuelve historial y saldo', async () => {
    const r = await api('GET', `/api/citas/${citaE._id}/pagos`, { token: tok.admin });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.pagos));
    assert.equal(r.json.pagos.length, 1);
    assert.equal(String(r.json.pagos[0]._id), String(pagoP3._id));
    assert.equal(r.json.saldo.estadoSaldo, 'PARCIAL');
  });

  test('K7 GET /api/citas/:id/saldo calcula desde pagos válidos', async () => {
    const r = await api('GET', `/api/citas/${citaE._id}/saldo`, { token: tok.admin });
    assert.equal(r.status, 200);
    assert.equal(r.json.saldo.precioCentavos, 10000);
    assert.equal(r.json.saldo.pagadoCentavos, 5000);
    assert.equal(r.json.saldo.saldoCentavos, 5000);
    assert.equal(r.json.saldo.estadoSaldo, 'PARCIAL');
  });

  test('K8 GET /api/citas/:id/saldo con id inválido → 404', async () => {
    assert.equal((await api('GET', '/api/citas/no-es-id/saldo', { token: tok.admin })).status, 404);
  });

  test('K9 filtro por estado eliminado (PROGRAMADA) → 400', async () => {
    assert.equal((await api('GET', '/api/citas?estado=PROGRAMADA', { token: tok.admin })).status, 400);
  });

  test('K10 PENDIENTE→CONFIRMADA→COMPLETADA → 200', async () => {
    const c = await crearCita(slot(16, 0, miercoles));
    assert.equal((await cambiarEstado(c.json.cita._id, 'CONFIRMADA')).status, 200);
    const r = await cambiarEstado(c.json.cita._id, 'COMPLETADA');
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.estado, 'COMPLETADA');
  });
});

describe('L. Modelos y relaciones (B3)', () => {
  const fechaPasada = () => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const fechaFutura = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  test('L1 paciente guarda fechaInicioProceso y observaciones administrativas', async () => {
    const r = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Paciente', apellido: 'B3', fechaNacimiento: '1998-03-15', sexo: 'F',
        telefono: '5557001', email: 'paciente.b3@test.local',
        fechaInicioProceso: fechaPasada(),
        observacionesAdministrativas: 'Observación administrativa B3'
      }
    });
    assert.equal(r.status, 201);
    assert.ok(r.json.paciente.fechaInicioProceso);
    assert.equal(r.json.paciente.observacionesAdministrativas, 'Observación administrativa B3');
  });

  test('L2 fechaInicioProceso futura → 400', async () => {
    const r = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Paciente', apellido: 'Futuro', fechaNacimiento: '1998-03-15', sexo: 'M',
        telefono: '5557002', fechaInicioProceso: fechaFutura()
      }
    });
    assert.equal(r.status, 400);
  });

  test('L3 responsable exige email y dirección (RF-04)', async () => {
    const incompleto = await api('POST', '/api/responsables', {
      token: tok.admin,
      body: { nombre: 'Resp', apellido: 'B3', telefono: '5557003', parentesco: 'Padre' }
    });
    assert.equal(incompleto.status, 400);

    const r = await api('POST', '/api/responsables', {
      token: tok.admin,
      body: {
        nombre: 'Resp', apellido: 'B3', telefono: '5557003', parentesco: 'Padre',
        email: 'resp.b3@test.local', direccion: 'Calle B3, casa 7',
        fotoUrl: 'https://ejemplo.test/resp-b3.jpg'
      }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.responsable.email, 'resp.b3@test.local');
    assert.equal(r.json.responsable.direccion, 'Calle B3, casa 7');
    assert.equal(r.json.responsable.fotoUrl, 'https://ejemplo.test/resp-b3.jpg');
  });

  test('L4 profesional se vincula a un usuario PROFESIONAL', async () => {
    const r = await api('POST', '/api/profesionales', {
      token: tok.admin,
      body: {
        nombre: 'Vinculado', apellido: 'B3', especialidad: 'General', telefono: '5557004',
        email: 'vinculado.b3@test.local', dni: '70000003', matricula: 'MP-70003',
        usuarioId: String(profUser._id)
      }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.profesional.usuario.email, 'prof.dos@sigca.test');
  });

  test('L5 un usuario no puede vincularse a dos profesionales → 409', async () => {
    const r = await api('POST', '/api/profesionales', {
      token: tok.admin,
      body: {
        nombre: 'Duplicado', apellido: 'B3', especialidad: 'General', telefono: '5557005',
        email: 'duplicado.b3@test.local', dni: '70000004', matricula: 'MP-70004',
        usuarioId: String(profUser._id)
      }
    });
    assert.equal(r.status, 409);
  });

  test('L6 el usuario vinculado debe tener rol PROFESIONAL → 400', async () => {
    const admin = await User.findOne({ email: 'admin.test@sigca.test' });
    const r = await api('POST', '/api/profesionales', {
      token: tok.admin,
      body: {
        nombre: 'Admin', apellido: 'B3', especialidad: 'General', telefono: '5557006',
        email: 'adminprof.b3@test.local', dni: '70000005', matricula: 'MP-70005',
        usuarioId: String(admin._id)
      }
    });
    assert.equal(r.status, 400);
  });

  test('L7 alta de profesional sin usuarioId → 400', async () => {
    const r = await api('POST', '/api/profesionales', {
      token: tok.admin,
      body: {
        nombre: 'Sin', apellido: 'Usuario', especialidad: 'General', telefono: '5557007',
        email: 'sinusuario.b3@test.local', dni: '70000006', matricula: 'MP-70006'
      }
    });
    assert.equal(r.status, 400);
  });

  test('L8 servicio guarda y publica imagenUrl (RF-05)', async () => {
    const alta = await api('POST', '/api/servicios', {
      token: tok.admin,
      body: {
        nombre: 'Servicio B3', precioCentavos: 12000, duracionMinutos: 30,
        imagenUrl: 'https://ejemplo.test/servicio-b3.jpg'
      }
    });
    assert.equal(alta.status, 201);
    assert.equal(alta.json.servicio.imagenUrl, 'https://ejemplo.test/servicio-b3.jpg');
    const publico = await api('GET', '/api/servicios');
    const encontrado = publico.json.servicios.find((s) => s.nombre === 'Servicio B3');
    assert.equal(encontrado.imagenUrl, 'https://ejemplo.test/servicio-b3.jpg');
  });

  test('L9 contacto exige teléfono y asunto', async () => {
    const incompleto = await api('POST', '/api/contacto', {
      body: { nombre: 'Contacto B3', email: 'contacto.b3@test.local', mensaje: 'Mensaje de prueba B3' }
    });
    assert.equal(incompleto.status, 400);
    const r = await api('POST', '/api/contacto', {
      body: {
        nombre: 'Contacto B3', email: 'contacto.b3@test.local', telefono: '5557008',
        asunto: 'Consulta B3', mensaje: 'Mensaje de prueba B3'
      }
    });
    assert.equal(r.status, 201);
  });

  test('L10 la asignación de material registra quién la realizó', async () => {
    const material = await api('POST', '/api/materiales', {
      token: tok.admin,
      body: { titulo: 'Material B3', descripcion: 'Material de prueba B3', tipo: 'DOCUMENTO' }
    });
    assert.equal(material.status, 201);
    const r = await api('POST', `/api/pacientes/${paciente._id}/materiales`, {
      token: tok.admin,
      body: { materialId: material.json.material._id, notas: 'Asignación B3' }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.relacion.asignadoPor.email, 'admin.test@sigca.test');
  });

  test('L11 la solicitud devuelve la cita generada y quién la atendió', async () => {
    const admin = await User.findOne({ email: 'admin.test@sigca.test' });
    const solicitud = await new AppointmentRequest({
      nombre: 'Solicitud B3', telefono: '5557009', email: 'solicitud.b3@test.local',
      servicio: servicio._id, estado: 'ATENDIDA',
      citaGenerada: citaB7._id, atendidaPor: admin._id, fechaAtencion: new Date()
    }).save();
    const r = await api('GET', '/api/solicitudes-cita', { token: tok.admin });
    assert.equal(r.status, 200);
    const encontrada = r.json.solicitudes.find((s) => String(s._id) === String(solicitud._id));
    assert.equal(String(encontrada.citaGenerada._id), String(citaB7._id));
    assert.equal(encontrada.atendidaPor.email, 'admin.test@sigca.test');
  });
});

describe('M. Restricciones del rol PROFESIONAL (B4)', () => {
  let citaM, citaOtro, materialM, pacienteAjeno;

  test('M1 un PROFESIONAL sin vínculo no puede listar citas → 403', async () => {
    const r = await api('GET', '/api/citas', { token: tok.prof });
    assert.equal(r.status, 403);
    assert.match(r.json.message, /profesional activo vinculado/i);
  });

  test('M2 el filtro profesional se ignora para el PROFESIONAL autenticado', async () => {
    const r = await api('GET', `/api/citas?profesional=${profesionalOtro._id}&limit=100`, {
      token: tok.profLink
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.citas.length > 0);
    for (const c of r.json.citas) {
      assert.equal(String(c.profesional._id), String(profesional._id));
    }
  });

  test('M3 se crea una cita propia y otra de otro profesional', async () => {
    const propia = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesional._id),
        servicioId: String(servicio._id),
        inicio: slot(9, 0, jueves)
      }
    });
    assert.equal(propia.status, 201);
    citaM = propia.json.cita;
    assert.equal((await cambiarEstado(citaM._id, 'CONFIRMADA')).status, 200);

    const ajena = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesionalOtro._id),
        servicioId: String(servicio._id),
        inicio: slot(10, 0, jueves)
      }
    });
    assert.equal(ajena.status, 201);
    citaOtro = ajena.json.cita;
  });

  test('M4 el PROFESIONAL puede leer su propia cita → 200', async () => {
    const r = await api('GET', `/api/citas/${citaM._id}`, { token: tok.profLink });
    assert.equal(r.status, 200);
    assert.equal(String(r.json.cita._id), String(citaM._id));
  });

  test('M5 la cita de otro profesional no es visible → 404', async () => {
    assert.equal((await api('GET', `/api/citas/${citaOtro._id}`, { token: tok.profLink })).status, 404);
  });

  test('M6 el PROFESIONAL completa una cita propia CONFIRMADA → 200', async () => {
    const r = await api('PATCH', `/api/citas/${citaM._id}/estado`, {
      token: tok.profLink,
      body: { estado: 'COMPLETADA' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.cita.estado, 'COMPLETADA');
  });

  test('M7 el PROFESIONAL no puede completar la cita de otro → 404', async () => {
    const r = await api('PATCH', `/api/citas/${citaOtro._id}/estado`, {
      token: tok.profLink,
      body: { estado: 'COMPLETADA' }
    });
    assert.equal(r.status, 404);
  });

  test('M8 PENDIENTE→COMPLETADA con rol PROFESIONAL → 400', async () => {
    const alta = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesional._id),
        servicioId: String(servicio._id),
        inicio: slot(11, 0, jueves)
      }
    });
    assert.equal(alta.status, 201);
    const r = await api('PATCH', `/api/citas/${alta.json.cita._id}/estado`, {
      token: tok.profLink,
      body: { estado: 'COMPLETADA' }
    });
    assert.equal(r.status, 400);
    const cancelar = await api('PATCH', `/api/citas/${alta.json.cita._id}/estado`, {
      token: tok.profLink,
      body: { estado: 'CANCELADA' }
    });
    assert.equal(cancelar.status, 403);
  });

  test('M9 el PROFESIONAL solo ve datos básicos de sus pacientes', async () => {
    const r = await api('GET', '/api/pacientes?limit=100', { token: tok.profLink });
    assert.equal(r.status, 200);
    assert.ok(r.json.pacientes.length > 0);
    for (const p of r.json.pacientes) {
      assert.equal(p.email, undefined);
      assert.equal(p.direccion, undefined);
      assert.ok(p.nombre);
      assert.ok(p.apellido);
      assert.ok(p.telefono);
    }
    const propia = await api('GET', `/api/pacientes/${paciente._id}`, { token: tok.profLink });
    assert.equal(propia.status, 200);
    assert.equal(propia.json.paciente.email, undefined);
  });

  test('M10 un paciente sin cita con el PROFESIONAL no es visible → 404', async () => {
    const alta = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Ajeno', apellido: 'Sin Cita', fechaNacimiento: '1990-01-01',
        sexo: 'M', telefono: '5557100'
      }
    });
    assert.equal(alta.status, 201);
    pacienteAjeno = alta.json.paciente;
    const r = await api('GET', `/api/pacientes/${alta.json.paciente._id}`, { token: tok.profLink });
    assert.equal(r.status, 404);
  });

  test('M11 el PROFESIONAL asigna materiales a su propio paciente, no a uno ajeno', async () => {
    const material = await api('POST', '/api/materiales', {
      token: tok.admin,
      body: { titulo: 'Material B4', descripcion: 'Material B4', tipo: 'DOCUMENTO' }
    });
    assert.equal(material.status, 201);
    materialM = material.json.material;
    const propio = await api('POST', `/api/pacientes/${paciente._id}/materiales`, {
      token: tok.profLink,
      body: { materialId: materialM._id }
    });
    assert.equal(propio.status, 201);
    assert.equal(propio.json.relacion.asignadoPor.email, 'prof.link@sigca.test');

    const lista = await api('GET', `/api/pacientes/${paciente._id}/materiales`, { token: tok.profLink });
    assert.equal(lista.status, 200);

    const ajeno = await api('POST', `/api/pacientes/${pacienteAjeno._id}/materiales`, {
      token: tok.profLink,
      body: { materialId: materialM._id }
    });
    assert.equal(ajeno.status, 404);
  });

  test('M12 asignar material a un paciente inactivo → 409 (RN-09)', async () => {
    const alta = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Inactivo', apellido: 'B4', fechaNacimiento: '1992-01-01',
        sexo: 'F', telefono: '5557101'
      }
    });
    assert.equal(alta.status, 201);
    const pacienteInactivo = alta.json.paciente;
    const cita = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: String(pacienteInactivo._id),
        profesionalId: String(profesional._id),
        servicioId: String(servicio._id),
        inicio: slot(12, 0, jueves)
      }
    });
    assert.equal(cita.status, 201);
    const baja = await api('PATCH', `/api/pacientes/${pacienteInactivo._id}/estado`, {
      token: tok.admin,
      body: { activo: false }
    });
    assert.equal(baja.status, 200);
    const r = await api('POST', `/api/pacientes/${pacienteInactivo._id}/materiales`, {
      token: tok.profLink,
      body: { materialId: materialM._id }
    });
    assert.equal(r.status, 409);
  });

  test('M13 un PROFESIONAL sin vínculo no accede a materiales de pacientes → 403', async () => {
    const r = await api('GET', `/api/pacientes/${paciente._id}/materiales`, { token: tok.prof });
    assert.equal(r.status, 403);
  });
});

describe('N. Solicitudes y conversión atómica (B4)', () => {
  test('N1 alta sin email → 400', async () => {
    const r = await api('POST', '/api/solicitudes-cita', {
      body: { nombre: 'Sin Email', telefono: '5557200', servicio: String(servicio._id) }
    });
    assert.equal(r.status, 400);
  });

  test('N2 alta sin servicio → 400', async () => {
    const r = await api('POST', '/api/solicitudes-cita', {
      body: { nombre: 'Sin Servicio', telefono: '5557201', email: 'sinservicio.n2@test.local' }
    });
    assert.equal(r.status, 400);
  });

  test('N3 servicio inválido o inactivo → 400', async () => {
    assert.equal((await api('POST', '/api/solicitudes-cita', {
      body: { nombre: 'Mal Servicio', telefono: '5557202', email: 'mal.n3@test.local', servicio: 'no-es-id' }
    })).status, 400);
    const inexistente = new mongoose.Types.ObjectId();
    assert.equal((await api('POST', '/api/solicitudes-cita', {
      body: { nombre: 'No Existe', telefono: '5557203', email: 'no.n3@test.local', servicio: String(inexistente) }
    })).status, 400);
  });

  test('N4 alta válida, listado y filtro por estado', async () => {
    const alta = await api('POST', '/api/solicitudes-cita', {
      body: {
        nombre: 'Solicitud B4', telefono: '5557204', email: 'solicitud.b4@test.local',
        servicio: String(servicio._id), mensaje: 'n4-demo'
      }
    });
    assert.equal(alta.status, 201);
    const lista = await api('GET', '/api/solicitudes-cita?estado=PENDIENTE', { token: tok.admin });
    assert.equal(lista.status, 200);
    assert.ok(lista.json.solicitudes.every((s) => s.estado === 'PENDIENTE'));
    assert.ok(lista.json.solicitudes.some((s) => s.mensaje === 'n4-demo'));
    assert.equal((await api('GET', '/api/solicitudes-cita?estado=NOPE', { token: tok.admin })).status, 400);
  });

  test('N5 rechazo sin motivo → 400', async () => {
    const sol = await AppointmentRequest.findOne({ mensaje: 'n4-demo' });
    assert.equal((await api('PATCH', `/api/solicitudes-cita/${sol._id}/rechazar`, {
      token: tok.admin,
      body: {}
    })).status, 400);
    assert.equal((await api('PATCH', `/api/solicitudes-cita/${sol._id}/rechazar`, {
      token: tok.admin,
      body: { motivoRechazo: '   ' }
    })).status, 400);
  });

  test('N6 rechazo con motivo → RECHAZADA y auditoría', async () => {
    const sol = await AppointmentRequest.findOne({ mensaje: 'n4-demo' });
    const r = await api('PATCH', `/api/solicitudes-cita/${sol._id}/rechazar`, {
      token: tok.admin,
      body: { motivoRechazo: 'Fuera de cobertura' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.solicitud.estado, 'RECHAZADA');
    assert.equal(r.json.solicitud.motivoRechazo, 'Fuera de cobertura');
    assert.equal(r.json.solicitud.atendidaPor.email, 'admin.test@sigca.test');
    assert.ok(r.json.solicitud.fechaAtencion);
  });

  test('N7 rechazar una solicitud ya no PENDIENTE → 409', async () => {
    const sol = await AppointmentRequest.findOne({ mensaje: 'n4-demo' });
    const r = await api('PATCH', `/api/solicitudes-cita/${sol._id}/rechazar`, {
      token: tok.admin,
      body: { motivoRechazo: 'Otra vez' }
    });
    assert.equal(r.status, 409);
  });

  test('N8 dos atender concurrentes de la misma solicitud → 1 éxito, 1 cita', async () => {
    const alta = await api('POST', '/api/solicitudes-cita', {
      body: {
        nombre: 'Concurrente', telefono: '5557205', email: 'concurrente.n8@test.local',
        servicio: String(servicio._id), mensaje: 'n8-demo'
      }
    });
    assert.equal(alta.status, 201);
    const sol = await AppointmentRequest.findOne({ mensaje: 'n8-demo' });
    const body = {
      pacienteId: String(paciente._id),
      profesionalId: String(profesional._id),
      inicio: slot(9, 0, viernes)
    };
    const [a, b] = await Promise.all([
      api('POST', `/api/citas/solicitudes/${sol._id}/atender`, { token: tok.admin, body }),
      api('POST', `/api/citas/solicitudes/${sol._id}/atender`, { token: tok.admin, body })
    ]);
    assert.deepEqual([a.status, b.status].sort((x, y) => x - y), [201, 409]);
    assert.equal(await Appointment.countDocuments({ solicitudOrigen: sol._id }), 1);
  });

  test('N9 dos crearCita concurrentes en el mismo horario → 1 cita', async () => {
    const body = {
      pacienteId: String(paciente._id),
      profesionalId: String(profesional._id),
      servicioId: String(servicio._id),
      inicio: slot(10, 0, viernes)
    };
    const [a, b] = await Promise.all([
      api('POST', '/api/citas', { token: tok.admin, body }),
      api('POST', '/api/citas', { token: tok.admin, body })
    ]);
    assert.equal([a.status, b.status].filter((s) => s === 201).length, 1);
    assert.ok([a.status, b.status].every((s) => s === 201 || s === 400 || s === 409));
    assert.equal(await Appointment.countDocuments({
      profesional: profesional._id,
      estado: { $in: ['PENDIENTE', 'CONFIRMADA'] },
      inicio: new Date(body.inicio)
    }), 1);
  });

  test('N10 el índice único parcial de solicitudOrigen existe', async () => {
    const indices = await Appointment.collection.indexes();
    const idx = indices.find((i) => i.name === 'solicitudOrigen_1');
    assert.ok(idx, 'debe existir el índice solicitudOrigen_1');
    assert.equal(idx.unique, true);
    assert.deepEqual(idx.partialFilterExpression, { solicitudOrigen: { $type: 'objectId' } });
  });

  test('N11 reparar enlace si la cita ya existe pero la solicitud quedó PENDIENTE', async () => {
    const sol = await new AppointmentRequest({
      nombre: 'Reparar', telefono: '5557206', email: 'reparar.n11@test.local',
      servicio: servicio._id, mensaje: 'n11-demo'
    }).save();
    const citaExistente = await new Appointment({
      paciente: paciente._id,
      profesional: profesional._id,
      servicio: servicio._id,
      inicio: new Date(slot(11, 0, viernes)),
      fin: new Date(new Date(slot(11, 0, viernes)).getTime() + 30 * 60000),
      precioCentavos: servicio.precioCentavos,
      duracionMinutos: servicio.duracionMinutos,
      estado: 'PENDIENTE',
      solicitudOrigen: sol._id
    }).save();
    const r = await api('POST', `/api/citas/solicitudes/${sol._id}/atender`, {
      token: tok.admin,
      body: {
        pacienteId: String(paciente._id),
        profesionalId: String(profesional._id),
        inicio: slot(12, 0, viernes)
      }
    });
    assert.equal(r.status, 409);
    const reparada = await AppointmentRequest.findById(sol._id);
    assert.equal(reparada.estado, 'ATENDIDA');
    assert.equal(String(reparada.citaGenerada), String(citaExistente._id));
    assert.equal(await Appointment.countDocuments({ solicitudOrigen: sol._id }), 1);
  });
});

describe('O. Restablecimiento de contraseña por ADMINISTRADOR (B4)', () => {
  let usuarioReset;

  test('O1 el admin restablece la contraseña; la anterior deja de funcionar', async () => {
    const alta = await api('POST', '/api/usuarios', {
      token: tok.admin,
      body: {
        nombre: 'Reset User', email: 'reset.test@sigca.test', password: PASS, rol: 'RECEPCIONISTA'
      }
    });
    assert.equal(alta.status, 201);
    usuarioReset = alta.json.usuario;
    assert.equal((await api('POST', '/api/auth/login', {
      body: { email: 'reset.test@sigca.test', password: PASS }
    })).status, 200);
    const r = await api('PATCH', `/api/usuarios/${usuarioReset.id}/restablecer-password`, {
      token: tok.admin,
      body: { passwordNueva: 'Nueva1234' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.usuario.password, undefined);
    assert.equal(JSON.stringify(r.json).includes('$2'), false);
    assert.equal((await api('POST', '/api/auth/login', {
      body: { email: 'reset.test@sigca.test', password: PASS }
    })).status, 401);
    assert.equal((await api('POST', '/api/auth/login', {
      body: { email: 'reset.test@sigca.test', password: 'Nueva1234' }
    })).status, 200);
  });

  test('O2 RECEPCIONISTA y PROFESIONAL no pueden restablecer contraseñas → 403', async () => {
    for (const token of [tok.recep, tok.profLink]) {
      const r = await api('PATCH', `/api/usuarios/${usuarioReset.id}/restablecer-password`, {
        token,
        body: { passwordNueva: 'Otra1234' }
      });
      assert.equal(r.status, 403);
    }
  });

  test('O3 contraseña corta, tipo inválido y usuario inexistente', async () => {
    assert.equal((await api('PATCH', `/api/usuarios/${usuarioReset.id}/restablecer-password`, {
      token: tok.admin, body: { passwordNueva: '123' }
    })).status, 400);
    assert.equal((await api('PATCH', `/api/usuarios/${usuarioReset.id}/restablecer-password`, {
      token: tok.admin, body: { passwordNueva: 12345678 }
    })).status, 400);
    assert.equal((await api('PATCH', `/api/usuarios/${new mongoose.Types.ObjectId()}/restablecer-password`, {
      token: tok.admin, body: { passwordNueva: 'Nueva1234' }
    })).status, 404);
  });
});

describe('P. Índices, filtros y robustez de entrada (B4)', () => {
  test('P1 índice único parcial de Professional.usuario', async () => {
    const idx = (await Professional.collection.indexes()).find((i) => i.name === 'usuario_1');
    assert.ok(idx);
    assert.equal(idx.unique, true);
    assert.deepEqual(idx.partialFilterExpression, { usuario: { $type: 'objectId' } });
  });

  test('P2 índice único parcial de Payment.numeroComprobante', async () => {
    const idx = (await Payment.collection.indexes()).find((i) => i.name === 'numeroComprobante_1');
    assert.ok(idx);
    assert.equal(idx.unique, true);
    assert.deepEqual(idx.partialFilterExpression, { numeroComprobante: { $type: 'string' } });
  });

  test('P3 filtros inválidos de citas y solicitudes → 400, nunca 5xx', async () => {
    const casos = [
      ['GET', '/api/citas?paciente=no-es-id', tok.admin],
      ['GET', '/api/citas?servicio=no-es-id', tok.admin],
      ['GET', '/api/citas?profesional=no-es-id', tok.admin],
      ['GET', '/api/citas?desde=no-es-fecha', tok.admin],
      ['GET', '/api/solicitudes-cita?estado=NOPE', tok.admin]
    ];
    for (const [metodo, ruta, token] of casos) {
      const r = await api(metodo, ruta, { token });
      assert.equal(r.status, 400, `${ruta} debe ser 400`);
    }
  });

  test('P4 IDs inválidos en rutas nuevas → 404, nunca 5xx', async () => {
    const casos = [
      ['GET', '/api/citas/no-es-id', tok.admin],
      ['GET', '/api/citas/no-es-id', tok.profLink],
      ['PATCH', '/api/solicitudes-cita/no-es-id/rechazar', tok.admin],
      ['PATCH', '/api/usuarios/no-es-id/restablecer-password', tok.admin],
      ['GET', '/api/profesionales/no-es-id', tok.admin]
    ];
    for (const [metodo, ruta, token] of casos) {
      const r = await api(metodo, ruta, {
        token,
        body: metodo === 'PATCH' ? { motivoRechazo: 'x', passwordNueva: 'Nueva1234' } : undefined
      });
      assert.equal(r.status, 404, `${ruta} debe ser 404`);
    }
  });

  test('P5 RECEPCIONISTA conserva acceso a citas y no a usuarios', async () => {
    assert.equal((await api('GET', '/api/citas', { token: tok.recep })).status, 200);
    assert.equal((await api('GET', '/api/usuarios', { token: tok.recep })).status, 403);
  });
});
