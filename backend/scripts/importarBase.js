// Restaura la base de datos de demostración desde db/sigca/*.json.
//
// Uso (desde backend/):
//   npm run db:importar            (solo si la base destino está vacía)
//   npm run db:restaurar           (borra los documentos de esas colecciones y reimporta)
//   npm run db:importar -- --entrada db/copia
//
// No requiere mongodump/mongorestore: usa el driver de MongoDB que ya trae el
// proyecto y reconstruye ObjectId/Date desde Extended JSON.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');

function argumento(nombre) {
  const i = process.argv.indexOf(nombre);
  return i === -1 ? null : process.argv[i + 1];
}

const ORIGEN = path.resolve(RAIZ, argumento('--entrada') || 'db/sigca');
const FORZAR = process.argv.includes('--force') || process.argv.includes('--restaurar');

function revivir(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) return valor.map(revivir);
  if (typeof valor.$oid === 'string') return new mongoose.Types.ObjectId(valor.$oid);
  if (typeof valor.$date === 'string') return new Date(valor.$date);
  if (typeof valor.$numberDecimal === 'string') return mongoose.Types.Decimal128.fromString(valor.$numberDecimal);
  if (valor.$binary?.base64) {
    return new mongoose.mongo.Binary(
      Buffer.from(valor.$binary.base64, 'base64'),
      parseInt(valor.$binary.subType || '0', 16)
    );
  }
  const objeto = {};
  for (const [clave, contenido] of Object.entries(valor)) objeto[clave] = revivir(contenido);
  return objeto;
}

function leerColecciones() {
  if (!fs.existsSync(ORIGEN)) {
    throw new Error(`No existe la carpeta ${ORIGEN}. Ejecuta primero "npm run db:exportar".`);
  }
  const archivos = fs
    .readdirSync(ORIGEN)
    .filter((f) => f.endsWith('.json') && f !== '_meta.json')
    .sort();
  if (!archivos.length) throw new Error(`La carpeta ${ORIGEN} no tiene colecciones para importar.`);
  return archivos.map((archivo) => ({
    nombre: path.basename(archivo, '.json'),
    documentos: revivir(JSON.parse(fs.readFileSync(path.join(ORIGEN, archivo), 'utf8')))
  }));
}

async function main() {
  console.log('============================================================');
  console.log('SIGCA - Restaurar base de datos');
  console.log('URI:', env.mongoUri);
  console.log('Origen:', ORIGEN);
  console.log('Modo:', FORZAR ? 'REEMPLAZAR (borra esas colecciones)' : 'IMPORTAR (solo si están vacías)');
  console.log('============================================================');

  const colecciones = leerColecciones();
  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db;
  console.log('Base de datos destino:', db.databaseName);

  const conDatos = [];
  for (const { nombre } of colecciones) {
    const total = await db.collection(nombre).countDocuments();
    if (total > 0) conDatos.push(`${nombre} (${total})`);
  }

  if (conDatos.length && !FORZAR) {
    console.log('\nLa base destino ya tiene datos en estas colecciones:');
    for (const c of conDatos) console.log(`  - ${c}`);
    console.log('\nNo se escribió nada. Usa "npm run db:restaurar" para reemplazarlas,');
    console.log('o apunta a otra base con MONGO_URI=mongodb://localhost:27017/otra_base.');
    process.exitCode = 1;
    return;
  }

  let total = 0;
  for (const { nombre, documentos } of colecciones) {
    const coleccion = db.collection(nombre);
    if (FORZAR) await coleccion.deleteMany({});
    if (documentos.length) await coleccion.insertMany(documentos, { ordered: true });
    total += documentos.length;
    console.log(`  [ok] ${nombre}: ${documentos.length}`);
  }

  if (fs.existsSync(path.join(ORIGEN, '_meta.json'))) {
    const meta = JSON.parse(fs.readFileSync(path.join(ORIGEN, '_meta.json'), 'utf8'));
    const esperado = meta.documentos;
    if (typeof esperado === 'number' && esperado !== total) {
      console.log(`\nAviso: el export declara ${esperado} documentos y se importaron ${total}.`);
    }
  }

  console.log('------------------------------------------------------------');
  console.log(`Importadas ${colecciones.length} colecciones, ${total} documentos.`);
  console.log('Al arrancar el backend se crean los índices y se completan los catálogos base.');
  console.log('Credenciales de demostración: admin@sigca.local / Admin123');
}

main()
  .catch((error) => {
    console.error('Error al importar:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
