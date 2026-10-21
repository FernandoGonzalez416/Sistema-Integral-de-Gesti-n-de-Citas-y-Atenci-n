import Service from '../models/Service.js';

// Catálogo inicial de servicios de salud. Solo se crea si no existe ningún servicio,
// así nunca pisa lo que el administrador ya haya registrado o editado.
// Precios en centavos (2500 = $25.00).
const CATALOGO = [
  // ---- Atención primaria ----
  {
    nombre: 'Consulta de medicina general',
    categoria: 'Atención primaria', icono: 'estetoscopio', precioCentavos: 2500, duracionMinutos: 30,
    descripcion: 'Evaluación médica completa para síntomas nuevos, malestares frecuentes o dudas sobre tu salud, con diagnóstico y plan de tratamiento.',
    incluye: ['Historia clínica y examen físico', 'Toma de signos vitales', 'Receta y recomendaciones', 'Referencia a especialista si se necesita'],
    preparacion: 'Trae tus estudios o recetas anteriores y la lista de medicamentos que tomas.'
  },
  {
    nombre: 'Control de enfermedades crónicas',
    categoria: 'Atención primaria', icono: 'corazon', precioCentavos: 3000, duracionMinutos: 40,
    descripcion: 'Seguimiento periódico de diabetes, hipertensión y otras condiciones crónicas para mantenerlas estables y prevenir complicaciones.',
    incluye: ['Control de presión y glucosa', 'Ajuste de tratamiento', 'Plan de alimentación y actividad', 'Calendario de próximos controles'],
    preparacion: 'Lleva tu registro de glucosa o presión y tus medicamentos actuales.'
  },
  {
    nombre: 'Chequeo médico integral',
    categoria: 'Atención primaria', icono: 'actividad', precioCentavos: 6000, duracionMinutos: 60,
    descripcion: 'Revisión preventiva completa para conocer tu estado de salud general y detectar a tiempo factores de riesgo.',
    incluye: ['Examen físico completo', 'Medidas y signos vitales', 'Revisión de antecedentes familiares', 'Orden de exámenes de laboratorio'],
    preparacion: 'Si te indicamos laboratorios, acude con ayuno de 8 horas.'
  },

  // ---- Mujer y niñez ----
  {
    nombre: 'Control prenatal',
    categoria: 'Mujer y niñez', icono: 'maternidad', precioCentavos: 3500, duracionMinutos: 40,
    descripcion: 'Acompañamiento médico durante el embarazo para cuidar tu salud y el desarrollo de tu bebé en cada etapa.',
    incluye: ['Control de peso y presión', 'Seguimiento del crecimiento del bebé', 'Indicaciones de nutrición y suplementos', 'Resolución de dudas'],
    preparacion: 'Trae tu carné prenatal y los resultados de estudios previos.'
  },
  {
    nombre: 'Consulta pediátrica',
    categoria: 'Mujer y niñez', icono: 'bebe', precioCentavos: 2800, duracionMinutos: 30,
    descripcion: 'Atención médica para bebés, niños y adolescentes, con trato amable y orientación para madres, padres y cuidadores.',
    incluye: ['Evaluación del crecimiento', 'Diagnóstico y tratamiento', 'Orientación a la familia', 'Revisión del esquema de vacunas'],
    preparacion: 'Trae el carné de vacunación y, si es posible, el peso y la talla más recientes.'
  },
  {
    nombre: 'Planificación familiar',
    categoria: 'Mujer y niñez', icono: 'escudo', precioCentavos: 2000, duracionMinutos: 30,
    descripcion: 'Orientación confidencial y personalizada sobre métodos anticonceptivos para que decidas con información clara.',
    incluye: ['Consejería confidencial', 'Evaluación de salud', 'Explicación de métodos disponibles', 'Seguimiento'],
    preparacion: 'No requiere preparación. Puedes venir sola o acompañada.'
  },

  // ---- Especialidades ----
  {
    nombre: 'Cardiología',
    categoria: 'Especialidades', icono: 'corazon', precioCentavos: 4000, duracionMinutos: 30,
    descripcion: 'Evaluación del corazón y la circulación: dolor de pecho, palpitaciones, presión alta o antecedentes familiares.',
    incluye: ['Consulta con especialista', 'Electrocardiograma', 'Interpretación de resultados', 'Plan de prevención cardiovascular'],
    preparacion: 'Usa ropa cómoda y evita cafeína el día de la cita.'
  },
  {
    nombre: 'Dermatología',
    categoria: 'Especialidades', icono: 'piel', precioCentavos: 3500, duracionMinutos: 30,
    descripcion: 'Diagnóstico y tratamiento de enfermedades de la piel, el cabello y las uñas, desde acné hasta revisión de lunares.',
    incluye: ['Examen de la piel', 'Diagnóstico y tratamiento', 'Recomendaciones de cuidado', 'Seguimiento de lesiones'],
    preparacion: 'Acude sin maquillaje ni cremas en la zona a revisar.'
  },
  {
    nombre: 'Oftalmología',
    categoria: 'Especialidades', icono: 'ojo', precioCentavos: 3000, duracionMinutos: 30,
    descripcion: 'Examen de la vista y salud ocular para detectar problemas de visión, cansancio visual y enfermedades de los ojos.',
    incluye: ['Medición de agudeza visual', 'Revisión del fondo de ojo', 'Receta de lentes si se necesita', 'Orientación de cuidado visual'],
    preparacion: 'Lleva tus lentes actuales. Evita manejar justo después si se dilatan las pupilas.'
  },
  {
    nombre: 'Psicología',
    categoria: 'Especialidades', icono: 'mente', precioCentavos: 3500, duracionMinutos: 50,
    descripcion: 'Sesión individual en un espacio seguro y confidencial para trabajar ansiedad, estrés, duelo y bienestar emocional.',
    incluye: ['Entrevista inicial', 'Plan terapéutico', 'Estrategias prácticas', 'Confidencialidad profesional'],
    preparacion: 'No requiere preparación. Piensa qué te gustaría trabajar.'
  },
  {
    nombre: 'Nutrición y alimentación',
    categoria: 'Especialidades', icono: 'manzana', precioCentavos: 3000, duracionMinutos: 45,
    descripcion: 'Plan de alimentación realista y adaptado a tu edad, estilo de vida y condiciones de salud.',
    incluye: ['Evaluación nutricional', 'Medidas corporales', 'Plan de alimentación personalizado', 'Seguimiento de avances'],
    preparacion: 'Anota lo que comes durante 2 o 3 días antes de la cita.'
  },
  {
    nombre: 'Odontología general',
    categoria: 'Especialidades', icono: 'diente', precioCentavos: 3000, duracionMinutos: 45,
    descripcion: 'Revisión y limpieza dental para mantener tu boca sana y detectar caries o problemas de encías a tiempo.',
    incluye: ['Revisión bucal completa', 'Limpieza dental', 'Aplicación de flúor', 'Plan de tratamiento si hace falta'],
    preparacion: 'Cepíllate los dientes antes de la cita.'
  },

  // ---- Diagnóstico ----
  {
    nombre: 'Laboratorio clínico',
    categoria: 'Diagnóstico', icono: 'laboratorio', precioCentavos: 1500, duracionMinutos: 20,
    descripcion: 'Toma de muestras y exámenes de sangre, orina y otros análisis para apoyar el diagnóstico médico.',
    incluye: ['Toma de muestra', 'Análisis en laboratorio', 'Resultados entregados al paciente', 'Orientación sobre el resultado'],
    preparacion: 'Muchos exámenes requieren ayuno de 8 horas. Confírmalo con tu orden médica.'
  },
  {
    nombre: 'Ultrasonido',
    categoria: 'Diagnóstico', icono: 'ecografia', precioCentavos: 3500, duracionMinutos: 30,
    descripcion: 'Estudio por imágenes, seguro y sin radiación, para ver abdomen, pelvis, tiroides y control del embarazo.',
    incluye: ['Estudio por ultrasonido', 'Informe con interpretación', 'Imágenes del estudio'],
    preparacion: 'Según el estudio puede pedirse vejiga llena o ayuno. Te lo indicaremos al agendar.'
  },
  {
    nombre: 'Rayos X',
    categoria: 'Diagnóstico', icono: 'rayosx', precioCentavos: 2500, duracionMinutos: 20,
    descripcion: 'Estudios radiográficos de tórax, huesos y articulaciones, con equipo y protección adecuados.',
    incluye: ['Toma de la radiografía', 'Informe médico', 'Entrega de imágenes'],
    preparacion: 'Retira objetos metálicos de la zona. Avisa si hay posibilidad de embarazo.'
  },

  // ---- Prevención ----
  {
    nombre: 'Vacunación infantil y adulta',
    categoria: 'Prevención', icono: 'vacuna', precioCentavos: 1200, duracionMinutos: 15,
    descripcion: 'Aplicación de vacunas según el esquema oficial y recomendaciones para proteger a toda la familia.',
    incluye: ['Revisión del esquema de vacunación', 'Aplicación de la vacuna', 'Registro en tu carné', 'Indicaciones posteriores'],
    preparacion: 'Trae tu carné de vacunación. Avisa si hay fiebre o alergias conocidas.'
  }
];

export async function seedServicios() {
  const total = await Service.countDocuments();
  if (total > 0) {
    console.log('Servicios ya existen, seed omitido');
    return;
  }
  await Service.insertMany(CATALOGO);
  console.log(`Catálogo de servicios creado (${CATALOGO.length})`);
}
