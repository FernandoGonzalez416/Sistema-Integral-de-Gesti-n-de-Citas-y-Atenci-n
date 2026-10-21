import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Professional from '../models/Professional.js';
import Patient from '../models/Patient.js';
import Responsible from '../models/Responsible.js';
import PatientResponsible from '../models/PatientResponsible.js';
import EducationalMaterial from '../models/EducationalMaterial.js';
import PatientMaterial from '../models/PatientMaterial.js';
import AppointmentRequest from '../models/AppointmentRequest.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import CashSession from '../models/CashSession.js';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Seed de demostración idempotente para SIGCA.
//
// Garantías:
//  - NO borra colecciones ni documentos (no usa deleteMany/deleteOne).
//  - NO sobrescribe registros existentes: si la clave estable ya existe, se omite.
//  - NO cambia contraseñas ni desactiva usuarios existentes.
//  - Claves estables: campos únicos naturales + marcadores [seedDemo:clave] en
//    campos de texto para modelos sin clave natural.
//  - Datos financieros coherentes: la suma de pagos ACTIVOS nunca supera el
//    precio de la cita; los pagos de demostración caen dentro de su caja.
// ---------------------------------------------------------------------------

const MARCA = 'seedDemo';
const marcador = (clave) => `[${MARCA}:${clave}]`;
const regexMarcador = (clave) => new RegExp(`\\[${MARCA}:${clave.replace(/[-]/g, '\\-')}\\]`);

// --- Fechas de demostración -------------------------------------------------
const ahora = new Date();
const hoy0 = new Date(ahora);
hoy0.setHours(0, 0, 0, 0);

function dia(offsetDias, hora, minuto = 0) {
  const d = new Date(hoy0);
  d.setDate(d.getDate() + offsetDias);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

// n-ésimo día laborable (lun-vie) a partir de hoy.
function proximoLaborable(n) {
  const d = new Date(hoy0);
  let contados = 0;
  while (contados < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) contados++;
  }
  d.setHours(9, 0, 0, 0);
  return d;
}

