// Exporta la base de datos completa a JSON legible y versionable.
//
// Uso (desde backend/):
//   npm run db:exportar
//   npm run db:exportar -- --salida db/copia
//
// El resultado se guarda en db/sigca/ con un archivo por colección y un
// _meta.json con los conteos. Los tipos de MongoDB se escriben en Extended JSON
// ({ "$oid": ... }, { "$date": ... }) para que el importador los reconstruya
// sin depender de mongodump/mongorestore.
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

const DESTINO = path.resolve(RAIZ, argumento('--salida') || 'db/sigca');

// Extended JSON mínimo: ObjectId, Date, Decimal128 y Binary.
function serializar(valor) {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof mongoose.Types.ObjectId) return { $oid: valor.toHexString() };
  if (valor instanceof Date) return { $date: valor.toISOString() };
  if (valor?._bsontype === 'Decimal128') return { $numberDecimal: valor.toString() };
  if (valor?._bsontype === 'Binary') {
    return { $binary: { base64: valor.buffer.toString('base64'), subType: valor.sub_type.toString(16) } };
  }
  if (Array.isArray(valor)) return valor.map(serializar);
  if (typeof valor === 'object') {
    const objeto = {};
    for (const [clave, contenido] of Object.entries(valor)) objeto[clave] = serializar(contenido);
    return objeto;
  }
  return valor;
}

async function main() {
  console.log('============================================================');
  console.log('SIGCA - Exportar base de datos');
  console.log('URI:', env.mongoUri);
  console.log('Destino:', DESTINO);
  console.log('============================================================');

  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db;
  console.log('Base de datos:', db.databaseName);

  fs.mkdirSync(DESTINO, { recursive: true });

  const colecciones = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();

  const conteos = {};
  const vacias = [];
  let total = 0;

  for (const nombre of colecciones) {
    const documentos = await db.collection(nombre).find({}).toArray();
    conteos[nombre] = documentos.length;
    total += documentos.length;
    if (!documentos.length) {
      vacias.push(nombre);
      console.log(`  [vacía] ${nombre}: 0`);
      continue;
    }
    const archivo = path.join(DESTINO, `${nombre}.json`);
    fs.writeFileSync(archivo, `${JSON.stringify(documentos.map(serializar), null, 2)}\n`, 'utf8');
    console.log(`  [ok] ${nombre}: ${documentos.length}`);
  }

  const meta = {
    base: db.databaseName,
    exportadoEn: new Date().toISOString(),
    colecciones: colecciones.length,
    documentos: total,
    conteos,
    coleccionesVacias: vacias,
    nota: 'Generado por backend/scripts/exportarBase.js. Restaurar con npm run db:importar.'
  };
  fs.writeFileSync(path.join(DESTINO, '_meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

  console.log('------------------------------------------------------------');
  console.log(`Exportadas ${colecciones.length} colecciones, ${total} documentos.`);
  console.log(`Archivos en ${DESTINO}`);
}

main()
  .catch((error) => {
    console.error('Error al exportar:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
