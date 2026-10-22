// Migración idempotente: completa campos y relaciones de B3.
//
// Uso:
//   node scripts/completarRelaciones.js --dry-run   (solo informa)
//   node scripts/completarRelaciones.js             (aplica cambios)
//
// Contexto: B3 agregó campos y relaciones que los registros históricos no
// tienen. Esta migración SOLO rellena datos faltantes a partir de información
// ya existente; no inventa datos personales ni elimina documentos.
//
// Qué completa:
//  1. Payment.numeroComprobante desde su Receipt (1:1, fuente de verdad).
//  2. Patient.fechaInicioProceso desde createdAt cuando está vacío.
//  3. Professional.usuario por coincidencia exacta de email con un User
//     activo de rol PROFESIONAL (y sin vínculo previo).
//  4. AppointmentRequest.citaGenerada <-> Appointment.solicitudOrigen en
//     ambos sentidos, solo cuando la referencia está vacía.
//
// Qué solo informa (requiere decisión humana):
//  - Responsables sin email/dirección (RF-04).
//  - Mensajes de contacto sin teléfono/asunto (RF-01).
//  - Asignaciones de material sin usuario que asignó.
//  - Profesionales sin usuario vinculable.
//
// Garantías: no borra nada, no reasigna referencias existentes y puede
// ejecutarse varias veces sin cambios adicionales.
import 'dotenv/config';
import mongoose from 'mongoose';
import Payment from '../src/models/Payment.js';
import Receipt from '../src/models/Receipt.js';
import Patient from '../src/models/Patient.js';
import Professional from '../src/models/Professional.js';
import User from '../src/models/User.js';
import Appointment from '../src/models/Appointment.js';
import AppointmentRequest from '../src/models/AppointmentRequest.js';
import Responsible from '../src/models/Responsible.js';
import ContactMessage from '../src/models/ContactMessage.js';
import PatientMaterial from '../src/models/PatientMaterial.js';

const DRY_RUN = process.argv.includes('--dry-run');
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sigca';

const resumen = {
  numerosComprobante: 0,
  fechasInicio: 0,
  profesionalesVinculados: 0,
  profesionalesSinUsuario: 0,
  solicitudesConCita: 0,
  citasConSolicitud: 0
};

async function migrarNumerosComprobante() {
  const recibos = await Receipt.find({ pago: { $ne: null } }).select('numero pago').lean();
  let cambios = 0;
  for (const recibo of recibos) {
    const pendiente = await Payment.exists({
      _id: recibo.pago,
      numeroComprobante: { $ne: recibo.numero }
    });
    if (!pendiente) continue;
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] pago ${recibo.pago} -> ${recibo.numero}`);
    if (!DRY_RUN) {
      await Payment.updateOne(
        { _id: recibo.pago, numeroComprobante: { $ne: recibo.numero } },
        { $set: { numeroComprobante: recibo.numero } }
      );
    }
    cambios += 1;
  }
  resumen.numerosComprobante = cambios;
}

async function migrarFechasInicio() {
  const pacientes = await Patient.find({
    $or: [{ fechaInicioProceso: null }, { fechaInicioProceso: { $exists: false } }]
  }).select('_id createdAt').lean();
  for (const paciente of pacientes) {
    if (!paciente.createdAt) continue;
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] paciente ${paciente._id} -> fechaInicioProceso=${new Date(paciente.createdAt).toISOString()}`);
    if (!DRY_RUN) {
      await Patient.updateOne(
        { _id: paciente._id, fechaInicioProceso: null },
        { $set: { fechaInicioProceso: paciente.createdAt } }
      );
    }
    resumen.fechasInicio += 1;
  }
}

