import InstitutionalContent from '../models/InstitutionalContent.js';

// Configuración del sitio reutilizando los bloques de InstitutionalContent.
// No se duplica el contenido: `contacto-nombre` sigue siendo el nombre del
// centro y `nosotros` la información principal.
const CAMPOS = {
  nombre: {
    clave: 'contacto-nombre',
    titulo: 'Nombre del centro',
    defecto: 'Centro de Salud SIGSA',
    min: 2,
    max: 100
  },
  logoUrl: {
    clave: 'sitio-logo',
    titulo: 'Logotipo',
    defecto: '/logo-sigsa.svg',
    min: 1,
    max: 500
  },
  mision: {
    clave: 'mision',
    titulo: 'Misión',
    defecto:
      'Brindar atención integral en salud a cada persona y a su familia, con profesionales calificados, trato humano y servicios accesibles.',
    min: 10,
    max: 5000
  },
  vision: {
    clave: 'vision',
    titulo: 'Visión',
    defecto:
      'Ser el centro de referencia en atención integral y educación en salud de nuestra comunidad.',
    min: 10,
    max: 5000
  },
  informacionPrincipal: {
    clave: 'nosotros',
    titulo: 'Información principal',
    defecto:
      'Somos un centro comprometido con la salud de las familias. Ofrecemos atención cercana, servicios de calidad y educación para el bienestar de nuestra comunidad.',
    min: 10,
    max: 5000
  },
  email: {
    clave: 'contacto-email',
    titulo: 'Correo de contacto',
    defecto: 'contacto@sigsa.com.gt',
    min: 5,
    max: 254
  },
  telefono: {
    clave: 'contacto-telefono',
    titulo: 'Teléfono',
    defecto: '+502 7839-4521',
    min: 7,
    max: 30
  },
  direccion: {
    clave: 'contacto-direccion',
    titulo: 'Dirección',
    defecto: '4a. Avenida 5-20, Zona 1, Chimaltenango, Guatemala',
    min: 5,
    max: 300
  }
};

const CLAVES = Object.values(CAMPOS).map((campo) => campo.clave);

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function urlImagenValida(valor) {
  if (valor.startsWith('/')) return true;
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validarCampo(nombre, valor) {
  const campo = CAMPOS[nombre];
  if (typeof valor !== 'string') return `${campo.titulo} debe ser texto`;
  const texto = valor.trim();
  if (texto.length < campo.min) return `${campo.titulo} es demasiado corto`;
  if (texto.length > campo.max) return `${campo.titulo} admite máximo ${campo.max} caracteres`;
  if (nombre === 'logoUrl' && !urlImagenValida(texto)) {
    return 'El logotipo debe ser una URL http(s) o una ruta local que empiece con /';
  }
  if (nombre === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) {
    return 'Correo de contacto inválido';
  }
  if (nombre === 'telefono') {
    const digitos = texto.replace(/\D/g, '');
    if (!/^[\d\s+()-]+$/.test(texto) || digitos.length < 7 || digitos.length > 15) {
      return 'Teléfono de contacto inválido';
    }
  }
  return null;
}

function serializar(documentos) {
  const porClave = new Map(documentos.map((doc) => [doc.clave, String(doc.cuerpo || '').trim()]));
  const valor = (nombre) => porClave.get(CAMPOS[nombre].clave) || CAMPOS[nombre].defecto;
  return {
    nombre: valor('nombre'),
    logoUrl: valor('logoUrl'),
    mision: valor('mision'),
    vision: valor('vision'),
    informacionPrincipal: valor('informacionPrincipal'),
    contacto: {
      email: valor('email'),
      telefono: valor('telefono'),
      direccion: valor('direccion')
    }
  };
}

async function leerSitio() {
  const documentos = await InstitutionalContent.find({
    clave: { $in: CLAVES },
    activo: true
  }).lean();
  return serializar(documentos);
}

// GET /api/contenido/sitio — configuración pública del portal.
export async function obtenerSitio(req, res, next) {
  try {
    res.json({ ok: true, sitio: await leerSitio() });
  } catch (e) {
    next(e);
  }
}

// PUT /api/contenido/sitio — solo ADMINISTRADOR. Acepta cambios parciales.
export async function actualizarSitio(req, res, next) {
  try {
    const body = req.body || {};
    if (!esObjeto(body)) {
      return res.status(400).json({ ok: false, message: 'El cuerpo debe ser un objeto' });
    }

    const cambios = [];
    for (const [nombre, campo] of Object.entries(CAMPOS)) {
      if (body[nombre] === undefined) continue;
      const error = validarCampo(nombre, body[nombre]);
      if (error) return res.status(400).json({ ok: false, message: error });
      cambios.push({ ...campo, valor: body[nombre].trim() });
    }
    if (!cambios.length) {
      return res.status(400).json({ ok: false, message: 'No hay campos para actualizar' });
    }

    for (const cambio of cambios) {
      await InstitutionalContent.findOneAndUpdate(
        { clave: cambio.clave },
        { $set: { titulo: cambio.titulo, cuerpo: cambio.valor, activo: true } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ ok: true, sitio: await leerSitio() });
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ ok: false, message: 'Datos de configuración inválidos' });
    }
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, message: 'La configuración cambió; intenta de nuevo' });
    }
    next(e);
  }
}
