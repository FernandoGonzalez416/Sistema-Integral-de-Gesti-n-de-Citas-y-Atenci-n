import InstitutionalContent from '../models/InstitutionalContent.js';
import Publication from '../models/Publication.js';

// Bloques iniciales. Solo crea los que falten; nunca borra ni sobrescribe ediciones.
const INICIALES = [
  { clave: 'mision', titulo: 'Misión', cuerpo: 'Brindar atención integral en salud a cada persona y a su familia, con profesionales calificados, trato humano y servicios accesibles. Respaldamos nuestro trabajo con una gestión de citas ordenada y confiable que respeta el tiempo de quienes nos visitan, y promovemos la educación en salud como base del bienestar.' },
  { clave: 'vision', titulo: 'Visión', cuerpo: 'Ser el centro de referencia en atención integral y educación en salud de nuestra comunidad, reconocido por la calidad humana y profesional de nuestro equipo, la innovación en nuestros servicios y el compromiso permanente con el bienestar de las familias.' },
  { clave: 'nosotros', titulo: 'Quiénes somos', cuerpo: 'Contenido pendiente de edición.' },
  { clave: 'contacto-nombre', titulo: 'Nombre del centro', cuerpo: 'Centro de Salud SIGSA' },
  { clave: 'contacto-email', titulo: 'Correo de contacto', cuerpo: 'contacto@sigsa.com.gt' },
  { clave: 'contacto-telefono', titulo: 'Teléfono', cuerpo: '+502 7839-4521' },
  { clave: 'contacto-direccion', titulo: 'Dirección', cuerpo: '4a. Avenida 5-20, Zona 1, Chimaltenango, Guatemala' }
];

export async function seedContenidos() {
  for (const item of INICIALES) {
    const existe = await InstitutionalContent.findOne({ clave: item.clave });
    if (!existe) await new InstitutionalContent(item).save();
  }
  console.log('Contenidos base verificados');
  await seedPublicaciones();
}

// Publicaciones de ejemplo. Solo se crean si la colección está vacía, así que nunca
// vuelven a aparecer después de que el administrador gestione las suyas
// (desde el panel se pueden editar o desactivar).
const EDUCATIVAS = [
  ['Lavado de manos: el hábito que protege', 'Lavarse las manos con agua y jabón durante 20 segundos reduce el contagio de infecciones respiratorias y digestivas. Hazlo antes de comer y después de usar el baño.'],
  ['Alimentación balanceada para toda la familia', 'Incluye frutas, verduras, granos integrales y proteínas en cada día. Reducir azúcares y ultraprocesados ayuda a prevenir diabetes e hipertensión.'],
  ['Vacunas: esquema al día, familia protegida', 'Las vacunas previenen enfermedades graves en niños y adultos. Consulta con tu profesional de salud si tu esquema está completo.'],
  ['Higiene del sueño', 'Dormir entre 7 y 9 horas, mantener horarios regulares y evitar pantallas antes de acostarte mejora la memoria, el ánimo y las defensas.'],
  ['Actividad física diaria', 'Treinta minutos de movimiento al día fortalecen el corazón, los huesos y la salud mental. Caminar, bailar o subir escaleras también cuenta.'],
  ['Salud bucal desde la infancia', 'Cepillar los dientes dos veces al día y visitar al odontólogo cada seis meses previene caries y problemas de encías.'],
  ['Hidratación: cuánta agua necesitas', 'El agua regula la temperatura, ayuda a la digestión y al funcionamiento de los riñones. Aumenta su consumo en climas cálidos y al hacer ejercicio.'],
  ['Cómo manejar el estrés', 'Respiración profunda, pausas activas y hablar con alguien de confianza ayudan a reducir la tensión. Si persiste, busca apoyo profesional.'],
  ['Prevención de caídas en adultos mayores', 'Buena iluminación, pisos secos, calzado firme y ejercicios de equilibrio reducen el riesgo de caídas en el hogar.'],
  ['Control de la presión arterial', 'La hipertensión suele no dar síntomas. Medirla con regularidad, reducir la sal y mantenerse activo ayuda a controlarla.'],
  ['Primeros auxilios básicos', 'Saber detener una hemorragia, atender una quemadura leve o reconocer una señal de alarma puede marcar la diferencia mientras llega la ayuda.'],
  ['Salud mental en familia', 'Conversar, escuchar sin juzgar y compartir tiempo de calidad fortalece el bienestar emocional de niños, jóvenes y adultos.']
];

const CORPORATIVAS = [
  ['Bienvenidos a nuestro centro', 'Somos un equipo comprometido con brindar atención integral, cercana y de calidad a cada paciente y su familia.'],
  ['Nuestro equipo profesional', 'Contamos con profesionales calificados y en formación continua para acompañarte en cada etapa de tu bienestar.'],
  ['Gestión de citas ordenada', 'Solicita tu cita desde el portal y respetamos tu tiempo con horarios claros y confirmación oportuna.'],
  ['Compromiso con la calidad', 'Mejoramos de forma constante nuestros procesos y servicios para ofrecerte una experiencia segura y confiable.'],
  ['Jornadas de salud comunitaria', 'Participamos en jornadas de prevención y orientación para acercar la salud a las comunidades.'],
  ['Privacidad de tu información', 'Tus datos personales y clínicos se manejan con confidencialidad y solo para brindarte una mejor atención.'],
  ['Responsabilidad social', 'Impulsamos iniciativas solidarias y educativas que benefician a las familias de nuestra comunidad.'],
  ['Contáctanos', 'Escríbenos desde la sección de Contacto o solicita una cita desde Servicios; con gusto te atenderemos.']
];

export async function seedPublicaciones() {
  if ((await Publication.countDocuments()) > 0) return;
  const ahora = Date.now();
  const crear = (lista, tipo) =>
    lista.map(([titulo, descripcion], i) => ({
      titulo,
      descripcion,
      tipo,
      fecha: new Date(ahora - i * 86400000)
    }));
  await Publication.insertMany([...crear(EDUCATIVAS, 'EDUCATIVO'), ...crear(CORPORATIVAS, 'CORPORATIVO')]);
  console.log('Publicaciones de ejemplo creadas');
}