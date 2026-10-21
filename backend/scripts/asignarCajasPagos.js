// Migración idempotente: asocia los pagos históricos a su caja (B2).
//
// Uso:
//   node scripts/asignarCajasPagos.js --dry-run   (solo informa)
//   node scripts/asignarCajasPagos.js             (aplica cambios)
//
// Contexto: hasta B1 los pagos no guardaban la caja; el módulo de caja infería
// los ingresos por una ventana de fechas. Desde B2 cada pago referencia su caja
// (Payment.caja) y solo se permite anular pagos de cajas ABIERTAS.
//
// Garantías:
//  - No elimina documentos ni colecciones.
//  - Solo escribe en pagos con `caja` vacía (nunca reasigna una caja existente).
//  - Elige la caja cuya ventana [fechaApertura, fechaCierre] contiene la fecha
//    del pago, prefiriendo la del usuario que lo registró y la ventana más corta.
//  - Los pagos sin caja compatible se informan y quedan intactos.
//  - Se puede ejecutar varias veces: la segunda ejecución no cambia nada.
import 'dotenv/config';
import mongoose from 'mongoose';
import Payment from '../src/models/Payment.js';
import CashSession from '../src/models/CashSession.js';

const DRY_RUN = process.argv.includes('--dry-run');
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sigca';

function dentroDeVentana(caja, fecha) {
  const inicio = caja.fechaApertura ? new Date(caja.fechaApertura).getTime() : 0;
  const fin = caja.fechaCierre ? new Date(caja.fechaCierre).getTime() : Date.now();
  const t = new Date(fecha).getTime();
  return t >= inicio && t <= fin;
}

function duracion(caja) {
  const inicio = caja.fechaApertura ? new Date(caja.fechaApertura).getTime() : 0;
  const fin = caja.fechaCierre ? new Date(caja.fechaCierre).getTime() : Date.now();
  return fin - inicio;
}

async function main() {
  console.log('============================================================');
  console.log('SIGCA - Asociación de pagos históricos a su caja (B2)');
  console.log('URI:', URI);
  console.log('Modo:', DRY_RUN ? 'SIMULACIÓN (no escribe)' : 'APLICAR');
  console.log('============================================================');

  await mongoose.connect(URI);
  console.log('Base de datos:', mongoose.connection.name);

  const pagos = await Payment.find({ caja: null }).sort({ fecha: 1 }).lean();
  console.log(`Pagos sin caja: ${pagos.length}`);

  if (pagos.length === 0) {
    console.log('Nada por migrar.');
    return;
  }

  const cajas = await CashSession.find().sort({ fechaApertura: 1 }).lean();
  console.log(`Cajas disponibles: ${cajas.length}`);

  let asignados = 0;
  let sinCaja = 0;

  for (const pago of pagos) {
    const candidatas = cajas.filter((c) => dentroDeVentana(c, pago.fecha));
    if (candidatas.length === 0) {
      sinCaja += 1;
      console.log(`  [SIN CAJA] pago ${pago._id} (${new Date(pago.fecha).toISOString()})`);
      continue;
    }

    // Prioridad: caja del usuario que registró el pago, luego ventana más corta.
    candidatas.sort((a, b) => {
      const aPropia = String(a.abiertaPor || '') === String(pago.registradoPor || '') ? 0 : 1;
      const bPropia = String(b.abiertaPor || '') === String(pago.registradoPor || '') ? 0 : 1;
      if (aPropia !== bPropia) return aPropia - bPropia;
      return duracion(a) - duracion(b);
    });

    const caja = candidatas[0];
    console.log(`  [${DRY_RUN ? 'PLAN' : 'OK'}] pago ${pago._id} -> caja ${caja._id}`);
    if (!DRY_RUN) {
      await Payment.updateOne(
        { _id: pago._id, caja: null },
        { $set: { caja: caja._id } }
      );
    }
    asignados += 1;
  }

  console.log('------------------------------------------------------------');
  console.log(
    DRY_RUN
      ? `Simulación: ${asignados} pagos por asociar, ${sinCaja} sin caja compatible.`
      : `Migración terminada: ${asignados} pagos asociados, ${sinCaja} sin caja compatible.`
  );
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
