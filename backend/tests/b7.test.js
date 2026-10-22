// B7: pasada completa de la sección 16 del enunciado (evaluación funcional)
// más la auditoría de modelos, relaciones, validaciones e integridad entre
// usuarios, profesionales, pacientes, responsables, servicios, citas,
// solicitudes, pagos y cajas.
//
// Aislamiento: base DEDICADA y DESECHABLE `sigca_test_b7` y puerto 3991.
// NO toca la base de desarrollo `sigca` ni otras bases `sigca_test_*`.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const URI = 'mongodb://localhost:27017/sigca_test_b7';
const PORT = 3991;
const BASE = `http://localhost:${PORT}`;
const PASS = 'Test1234';

process.env.MONGO_URI = URI;

const { default: app } = await import('../src/app.js');
const User = (await import('../src/models/User.js')).default;
const Patient = (await import('../src/models/Patient.js')).default;
const Responsible = (await import('../src/models/Responsible.js')).default;
const PatientResponsible = (await import('../src/models/PatientResponsible.js')).default;
const Professional = (await import('../src/models/Professional.js')).default;
const Service = (await import('../src/models/Service.js')).default;
const Schedule = (await import('../src/models/Schedule.js')).default;
const Appointment = (await import('../src/models/Appointment.js')).default;
const AppointmentRequest = (await import('../src/models/AppointmentRequest.js')).default;
const Payment = (await import('../src/models/Payment.js')).default;
const Receipt = (await import('../src/models/Receipt.js')).default;
const CashSession = (await import('../src/models/CashSession.js')).default;

let server;
const tok = {};
const ctx = {};
let respuestas5xx = 0;

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (res.status >= 500) respuestas5xx += 1;
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function login(email) {
  const r = await api('POST', '/api/auth/login', { body: { email, password: PASS } });
  assert.equal(r.status, 200, `login ${email}`);
  return r.json.token;
}

// Próximo día a las 09:00 (siempre futuro) y horarios de 07:00 a 20:00 los 7 días.
function inicioManana(hora = 9, minuto = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(hora, minuto, 0, 0);
  return fecha;
}

