import InstitutionalContent from '../models/InstitutionalContent.js';

// Bloques iniciales. Solo crea los que falten; nunca borra ni sobrescribe ediciones.
const INICIALES = [
  { clave: 'mision', titulo: 'Misión', cuerpo: 'Contenido pendiente de edición.' },
  { clave: 'vision', titulo: 'Visión', cuerpo: 'Contenido pendiente de edición.' },
  { clave: 'nosotros', titulo: 'Quiénes somos', cuerpo: 'Contenido pendiente de edición.' },
  { clave: 'contacto-nombre', titulo: 'Nombre del centro', cuerpo: 'Centro SIGCA' },
  { clave: 'contacto-email', titulo: 'Correo de contacto', cuerpo: 'contacto@sigca.local' },
  { clave: 'contacto-telefono', titulo: 'Teléfono', cuerpo: '0000-0000' },
  { clave: 'contacto-direccion', titulo: 'Dirección', cuerpo: 'Contenido pendiente de edición.' }
];

export async function seedContenidos() {
  for (const item of INICIALES) {
    const existe = await InstitutionalContent.findOne({ clave: item.clave });
    if (!existe) await new InstitutionalContent(item).save();
  }
  console.log('Contenidos base verificados');
}
