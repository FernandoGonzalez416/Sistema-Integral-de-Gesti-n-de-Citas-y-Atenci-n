import { connectDB } from './src/config/db.js';
import Professional from './src/models/Professional.js';

await connectDB('mongodb://localhost:27017/sigca');

const profs = await Professional.find({}, 'especialidad');
profs.forEach(p => {
  console.log('especialidad:', p.especialidad, 'hex:', Buffer.from(p.especialidad).toString('hex'));
});

// Probar filtro exacto
const filtro = await Professional.find({ especialidad: 'Odontología' });
console.log('filtro exacto Odontología:', filtro.length);

const filtro2 = await Professional.find({ especialidad: 'Odontolog\u00eda' });
console.log('filtro unicode:', filtro2.length);

process.exit(0);