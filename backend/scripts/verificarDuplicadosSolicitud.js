// Detecta citas duplicadas por solicitudOrigen ANTES de crear el índice único
// parcial. Es un informe de SOLO LECTURA (acepta --dry-run por compatibilidad).
//
// Uso: npm run verificar:solicitudes
//      npm run verificar:solicitudes -- --dry-run
//
// Sale con código 1 si hay duplicados: en ese caso el índice único no se podrá
// crear y hay que corregir los datos antes de arrancar el backend.
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import Appointment from '../src/models/Appointment.js';

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log('Informe de solo lectura de citas duplicadas por solicitudOrigen.');
  console.log('Opciones: --dry-run (no modifica datos; es el comportamiento por defecto)');
  process.exit(0);
}

let conectado = false;
try {
  await mongoose.connect(env.mongoUri);
  conectado = true;
  console.log(`Base de datos: ${env.mongoUri}`);

  // En una base recién creada la colección aún no existe. Consultar el catálogo
  // evita lanzar un aggregate contra una colección inexistente.
  const nombreColeccion = Appointment.collection.collectionName;
  const colecciones = await mongoose.connection.db
    .listCollections({ name: nombreColeccion }, { nameOnly: true })
    .toArray();

  if (colecciones.length === 0) {
    console.log('Sin duplicados: la colección de citas aún no existe.');
  } else {
    const duplicados = await Appointment.aggregate([
      { $match: { solicitudOrigen: { $type: 'objectId' } } },
      {
        $group: {
          _id: '$solicitudOrigen',
          total: { $sum: 1 },
          citas: { $push: { id: '$_id', estado: '$estado', inicio: '$inicio' } }
        }
      },
      { $match: { total: { $gt: 1 } } },
      { $sort: { total: -1, _id: 1 } }
    ]);

    console.log(`Solicitudes con más de una cita: ${duplicados.length}`);
    for (const d of duplicados) {
      console.log(`- solicitud ${d._id}: ${d.total} citas`);
      for (const c of d.citas) {
        console.log(`  · cita ${c.id} (${c.estado}, ${c.inicio?.toISOString?.() || c.inicio})`);
      }
    }

    if (duplicados.length > 0) {
      console.error(
        'Hay duplicados: el índice único de Appointment.solicitudOrigen no se puede crear. ' +
        'Conserve una cita por solicitud y vuelva a ejecutar el informe.'
      );
      process.exitCode = 1;
    } else {
      console.log('Sin duplicados: el índice único parcial puede crearse sin riesgo.');
    }
  }
} catch (error) {
  console.error('No se pudo verificar solicitudes duplicadas:', error.message);
  process.exitCode = 1;
} finally {
  if (conectado) await mongoose.disconnect();
}