function conHora(base, hora, minuto = 0) {
  const d = new Date(base);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

// --- Estado del proceso -----------------------------------------------------
const refs = {};        // alias -> _id (existente o creado)
const plan = [];        // { accion, clave }
const creados = [];
const omitidos = [];
const advertencias = [];
let saltarCajaAbierta = false;

function registrarPlan(accion, clave) {
  plan.push({ accion, clave });
}

// Fase de planificación (solo lectura).
async function planificar(alias, modelo, filtroFactory, clave, requiere = []) {
  if (requiere.some((a) => !refs[a])) {
    refs[alias] = undefined;
    registrarPlan('CREAR', clave);
    return false;
  }
  const doc = await modelo.findOne(filtroFactory()).select('_id').lean();
  if (doc) {
    refs[alias] = doc._id;
    registrarPlan('OMITIR', clave);
    return true;
  }
  refs[alias] = undefined;
  registrarPlan('CREAR', clave);
  return false;
}

// Fase de aplicación (crea solo si falta).
async function aplicar(alias, modelo, filtroFactory, datosFactory) {
  const filtro = filtroFactory();
  let doc = await modelo.findOne(filtro);
  if (!doc) {
    doc = new modelo(datosFactory());
    await doc.save();
    creados.push(alias);
  } else {
    omitidos.push(alias);
  }
  refs[alias] = doc._id;
  return doc;
}

export async function seedDemo({ dryRun = false } = {}) {
  const conexion = mongoose.connection;
  console.log('============================================================');
  console.log('SIGCA — Seed de demostración (idempotente)');
  console.log('Base de datos seleccionada:', conexion.name, '@', conexion.host + ':' + conexion.port);
  console.log('Origen de la URI: variable de entorno MONGO_URI (o valor por defecto de desarrollo)');
  console.log('Modo:', dryRun ? 'SIMULACIÓN (no escribe en la base)' : 'APLICAR (crea solo lo que falta)');
  console.log('============================================================');

  // ------------------------------------------------------------------
  // FASE 1 — PLANIFICACIÓN (solo lectura)
  // ------------------------------------------------------------------
  await planificar('admin', User, () => ({ email: env.adminEmail.toLowerCase() }), 'Usuario ADMINISTRADOR (admin@sigca.local)');
  await planificar('recepcion', User, () => ({ email: 'recepcion.demo@demo.sigca' }), 'Usuario RECEPCIONISTA (recepcion.demo@demo.sigca)');
  await planificar('profesionalUser', User, () => ({ email: 'profesional.demo@demo.sigca' }), 'Usuario PROFESIONAL (profesional.demo@demo.sigca)');

  await planificar('s1', Service, () => ({ nombre: 'Consulta odontológica general' }), 'Servicio: Consulta odontológica general');
  await planificar('s2', Service, () => ({ nombre: 'Limpieza dental' }), 'Servicio: Limpieza dental');
  await planificar('s3', Service, () => ({ nombre: 'Sesión de psicología' }), 'Servicio: Sesión de psicología');
  await planificar('s4', Service, () => ({ nombre: 'Control de niño sano' }), 'Servicio: Control de niño sano');

  await planificar('pr1', Professional, () => ({ dni: '30000001' }), 'Profesional: Laura Giménez (Odontología)');
  await planificar('pr2', Professional, () => ({ dni: '30000002' }), 'Profesional: Pablo Herrera (Psicología)');

  await planificar('pa1', Patient, () => ({ email: 'paciente.adulto@demo.sigca' }), 'Paciente: Martín Ríos (adulto)');
  await planificar('pa2', Patient, () => ({ email: 'paciente.menor@demo.sigca' }), 'Paciente: Sofía Ríos (menor)');
  await planificar('pa3', Patient, () => ({ email: 'paciente.carla@demo.sigca' }), 'Paciente: Carla Méndez (adulta)');

  await planificar('r1', Responsible, () => ({ email: 'responsable.ana@demo.sigca' }), 'Responsable: Ana Ríos (Madre)');

  await planificar('m1', EducationalMaterial, () => ({ titulo: 'Cuidado bucal diario' }), 'Material: Cuidado bucal diario');
  await planificar('m2', EducationalMaterial, () => ({ titulo: 'Alimentación saludable' }), 'Material: Alimentación saludable');
  await planificar('m3', EducationalMaterial, () => ({ titulo: 'Video: cepillado correcto' }), 'Material: Video cepillado correcto');

  await planificar('pr_menor', PatientResponsible,
    () => ({ paciente: refs.pa2, responsable: refs.r1 }),
    'Relación: Sofía Ríos ↔ Ana Ríos',
    ['pa2', 'r1']);

  await planificar('pm1', PatientMaterial,
    () => ({ paciente: refs.pa1, material: refs.m1 }),
    'Relación: Martín Ríos ↔ Cuidado bucal',
    ['pa1', 'm1']);
  await planificar('pm2', PatientMaterial,
    () => ({ paciente: refs.pa2, material: refs.m3 }),
    'Relación: Sofía Ríos ↔ Video cepillado',
    ['pa2', 'm3']);

  await planificar('sol1', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-01') }), 'Solicitud: Javier Lemos (PENDIENTE)');
  await planificar('sol2', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-02') }), 'Solicitud: Lucía Fernández (ATENDIDA)');

  await planificar('cita1', Appointment, () => ({ observaciones: regexMarcador('cita-01') }), 'Cita 01: Martín Ríos — total pagada', ['pa1', 'pr1', 's1']);
  await planificar('cita2', Appointment, () => ({ observaciones: regexMarcador('cita-02') }), 'Cita 02: Carla Méndez — parcial', ['pa3', 'pr2', 's3']);
  await planificar('cita3', Appointment, () => ({ observaciones: regexMarcador('cita-03') }), 'Cita 03: Sofía Ríos — pendiente', ['pa2', 'pr1', 's2']);
  await planificar('cita4', Appointment, () => ({ observaciones: regexMarcador('cita-04') }), 'Cita 04: Martín Ríos — con pago anulado', ['pa1', 'pr1', 's1']);

  await planificar('pago1', Payment, () => ({ notas: regexMarcador('pago-01') }), 'Pago 01: cita 01 total (EFECTIVO)', ['cita1']);
  await planificar('pago2', Payment, () => ({ notas: regexMarcador('pago-02') }), 'Pago 02: cita 02 seña (TARJETA)', ['cita2']);
  await planificar('pago4', Payment, () => ({ notas: regexMarcador('pago-04') }), 'Pago 04: cita 04 ANULADO (TRANSFERENCIA)', ['cita4']);
  await planificar('pago5', Payment, () => ({ notas: regexMarcador('pago-05') }), 'Pago 05: cita 02 saldo (EFECTIVO, caja abierta)', ['cita2']);

  await planificar('caja1', CashSession, () => ({ observacionesApertura: regexMarcador('caja-01') }), 'Caja CERRADA (arqueo con diferencia)');

  const cajaAbiertaAjena = await CashSession.findOne({ estado: 'ABIERTA' }).lean();
  const esCajaDemo = cajaAbiertaAjena
    ? regexMarcador('caja-02').test(String(cajaAbiertaAjena.observacionesApertura || ''))
    : false;
  if (cajaAbiertaAjena && !esCajaDemo) {
    saltarCajaAbierta = true;
    advertencias.push('Existe una caja ABIERTA ajena al seed: se omite crear la caja de demostración abierta y su pago (pago-05).');
    registrarPlan('OMITIR', 'Caja ABIERTA de demostración (ya hay otra caja abierta)');
  } else {
    await planificar('caja2', CashSession, () => ({ observacionesApertura: regexMarcador('caja-02') }), 'Caja ABIERTA (turno de hoy)');
  }

  // Mostrar el plan ANTES de escribir.
  console.log('\nPLAN (registros de demostración):');
  for (const p of plan) console.log(`  [${p.accion}] ${p.clave}`);
  if (advertencias.length) {
    console.log('\nAdvertencias / limitaciones:');
    for (const a of advertencias) console.log(`  - ${a}`);
  }
  console.log(`\nResumen del plan: ${plan.filter(p => p.accion === 'CREAR').length} por crear, ${plan.filter(p => p.accion === 'OMITIR').length} ya existentes.`);

  if (dryRun) {
    console.log('\nSimulación finalizada. No se escribió nada.');
    return { creados: [], omitidos: [], plan, advertencias };
  }

  console.log('\nAplicando cambios (sin operaciones destructivas)...');

  // ------------------------------------------------------------------
  // FASE 2 — USUARIOS (save() para que el hook hashee la contraseña)
  // ------------------------------------------------------------------
  await aplicar('admin', User, () => ({ email: env.adminEmail.toLowerCase() }), () => ({
    nombre: 'Administrador Demo', email: env.adminEmail.toLowerCase(), password: env.adminPassword, rol: 'ADMINISTRADOR', activo: true
  }));
  await aplicar('recepcion', User, () => ({ email: 'recepcion.demo@demo.sigca' }), () => ({
    nombre: 'Recepcionista Demo', email: 'recepcion.demo@demo.sigca', password: 'Demo1234', rol: 'RECEPCIONISTA', activo: true
  }));
  await aplicar('profesionalUser', User, () => ({ email: 'profesional.demo@demo.sigca' }), () => ({
    nombre: 'Profesional Demo', email: 'profesional.demo@demo.sigca', password: 'Demo1234', rol: 'PROFESIONAL', activo: true
  }));

  // ------------------------------------------------------------------
  // FASE 3 — SERVICIOS y PROFESIONALES
  // ------------------------------------------------------------------
  const s1 = await aplicar('s1', Service, () => ({ nombre: 'Consulta odontológica general' }), () => ({
    nombre: 'Consulta odontológica general', descripcion: 'Evaluación y diagnóstico odontológico', precioCentavos: 25000, duracionMinutos: 30, activo: true
  }));
  const s2 = await aplicar('s2', Service, () => ({ nombre: 'Limpieza dental' }), () => ({
    nombre: 'Limpieza dental', descripcion: 'Profilaxis y pulido dental', precioCentavos: 18000, duracionMinutos: 30, activo: true
  }));
  const s3 = await aplicar('s3', Service, () => ({ nombre: 'Sesión de psicología' }), () => ({
    nombre: 'Sesión de psicología', descripcion: 'Consulta psicológica individual', precioCentavos: 30000, duracionMinutos: 45, activo: true
  }));
  await aplicar('s4', Service, () => ({ nombre: 'Control de niño sano' }), () => ({
    nombre: 'Control de niño sano', descripcion: 'Control pediátrico', precioCentavos: 20000, duracionMinutos: 30, activo: true
  }));

  const pr1 = await aplicar('pr1', Professional, () => ({ dni: '30000001' }), () => ({
    nombre: 'Laura', apellido: 'Giménez', especialidad: 'Odontología general', telefono: '5551-1001', email: 'laura.gimenez@demo.sigca', dni: '30000001', matricula: 'MP-30001', activo: true
  }));
  const pr2 = await aplicar('pr2', Professional, () => ({ dni: '30000002' }), () => ({
    nombre: 'Pablo', apellido: 'Herrera', especialidad: 'Psicología', telefono: '5551-1002', email: 'pablo.herrera@demo.sigca', dni: '30000002', matricula: 'MP-30002', activo: true
  }));

  // ------------------------------------------------------------------
  // FASE 4 — PACIENTES y RESPONSABLES
  // ------------------------------------------------------------------
  const pa1 = await aplicar('pa1', Patient, () => ({ email: 'paciente.adulto@demo.sigca' }), () => ({
    nombre: 'Martín', apellido: 'Ríos', fechaNacimiento: new Date('1990-04-12'), sexo: 'M', telefono: '5551-0001', email: 'paciente.adulto@demo.sigca', activo: true
  }));
  const pa2 = await aplicar('pa2', Patient, () => ({ email: 'paciente.menor@demo.sigca' }), () => ({
    nombre: 'Sofía', apellido: 'Ríos', fechaNacimiento: new Date('2015-09-30'), sexo: 'F', telefono: '5551-0002', email: 'paciente.menor@demo.sigca', activo: true
  }));
  const pa3 = await aplicar('pa3', Patient, () => ({ email: 'paciente.carla@demo.sigca' }), () => ({
    nombre: 'Carla', apellido: 'Méndez', fechaNacimiento: new Date('1985-01-20'), sexo: 'F', telefono: '5551-0003', email: 'paciente.carla@demo.sigca', activo: true
  }));

  const r1 = await aplicar('r1', Responsible, () => ({ email: 'responsable.ana@demo.sigca' }), () => ({
    nombre: 'Ana', apellido: 'Ríos', telefono: '5551-0001', email: 'responsable.ana@demo.sigca', parentesco: 'Madre', activo: true
  }));

  await aplicar('pr_menor', PatientResponsible,
    () => ({ paciente: pa2._id, responsable: r1._id }),
    () => ({ paciente: pa2._id, responsable: r1._id, activo: true }));

  // ------------------------------------------------------------------
  // FASE 5 — MATERIALES y ASIGNACIONES
  // ------------------------------------------------------------------
  const m1 = await aplicar('m1', EducationalMaterial, () => ({ titulo: 'Cuidado bucal diario' }), () => ({
    titulo: 'Cuidado bucal diario', descripcion: 'Guía de cepillado y uso de hilo dental', tipo: 'DOCUMENTO', url: 'https://ejemplo.sigca/materiales/cuidado-bucal.pdf', activo: true
  }));
  await aplicar('m2', EducationalMaterial, () => ({ titulo: 'Alimentación saludable' }), () => ({
    titulo: 'Alimentación saludable', descripcion: 'Recomendaciones de alimentación para toda la familia', tipo: 'DOCUMENTO', url: 'https://ejemplo.sigca/materiales/alimentacion.pdf', activo: true
  }));
  const m3 = await aplicar('m3', EducationalMaterial, () => ({ titulo: 'Video: cepillado correcto' }), () => ({
    titulo: 'Video: cepillado correcto', descripcion: 'Técnica de cepillado paso a paso', tipo: 'VIDEO', url: 'https://ejemplo.sigca/materiales/cepillado.mp4', activo: true
  }));

  await aplicar('pm1', PatientMaterial,
    () => ({ paciente: pa1._id, material: m1._id }),
    () => ({ paciente: pa1._id, material: m1._id, notas: 'Entregado en la consulta', activo: true }));
  await aplicar('pm2', PatientMaterial,
    () => ({ paciente: pa2._id, material: m3._id }),
    () => ({ paciente: pa2._id, material: m3._id, notas: 'Para ver en casa con la madre', activo: true }));

  // ------------------------------------------------------------------
  // FASE 6 — SOLICITUDES
  // ------------------------------------------------------------------
  await aplicar('sol1', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-01') }), () => ({
    nombre: 'Javier Lemos', telefono: '5551-0004', email: 'javier.lemos@demo.sigca',
    servicio: s1._id, fechaPreferida: dia(2, 9, 0),
    mensaje: `${marcador('sol-01')} Quisiera un turno por la mañana.`, estado: 'PENDIENTE'
  }));
  await aplicar('sol2', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-02') }), () => ({
    nombre: 'Lucía Fernández', telefono: '5551-0005', email: 'lucia.fernandez@demo.sigca',
    servicio: s3._id,
    mensaje: `${marcador('sol-02')} Consulta de psicología.`, estado: 'ATENDIDA'
  }));

  // ------------------------------------------------------------------
  // FASE 7 — CITAS (con precio/duración históricos del servicio)
  // ------------------------------------------------------------------
  const inicio1 = conHora(proximoLaborable(1), 9, 0);
  const inicio2 = conHora(proximoLaborable(2), 10, 0);
  const inicio3 = conHora(proximoLaborable(3), 11, 0);
  const inicio4 = conHora(proximoLaborable(4), 15, 0);

  const cita1 = await aplicar('cita1', Appointment, () => ({ observaciones: regexMarcador('cita-01') }), () => ({
    paciente: pa1._id, profesional: pr1._id, servicio: s1._id,
    inicio: inicio1, fin: new Date(inicio1.getTime() + s1.duracionMinutos * 60000),
    precioCentavos: s1.precioCentavos, duracionMinutos: s1.duracionMinutos,
    estado: 'CONFIRMADA', observaciones: `${marcador('cita-01')} Consulta de control`
  }));
  const cita2 = await aplicar('cita2', Appointment, () => ({ observaciones: regexMarcador('cita-02') }), () => ({
    paciente: pa3._id, profesional: pr2._id, servicio: s3._id,
    inicio: inicio2, fin: new Date(inicio2.getTime() + s3.duracionMinutos * 60000),
    precioCentavos: s3.precioCentavos, duracionMinutos: s3.duracionMinutos,
    estado: 'CONFIRMADA', observaciones: `${marcador('cita-02')} Primera sesión`
  }));
  await aplicar('cita3', Appointment, () => ({ observaciones: regexMarcador('cita-03') }), () => ({
    paciente: pa2._id, profesional: pr1._id, servicio: s2._id,
    inicio: inicio3, fin: new Date(inicio3.getTime() + s2.duracionMinutos * 60000),
    precioCentavos: s2.precioCentavos, duracionMinutos: s2.duracionMinutos,
    estado: 'PENDIENTE', observaciones: `${marcador('cita-03')} Limpieza (paciente menor, asiste con responsable)`
  }));
  const cita4 = await aplicar('cita4', Appointment, () => ({ observaciones: regexMarcador('cita-04') }), () => ({
    paciente: pa1._id, profesional: pr1._id, servicio: s1._id,
    inicio: inicio4, fin: new Date(inicio4.getTime() + s1.duracionMinutos * 60000),
    precioCentavos: s1.precioCentavos, duracionMinutos: s1.duracionMinutos,
    estado: 'CONFIRMADA', observaciones: `${marcador('cita-04')} Control general`
  }));

  // ------------------------------------------------------------------
  // FASE 8 — PAGOS (coherentes: nunca superan el precio de la cita)
  // ------------------------------------------------------------------
  const fechaCaja1 = dia(-7, 8, 0);
  const fechaCaja1Fin = dia(-7, 16, 0);

  const pago1 = await aplicar('pago1', Payment, () => ({ notas: regexMarcador('pago-01') }), () => ({
    cita: cita1._id, paciente: pa1._id, montoCentavos: cita1.precioCentavos, metodo: 'EFECTIVO',
    fecha: dia(-7, 9, 0), estado: 'REGISTRADO', notas: `${marcador('pago-01')} Pago total`
  }));
  const pago2 = await aplicar('pago2', Payment, () => ({ notas: regexMarcador('pago-02') }), () => ({
    cita: cita2._id, paciente: pa3._id, montoCentavos: 10000, metodo: 'TARJETA',
    fecha: dia(-7, 10, 0), estado: 'REGISTRADO', notas: `${marcador('pago-02')} Seña`
  }));
  await aplicar('pago4', Payment, () => ({ notas: regexMarcador('pago-04') }), () => ({
    cita: cita4._id, paciente: pa1._id, montoCentavos: cita4.precioCentavos, metodo: 'TRANSFERENCIA',
    fecha: dia(-7, 11, 0), estado: 'ANULADO', motivoAnulacion: 'Pago duplicado', anuladoEn: dia(-7, 11, 30),
    notas: `${marcador('pago-04')} Anulado por duplicado`
  }));
  let pago5 = null;
  if (!saltarCajaAbierta) {
    pago5 = await aplicar('pago5', Payment, () => ({ notas: regexMarcador('pago-05') }), () => ({
      cita: cita2._id, paciente: pa3._id, montoCentavos: 5000, metodo: 'EFECTIVO',
      fecha: ahora, estado: 'REGISTRADO', notas: `${marcador('pago-05')} Saldo abonado en caja abierta`
    }));
  }

  // ------------------------------------------------------------------
  // FASE 9 — CAJAS (el cierre refleja los pagos ACTIVOS de su ventana)
  // ------------------------------------------------------------------
  const pagosCaja1 = [pago1, pago2].filter(Boolean);
  const totalesCaja1 = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  for (const p of pagosCaja1) totalesCaja1[p.metodo] = (totalesCaja1[p.metodo] || 0) + p.montoCentavos;
  const totalGeneralCaja1 = Object.values(totalesCaja1).reduce((a, b) => a + b, 0);
  const montoInicialCaja1 = 20000;
  const totalEsperadoCaja1 = montoInicialCaja1 + totalGeneralCaja1;
  const totalRealCaja1 = totalEsperadoCaja1 - 500; // pequeña diferencia para demostrar el arqueo

  await aplicar('caja1', CashSession, () => ({ observacionesApertura: regexMarcador('caja-01') }), () => ({
    estado: 'CERRADA',
    abiertaPor: refs.recepcion, fechaApertura: fechaCaja1,
    montoInicialCentavos: montoInicialCaja1,
    observacionesApertura: `${marcador('caja-01')} Turno de la mañana`,
    cerradaPor: refs.recepcion, fechaCierre: fechaCaja1Fin,
    totalesPorMetodo: totalesCaja1,
    totalEsperadoCentavos: totalEsperadoCaja1,
    totalRealCentavos: totalRealCaja1,
    diferenciaCentavos: totalRealCaja1 - totalEsperadoCaja1,
    observacionesCierre: 'Falta efectivo en el arqueo'
  }));

  if (!saltarCajaAbierta) {
    let apertura = dia(0, 8, 0);
    if (apertura > ahora) apertura = new Date(ahora.getTime() - 60 * 60 * 1000);
    await aplicar('caja2', CashSession, () => ({ observacionesApertura: regexMarcador('caja-02') }), () => ({
      estado: 'ABIERTA',
      abiertaPor: refs.recepcion, fechaApertura: apertura,
      montoInicialCentavos: 10000,
      observacionesApertura: `${marcador('caja-02')} Turno de hoy`
    }));
  }

  // ------------------------------------------------------------------
  // RESUMEN
  // ------------------------------------------------------------------
  console.log('\nRESULTADO:');
  console.log(`  Creados: ${creados.length}`);
  console.log(`  Ya existentes (omitidos): ${omitidos.length}`);
  if (advertencias.length) {
    console.log('  Advertencias:');
    for (const a of advertencias) console.log(`   - ${a}`);
  }
  console.log('\nCredenciales de demostración (FICTICIAS, solo desarrollo):');
  console.log('  recepcion.demo@demo.sigca / Demo1234  (RECEPCIONISTA)');
  console.log('  profesional.demo@demo.sigca / Demo1234 (PROFESIONAL)');
  console.log('  (El administrador usa las credenciales definidas en backend/.env)');

  return { creados, omitidos, plan, advertencias };
}

export { marcador, regexMarcador };
