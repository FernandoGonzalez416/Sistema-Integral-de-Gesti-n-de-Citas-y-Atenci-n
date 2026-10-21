// Migración idempotente de estados/métodos antiguos al contrato del RF (B1).
//
// Uso:
//   node scripts/migrarEstados.js --dry-run   (solo informa)
//   node scripts/migrarEstados.js             (aplica cambios)
//
// Garantías:
//  - No elimina documentos ni colecciones.
//  - Solo actualiza registros que aún tengan un valor antiguo.
//  - Se puede ejecutar varias veces: la segunda ejecución no cambia nada.
//
// Mapeos:
//  - Cita PROGRAMADA   -> PENDIENTE
//  - Cita REPROGRAMADA -> CONFIRMADA   (reprogramar ya no cambia el estado)
//  - Cita NO_ASISTIO   -> CANCELADA
//  - Pago ACTIVO       -> REGISTRADO
//  - Pago OTRO         -> TRANSFERENCIA (método eliminado por RF-10)
//  - Solicitud CANCELADA -> RECHAZADA
//  - Caja: el total OTRO se suma a TRANSFERENCIA para no perder el arqueo.
import 'dotenv/config';
import mongoose from 'mongoose';
import Appointment from '../src/models/Appointment.js';
import AppointmentRequest from '../src/models/AppointmentRequest.js';
import Payment from '../src/models/Payment.js';
import Receipt from '../src/models/Receipt.js';
import CashSession from '../src/models/CashSession.js';

const DRY_RUN = process.argv.includes('--dry-run');
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sigca';

const operaciones = [
  {
    nombre: 'Citas PROGRAMADA -> PENDIENTE',
    modelo: Appointment,
    filtro: { estado: 'PROGRAMADA' },
    update: { $set: { estado: 'PENDIENTE' } }
  },
  {
    nombre: 'Citas REPROGRAMADA -> CONFIRMADA',
    modelo: Appointment,
    filtro: { estado: 'REPROGRAMADA' },
    update: { $set: { estado: 'CONFIRMADA' } }
  },
  {
    nombre: 'Citas NO_ASISTIO -> CANCELADA',
    modelo: Appointment,
    filtro: { estado: 'NO_ASISTIO' },
    update: { $set: { estado: 'CANCELADA' } }
  },
  {
    nombre: 'Pagos ACTIVO -> REGISTRADO',
    modelo: Payment,
    filtro: { estado: 'ACTIVO' },
    update: { $set: { estado: 'REGISTRADO' } }
  },
  {
    nombre: 'Pagos OTRO -> TRANSFERENCIA',
    modelo: Payment,
    filtro: { metodo: 'OTRO' },
    update: { $set: { metodo: 'TRANSFERENCIA' } }
  },
  {
    nombre: 'Comprobantes OTRO -> TRANSFERENCIA',
    modelo: Receipt,
    filtro: { metodo: 'OTRO' },
    update: { $set: { metodo: 'TRANSFERENCIA' } }
  },
  {
    nombre: 'Solicitudes CANCELADA -> RECHAZADA',
    modelo: AppointmentRequest,
    filtro: { estado: 'CANCELADA' },
    update: { $set: { estado: 'RECHAZADA' } }
  }
];

async function migrarTotalesCaja() {
  const filtro = { 'totalesPorMetodo.OTRO': { $gt: 0 } };
  const total = await CashSession.countDocuments(filtro);
  if (total > 0 && !DRY_RUN) {
    const update = [
      {
        $set: {
          'totalesPorMetodo.TRANSFERENCIA': {
            $add: [
              { $ifNull: ['$totalesPorMetodo.TRANSFERENCIA', 0] },
              { $ifNull: ['$totalesPorMetodo.OTRO', 0] }
            ]
          },
          'totalesPorMetodo.OTRO': 0
        }
      }
    ];
    await CashSession.updateMany(filtro, update);
  }
  return total;
}

async function main() {
  console.log('============================================================');
  console.log('SIGCA - Migración de estados y métodos (B1)');
  console.log('URI:', URI);
  console.log('Modo:', DRY_RUN ? 'SIMULACIÓN (no escribe)' : 'APLICAR');
  console.log('============================================================');

  await mongoose.connect(URI);
  console.log('Base de datos:', mongoose.connection.name);

  let cambios = 0;
  for (const op of operaciones) {
    const total = await op.modelo.countDocuments(op.filtro);
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] ${op.nombre}: ${total}`);
    if (total > 0 && !DRY_RUN) await op.modelo.updateMany(op.filtro, op.update);
    cambios += total;
  }

  const totalesCaja = await migrarTotalesCaja();
  console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] Cajas con total OTRO: ${totalesCaja}`);
  cambios += totalesCaja;

  console.log('------------------------------------------------------------');
  console.log(DRY_RUN ? `Simulación: ${cambios} documentos por migrar.` : `Migración terminada: ${cambios} documentos actualizados.`);
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
