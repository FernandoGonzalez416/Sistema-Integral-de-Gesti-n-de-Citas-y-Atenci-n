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
import Receipt from '../models/Receipt.js';
import { emitirComprobante } from './receipt.js';
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
//  - Datos financieros coherentes: la suma de pagos REGISTRADO nunca supera el
//    precio de la cita; los pagos de demostración caen dentro de su caja.
//  - Cada llamada parte de estado limpio (refs/plan/creados/omitidos/advertencias)
//    para que el seed sea idempotente incluso si se ejecuta varias veces en el
//    mismo proceso.
// ---------------------------------------------------------------------------

const MARCA = 'seedDemo';
const marcador = (clave) => `[${MARCA}:${clave}]`;
const regexMarcador = (clave) => new RegExp(`\\[${MARCA}:${clave.replace(/[-]/g, '\\-')}\\]`);

// --- Fechas de demostración -------------------------------------------------
// El contexto se crea en cada ejecución para no quedarse con la fecha del
// momento en que se importó el módulo.
function crearContexto() {
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

  return { ahora, hoy0, dia, proximoLaborable, conHora };
}

// --- Estado del proceso -----------------------------------------------------
function crearEstado() {
  return {
    refs: {}, // alias -> _id (existente o creado)
    plan: [], // { accion, clave }
    creados: [],
    omitidos: [],
    advertencias: [],
    // Disponibilidad de las cajas de demostración. Se decide en la fase de
    // planificación para que el plan y la aplicación sean consistentes.
    caja1Disponible: true,
    caja2Disponible: true,
    caja3Disponible: true
  };
}

function registrarPlan(estado, accion, clave) {
  estado.plan.push({ accion, clave });
}

// Fase de planificación (solo lectura).
async function planificar(estado, alias, modelo, filtroFactory, clave, requiere = []) {
  if (requiere.some((a) => !estado.refs[a])) {
    estado.refs[alias] = undefined;
    registrarPlan(estado, 'CREAR', clave);
    return false;
  }
  const doc = await modelo.findOne(filtroFactory()).select('_id').lean();
  if (doc) {
    estado.refs[alias] = doc._id;
    registrarPlan(estado, 'OMITIR', clave);
    return true;
  }
  estado.refs[alias] = undefined;
  registrarPlan(estado, 'CREAR', clave);
  return false;
}

// Fase de aplicación (crea solo si falta).
async function aplicar(estado, alias, modelo, filtroFactory, datosFactory) {
  const filtro = filtroFactory();
  let doc = await modelo.findOne(filtro);
  if (!doc) {
    doc = new modelo(datosFactory());
    await doc.save();
    estado.creados.push(alias);
  } else {
    estado.omitidos.push(alias);
  }
  estado.refs[alias] = doc._id;
  return doc;
}

// Planifica una caja con marcador propio. Si ya existe con un estado distinto
// al esperado, la marca como no disponible y sus pagos dependientes no se
// planifican ni se crean (nunca se cierra/reabre una caja existente).
async function planificarCaja(estado, alias, claveMarcador, estadoEsperado, etiqueta) {
  const doc = await CashSession.findOne({ observacionesApertura: regexMarcador(claveMarcador) })
    .select('_id estado')
    .lean();

  if (doc) {
    estado.refs[alias] = doc._id;
    registrarPlan(estado, 'OMITIR', etiqueta);
    if (doc.estado !== estadoEsperado) {
      estado[`${alias}Disponible`] = false;
      estado.advertencias.push(
        `La caja de demostración ${claveMarcador} existe en estado ${doc.estado} (se esperaba ${estadoEsperado}): ` +
        'se omiten sus pagos dependientes y no se modifica su estado.'
      );
    }
    return doc;
  }

  estado.refs[alias] = undefined;
  registrarPlan(estado, 'CREAR', etiqueta);
  return null;
}

// La caja abierta se evalúa por usuario (abiertaPor), no de forma global:
// otra persona puede tener una caja abierta sin impedir la de recepción.
async function planificarCajaAbierta(estado) {
  const doc = await CashSession.findOne({ observacionesApertura: regexMarcador('caja-02') })
    .select('_id estado abiertaPor')
    .lean();

  if (doc) {
    estado.refs.caja2 = doc._id;
    registrarPlan(estado, 'OMITIR', 'Caja ABIERTA (turno de hoy)');
    const duenoCorrecto = String(doc.abiertaPor) === String(estado.refs.recepcion);
    if (doc.estado !== 'ABIERTA' || !duenoCorrecto) {
      estado.caja2Disponible = false;
      estado.advertencias.push(
        'La caja de demostración caja-02 no está disponible (' +
        `estado=${doc.estado}, abiertaPor=${doc.abiertaPor || 'null'}): ` +
        'se omiten pago-05, pago-07 y pago-11.'
      );
    }
    return;
  }

  let abiertaAjena = null;
  if (estado.refs.recepcion) {
    abiertaAjena = await CashSession.findOne({
      estado: 'ABIERTA',
      abiertaPor: estado.refs.recepcion
    }).select('_id').lean();
  }

  if (abiertaAjena) {
    estado.refs.caja2 = undefined;
    estado.caja2Disponible = false;
    registrarPlan(estado, 'OMITIR', 'Caja ABIERTA (ya hay otra caja abierta del receptor)');
    estado.advertencias.push(
      'El usuario de recepción ya tiene una caja ABIERTA ajena al seed: se omite caja-02 y sus pagos (pago-05, pago-07, pago-11).'
    );
    return;
  }

  estado.refs.caja2 = undefined;
  registrarPlan(estado, 'CREAR', 'Caja ABIERTA (turno de hoy)');
}

// Evita solapamientos del mismo profesional. En caso de colisión (por ejemplo,
// si una fecha calculada cae en el mismo día que otra), corre la cita en
// bloques de 15 minutos hasta encontrar un hueco libre.
function resolverInicio(inicioDeseado, duracionMinutos, profesionalId, intervalos) {
  let inicio = new Date(inicioDeseado);
  for (let intento = 0; intento < 200; intento++) {
    const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
    const solapa = intervalos.some(
      (iv) =>
        String(iv.profesional) === String(profesionalId) &&
        inicio < iv.fin &&
        fin > iv.inicio
    );
    if (!solapa) return { inicio, fin };
    inicio = new Date(inicio.getTime() + 15 * 60000);
  }
  // Fallback excepcional: al día siguiente a la misma hora.
  inicio = new Date(inicioDeseado.getTime() + 24 * 60 * 60000);
  return { inicio, fin: new Date(inicio.getTime() + duracionMinutos * 60000) };
}

// Crea (o reutiliza) una cita de demostración respetando los intervalos reales
// ya ocupados por cada profesional.
async function aplicarCita(estado, def, servicio, intervalos) {
  const filtro = { observaciones: regexMarcador(def.marcador) };
  const existente = await Appointment.findOne(filtro);

  let inicio;
  let fin;

  if (existente) {
    inicio = new Date(existente.inicio);
    fin = new Date(existente.fin);
    // La planificación ya registró este alias como OMITIDO; no duplicar el
    // contador cuando el seed se ejecuta dos veces en el mismo proceso.
    if (!estado.omitidos.includes(def.alias)) estado.omitidos.push(def.alias);
    estado.refs[def.alias] = existente._id;
  } else {
    const resuelto = resolverInicio(
      def.inicio,
      servicio.duracionMinutos,
      estado.refs[def.profesional],
      intervalos
    );
    inicio = resuelto.inicio;
    fin = resuelto.fin;
    const doc = new Appointment({
      paciente: estado.refs[def.paciente],
      profesional: estado.refs[def.profesional],
      servicio: estado.refs[def.servicio],
      inicio,
      fin,
      precioCentavos: servicio.precioCentavos,
      duracionMinutos: servicio.duracionMinutos,
      estado: def.estado,
      observaciones: `${marcador(def.marcador)} ${def.observaciones}`,
      ...(def.solicitud ? { solicitudOrigen: estado.refs[def.solicitud] } : {})
    });
    await doc.save();
    estado.creados.push(def.alias);
    estado.refs[def.alias] = doc._id;
  }

  intervalos.push({
    profesional: estado.refs[def.profesional],
    inicio,
    fin
  });
}

