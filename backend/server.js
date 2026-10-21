import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { seedAdmin } from './src/utils/seedAdmin.js';
import { seedContenidos } from './src/utils/seedContent.js';
import { seedHorarios } from './src/utils/seedSchedules.js';
import { seedServicios } from './src/utils/seedServices.js';

try {
  await connectDB(env.mongoUri);
  console.log('Conectado a MongoDB');
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