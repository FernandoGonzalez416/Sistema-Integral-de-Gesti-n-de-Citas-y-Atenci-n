import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import Appointment from './src/models/Appointment.js';
import { seedAdmin } from './src/utils/seedAdmin.js';
import { seedContenidos } from './src/utils/seedContent.js';
import { seedHorarios } from './src/utils/seedSchedules.js';
import { seedServicios } from './src/utils/seedServices.js';

try {
  await connectDB(env.mongoUri);
  console.log('Conectado a MongoDB');
  try {
    await Appointment.createIndexes();
  } catch (error) {
    if (error.code === 11000 || /duplicate key/i.test(error.message || '')) {
      console.error(
        'No se pudo crear el índice único de Appointment.solicitudOrigen: hay solicitudes con más de una cita.'
      );
      console.error(
        'Ejecute "npm run verificar:solicitudes -- --dry-run" para ver los duplicados y corregirlos antes de arrancar.'
      );
      process.exit(1);
    }
    throw error;
  }
  await seedAdmin();
  await seedContenidos();
  await seedHorarios();
  await seedServicios();
} catch (error) {
  console.error('Error al conectar a MongoDB:', error.message);
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`SIGCA backend en http://localhost:${env.port}`);
});