async function repararProfesional(estado, alias, usuarioAlias) {
  if (!estado.refs[alias] || !estado.refs[usuarioAlias]) return;
  const profesional = await Professional.findById(estado.refs[alias]).select('usuario').lean();
  if (!profesional || profesional.usuario) return;

  const vinculadoEnOtro = await Professional.exists({
    usuario: estado.refs[usuarioAlias],
    _id: { $ne: estado.refs[alias] }
  });
  if (vinculadoEnOtro) {
    estado.advertencias.push(
      `No se vincula ${alias} al usuario ${usuarioAlias}: ese usuario ya está asociado a otro profesional.`
    );
    return;
  }

  await Professional.updateOne(
    { _id: estado.refs[alias], usuario: null },
    { $set: { usuario: estado.refs[usuarioAlias] } }
  );
}

async function repararEnlaceCita(estado, citaAlias, solicitudAlias) {
  if (!estado.refs[citaAlias] || !estado.refs[solicitudAlias]) return;
  const cita = await Appointment.findById(estado.refs[citaAlias]).select('solicitudOrigen').lean();
  if (!cita || cita.solicitudOrigen) return;

  const yaReferenciada = await Appointment.exists({
    solicitudOrigen: estado.refs[solicitudAlias],
    _id: { $ne: estado.refs[citaAlias] }
  });
  if (yaReferenciada) {
    estado.advertencias.push(
      `No se enlaza ${citaAlias} con ${solicitudAlias}: otra cita ya referencia esa solicitud.`
    );
    return;
  }

  await Appointment.updateOne(
    { _id: estado.refs[citaAlias], solicitudOrigen: null },
    { $set: { solicitudOrigen: estado.refs[solicitudAlias] } }
  );
}

async function repararEnlaceSolicitud(estado, solicitudAlias, citaAlias) {
  if (!estado.refs[solicitudAlias] || !estado.refs[citaAlias]) return;
  const solicitud = await AppointmentRequest.findById(estado.refs[solicitudAlias])
    .select('citaGenerada estado')
    .lean();
  if (!solicitud || solicitud.citaGenerada) return;
  if (solicitud.estado !== 'ATENDIDA') return;

  const citaYaUsada = await AppointmentRequest.exists({
    citaGenerada: estado.refs[citaAlias],
    _id: { $ne: estado.refs[solicitudAlias] }
  });
  if (citaYaUsada) {
    estado.advertencias.push(
      `No se enlaza ${solicitudAlias} con ${citaAlias}: otra solicitud ya referencia esa cita.`
    );
    return;
  }

  const cita = await Appointment.findById(estado.refs[citaAlias]).select('solicitudOrigen').lean();
  if (!cita || (cita.solicitudOrigen && String(cita.solicitudOrigen) !== String(estado.refs[solicitudAlias]))) {
    estado.advertencias.push(
      `No se enlaza ${solicitudAlias} con ${citaAlias}: la cita no apunta a esa solicitud.`
    );
    return;
  }

  await AppointmentRequest.updateOne(
    { _id: estado.refs[solicitudAlias], citaGenerada: null },
    { $set: { citaGenerada: estado.refs[citaAlias] } }
  );
}

// Recalcula los totales de una caja de demostración a partir de sus pagos
// REGISTRADO. Solo actúa sobre cajas con marcador propio y estado esperado.
async function actualizarTotalesCaja(estado, { alias, claveMarcador, estadoEsperado, totalReal = null }) {
  if (!estado[`${alias}Disponible`] || !estado.refs[alias]) return;

  const caja = await CashSession.findOne({
    _id: estado.refs[alias],
    observacionesApertura: regexMarcador(claveMarcador)
  });
  if (!caja || caja.estado !== estadoEsperado) return;

  const pagos = await Payment.find({ caja: caja._id, estado: 'REGISTRADO' })
    .select('montoCentavos metodo')
    .lean();

  const totales = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  let totalIngresos = 0;
  for (const pago of pagos) {
    if (totales[pago.metodo] !== undefined) totales[pago.metodo] += pago.montoCentavos;
    totalIngresos += pago.montoCentavos;
  }

  const totalEsperado = caja.montoInicialCentavos + totales.EFECTIVO;
  const cambios = {
    totalesPorMetodo: totales,
    totalIngresosCentavos: totalIngresos,
    totalEsperadoCentavos: totalEsperado
  };

  // En cajas abiertas no se fuerzan campos de cierre (real/diferencia/cierre).
  if (totalReal !== null) {
    cambios.totalRealCentavos = totalReal;
    cambios.diferenciaCentavos = totalReal - totalEsperado;
  }

  await CashSession.updateOne(
    { _id: caja._id, observacionesApertura: regexMarcador(claveMarcador) },
    { $set: cambios }
  );
}

