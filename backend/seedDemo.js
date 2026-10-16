import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { seedDemo } from './src/utils/seedDemo.js';

// Ejecutable del seed de demostración.
//   node seedDemo.js             -> aplica (crea solo lo que falta)
//   node seedDemo.js --dry-run   -> solo muestra el plan (no escribe)
//   DRY_RUN=1 node seedDemo.js   -> equivalente
const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

try {
  await connectDB(env.mongoUri);
  const resultado = await seedDemo({ dryRun });
  console.log(`\nSeed de demostración finalizado. Creados: ${resultado.creados.length}, omitidos: ${resultado.omitidos.length}.`);
} catch (error) {
  console.error('Error en el seed de demostración:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