async function migrarProfesionales() {
  const profesionales = await Professional.find({
    $or: [{ usuario: null }, { usuario: { $exists: false } }]
  }).select('_id nombre apellido email').lean();

  for (const profesional of profesionales) {
    if (!profesional.email) {
      resumen.profesionalesSinUsuario += 1;
      console.log(`  [SIN USUARIO] profesional ${profesional._id} (${profesional.nombre} ${profesional.apellido}): sin email`);
      continue;
    }
    const usuario = await User.findOne({
      email: profesional.email.toLowerCase(),
      rol: 'PROFESIONAL',
      activo: true
    }).select('_id email').lean();
    if (!usuario) {
      resumen.profesionalesSinUsuario += 1;
      console.log(`  [SIN USUARIO] profesional ${profesional._id} (${profesional.nombre} ${profesional.apellido}): no hay usuario PROFESIONAL activo con email ${profesional.email}`);
      continue;
    }
    const yaVinculado = await Professional.findOne({ usuario: usuario._id, _id: { $ne: profesional._id } }).select('_id').lean();
    if (yaVinculado) {
      resumen.profesionalesSinUsuario += 1;
      console.log(`  [CONFLICTO] usuario ${usuario.email} ya está vinculado al profesional ${yaVinculado._id}`);
      continue;
    }
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] profesional ${profesional._id} -> usuario ${usuario.email}`);
    if (!DRY_RUN) {
      try {
        await Professional.updateOne(
          { _id: profesional._id, usuario: null },
          { $set: { usuario: usuario._id } }
        );
      } catch (e) {
        if (e.code === 11000) {
          console.log(`  [CONFLICTO] el usuario ${usuario.email} fue vinculado por otra ejecución`);
          resumen.profesionalesSinUsuario += 1;
          continue;
        }
        throw e;
      }
    }
    resumen.profesionalesVinculados += 1;
  }
}

async function migrarSolicitudesYCitas() {
  // Solicitud ATENDIDA sin citaGenerada: buscar la cita que la referencia.
  const solicitudes = await AppointmentRequest.find({
    estado: 'ATENDIDA',
    $or: [{ citaGenerada: null }, { citaGenerada: { $exists: false } }]
  }).select('_id').lean();
  for (const solicitud of solicitudes) {
    const cita = await Appointment.findOne({ solicitudOrigen: solicitud._id }).select('_id').lean();
    if (!cita) continue;
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] solicitud ${solicitud._id} -> cita ${cita._id}`);
    if (!DRY_RUN) {
      await AppointmentRequest.updateOne(
        { _id: solicitud._id, citaGenerada: null },
        { $set: { citaGenerada: cita._id } }
      );
    }
    resumen.solicitudesConCita += 1;
  }

  // Cita sin solicitudOrigen: buscar la solicitud que la apunta.
  const citas = await Appointment.find({
    $or: [{ solicitudOrigen: null }, { solicitudOrigen: { $exists: false } }]
  }).select('_id').lean();
  for (const cita of citas) {
    const solicitud = await AppointmentRequest.findOne({ citaGenerada: cita._id }).select('_id').lean();
    if (!solicitud) continue;
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] cita ${cita._id} -> solicitud ${solicitud._id}`);
    if (!DRY_RUN) {
      await Appointment.updateOne(
        { _id: cita._id, solicitudOrigen: null },
        { $set: { solicitudOrigen: solicitud._id } }
      );
    }
    resumen.citasConSolicitud += 1;
  }
}

async function informarDatosIncompletos() {
  const responsables = await Responsible.countDocuments({
    $or: [{ email: { $in: [null, ''] } }, { direccion: { $in: [null, ''] } }]
  });
  const mensajes = await ContactMessage.countDocuments({
    $or: [
      { telefono: { $in: [null, ''] } },
      { asunto: { $in: [null, ''] } }
    ]
  });
  const asignaciones = await PatientMaterial.countDocuments({ asignadoPor: null });

  console.log('------------------------------------------------------------');
  console.log('Datos que requieren revisión manual (no se modifican):');
  console.log(`  Responsables sin email o dirección: ${responsables}`);
  console.log(`  Mensajes de contacto sin teléfono o asunto: ${mensajes}`);
  console.log(`  Asignaciones de material sin asignadoPor: ${asignaciones}`);
}

async function main() {
  console.log('============================================================');
  console.log('SIGCA - Completar campos y relaciones (B3)');
  console.log('URI:', URI);
  console.log('Modo:', DRY_RUN ? 'SIMULACIÓN (no escribe)' : 'APLICAR');
  console.log('============================================================');

  await mongoose.connect(URI);
  console.log('Base de datos:', mongoose.connection.name);

  console.log('\n1) Números de comprobante en pagos');
  await migrarNumerosComprobante();

  console.log('\n2) Fecha de inicio de proceso en pacientes');
  await migrarFechasInicio();

  console.log('\n3) Vínculo profesional <-> usuario');
  await migrarProfesionales();

  console.log('\n4) Referencias solicitud <-> cita');
  await migrarSolicitudesYCitas();

  await informarDatosIncompletos();

  console.log('------------------------------------------------------------');
  console.log(DRY_RUN ? 'Simulación terminada.' : 'Migración terminada.');
  console.log(`  Números de comprobante sincronizados: ${resumen.numerosComprobante}`);
  console.log(`  Pacientes con fechaInicioProceso: ${resumen.fechasInicio}`);
  console.log(`  Profesionales vinculados: ${resumen.profesionalesVinculados}`);
  console.log(`  Profesionales sin usuario vinculable: ${resumen.profesionalesSinUsuario}`);
  console.log(`  Solicitudes con citaGenerada: ${resumen.solicitudesConCita}`);
  console.log(`  Citas con solicitudOrigen: ${resumen.citasConSolicitud}`);
  console.log('No se eliminó ningún documento.');
}

main()
  .catch((error) => {
    console.error('Error en la migración:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