export async function seedDemo({ dryRun = false } = {}) {
  const conexion = mongoose.connection;
  const ctx = crearContexto();
  const estado = crearEstado();
  const { refs, plan, creados, omitidos, advertencias } = estado;
  const { ahora, dia, proximoLaborable, conHora } = ctx;

  console.log('============================================================');
  console.log('SIGCA — Seed de demostración (idempotente)');
  console.log('Base de datos seleccionada:', conexion.name, '@', conexion.host + ':' + conexion.port);
  console.log('Origen de la URI: variable de entorno MONGO_URI (o valor por defecto de desarrollo)');
  console.log('Modo:', dryRun ? 'SIMULACIÓN (no escribe en la base)' : 'APLICAR (crea solo lo que falta)');
  console.log('============================================================');

  // ------------------------------------------------------------------
  // FASE 1 — PLANIFICACIÓN (solo lectura)
  // ------------------------------------------------------------------
  await planificar(estado, 'admin', User, () => ({ email: env.adminEmail.toLowerCase() }), `Usuario ADMINISTRADOR (${env.adminEmail})`);
  await planificar(estado, 'recepcion', User, () => ({ email: 'recepcion.demo@demo.sigca' }), 'Usuario RECEPCIONISTA (recepcion.demo@demo.sigca)');
  await planificar(estado, 'recepcion2', User, () => ({ email: 'recepcion2.demo@demo.sigca' }), 'Usuario RECEPCIONISTA (recepcion2.demo@demo.sigca)');
  await planificar(estado, 'profesionalUser', User, () => ({ email: 'profesional.demo@demo.sigca' }), 'Usuario PROFESIONAL (profesional.demo@demo.sigca)');
  await planificar(estado, 'profesionalUser2', User, () => ({ email: 'pablo.herrera@demo.sigca' }), 'Usuario PROFESIONAL (pablo.herrera@demo.sigca)');
  await planificar(estado, 'valentinaUser', User, () => ({ email: 'valentina.ortiz@demo.sigca' }), 'Usuario PROFESIONAL (valentina.ortiz@demo.sigca)');

  await planificar(estado, 's1', Service, () => ({ nombre: 'Consulta odontológica general' }), 'Servicio: Consulta odontológica general');
  await planificar(estado, 's2', Service, () => ({ nombre: 'Limpieza dental' }), 'Servicio: Limpieza dental');
  await planificar(estado, 's3', Service, () => ({ nombre: 'Sesión de psicología' }), 'Servicio: Sesión de psicología');
  await planificar(estado, 's4', Service, () => ({ nombre: 'Control de niño sano' }), 'Servicio: Control de niño sano');
  await planificar(estado, 's5', Service, () => ({ nombre: 'Evaluación inicial' }), 'Servicio: Evaluación inicial (inactivo)');

  await planificar(estado, 'pr1', Professional, () => ({ dni: '30000001' }), 'Profesional: Laura Giménez (Odontología)');
  await planificar(estado, 'pr2', Professional, () => ({ dni: '30000002' }), 'Profesional: Pablo Herrera (Psicología)');
  await planificar(estado, 'pr3', Professional, () => ({ dni: '30000003' }), 'Profesional: Valentina Ortiz (Pediatría)');

  await planificar(estado, 'pa1', Patient, () => ({ email: 'paciente.adulto@demo.sigca' }), 'Paciente: Martín Ríos (adulto)');
  await planificar(estado, 'pa2', Patient, () => ({ email: 'paciente.menor@demo.sigca' }), 'Paciente: Sofía Ríos (menor)');
  await planificar(estado, 'pa3', Patient, () => ({ email: 'paciente.carla@demo.sigca' }), 'Paciente: Carla Méndez (adulta)');
  await planificar(estado, 'pa4', Patient, () => ({ email: 'paciente.lucia@demo.sigca' }), 'Paciente: Lucía Fernández (menor)');
  await planificar(estado, 'pa5', Patient, () => ({ email: 'paciente.mateo@demo.sigca' }), 'Paciente: Mateo García (menor)');
  await planificar(estado, 'pa6', Patient, () => ({ email: 'paciente.valentina@demo.sigca' }), 'Paciente: Valentina López (adulta)');
  await planificar(estado, 'pa7', Patient, () => ({ email: 'paciente.andres@demo.sigca' }), 'Paciente: Andrés Ramírez (adulto)');
  await planificar(estado, 'pa8', Patient, () => ({ email: 'paciente.camila@demo.sigca' }), 'Paciente: Camila Torres (adulta)');
  await planificar(estado, 'pa9', Patient, () => ({ email: 'paciente.jose@demo.sigca' }), 'Paciente: José Morales (adulto)');
  await planificar(estado, 'pa10', Patient, () => ({ email: 'paciente.elena@demo.sigca' }), 'Paciente: Elena Castro (menor)');

  await planificar(estado, 'r1', Responsible, () => ({ email: 'responsable.ana@demo.sigca' }), 'Responsable: Ana Ríos (Madre)');
  await planificar(estado, 'r2', Responsible, () => ({ email: 'responsable.marta@demo.sigca' }), 'Responsable: Marta Fernández (Madre)');
  await planificar(estado, 'r3', Responsible, () => ({ email: 'responsable.carlos@demo.sigca' }), 'Responsable: Carlos García (Padre)');
  await planificar(estado, 'r4', Responsible, () => ({ email: 'responsable.patricia@demo.sigca' }), 'Responsable: Patricia Castro (Madre)');
  await planificar(estado, 'r5', Responsible, () => ({ email: 'responsable.miguel@demo.sigca' }), 'Responsable: Miguel Castro (Padre)');

  await planificar(estado, 'm1', EducationalMaterial, () => ({ titulo: 'Cuidado bucal diario' }), 'Material: Cuidado bucal diario');
  await planificar(estado, 'm2', EducationalMaterial, () => ({ titulo: 'Alimentación saludable' }), 'Material: Alimentación saludable');
  await planificar(estado, 'm3', EducationalMaterial, () => ({ titulo: 'Video: cepillado correcto' }), 'Material: Video cepillado correcto');
  await planificar(estado, 'm4', EducationalMaterial, () => ({ titulo: 'Higiene de manos' }), 'Material: Higiene de manos');
  await planificar(estado, 'm5', EducationalMaterial, () => ({ titulo: 'Video: alimentación equilibrada' }), 'Material: Video: alimentación equilibrada');

  await planificar(estado, 'pr_menor', PatientResponsible,
    () => ({ paciente: refs.pa2, responsable: refs.r1 }),
    'Relación: Sofía Ríos ↔ Ana Ríos',
    ['pa2', 'r1']);
  await planificar(estado, 'pr_lucia', PatientResponsible,
    () => ({ paciente: refs.pa4, responsable: refs.r2 }),
    'Relación: Lucía Fernández ↔ Marta Fernández',
    ['pa4', 'r2']);
  await planificar(estado, 'pr_mateo', PatientResponsible,
    () => ({ paciente: refs.pa5, responsable: refs.r3 }),
    'Relación: Mateo García ↔ Carlos García',
    ['pa5', 'r3']);
  await planificar(estado, 'pr_elena_patricia', PatientResponsible,
    () => ({ paciente: refs.pa10, responsable: refs.r4 }),
    'Relación: Elena Castro ↔ Patricia Castro',
    ['pa10', 'r4']);
  await planificar(estado, 'pr_elena_miguel', PatientResponsible,
    () => ({ paciente: refs.pa10, responsable: refs.r5 }),
    'Relación: Elena Castro ↔ Miguel Castro',
    ['pa10', 'r5']);

  await planificar(estado, 'pm1', PatientMaterial,
    () => ({ paciente: refs.pa1, material: refs.m1 }),
    'Relación: Martín Ríos ↔ Cuidado bucal',
    ['pa1', 'm1']);
  await planificar(estado, 'pm2', PatientMaterial,
    () => ({ paciente: refs.pa2, material: refs.m3 }),
    'Relación: Sofía Ríos ↔ Video cepillado',
    ['pa2', 'm3']);
  await planificar(estado, 'pm3', PatientMaterial,
    () => ({ paciente: refs.pa3, material: refs.m2 }),
    'Relación: Carla Méndez ↔ Alimentación saludable',
    ['pa3', 'm2']);
  await planificar(estado, 'pm4', PatientMaterial,
    () => ({ paciente: refs.pa4, material: refs.m4 }),
    'Relación: Lucía Fernández ↔ Higiene de manos',
    ['pa4', 'm4']);
  await planificar(estado, 'pm5', PatientMaterial,
    () => ({ paciente: refs.pa5, material: refs.m5 }),
    'Relación: Mateo García ↔ Video alimentación equilibrada',
    ['pa5', 'm5']);

  await planificar(estado, 'sol1', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-01') }), 'Solicitud: Javier Lemos (PENDIENTE)');
  await planificar(estado, 'sol2', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-02') }), 'Solicitud: Carla Méndez (ATENDIDA)');
  await planificar(estado, 'sol3', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-03') }), 'Solicitud: Roberto Díaz (RECHAZADA)');
  await planificar(estado, 'sol4', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-04') }), 'Solicitud: Lucía Fernández (ATENDIDA)');
  await planificar(estado, 'sol5', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-05') }), 'Solicitud: Marta Ruiz (PENDIENTE)');

  await planificar(estado, 'cita1', Appointment, () => ({ observaciones: regexMarcador('cita-01') }), 'Cita 01: Martín Ríos — total pagada', ['pa1', 'pr1', 's1']);
  await planificar(estado, 'cita2', Appointment, () => ({ observaciones: regexMarcador('cita-02') }), 'Cita 02: Carla Méndez — parcial', ['pa3', 'pr2', 's3']);
  await planificar(estado, 'cita3', Appointment, () => ({ observaciones: regexMarcador('cita-03') }), 'Cita 03: Sofía Ríos — pendiente', ['pa2', 'pr1', 's2']);
  await planificar(estado, 'cita4', Appointment, () => ({ observaciones: regexMarcador('cita-04') }), 'Cita 04: Martín Ríos — con pago anulado', ['pa1', 'pr1', 's1']);
  await planificar(estado, 'cita5', Appointment, () => ({ observaciones: regexMarcador('cita-05') }), 'Cita 05: Martín Ríos — completada', ['pa1', 'pr1', 's3']);
  await planificar(estado, 'cita6', Appointment, () => ({ observaciones: regexMarcador('cita-06') }), 'Cita 06: Sofía Ríos — cancelada', ['pa2', 'pr2', 's3']);
  await planificar(estado, 'cita7', Appointment, () => ({ observaciones: regexMarcador('cita-07') }), 'Cita 07: Lucía Fernández — pendiente (desde solicitud)', ['pa4', 'pr3', 's1']);
  await planificar(estado, 'cita8', Appointment, () => ({ observaciones: regexMarcador('cita-08') }), 'Cita 08: Mateo García — confirmada', ['pa5', 'pr1', 's3']);
  await planificar(estado, 'cita9', Appointment, () => ({ observaciones: regexMarcador('cita-09') }), 'Cita 09: Valentina López — completada', ['pa6', 'pr2', 's2']);
  await planificar(estado, 'cita10', Appointment, () => ({ observaciones: regexMarcador('cita-10') }), 'Cita 10: Andrés Ramírez — cancelada', ['pa7', 'pr3', 's2']);
  await planificar(estado, 'cita11', Appointment, () => ({ observaciones: regexMarcador('cita-11') }), 'Cita 11: Camila Torres — pendiente', ['pa8', 'pr1', 's3']);
  await planificar(estado, 'cita12', Appointment, () => ({ observaciones: regexMarcador('cita-12') }), 'Cita 12: José Morales — confirmada', ['pa9', 'pr2', 's2']);
  await planificar(estado, 'cita13', Appointment, () => ({ observaciones: regexMarcador('cita-13') }), 'Cita 13: Elena Castro — pendiente', ['pa10', 'pr3', 's1']);
  await planificar(estado, 'cita14', Appointment, () => ({ observaciones: regexMarcador('cita-14') }), 'Cita 14: Lucía Fernández — completada', ['pa4', 'pr2', 's3']);
  await planificar(estado, 'cita15', Appointment, () => ({ observaciones: regexMarcador('cita-15') }), 'Cita 15: Mateo García — cancelada', ['pa5', 'pr3', 's2']);

  await planificarCaja(estado, 'caja1', 'caja-01', 'CERRADA', 'Caja CERRADA (arqueo con diferencia)');
  await planificarCajaAbierta(estado);
  await planificarCaja(estado, 'caja3', 'caja-03', 'CERRADA', 'Caja CERRADA (turno de recepción 2)');

  // Pagos: solo se planifican si su caja está disponible. Así el plan y la
  // aplicación nunca intentan asociar pagos a una caja extranjera o cerrada.
  const pagoDefsPlan = [
    ['pago1', 'pago-01', 'Pago 01: cita 01 total (EFECTIVO, caja 01)', 'caja1', 'cita1'],
    ['pago2', 'pago-02', 'Pago 02: cita 02 seña (TARJETA, caja 01)', 'caja1', 'cita2'],
    ['pago4', 'pago-04', 'Pago 04: cita 04 ANULADO (TRANSFERENCIA, caja 01)', 'caja1', 'cita4'],
    ['pago5', 'pago-05', 'Pago 05: cita 02 saldo (EFECTIVO, caja 02)', 'caja2', 'cita2'],
    ['pago6', 'pago-06', 'Pago 06: cita 05 total (EFECTIVO, caja 03)', 'caja3', 'cita5'],
    ['pago7', 'pago-07', 'Pago 07: cita 08 seña (TARJETA, caja 02)', 'caja2', 'cita8'],
    ['pago8', 'pago-08', 'Pago 08: cita 09 seña (TARJETA, caja 03)', 'caja3', 'cita9'],
    ['pago9', 'pago-09', 'Pago 09: cita 09 saldo (EFECTIVO, caja 03)', 'caja3', 'cita9'],
    ['pago10', 'pago-10', 'Pago 10: cita 12 total (TRANSFERENCIA, caja 03)', 'caja3', 'cita12'],
    ['pago11', 'pago-11', 'Pago 11: cita 11 seña (TRANSFERENCIA, caja 02)', 'caja2', 'cita11']
  ];
  for (const [alias, claveMarcador, etiqueta, cajaAlias, citaAlias] of pagoDefsPlan) {
    if (!estado[`${cajaAlias}Disponible`]) continue;
    await planificar(estado, alias, Payment,
      () => ({ notas: regexMarcador(claveMarcador) }),
      etiqueta,
      [citaAlias, cajaAlias]);
  }

  // Mostrar el plan ANTES de escribir.
  console.log('\nPLAN (registros de demostración):');
  for (const p of plan) console.log(`  [${p.accion}] ${p.clave}`);
  if (advertencias.length) {
    console.log('\nAdvertencias / limitaciones:');
    for (const a of advertencias) console.log(`  - ${a}`);
  }
  console.log(`\nResumen del plan: ${plan.filter((p) => p.accion === 'CREAR').length} por crear, ${plan.filter((p) => p.accion === 'OMITIR').length} ya existentes.`);

  if (dryRun) {
    console.log('\nSimulación finalizada. No se escribió nada.');
    return { creados: [], omitidos: [], plan, advertencias };
  }

  console.log('\nAplicando cambios (sin operaciones destructivas)...');

  // ------------------------------------------------------------------
  // FASE 2 — USUARIOS (save() para que el hook hashee la contraseña)
  // ------------------------------------------------------------------
  await aplicar(estado, 'admin', User, () => ({ email: env.adminEmail.toLowerCase() }), () => ({
    nombre: 'Administrador Demo', email: env.adminEmail.toLowerCase(), password: env.adminPassword, rol: 'ADMINISTRADOR', activo: true
  }));
  await aplicar(estado, 'recepcion', User, () => ({ email: 'recepcion.demo@demo.sigca' }), () => ({
    nombre: 'Recepcionista Demo', email: 'recepcion.demo@demo.sigca', password: 'Demo1234', rol: 'RECEPCIONISTA', activo: true
  }));
  await aplicar(estado, 'recepcion2', User, () => ({ email: 'recepcion2.demo@demo.sigca' }), () => ({
    nombre: 'Recepcionista Dos', email: 'recepcion2.demo@demo.sigca', password: 'Demo1234', rol: 'RECEPCIONISTA', activo: true
  }));
  await aplicar(estado, 'profesionalUser', User, () => ({ email: 'profesional.demo@demo.sigca' }), () => ({
    nombre: 'Profesional Demo', email: 'profesional.demo@demo.sigca', password: 'Demo1234', rol: 'PROFESIONAL', activo: true
  }));
  await aplicar(estado, 'profesionalUser2', User, () => ({ email: 'pablo.herrera@demo.sigca' }), () => ({
    nombre: 'Pablo Herrera', email: 'pablo.herrera@demo.sigca', password: 'Demo1234', rol: 'PROFESIONAL', activo: true
  }));
  await aplicar(estado, 'valentinaUser', User, () => ({ email: 'valentina.ortiz@demo.sigca' }), () => ({
    nombre: 'Valentina Ortiz', email: 'valentina.ortiz@demo.sigca', password: 'Demo1234', rol: 'PROFESIONAL', activo: true
  }));

  // ------------------------------------------------------------------
  // FASE 3 — SERVICIOS y PROFESIONALES
  // ------------------------------------------------------------------
  const s1 = await aplicar(estado, 's1', Service, () => ({ nombre: 'Consulta odontológica general' }), () => ({
    nombre: 'Consulta odontológica general', descripcion: 'Evaluación y diagnóstico odontológico', precioCentavos: 25000, duracionMinutos: 30, activo: true,
    imagenUrl: '/servicios/consulta-odontologica.svg', categoria: 'Odontología', icono: 'diente'
  }));
  const s2 = await aplicar(estado, 's2', Service, () => ({ nombre: 'Limpieza dental' }), () => ({
    nombre: 'Limpieza dental', descripcion: 'Profilaxis y pulido dental', precioCentavos: 18000, duracionMinutos: 30, activo: true,
    imagenUrl: '/servicios/limpieza-dental.svg', categoria: 'Odontología', icono: 'diente'
  }));
  const s3 = await aplicar(estado, 's3', Service, () => ({ nombre: 'Sesión de psicología' }), () => ({
    nombre: 'Sesión de psicología', descripcion: 'Consulta psicológica individual', precioCentavos: 30000, duracionMinutos: 45, activo: true,
    imagenUrl: '/servicios/sesion-psicologia.svg', categoria: 'Psicología', icono: 'mente'
  }));
  const s4 = await aplicar(estado, 's4', Service, () => ({ nombre: 'Control de niño sano' }), () => ({
    nombre: 'Control de niño sano', descripcion: 'Control pediátrico', precioCentavos: 20000, duracionMinutos: 30, activo: true,
    imagenUrl: '/servicios/control-nino-sano.svg', categoria: 'Pediatría', icono: 'corazon'
  }));
  const s5 = await aplicar(estado, 's5', Service, () => ({ nombre: 'Evaluación inicial' }), () => ({
    nombre: 'Evaluación inicial', descripcion: 'Entrevista inicial de evaluación', precioCentavos: 15000, duracionMinutos: 30, activo: false,
    imagenUrl: '/servicios/evaluacion-inicial.svg', categoria: 'General', icono: 'estetoscopio'
  }));
  const servicios = { s1, s2, s3, s4, s5 };

  const pr1 = await aplicar(estado, 'pr1', Professional, () => ({ dni: '30000001' }), () => ({
    nombre: 'Laura', apellido: 'Giménez', especialidad: 'Odontología general', telefono: '5551-1001', email: 'profesional.demo@demo.sigca', dni: '30000001', matricula: 'MP-30001', usuario: refs.profesionalUser, activo: true
  }));
  const pr2 = await aplicar(estado, 'pr2', Professional, () => ({ dni: '30000002' }), () => ({
    nombre: 'Pablo', apellido: 'Herrera', especialidad: 'Psicología', telefono: '5551-1002', email: 'pablo.herrera@demo.sigca', dni: '30000002', matricula: 'MP-30002', usuario: refs.profesionalUser2, activo: true
  }));
  const pr3 = await aplicar(estado, 'pr3', Professional, () => ({ dni: '30000003' }), () => ({
    nombre: 'Valentina', apellido: 'Ortiz', especialidad: 'Pediatría', telefono: '5551-1003', email: 'valentina.ortiz@demo.sigca', dni: '30000003', matricula: 'MP-30003', usuario: refs.valentinaUser, activo: true
  }));

  // ------------------------------------------------------------------
  // FASE 4 — PACIENTES y RESPONSABLES
  // ------------------------------------------------------------------
  await aplicar(estado, 'pa1', Patient, () => ({ email: 'paciente.adulto@demo.sigca' }), () => ({
    nombre: 'Martín', apellido: 'Ríos', fechaNacimiento: new Date('1990-04-12'), sexo: 'M', telefono: '5551-0001', email: 'paciente.adulto@demo.sigca',
    fechaInicioProceso: dia(-90, 9, 0), observacionesAdministrativas: 'Paciente adulto, seguimiento odontológico.', activo: true
  }));
  await aplicar(estado, 'pa2', Patient, () => ({ email: 'paciente.menor@demo.sigca' }), () => ({
    nombre: 'Sofía', apellido: 'Ríos', fechaNacimiento: new Date('2015-09-30'), sexo: 'F', telefono: '5551-0002', email: 'paciente.menor@demo.sigca',
    fechaInicioProceso: dia(-60, 9, 0), observacionesAdministrativas: 'Menor de edad; asiste con su madre (Ana Ríos).', activo: true
  }));
  await aplicar(estado, 'pa3', Patient, () => ({ email: 'paciente.carla@demo.sigca' }), () => ({
    nombre: 'Carla', apellido: 'Méndez', fechaNacimiento: new Date('1985-01-20'), sexo: 'F', telefono: '5551-0003', email: 'paciente.carla@demo.sigca',
    fechaInicioProceso: dia(-30, 9, 0), observacionesAdministrativas: 'Inició terapia psicológica.', activo: true
  }));
  await aplicar(estado, 'pa4', Patient, () => ({ email: 'paciente.lucia@demo.sigca' }), () => ({
    nombre: 'Lucía', apellido: 'Fernández', fechaNacimiento: new Date('2014-06-18'), sexo: 'F', telefono: '5551-0004', email: 'paciente.lucia@demo.sigca',
    fechaInicioProceso: dia(-45, 9, 0), observacionesAdministrativas: 'Menor de edad; asiste con su madre (Marta Fernández).', activo: true
  }));
  await aplicar(estado, 'pa5', Patient, () => ({ email: 'paciente.mateo@demo.sigca' }), () => ({
    nombre: 'Mateo', apellido: 'García', fechaNacimiento: new Date('2016-02-11'), sexo: 'M', telefono: '5551-0005', email: 'paciente.mateo@demo.sigca',
    fechaInicioProceso: dia(-40, 9, 0), observacionesAdministrativas: 'Menor de edad; asiste con su padre (Carlos García).', activo: true
  }));
  await aplicar(estado, 'pa6', Patient, () => ({ email: 'paciente.valentina@demo.sigca' }), () => ({
    nombre: 'Valentina', apellido: 'López', fechaNacimiento: new Date('1992-11-05'), sexo: 'F', telefono: '5551-0006', email: 'paciente.valentina@demo.sigca',
    fechaInicioProceso: dia(-35, 9, 0), observacionesAdministrativas: 'Paciente adulta en seguimiento.', activo: true
  }));
  await aplicar(estado, 'pa7', Patient, () => ({ email: 'paciente.andres@demo.sigca' }), () => ({
    nombre: 'Andrés', apellido: 'Ramírez', fechaNacimiento: new Date('1988-07-22'), sexo: 'M', telefono: '5551-0007', email: 'paciente.andres@demo.sigca',
    fechaInicioProceso: dia(-25, 9, 0), observacionesAdministrativas: 'Paciente adulto, control periódico.', activo: true
  }));
  await aplicar(estado, 'pa8', Patient, () => ({ email: 'paciente.camila@demo.sigca' }), () => ({
    nombre: 'Camila', apellido: 'Torres', fechaNacimiento: new Date('1995-03-14'), sexo: 'F', telefono: '5551-0008', email: 'paciente.camila@demo.sigca',
    fechaInicioProceso: dia(-20, 9, 0), observacionesAdministrativas: 'Paciente adulta, primera consulta.', activo: true
  }));
  await aplicar(estado, 'pa9', Patient, () => ({ email: 'paciente.jose@demo.sigca' }), () => ({
    nombre: 'José', apellido: 'Morales', fechaNacimiento: new Date('1979-12-01'), sexo: 'M', telefono: '5551-0009', email: 'paciente.jose@demo.sigca',
    fechaInicioProceso: dia(-15, 9, 0), observacionesAdministrativas: 'Paciente adulto, seguimiento odontológico.', activo: true
  }));
  await aplicar(estado, 'pa10', Patient, () => ({ email: 'paciente.elena@demo.sigca' }), () => ({
    nombre: 'Elena', apellido: 'Castro', fechaNacimiento: new Date('2017-08-25'), sexo: 'F', telefono: '5551-0010', email: 'paciente.elena@demo.sigca',
    fechaInicioProceso: dia(-10, 9, 0), observacionesAdministrativas: 'Menor de edad; asiste con sus padres (Patricia y Miguel Castro).', activo: true
  }));

  await aplicar(estado, 'r1', Responsible, () => ({ email: 'responsable.ana@demo.sigca' }), () => ({
    nombre: 'Ana', apellido: 'Ríos', telefono: '5551-0001', email: 'responsable.ana@demo.sigca',
    direccion: 'Colonia Centro, calle 1, casa 10', parentesco: 'Madre', activo: true
  }));
  await aplicar(estado, 'r2', Responsible, () => ({ email: 'responsable.marta@demo.sigca' }), () => ({
    nombre: 'Marta', apellido: 'Fernández', telefono: '5551-0104', email: 'responsable.marta@demo.sigca',
    direccion: 'Colonia Las Flores, avenida 4, casa 22', parentesco: 'Madre', activo: true
  }));
  await aplicar(estado, 'r3', Responsible, () => ({ email: 'responsable.carlos@demo.sigca' }), () => ({
    nombre: 'Carlos', apellido: 'García', telefono: '5551-0105', email: 'responsable.carlos@demo.sigca',
    direccion: 'Barrio El Sol, calle 8, casa 5', parentesco: 'Padre', activo: true
  }));
  await aplicar(estado, 'r4', Responsible, () => ({ email: 'responsable.patricia@demo.sigca' }), () => ({
    nombre: 'Patricia', apellido: 'Castro', telefono: '5551-0106', email: 'responsable.patricia@demo.sigca',
    direccion: 'Residencial Los Pinos, calle 12, casa 3', parentesco: 'Madre', activo: true
  }));
  await aplicar(estado, 'r5', Responsible, () => ({ email: 'responsable.miguel@demo.sigca' }), () => ({
    nombre: 'Miguel', apellido: 'Castro', telefono: '5551-0107', email: 'responsable.miguel@demo.sigca',
    direccion: 'Residencial Los Pinos, calle 12, casa 3', parentesco: 'Padre', activo: true
  }));

  await aplicar(estado, 'pr_menor', PatientResponsible,
    () => ({ paciente: refs.pa2, responsable: refs.r1 }),
    () => ({ paciente: refs.pa2, responsable: refs.r1, activo: true }));
  await aplicar(estado, 'pr_lucia', PatientResponsible,
    () => ({ paciente: refs.pa4, responsable: refs.r2 }),
    () => ({ paciente: refs.pa4, responsable: refs.r2, activo: true }));
  await aplicar(estado, 'pr_mateo', PatientResponsible,
    () => ({ paciente: refs.pa5, responsable: refs.r3 }),
    () => ({ paciente: refs.pa5, responsable: refs.r3, activo: true }));
  await aplicar(estado, 'pr_elena_patricia', PatientResponsible,
    () => ({ paciente: refs.pa10, responsable: refs.r4 }),
    () => ({ paciente: refs.pa10, responsable: refs.r4, activo: true }));
  await aplicar(estado, 'pr_elena_miguel', PatientResponsible,
    () => ({ paciente: refs.pa10, responsable: refs.r5 }),
    () => ({ paciente: refs.pa10, responsable: refs.r5, activo: true }));

  // ------------------------------------------------------------------
  // FASE 5 — MATERIALES y ASIGNACIONES
  // ------------------------------------------------------------------
  const m1 = await aplicar(estado, 'm1', EducationalMaterial, () => ({ titulo: 'Cuidado bucal diario' }), () => ({
    titulo: 'Cuidado bucal diario', descripcion: 'Guía de cepillado y uso de hilo dental', tipo: 'DOCUMENTO', url: 'https://ejemplo.sigca/materiales/cuidado-bucal.pdf', activo: true
  }));
  const m2 = await aplicar(estado, 'm2', EducationalMaterial, () => ({ titulo: 'Alimentación saludable' }), () => ({
    titulo: 'Alimentación saludable', descripcion: 'Recomendaciones de alimentación para toda la familia', tipo: 'DOCUMENTO', url: 'https://ejemplo.sigca/materiales/alimentacion.pdf', activo: true
  }));
  const m3 = await aplicar(estado, 'm3', EducationalMaterial, () => ({ titulo: 'Video: cepillado correcto' }), () => ({
    titulo: 'Video: cepillado correcto', descripcion: 'Técnica de cepillado paso a paso', tipo: 'VIDEO', url: 'https://ejemplo.sigca/materiales/cepillado.mp4', activo: true
  }));
  const m4 = await aplicar(estado, 'm4', EducationalMaterial, () => ({ titulo: 'Higiene de manos' }), () => ({
    titulo: 'Higiene de manos', descripcion: 'Pasos para una correcta higiene de manos', tipo: 'DOCUMENTO', url: 'https://ejemplo.sigca/materiales/higiene-manos.pdf', activo: true
  }));
  const m5 = await aplicar(estado, 'm5', EducationalMaterial, () => ({ titulo: 'Video: alimentación equilibrada' }), () => ({
    titulo: 'Video: alimentación equilibrada', descripcion: 'Ideas para una alimentación equilibrada en familia', tipo: 'VIDEO', url: 'https://ejemplo.sigca/materiales/alimentacion-equilibrada.mp4', activo: true
  }));

  await aplicar(estado, 'pm1', PatientMaterial,
    () => ({ paciente: refs.pa1, material: m1._id }),
    () => ({ paciente: refs.pa1, material: m1._id, notas: 'Entregado en la consulta', asignadoPor: refs.recepcion, activo: true }));
  await aplicar(estado, 'pm2', PatientMaterial,
    () => ({ paciente: refs.pa2, material: m3._id }),
    () => ({ paciente: refs.pa2, material: m3._id, notas: 'Para ver en casa con la madre', asignadoPor: refs.recepcion, activo: true }));
  await aplicar(estado, 'pm3', PatientMaterial,
    () => ({ paciente: refs.pa3, material: m2._id }),
    () => ({ paciente: refs.pa3, material: m2._id, notas: 'Recomendado en consulta', asignadoPor: refs.recepcion, activo: true }));
  await aplicar(estado, 'pm4', PatientMaterial,
    () => ({ paciente: refs.pa4, material: m4._id }),
    () => ({ paciente: refs.pa4, material: m4._id, notas: 'Entregado a la madre', asignadoPor: refs.recepcion, activo: true }));
  await aplicar(estado, 'pm5', PatientMaterial,
    () => ({ paciente: refs.pa5, material: m5._id }),
    () => ({ paciente: refs.pa5, material: m5._id, notas: 'Para ver en familia', asignadoPor: refs.recepcion, activo: true }));

  // ------------------------------------------------------------------
  // FASE 6 — SOLICITUDES
  // ------------------------------------------------------------------
  await aplicar(estado, 'sol1', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-01') }), () => ({
    nombre: 'Javier Lemos', telefono: '5551-0201', email: 'javier.lemos@demo.sigca',
    servicio: s1._id, fechaPreferida: dia(2, 9, 0),
    mensaje: `${marcador('sol-01')} Quisiera un turno por la mañana.`, estado: 'PENDIENTE'
  }));
  await aplicar(estado, 'sol2', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-02') }), () => ({
    nombre: 'Carla Méndez', telefono: '5551-0003', email: 'paciente.carla@demo.sigca',
    servicio: s3._id,
    mensaje: `${marcador('sol-02')} Consulta de psicología.`, estado: 'ATENDIDA',
    atendidaPor: refs.recepcion, fechaAtencion: dia(-2, 10, 0)
  }));
  await aplicar(estado, 'sol3', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-03') }), () => ({
    nombre: 'Roberto Díaz', telefono: '5551-0203', email: 'roberto.diaz@demo.sigca',
    servicio: s2._id, fechaPreferida: dia(-5, 9, 0),
    mensaje: `${marcador('sol-03')} Consulta de limpieza dental.`, estado: 'RECHAZADA',
    atendidaPor: refs.recepcion, fechaAtencion: dia(-5, 10, 0),
    motivoRechazo: 'Sin disponibilidad en la fecha solicitada'
  }));
  await aplicar(estado, 'sol4', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-04') }), () => ({
    nombre: 'Lucía Fernández', telefono: '5551-0004', email: 'paciente.lucia@demo.sigca',
    servicio: s1._id, fechaPreferida: proximoLaborable(5),
    mensaje: `${marcador('sol-04')} Primera consulta odontológica.`, estado: 'ATENDIDA',
    atendidaPor: refs.recepcion, fechaAtencion: dia(-1, 10, 0)
  }));
  await aplicar(estado, 'sol5', AppointmentRequest, () => ({ mensaje: regexMarcador('sol-05') }), () => ({
    nombre: 'Marta Ruiz', telefono: '5551-0205', email: 'marta.ruiz@demo.sigca',
    servicio: s4._id, fechaPreferida: dia(3, 9, 0),
    mensaje: `${marcador('sol-05')} Control de niño sano.`, estado: 'PENDIENTE'
  }));

  // ------------------------------------------------------------------
  // FASE 7 — CITAS (con precio/duración históricos del servicio)
  // ------------------------------------------------------------------
  const citaDefs = [
    { alias: 'cita1', marcador: 'cita-01', paciente: 'pa1', profesional: 'pr1', servicio: 's1', estado: 'CONFIRMADA', inicio: conHora(proximoLaborable(1), 9, 0), observaciones: 'Consulta de control' },
    { alias: 'cita2', marcador: 'cita-02', paciente: 'pa3', profesional: 'pr2', servicio: 's3', estado: 'CONFIRMADA', inicio: conHora(proximoLaborable(2), 10, 0), observaciones: 'Primera sesión', solicitud: 'sol2' },
    { alias: 'cita3', marcador: 'cita-03', paciente: 'pa2', profesional: 'pr1', servicio: 's2', estado: 'PENDIENTE', inicio: conHora(proximoLaborable(3), 11, 0), observaciones: 'Limpieza (paciente menor, asiste con responsable)' },
    { alias: 'cita4', marcador: 'cita-04', paciente: 'pa1', profesional: 'pr1', servicio: 's1', estado: 'CONFIRMADA', inicio: conHora(proximoLaborable(4), 15, 0), observaciones: 'Control general' },
    { alias: 'cita5', marcador: 'cita-05', paciente: 'pa1', profesional: 'pr1', servicio: 's3', estado: 'COMPLETADA', inicio: dia(-20, 9, 0), observaciones: 'Sesión completada' },
    { alias: 'cita6', marcador: 'cita-06', paciente: 'pa2', profesional: 'pr2', servicio: 's3', estado: 'CANCELADA', inicio: dia(-19, 10, 0), observaciones: 'Cancelada por la familia' },
    { alias: 'cita7', marcador: 'cita-07', paciente: 'pa4', profesional: 'pr3', servicio: 's1', estado: 'PENDIENTE', inicio: conHora(proximoLaborable(5), 9, 0), observaciones: 'Primera consulta (desde solicitud)', solicitud: 'sol4' },
    { alias: 'cita8', marcador: 'cita-08', paciente: 'pa5', profesional: 'pr1', servicio: 's3', estado: 'CONFIRMADA', inicio: conHora(proximoLaborable(5), 10, 0), observaciones: 'Sesión de control' },
    { alias: 'cita9', marcador: 'cita-09', paciente: 'pa6', profesional: 'pr2', servicio: 's2', estado: 'COMPLETADA', inicio: dia(-18, 11, 0), observaciones: 'Limpieza completada' },
    { alias: 'cita10', marcador: 'cita-10', paciente: 'pa7', profesional: 'pr3', servicio: 's2', estado: 'CANCELADA', inicio: dia(-17, 12, 0), observaciones: 'Cancelada por el paciente' },
    { alias: 'cita11', marcador: 'cita-11', paciente: 'pa8', profesional: 'pr1', servicio: 's3', estado: 'PENDIENTE', inicio: conHora(proximoLaborable(6), 9, 0), observaciones: 'Primera consulta' },
    { alias: 'cita12', marcador: 'cita-12', paciente: 'pa9', profesional: 'pr2', servicio: 's2', estado: 'CONFIRMADA', inicio: conHora(proximoLaborable(6), 10, 0), observaciones: 'Limpieza programada' },
    { alias: 'cita13', marcador: 'cita-13', paciente: 'pa10', profesional: 'pr3', servicio: 's1', estado: 'PENDIENTE', inicio: conHora(proximoLaborable(7), 9, 0), observaciones: 'Control pediátrico' },
    { alias: 'cita14', marcador: 'cita-14', paciente: 'pa4', profesional: 'pr2', servicio: 's3', estado: 'COMPLETADA', inicio: dia(-16, 13, 0), observaciones: 'Sesión completada' },
    { alias: 'cita15', marcador: 'cita-15', paciente: 'pa5', profesional: 'pr3', servicio: 's2', estado: 'CANCELADA', inicio: dia(-15, 14, 0), observaciones: 'Cancelada por la familia' }
  ];

  const intervalos = [];
  for (const def of citaDefs) {
    await aplicarCita(estado, def, servicios[def.servicio], intervalos);
  }

  // RF-06: la solicitud ATENDIDA conserva la cita generada (y la cita su
  // origen). Solo se completan referencias nulas, sin sobrescribir datos.
  await repararEnlaceCita(estado, 'cita2', 'sol2');
  await repararEnlaceCita(estado, 'cita7', 'sol4');
  await repararEnlaceSolicitud(estado, 'sol2', 'cita2');
  await repararEnlaceSolicitud(estado, 'sol4', 'cita7');

  // ------------------------------------------------------------------
  // FASE 8 — CAJAS (se crean antes de los pagos para asociarlos)
  // ------------------------------------------------------------------
  let caja1 = null;
  if (estado.caja1Disponible) {
    caja1 = await aplicar(estado, 'caja1', CashSession, () => ({ observacionesApertura: regexMarcador('caja-01') }), () => ({
      estado: 'CERRADA',
      abiertaPor: refs.recepcion, fechaApertura: dia(-7, 8, 0),
      montoInicialCentavos: 20000,
      observacionesApertura: `${marcador('caja-01')} Turno de la mañana`,
      cerradaPor: refs.recepcion, fechaCierre: dia(-7, 16, 0),
      observacionesCierre: 'Falta efectivo en el arqueo'
    }));
    if (caja1.estado !== 'CERRADA') {
      estado.caja1Disponible = false;
      advertencias.push('La caja caja-01 no quedó en estado CERRADA: se omiten pago-01, pago-02 y pago-04.');
    }
  }

  let caja2 = null;
  if (estado.caja2Disponible) {
    let apertura = dia(0, 8, 0);
    if (apertura > ahora) apertura = new Date(ahora.getTime() - 60 * 60 * 1000);
    caja2 = await aplicar(estado, 'caja2', CashSession, () => ({ observacionesApertura: regexMarcador('caja-02') }), () => ({
      estado: 'ABIERTA',
      abiertaPor: refs.recepcion, fechaApertura: apertura,
      montoInicialCentavos: 10000,
      observacionesApertura: `${marcador('caja-02')} Turno de hoy`
    }));
    if (caja2.estado !== 'ABIERTA') {
      estado.caja2Disponible = false;
      advertencias.push('La caja caja-02 no quedó en estado ABIERTA: se omiten pago-05, pago-07 y pago-11.');
    }
  }

  let caja3 = null;
  if (estado.caja3Disponible) {
    caja3 = await aplicar(estado, 'caja3', CashSession, () => ({ observacionesApertura: regexMarcador('caja-03') }), () => ({
      estado: 'CERRADA',
      abiertaPor: refs.recepcion2, fechaApertura: dia(-3, 8, 0),
      montoInicialCentavos: 15000,
      observacionesApertura: `${marcador('caja-03')} Turno de recepción 2`,
      cerradaPor: refs.recepcion2, fechaCierre: dia(-3, 16, 0),
      observacionesCierre: 'Arqueo sin diferencias'
    }));
    if (caja3.estado !== 'CERRADA') {
      estado.caja3Disponible = false;
      advertencias.push('La caja caja-03 no quedó en estado CERRADA: se omiten pago-06, pago-08, pago-09 y pago-10.');
    }
  }

  // ------------------------------------------------------------------
  // FASE 9 — PAGOS (coherentes: nunca superan el precio de la cita y
  // quedan asociados a la caja en la que se registraron)
  // ------------------------------------------------------------------
  const pagoDefs = [
    { alias: 'pago1', marcador: 'pago-01', cita: 'cita1', paciente: 'pa1', caja: 'caja1', montoCentavos: 25000, metodo: 'EFECTIVO', fecha: dia(-7, 9, 0), estado: 'REGISTRADO', usuario: 'recepcion', notas: 'Pago total' },
    { alias: 'pago2', marcador: 'pago-02', cita: 'cita2', paciente: 'pa3', caja: 'caja1', montoCentavos: 10000, metodo: 'TARJETA', fecha: dia(-7, 10, 0), estado: 'REGISTRADO', usuario: 'recepcion', notas: 'Seña' },
    { alias: 'pago4', marcador: 'pago-04', cita: 'cita4', paciente: 'pa1', caja: 'caja1', montoCentavos: 25000, metodo: 'TRANSFERENCIA', fecha: dia(-7, 11, 0), estado: 'ANULADO', usuario: 'recepcion', notas: 'Anulado por duplicado', motivoAnulacion: 'Pago duplicado', anuladoEn: dia(-7, 11, 30) },
    { alias: 'pago5', marcador: 'pago-05', cita: 'cita2', paciente: 'pa3', caja: 'caja2', montoCentavos: 5000, metodo: 'EFECTIVO', fecha: ahora, estado: 'REGISTRADO', usuario: 'recepcion', notas: 'Saldo abonado en caja abierta' },
    { alias: 'pago6', marcador: 'pago-06', cita: 'cita5', paciente: 'pa1', caja: 'caja3', montoCentavos: 30000, metodo: 'EFECTIVO', fecha: dia(-3, 9, 0), estado: 'REGISTRADO', usuario: 'recepcion2', notas: 'Pago total' },
    { alias: 'pago7', marcador: 'pago-07', cita: 'cita8', paciente: 'pa5', caja: 'caja2', montoCentavos: 10000, metodo: 'TARJETA', fecha: ahora, estado: 'REGISTRADO', usuario: 'recepcion', notas: 'Seña' },
    { alias: 'pago8', marcador: 'pago-08', cita: 'cita9', paciente: 'pa6', caja: 'caja3', montoCentavos: 8000, metodo: 'TARJETA', fecha: dia(-3, 10, 0), estado: 'REGISTRADO', usuario: 'recepcion2', notas: 'Seña' },
    { alias: 'pago9', marcador: 'pago-09', cita: 'cita9', paciente: 'pa6', caja: 'caja3', montoCentavos: 10000, metodo: 'EFECTIVO', fecha: dia(-3, 11, 0), estado: 'REGISTRADO', usuario: 'recepcion2', notas: 'Saldo' },
    { alias: 'pago10', marcador: 'pago-10', cita: 'cita12', paciente: 'pa9', caja: 'caja3', montoCentavos: 18000, metodo: 'TRANSFERENCIA', fecha: dia(-3, 12, 0), estado: 'REGISTRADO', usuario: 'recepcion2', notas: 'Pago total' },
    { alias: 'pago11', marcador: 'pago-11', cita: 'cita11', paciente: 'pa8', caja: 'caja2', montoCentavos: 5000, metodo: 'TRANSFERENCIA', fecha: ahora, estado: 'REGISTRADO', usuario: 'recepcion', notas: 'Seña' }
  ];

  for (const def of pagoDefs) {
    if (!estado[`${def.caja}Disponible`]) continue;
    await aplicar(estado, def.alias, Payment,
      () => ({ notas: regexMarcador(def.marcador) }),
      () => ({
        cita: refs[def.cita],
        paciente: refs[def.paciente],
        caja: refs[def.caja],
        montoCentavos: def.montoCentavos,
        metodo: def.metodo,
        fecha: def.fecha,
        estado: def.estado,
        registradoPor: refs[def.usuario],
        notas: `${marcador(def.marcador)} ${def.notas}`,
        ...(def.estado === 'ANULADO'
          ? {
              motivoAnulacion: def.motivoAnulacion,
              anuladoEn: def.anuladoEn,
              anuladoPor: refs[def.usuario]
            }
          : {})
      }));
  }

  // ------------------------------------------------------------------
  // FASE 10 — REPARACIONES SEGURAS (solo registros del seed)
  // ------------------------------------------------------------------
  await repararProfesional(estado, 'pr1', 'profesionalUser');
  await repararProfesional(estado, 'pr2', 'profesionalUser2');
  await repararProfesional(estado, 'pr3', 'valentinaUser');

  const offsetsInicio = {
    pa1: -90, pa2: -60, pa3: -30, pa4: -45, pa5: -40,
    pa6: -35, pa7: -25, pa8: -20, pa9: -15, pa10: -10
  };
  for (const [alias, offset] of Object.entries(offsetsInicio)) {
    if (!refs[alias]) continue;
    await Patient.updateOne(
      { _id: refs[alias], fechaInicioProceso: null },
      { $set: { fechaInicioProceso: dia(offset, 9, 0) } }
    );
  }

  for (const def of pagoDefs) {
    const pago = await Payment.findOne({ notas: regexMarcador(def.marcador) });
    if (!pago) continue;

    const cambios = {};
    if (pago.caja == null && refs[def.caja]) cambios.caja = refs[def.caja];
    if (pago.registradoPor == null && refs[def.usuario]) cambios.registradoPor = refs[def.usuario];
    if (pago.paciente == null && refs[def.paciente]) cambios.paciente = refs[def.paciente];

    if (def.estado === 'ANULADO' && pago.estado === 'ANULADO') {
      if (pago.motivoAnulacion == null || pago.motivoAnulacion === '') cambios.motivoAnulacion = def.motivoAnulacion;
      if (pago.anuladoEn == null) cambios.anuladoEn = def.anuladoEn;
      if (pago.anuladoPor == null && refs[def.usuario]) cambios.anuladoPor = refs[def.usuario];
    }

    if (Object.keys(cambios).length) {
      await Payment.updateOne({ _id: pago._id }, { $set: cambios });
    }
  }

  // RF-10: los pagos de demostración reciben su comprobante único (idempotente).
  // El número se copia al pago; la fuente de verdad sigue siendo Receipt.
  // Se incluyen también los pagos anulados (su comprobante nace ANULADO).
  const pagosDemo = await Payment.find({ notas: /^\[seedDemo:pago-/ });
  for (const pago of pagosDemo) await emitirComprobante(pago);
  const comprobantesDemo = await Receipt.countDocuments({ pago: { $in: pagosDemo.map((p) => p._id) } });
  if (comprobantesDemo < pagosDemo.length) {
    advertencias.push(`Hay ${pagosDemo.length - comprobantesDemo} pago(s) de demostración sin comprobante.`);
  }

  // Totales de las cajas calculados desde sus pagos REGISTRADO (los anulados no
  // suman; el efectivo esperado es inicial + EFECTIVO).
  await actualizarTotalesCaja(estado, {
    alias: 'caja1', claveMarcador: 'caja-01', estadoEsperado: 'CERRADA', totalReal: 44500
  });
  await actualizarTotalesCaja(estado, {
    alias: 'caja2', claveMarcador: 'caja-02', estadoEsperado: 'ABIERTA'
  });
  await actualizarTotalesCaja(estado, {
    alias: 'caja3', claveMarcador: 'caja-03', estadoEsperado: 'CERRADA', totalReal: 55000
  });

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
  console.log('  recepcion2.demo@demo.sigca / Demo1234 (RECEPCIONISTA)');
  console.log('  profesional.demo@demo.sigca / Demo1234 (PROFESIONAL)');
  console.log('  pablo.herrera@demo.sigca / Demo1234 (PROFESIONAL)');
  console.log('  valentina.ortiz@demo.sigca / Demo1234 (PROFESIONAL)');
  console.log('  (El administrador usa las credenciales definidas en backend/.env)');

  return { creados, omitidos, plan, advertencias };
}

export { marcador, regexMarcador };