before(async () => {
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();

  // Índices únicos/parciales que sostienen la integridad de las relaciones.
  await Promise.all([
    User.createIndexes(),
    Patient.createIndexes(),
    Responsible.createIndexes(),
    PatientResponsible.createIndexes(),
    Professional.createIndexes(),
    Service.createIndexes(),
    Schedule.createIndexes(),
    Appointment.createIndexes(),
    AppointmentRequest.createIndexes(),
    Payment.createIndexes(),
    Receipt.createIndexes(),
    CashSession.createIndexes()
  ]);

  server = app.listen(PORT);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  // Todos los días laborables para que la prueba no dependa del día de ejecución.
  await Schedule.insertMany(
    [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
      dia,
      horaInicio: '07:00',
      horaFin: '20:00',
      activo: true
    }))
  );

  const admin = await new User({
    nombre: 'Admin B7',
    email: 'admin.b7@test.local',
    password: PASS,
    rol: 'ADMINISTRADOR'
  }).save();
  const recep = await new User({
    nombre: 'Recep B7',
    email: 'recep.b7@test.local',
    password: PASS,
    rol: 'RECEPCIONISTA'
  }).save();
  const profUser = await new User({
    nombre: 'Prof B7',
    email: 'prof.b7@test.local',
    password: PASS,
    rol: 'PROFESIONAL'
  }).save();
  const profUser2 = await new User({
    nombre: 'Prof2 B7',
    email: 'prof2.b7@test.local',
    password: PASS,
    rol: 'PROFESIONAL'
  }).save();

  ctx.profesional = await new Professional({
    nombre: 'Ana',
    apellido: 'López',
    especialidad: 'Medicina general',
    telefono: '5555-2001',
    email: 'ana.lopez@test.local',
    dni: 'B7-DNI-001',
    matricula: 'B7-MAT-001',
    usuario: profUser._id
  }).save();
  ctx.profesional2 = await new Professional({
    nombre: 'Luis',
    apellido: 'Méndez',
    especialidad: 'Odontología',
    telefono: '5555-2002',
    email: 'luis.mendez@test.local',
    dni: 'B7-DNI-002',
    matricula: 'B7-MAT-002',
    usuario: profUser2._id
  }).save();
  ctx.adminId = admin._id;
  ctx.recepId = recep._id;
  ctx.profUserId = profUser._id;

  tok.admin = await login(admin.email);
  tok.recep = await login(recep.email);
  tok.prof = await login(profUser.email);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('B7 — sección 16 e integridad de datos', () => {
  test('1. inicio de sesión como administrador (paso 1)', async () => {
    const me = await api('GET', '/api/auth/me', { token: tok.admin });
    assert.equal(me.status, 200);
    assert.equal(me.json.usuario.email, 'admin.b7@test.local');
    assert.equal(me.json.usuario.rol, 'ADMINISTRADOR');
    assert.equal(me.json.usuario.password, undefined);

    const mala = await api('POST', '/api/auth/login', {
      body: { email: 'admin.b7@test.local', password: 'incorrecta' }
    });
    assert.equal(mala.status, 401);
  });

  test('2. registrar paciente y asociar responsable (pasos 2-3)', async () => {
    const paciente = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Sofía',
        apellido: 'Ramírez',
        fechaNacimiento: '2015-05-10',
        sexo: 'F',
        telefono: '5555-3001',
        email: 'sofia.ramirez@test.local',
        direccion: 'Zona 1, Guatemala',
        fechaInicioProceso: '2026-01-15',
        observacionesAdministrativas: 'Paciente de prueba B7'
      }
    });
    assert.equal(paciente.status, 201);
    assert.equal(paciente.json.paciente.activo, true, 'el alta nace activa');
    assert.ok(paciente.json.paciente.edad < 18, 'edad virtual calculada');
    ctx.pacienteId = paciente.json.paciente._id;

    const responsable = await api('POST', '/api/responsables', {
      token: tok.admin,
      body: {
        nombre: 'Marta',
        apellido: 'Ramírez',
        telefono: '5555-3002',
        email: 'marta.ramirez@test.local',
        direccion: 'Zona 1, Guatemala',
        parentesco: 'Madre'
      }
    });
    assert.equal(responsable.status, 201);
    ctx.responsableId = responsable.json.responsable._id;

    const relacion = await api('POST', `/api/pacientes/${ctx.pacienteId}/responsables`, {
      token: tok.admin,
      body: { responsableId: ctx.responsableId }
    });
    assert.equal(relacion.status, 201);
    assert.equal(String(relacion.json.relacion.responsable._id), String(ctx.responsableId));
    ctx.relacionId = relacion.json.relacion._id;

    const duplicada = await api('POST', `/api/pacientes/${ctx.pacienteId}/responsables`, {
      token: tok.admin,
      body: { responsableId: ctx.responsableId }
    });
    assert.equal(duplicada.status, 409, 'no se duplica la relación');

    const lista = await api('GET', `/api/pacientes/${ctx.pacienteId}/responsables`, { token: tok.admin });
    assert.equal(lista.status, 200);
    assert.equal(lista.json.relaciones.length, 1);

    // Validaciones de los modelos: sin email el responsable es rechazado.
    const sinEmail = await api('POST', '/api/responsables', {
      token: tok.admin,
      body: {
        nombre: 'Sin',
        apellido: 'Correo',
        telefono: '5555-3003',
        direccion: 'Zona 2',
        parentesco: 'Tutor'
      }
    });
    assert.equal(sinEmail.status, 400);
    assert.equal(await Responsible.countDocuments({ email: '' }), 0);
  });

  test('3. crear servicio con precio (paso 4)', async () => {
    const servicio = await api('POST', '/api/servicios', {
      token: tok.admin,
      body: {
        nombre: 'Consulta B7',
        descripcion: 'Consulta de evaluación',
        precioCentavos: 25000,
        duracionMinutos: 30,
        categoria: 'General',
        incluye: ['Evaluación inicial']
      }
    });
    assert.equal(servicio.status, 201);
    assert.equal(servicio.json.servicio.precioCentavos, 25000);
    assert.equal(servicio.json.servicio.duracionMinutos, 30);
    ctx.servicioId = servicio.json.servicio._id;

    const publico = await api('GET', '/api/servicios');
    assert.equal(publico.status, 200);
    assert.ok(publico.json.servicios.some((s) => String(s._id) === String(ctx.servicioId)));

    const precioInvalido = await api('POST', '/api/servicios', {
      token: tok.admin,
      body: {
        nombre: 'Servicio inválido B7',
        precioCentavos: 10.5,
        duracionMinutos: 30
      }
    });
    assert.equal(precioInvalido.status, 400);
  });

  test('4. programar cita y rechazar horario ocupado (pasos 5-6)', async () => {
    ctx.inicio = inicioManana(9, 0);
    const cita = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        servicioId: ctx.servicioId,
        inicio: ctx.inicio.toISOString(),
        observaciones: 'Cita B7'
      }
    });
    assert.equal(cita.status, 201);
    const creada = cita.json.cita;
    assert.equal(creada.estado, 'PENDIENTE');
    assert.equal(creada.precioCentavos, 25000, 'precio histórico copiado');
    assert.equal(creada.duracionMinutos, 30);
    assert.equal(new Date(creada.fin) - new Date(creada.inicio), 30 * 60000, 'fin = inicio + duración');
    ctx.citaId = creada._id;

    const ocupada = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        servicioId: ctx.servicioId,
        inicio: ctx.inicio.toISOString()
      }
    });
    assert.equal(ocupada.status, 400);
    assert.match(ocupada.json.message, /horario/);

    // Mismo horario con otro profesional: permitido.
    const otra = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional2._id,
        servicioId: ctx.servicioId,
        inicio: ctx.inicio.toISOString()
      }
    });
    assert.equal(otra.status, 201);
    ctx.citaOtroProfesionalId = otra.json.cita._id;

    const pasada = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        servicioId: ctx.servicioId,
        inicio: '2020-01-01T10:00:00.000Z'
      }
    });
    assert.equal(pasada.status, 400);
  });

  test('5. confirmar la cita y consultarla en el calendario (pasos 7-8)', async () => {
    const confirmada = await api('PATCH', `/api/citas/${ctx.citaId}/estado`, {
      token: tok.admin,
      body: { estado: 'CONFIRMADA' }
    });
    assert.equal(confirmada.status, 200);
    assert.equal(confirmada.json.cita.estado, 'CONFIRMADA');

    const invalida = await api('PATCH', `/api/citas/${ctx.citaId}/estado`, {
      token: tok.admin,
      body: { estado: 'PENDIENTE' }
    });
    assert.equal(invalida.status, 400, 'CONFIRMADA → PENDIENTE no permitida');

    const desde = new Date(ctx.inicio);
    desde.setHours(0, 0, 0, 0);
    const hasta = new Date(ctx.inicio);
    hasta.setHours(23, 59, 59, 999);
    const calendario = await api(
      'GET',
      `/api/citas?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`,
      { token: tok.admin }
    );
    assert.equal(calendario.status, 200);
    const enCalendario = calendario.json.citas.find((c) => String(c._id) === String(ctx.citaId));
    assert.ok(enCalendario, 'la cita aparece en el calendario');
    assert.equal(enCalendario.paciente.apellido, 'Ramírez');
    assert.equal(enCalendario.profesional.apellido, 'López');
    assert.equal(enCalendario.servicio.nombre, 'Consulta B7');
  });

  test('6. abrir caja con monto inicial (paso 9)', async () => {
    const caja = await api('POST', '/api/cajas/abrir', {
      token: tok.admin,
      body: { montoInicialCentavos: 50000, observacionesApertura: 'Apertura B7' }
    });
    assert.equal(caja.status, 201);
    assert.equal(caja.json.caja.estado, 'ABIERTA');
    assert.equal(caja.json.caja.montoInicialCentavos, 50000);
    assert.equal(String(caja.json.caja.abiertaPor._id), String(ctx.adminId));
    ctx.cajaId = caja.json.caja._id;

    const segunda = await api('POST', '/api/cajas/abrir', {
      token: tok.admin,
      body: { montoInicialCentavos: 1000 }
    });
    assert.equal(segunda.status, 409, 'una sola caja abierta por usuario');

    const actual = await api('GET', '/api/cajas/actual', { token: tok.admin });
    assert.equal(actual.status, 200);
    assert.equal(String(actual.json.caja._id), String(ctx.cajaId));
    assert.equal(actual.json.resumen.totalIngresosCentavos, 0);

    const negativo = await api('POST', '/api/cajas/abrir', {
      token: tok.admin,
      body: { montoInicialCentavos: -1 }
    });
    assert.equal(negativo.status, 400);
  });

  test('7. abono parcial y consulta de saldo (pasos 10-11)', async () => {
    const pago = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.citaId, montoCentavos: 10000, metodo: 'EFECTIVO', notas: 'Abono B7' }
    });
    assert.equal(pago.status, 201);
    assert.equal(pago.json.pago.montoCentavos, 10000);
    assert.equal(String(pago.json.pago.caja._id), String(ctx.cajaId), 'pago asociado a su caja');
    assert.match(pago.json.pago.numeroComprobante, /^REC-\d{4}-\d{6}$/);
    assert.equal(pago.json.saldo.estadoSaldo, 'PARCIAL');
    assert.equal(pago.json.saldo.saldoCentavos, 15000);
    ctx.pago1Id = pago.json.pago._id;

    const saldo = await api('GET', `/api/citas/${ctx.citaId}/saldo`, { token: tok.admin });
    assert.equal(saldo.status, 200);
    assert.equal(saldo.json.saldo.precioCentavos, 25000);
    assert.equal(saldo.json.saldo.pagadoCentavos, 10000);
    assert.equal(saldo.json.saldo.saldoCentavos, 15000);
    assert.equal(saldo.json.saldo.estadoSaldo, 'PARCIAL');

    const historial = await api('GET', `/api/citas/${ctx.citaId}/pagos`, { token: tok.admin });
    assert.equal(historial.status, 200);
    assert.equal(historial.json.pagos.length, 1);
  });

  test('8. segundo pago y estado financiero PAGADO (pasos 12-13)', async () => {
    const pago = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.citaId, montoCentavos: 15000, metodo: 'TARJETA' }
    });
    assert.equal(pago.status, 201);
    assert.equal(pago.json.saldo.estadoSaldo, 'PAGADO');
    assert.equal(pago.json.saldo.saldoCentavos, 0);
    ctx.pago2Id = pago.json.pago._id;

    const excedido = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.citaId, montoCentavos: 1, metodo: 'EFECTIVO' }
    });
    assert.equal(excedido.status, 400, 'no se supera el saldo');

    const cero = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.citaId, montoCentavos: 0, metodo: 'EFECTIVO' }
    });
    assert.equal(cero.status, 400);

    const metodoMalo = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.citaId, montoCentavos: 100, metodo: 'BITCOIN' }
    });
    assert.equal(metodoMalo.status, 400);
  });

  test('9. consultar el comprobante interno (paso 14)', async () => {
    const comprobante = await api('GET', `/api/pagos/${ctx.pago1Id}/comprobante`, { token: tok.admin });
    assert.equal(comprobante.status, 200);
    const c = comprobante.json.comprobante;
    assert.match(c.numero, /^REC-\d{4}-\d{6}$/);
    assert.equal(c.montoCentavos, 10000);
    assert.equal(c.metodo, 'EFECTIVO');
    assert.equal(c.estado, 'EMITIDO');
    assert.equal(String(c.pago._id), String(ctx.pago1Id));
    assert.equal(String(c.cita._id), String(ctx.citaId));
    assert.equal(String(c.paciente._id), String(ctx.pacienteId));
    ctx.numeroComprobante = c.numero;

    const otraVez = await api('GET', `/api/pagos/${ctx.pago1Id}/comprobante`, { token: tok.admin });
    assert.equal(otraVez.status, 200);
    assert.equal(otraVez.json.comprobante.numero, ctx.numeroComprobante, 'comprobante idempotente');
    assert.equal(await Receipt.countDocuments({ pago: ctx.pago1Id }), 1);
  });

  test('10. pagos con distintos métodos e ingresos del día (pasos 15-16)', async () => {
    // Segunda cita para cubrir TRANSFERENCIA y EFECTIVO con otro saldo.
    const cita2 = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        servicioId: ctx.servicioId,
        inicio: inicioManana(11, 0).toISOString()
      }
    });
    assert.equal(cita2.status, 201);
    ctx.cita2Id = cita2.json.cita._id;

    const transferencia = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.cita2Id, montoCentavos: 12000, metodo: 'TRANSFERENCIA' }
    });
    assert.equal(transferencia.status, 201);
    assert.equal(transferencia.json.saldo.estadoSaldo, 'PARCIAL');

    const efectivo = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.cita2Id, montoCentavos: 13000, metodo: 'EFECTIVO' }
    });
    assert.equal(efectivo.status, 201);
    assert.equal(efectivo.json.saldo.estadoSaldo, 'PAGADO');

    const movimientos = await api('GET', `/api/cajas/${ctx.cajaId}/movimientos`, { token: tok.admin });
    assert.equal(movimientos.status, 200);
    assert.equal(movimientos.json.movimientos.length, 4);
    const resumen = movimientos.json.resumen;
    assert.equal(resumen.totales.EFECTIVO, 23000);
    assert.equal(resumen.totales.TARJETA, 15000);
    assert.equal(resumen.totales.TRANSFERENCIA, 12000);
    assert.equal(resumen.totalIngresosCentavos, 50000);
    assert.equal(resumen.cantidadPagos, 4);

    const ingresosDelDia = await api(
      'GET',
      `/api/pagos?caja=${ctx.cajaId}&estado=REGISTRADO`,
      { token: tok.admin }
    );
    assert.equal(ingresosDelDia.status, 200);
    assert.equal(ingresosDelDia.json.total, 4);
    const suma = ingresosDelDia.json.pagos.reduce((acc, p) => acc + p.montoCentavos, 0);
    assert.equal(suma, 50000);
  });

  test('11. efectivo contado, cierre y bloqueo de la caja cerrada (pasos 17-19)', async () => {
    const antes = await api('GET', `/api/cajas/${ctx.cajaId}`, { token: tok.admin });
    assert.equal(antes.status, 200);
    assert.equal(antes.json.resumen.totalIngresosCentavos, 50000);
    assert.equal(antes.json.caja.montoInicialCentavos + antes.json.resumen.totales.EFECTIVO, 73000);

    const cierre = await api('POST', `/api/cajas/${ctx.cajaId}/cerrar`, {
      token: tok.admin,
      body: { totalRealCentavos: 72500, observacionesCierre: 'Cierre B7' }
    });
    assert.equal(cierre.status, 200);
    const caja = cierre.json.caja;
    assert.equal(caja.estado, 'CERRADA');
    assert.equal(caja.totalIngresosCentavos, 50000);
    assert.equal(caja.totalEsperadoCentavos, 73000);
    assert.equal(caja.totalRealCentavos, 72500);
    assert.equal(caja.diferenciaCentavos, -500);
    assert.equal(caja.totalesPorMetodo.EFECTIVO, 23000);
    assert.equal(caja.totalesPorMetodo.TARJETA, 15000);
    assert.equal(caja.totalesPorMetodo.TRANSFERENCIA, 12000);
    assert.equal(String(caja.cerradaPor._id), String(ctx.adminId));
    assert.ok(caja.fechaCierre);

    const cerrarOtraVez = await api('POST', `/api/cajas/${ctx.cajaId}/cerrar`, {
      token: tok.admin,
      body: { totalRealCentavos: 72500 }
    });
    assert.equal(cerrarOtraVez.status, 409);

    // Tercera cita sin pagar: el pago debe rechazarse con la caja cerrada.
    const cita3 = await api('POST', '/api/citas', {
      token: tok.admin,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        servicioId: ctx.servicioId,
        inicio: inicioManana(13, 0).toISOString()
      }
    });
    assert.equal(cita3.status, 201);
    ctx.cita3Id = cita3.json.cita._id;

    const pagoBloqueado = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.cita3Id, montoCentavos: 5000, metodo: 'EFECTIVO' }
    });
    assert.equal(pagoBloqueado.status, 409, 'sin caja abierta no se registran pagos');

    // Una caja nueva vuelve a habilitar el registro; luego se cierra.
    const nueva = await api('POST', '/api/cajas/abrir', {
      token: tok.admin,
      body: { montoInicialCentavos: 0 }
    });
    assert.equal(nueva.status, 201);
    ctx.caja2Id = nueva.json.caja._id;

    const pagoNuevo = await api('POST', '/api/pagos', {
      token: tok.admin,
      body: { citaId: ctx.cita3Id, montoCentavos: 5000, metodo: 'EFECTIVO' }
    });
    assert.equal(pagoNuevo.status, 201);
    assert.equal(pagoNuevo.json.saldo.estadoSaldo, 'PARCIAL');

    const cierre2 = await api('POST', `/api/cajas/${ctx.caja2Id}/cerrar`, {
      token: tok.admin,
      body: { totalRealCentavos: 5000 }
    });
    assert.equal(cierre2.status, 200);
    assert.equal(cierre2.json.caja.totalEsperadoCentavos, 5000);
    assert.equal(cierre2.json.caja.diferenciaCentavos, 0);

    const anularCerrada = await api('PATCH', `/api/pagos/${pagoNuevo.json.pago._id}/anular`, {
      token: tok.admin,
      body: { motivoAnulacion: 'Prueba B7' }
    });
    assert.equal(anularCerrada.status, 409, 'no se anulan pagos de caja cerrada');
  });

  test('12. historial de pagos del paciente (paso 20)', async () => {
    const historial = await api('GET', `/api/pagos?paciente=${ctx.pacienteId}`, { token: tok.admin });
    assert.equal(historial.status, 200);
    assert.equal(historial.json.total, 5);
    for (const pago of historial.json.pagos) {
      assert.equal(String(pago.paciente._id), String(ctx.pacienteId));
      assert.ok(pago.cita?._id, 'cada pago conserva su cita');
      assert.ok(pago.caja?._id, 'cada pago conserva su caja');
      assert.ok(['REGISTRADO', 'ANULADO'].includes(pago.estado));
    }

    const detalle = await api('GET', `/api/pagos/${ctx.pago2Id}`, { token: tok.admin });
    assert.equal(detalle.status, 200);
    assert.equal(detalle.json.pago.montoCentavos, 15000);
    assert.equal(String(detalle.json.pago.registradoPor._id), String(ctx.adminId));

    const deLaCita = await api('GET', `/api/citas/${ctx.citaId}/pagos`, { token: tok.admin });
    assert.equal(deLaCita.status, 200);
    assert.equal(deLaCita.json.pagos.length, 2);
    assert.equal(
      deLaCita.json.pagos.reduce((acc, p) => acc + p.montoCentavos, 0),
      25000
    );
  });

  test('13. solicitud del portal convertida en cita (integridad solicitud→cita)', async () => {
    const solicitud = await api('POST', '/api/solicitudes-cita', {
      body: {
        nombre: 'Carla Solís',
        telefono: '5555-4001',
        email: 'carla.solis@test.local',
        servicio: ctx.servicioId,
        mensaje: 'Solicitud B7'
      }
    });
    assert.equal(solicitud.status, 201);
    assert.match(solicitud.json.referencia, /^SOL-/);

    const bandeja = await api('GET', '/api/solicitudes-cita?estado=PENDIENTE', { token: tok.recep });
    assert.equal(bandeja.status, 200);
    const pendiente = bandeja.json.solicitudes.find((s) => s.email === 'carla.solis@test.local');
    assert.ok(pendiente, 'la solicitud aparece en la bandeja');
    ctx.solicitudId = pendiente._id;

    const atender = await api('POST', `/api/citas/solicitudes/${ctx.solicitudId}/atender`, {
      token: tok.recep,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        inicio: inicioManana(15, 0).toISOString()
      }
    });
    assert.equal(atender.status, 201);
    ctx.citaSolicitudId = atender.json.cita._id;

    const atendida = await AppointmentRequest.findById(ctx.solicitudId);
    assert.equal(atendida.estado, 'ATENDIDA');
    assert.equal(String(atendida.citaGenerada), String(ctx.citaSolicitudId));
    assert.equal(String(atendida.atendidaPor), String(ctx.recepId));
    assert.ok(atendida.fechaAtencion);

    const repetida = await api('POST', `/api/citas/solicitudes/${ctx.solicitudId}/atender`, {
      token: tok.recep,
      body: {
        pacienteId: ctx.pacienteId,
        profesionalId: ctx.profesional._id,
        inicio: inicioManana(16, 0).toISOString()
      }
    });
    assert.equal(repetida.status, 409, 'una solicitud no origina dos citas');
    assert.match(repetida.json.message, /ya (fue )?atendida|atendida/i);
    assert.equal(
      await Appointment.countDocuments({ solicitudOrigen: ctx.solicitudId }),
      1,
      'índice único parcial solicitudOrigen'
    );
  });

  test('14. integridad de modelos, relaciones e históricos (paso 21)', async () => {
    const citas = await Appointment.find({}).lean();
    const pagos = await Payment.find({}).lean();
    const recibos = await Receipt.find({}).lean();
    const relaciones = await PatientResponsible.find({}).lean();
    const profesionales = await Professional.find({}).lean();
    const cajas = await CashSession.find({}).lean();

    // Referencias existentes en cada colección.
    for (const cita of citas) {
      assert.ok(await Patient.exists({ _id: cita.paciente }), 'cita→paciente');
      assert.ok(await Professional.exists({ _id: cita.profesional }), 'cita→profesional');
      assert.ok(await Service.exists({ _id: cita.servicio }), 'cita→servicio');
      assert.ok(cita.fin > cita.inicio, 'fin posterior al inicio');
    }
    for (const pago of pagos) {
      const cita = citas.find((c) => String(c._id) === String(pago.cita));
      assert.ok(cita, 'pago→cita existente');
      assert.equal(String(pago.paciente), String(cita.paciente), 'pago.paciente coincide con la cita');
      assert.ok(cajas.some((c) => String(c._id) === String(pago.caja)), 'pago→caja existente');
    }
    for (const recibo of recibos) {
      assert.equal(await Receipt.countDocuments({ pago: recibo.pago }), 1, 'un comprobante por pago');
      const pago = pagos.find((p) => String(p._id) === String(recibo.pago));
      assert.ok(pago, 'comprobante→pago existente');
      assert.equal(recibo.montoCentavos, pago.montoCentavos);
      assert.equal(recibo.metodo, pago.metodo);
    }
    for (const relacion of relaciones) {
      assert.ok(await Patient.exists({ _id: relacion.paciente }), 'relación→paciente');
      assert.ok(await Responsible.exists({ _id: relacion.responsable }), 'relación→responsable');
    }
    for (const profesional of profesionales) {
      const usuario = await User.findById(profesional.usuario);
      assert.ok(usuario, 'profesional→usuario existente');
      assert.equal(usuario.rol, 'PROFESIONAL');
    }

    // Históricos: cambiar el servicio no altera las citas ya creadas.
    await Service.updateOne(
      { _id: ctx.servicioId },
      { $set: { precioCentavos: 30000, duracionMinutos: 45, nombre: 'Consulta B7 (actualizada)' } }
    );
    const citaOriginal = await Appointment.findById(ctx.citaId).lean();
    assert.equal(citaOriginal.precioCentavos, 25000, 'precio histórico conservado');
    assert.equal(citaOriginal.duracionMinutos, 30, 'duración histórica conservada');
    const citaViejaEnApi = await api('GET', `/api/citas/${ctx.citaId}`, { token: tok.admin });
    assert.equal(citaViejaEnApi.status, 200);
    assert.equal(citaViejaEnApi.json.cita.precioCentavos, 25000);

    // Snapshot de caja: el total guardado coincide con la suma de pagos REGISTRADO.
    const caja1 = await CashSession.findById(ctx.cajaId).lean();
    const pagosCaja1 = pagos.filter(
      (p) => String(p.caja) === String(ctx.cajaId) && p.estado === 'REGISTRADO'
    );
    assert.equal(
      pagosCaja1.reduce((acc, p) => acc + p.montoCentavos, 0),
      caja1.totalIngresosCentavos,
      'snapshot de ingresos de la caja'
    );
    assert.equal(caja1.totalEsperadoCentavos, caja1.montoInicialCentavos + caja1.totalesPorMetodo.EFECTIVO);
    assert.equal(
      caja1.diferenciaCentavos,
      caja1.totalRealCentavos - caja1.totalEsperadoCentavos
    );

    // El usuario PROFESIONAL solo existe una vez por usuario del sistema.
    const vinculados = profesionales.filter((p) => p.usuario).map((p) => String(p.usuario));
    assert.equal(new Set(vinculados).size, vinculados.length, 'usuario profesional único');
  });

  test('15. permisos por rol (paso 22)', async () => {
    // Sin token.
    assert.equal((await api('GET', '/api/citas')).status, 401);
    assert.equal((await api('GET', '/api/pacientes')).status, 401);
    assert.equal((await api('GET', '/api/pagos')).status, 401);

    // PROFESIONAL: lectura acotada, escritura denegada.
    const citasPropias = await api('GET', '/api/citas', { token: tok.prof });
    assert.equal(citasPropias.status, 200);
    for (const cita of citasPropias.json.citas) {
      assert.equal(String(cita.profesional._id), String(ctx.profesional._id));
    }
    const pacientePropio = await api('GET', `/api/pacientes/${ctx.pacienteId}`, { token: tok.prof });
    assert.equal(pacientePropio.status, 200);
    assert.equal(pacientePropio.json.paciente.nombre, 'Sofía');
    assert.equal(pacientePropio.json.paciente.direccion, undefined, 'solo campos básicos');

    assert.equal((await api('POST', '/api/citas', { token: tok.prof, body: {} })).status, 403);
    assert.equal((await api('GET', '/api/pagos', { token: tok.prof })).status, 403);
    assert.equal((await api('GET', '/api/cajas', { token: tok.prof })).status, 403);
    assert.equal((await api('GET', '/api/usuarios', { token: tok.prof })).status, 403);
    assert.equal(
      (await api('PUT', `/api/pacientes/${ctx.pacienteId}`, {
        token: tok.prof,
        body: { telefono: '5555-9999' }
      })).status,
      403
    );

    // Otro profesional no ve al paciente ajeno (sin citas con él).
    const ajenoPaciente = await api('POST', '/api/pacientes', {
      token: tok.admin,
      body: {
        nombre: 'Paciente',
        apellido: 'Ajeno',
        fechaNacimiento: '1990-03-20',
        sexo: 'M',
        telefono: '5555-5001'
      }
    });
    assert.equal(ajenoPaciente.status, 201);
    const prof2 = await login('prof2.b7@test.local');
    const ajeno = await api('GET', `/api/pacientes/${ajenoPaciente.json.paciente._id}`, { token: prof2 });
    assert.equal(ajeno.status, 404);

    // RECEPCIONISTA: opera caja y solicitudes, no administra usuarios/servicios.
    assert.equal((await api('GET', '/api/cajas', { token: tok.recep })).status, 200);
    assert.equal((await api('GET', '/api/usuarios', { token: tok.recep })).status, 403);
    assert.equal(
      (await api('POST', '/api/servicios', {
        token: tok.recep,
        body: { nombre: 'No permitido B7', precioCentavos: 100, duracionMinutos: 10 }
      })).status,
      403
    );
    assert.equal(
      (await api('POST', '/api/pacientes', { token: tok.recep, body: {} })).status,
      400,
      'recepción puede gestionar pacientes (validación, no permiso)'
    );
  });

  test('16. ninguna petición de la pasada devuelve 5xx', () => {
    assert.equal(respuestas5xx, 0, 'todas las respuestas fueron 4xx/2xx');
  });
});
