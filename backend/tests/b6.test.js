// Pruebas del bloque B6: configuración institucional, carrusel, publicaciones
// completas, horarios y bandeja de contacto.
//
// Aislamiento: base DEDICADA y DESECHABLE `sigca_test_b6` y puerto 3994.
// NO toca la base de desarrollo `sigca` ni otras bases `sigca_test_*`.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const URI = 'mongodb://localhost:27017/sigca_test_b6';
const PORT = 3994;
const BASE = `http://localhost:${PORT}`;
const PASS = 'Test1234';

process.env.MONGO_URI = URI;

const { default: app } = await import('../src/app.js');
const User = (await import('../src/models/User.js')).default;
const InstitutionalContent = (await import('../src/models/InstitutionalContent.js')).default;
const CarouselSlide = (await import('../src/models/CarouselSlide.js')).default;
const Publication = (await import('../src/models/Publication.js')).default;
const ContactMessage = (await import('../src/models/ContactMessage.js')).default;
const { seedContenidos, seedCarrusel } = await import('../src/utils/seedContent.js');

let server;
const tok = {};
let diapositivaId;
let publicacionId;
let contactoCreadoId;

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function login(email) {
  const r = await api('POST', '/api/auth/login', { body: { email, password: PASS } });
  assert.equal(r.status, 200);
  return r.json.token;
}

before(async () => {
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.createIndexes(), InstitutionalContent.createIndexes()]);

  // El servidor debe escuchar antes del primer login (que usa fetch).
  server = app.listen(PORT);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const admin = await new User({ nombre: 'Admin B6', email: 'admin.b6@test.local', password: PASS, rol: 'ADMINISTRADOR' }).save();
  await new User({ nombre: 'Recep B6', email: 'recep.b6@test.local', password: PASS, rol: 'RECEPCIONISTA' }).save();
  await new User({ nombre: 'Prof B6', email: 'prof.b6@test.local', password: PASS, rol: 'PROFESIONAL' }).save();
  tok.admin = await login(admin.email);
  tok.recep = await login('recep.b6@test.local');
  tok.prof = await login('prof.b6@test.local');

  await seedContenidos();
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('B6. Portal institucional y bandeja de contacto', () => {
  test('1. configuración pública y seed idempotente de cinco diapositivas', async () => {
    const sitio = await api('GET', '/api/contenido/sitio');
    assert.equal(sitio.status, 200);
    assert.equal(sitio.json.ok, true);
    assert.equal(sitio.json.sitio.nombre, 'Centro de Salud SIGSA');
    assert.equal(sitio.json.sitio.logoUrl, '/logo-sigsa.svg');
    assert.ok(sitio.json.sitio.mision.length > 20);
    assert.ok(sitio.json.sitio.informacionPrincipal.length > 20);
    assert.equal(sitio.json.sitio.contacto.email, 'contacto@sigsa.com.gt');

    const carrusel = await api('GET', '/api/contenido/carrusel');
    assert.equal(carrusel.status, 200);
    assert.equal(carrusel.json.diapositivas.length, 5);
    assert.deepEqual(carrusel.json.diapositivas.map((d) => d.orden), [1, 2, 3, 4, 5]);
    diapositivaId = carrusel.json.diapositivas[0]._id;

    await seedCarrusel();
    assert.equal(await CarouselSlide.countDocuments(), 5, 'el seed no debe duplicar diapositivas');
  });

  test('2. PUT /api/contenido/sitio: admin, roles y validaciones 400', async () => {
    const sinToken = await api('PUT', '/api/contenido/sitio', { body: { nombre: 'Otro' } });
    assert.equal(sinToken.status, 401);

    const recep = await api('PUT', '/api/contenido/sitio', { token: tok.recep, body: { nombre: 'Otro' } });
    assert.equal(recep.status, 403);

    const actualizado = await api('PUT', '/api/contenido/sitio', {
      token: tok.admin,
      body: {
        nombre: 'Centro de Salud B6',
        logoUrl: 'https://example.com/logo.png',
        mision: 'Misión editada desde la prueba de integración.',
        vision: 'Visión editada desde la prueba de integración.',
        informacionPrincipal: 'Información principal editable desde el panel.',
        email: 'nuevo@sigsa.test',
        telefono: '+502 5555-0101',
        direccion: 'Calle de prueba 123, Chimaltenango'
      }
    });
    assert.equal(actualizado.status, 200);
    assert.equal(actualizado.json.sitio.nombre, 'Centro de Salud B6');
    assert.equal(actualizado.json.sitio.contacto.email, 'nuevo@sigsa.test');

    const key = await InstitutionalContent.findOne({ clave: 'contacto-nombre' }).lean();
    assert.equal(key.cuerpo, 'Centro de Salud B6', 'debe reutilizar el bloque institucional');

    const publico = await api('GET', '/api/contenido/sitio');
    assert.equal(publico.json.sitio.logoUrl, 'https://example.com/logo.png');
    assert.equal(publico.json.sitio.informacionPrincipal, 'Información principal editable desde el panel.');

    const emailMalo = await api('PUT', '/api/contenido/sitio', { token: tok.admin, body: { email: 'no-es-correo' } });
    assert.equal(emailMalo.status, 400);
    assert.match(emailMalo.json.message, /Correo/i);

    const logoMalo = await api('PUT', '/api/contenido/sitio', { token: tok.admin, body: { logoUrl: 'javascript:alert(1)' } });
    assert.equal(logoMalo.status, 400);

    const vacio = await api('PUT', '/api/contenido/sitio', { token: tok.admin, body: {} });
    assert.equal(vacio.status, 400);

    const arreglo = await api('PUT', '/api/contenido/sitio', { token: tok.admin, body: [] });
    assert.equal(arreglo.status, 400);
  });

  test('3. CRUD de carrusel: público ordenado, admin total y errores claros', async () => {
    const publico = await api('GET', '/api/contenido/carrusel');
    assert.equal(publico.status, 200);
    assert.equal(publico.json.diapositivas.length, 5);
    assert.equal(publico.json.diapositivas[0].activo, true);

    const todos = await api('GET', '/api/contenido/carrusel/admin/todos', { token: tok.admin });
    assert.equal(todos.status, 200);
    assert.equal(todos.json.diapositivas.length, 5);

    const recep = await api('GET', '/api/contenido/carrusel/admin/todos', { token: tok.recep });
    assert.equal(recep.status, 403);

    const creada = await api('POST', '/api/contenido/carrusel', {
      token: tok.admin,
      body: { imagenUrl: 'https://example.com/slide.jpg', titulo: 'Diapositiva B6', orden: 0, activo: true }
    });
    assert.equal(creada.status, 201);
    assert.equal(creada.json.diapositiva.orden, 0);
    const nuevaId = creada.json.diapositiva._id;

    const ordenado = await api('GET', '/api/contenido/carrusel');
    assert.equal(ordenado.json.diapositivas[0]._id, nuevaId, 'orden 0 debe ir primero');

    const editada = await api('PUT', `/api/contenido/carrusel/${nuevaId}`, {
      token: tok.admin,
      body: { titulo: 'Diapositiva B6 editada', orden: 99, activo: false }
    });
    assert.equal(editada.status, 200);
    assert.equal(editada.json.diapositiva.activo, false);

    const publicoOtraVez = await api('GET', '/api/contenido/carrusel');
    assert.equal(publicoOtraVez.json.diapositivas.some((d) => d._id === nuevaId), false);

    const urlMala = await api('POST', '/api/contenido/carrusel', {
      token: tok.admin,
      body: { imagenUrl: 'no-es-url', titulo: 'Mala', orden: 1, activo: true }
    });
    assert.equal(urlMala.status, 400);

    const activoMalo = await api('PUT', `/api/contenido/carrusel/${nuevaId}`, {
      token: tok.admin,
      body: { activo: 'si' }
    });
    assert.equal(activoMalo.status, 400);

    const recepCrea = await api('POST', '/api/contenido/carrusel', {
      token: tok.recep,
      body: { imagenUrl: '/carrusel-1.svg', titulo: 'No permitida' }
    });
    assert.equal(recepCrea.status, 403);

    const idMalo = await api('PUT', '/api/contenido/carrusel/no-es-id', {
      token: tok.admin,
      body: { titulo: 'No existe' }
    });
    assert.equal(idMalo.status, 404);

    const eliminada = await api('DELETE', `/api/contenido/carrusel/${nuevaId}`, { token: tok.admin });
    assert.equal(eliminada.status, 200);
    const eliminadaOtraVez = await api('DELETE', `/api/contenido/carrusel/${nuevaId}`, { token: tok.admin });
    assert.equal(eliminadaOtraVez.status, 404);
  });

  test('4. publicaciones: PUT completo, fecha, URLs, activo y roles', async () => {
    const creada = await api('POST', '/api/publicaciones', {
      token: tok.admin,
      body: {
        titulo: 'Publicación B6',
        descripcion: 'Descripción completa de la publicación B6.',
        tipo: 'CORPORATIVO',
        fecha: '2026-10-20T12:00:00.000Z',
        imagenUrl: 'https://example.com/imagen.png',
        enlace: 'https://example.com/mas',
        activo: false
      }
    });
    assert.equal(creada.status, 201);
    publicacionId = creada.json.publicacion._id;
    assert.equal(creada.json.publicacion.activo, false);

    const publicoInactiva = await api('GET', '/api/publicaciones?tipo=CORPORATIVO');
    assert.equal(publicoInactiva.json.publicaciones.some((p) => p._id === publicacionId), false);

    const editada = await api('PUT', `/api/publicaciones/${publicacionId}`, {
      token: tok.admin,
      body: {
        titulo: 'Publicación B6 editada',
        descripcion: 'Descripción editada con todos los campos.',
        tipo: 'EDUCATIVO',
        fecha: '2026-10-21T08:30:00.000Z',
        imagenUrl: '/carrusel-2.svg',
        enlace: 'mailto:contacto@sigsa.test',
        activo: true
      }
    });
    assert.equal(editada.status, 200);
    assert.equal(editada.json.publicacion.titulo, 'Publicación B6 editada');
    assert.equal(editada.json.publicacion.tipo, 'EDUCATIVO');
    assert.equal(editada.json.publicacion.activo, true);
    assert.equal(editada.json.publicacion.imagenUrl, '/carrusel-2.svg');
    assert.equal(editada.json.publicacion.enlace, 'mailto:contacto@sigsa.test');

    const publicoActiva = await api('GET', '/api/publicaciones?tipo=EDUCATIVO');
    assert.equal(publicoActiva.json.publicaciones.some((p) => p._id === publicacionId), true);

    const fechaMala = await api('PUT', `/api/publicaciones/${publicacionId}`, {
      token: tok.admin,
      body: { fecha: 'no-es-fecha' }
    });
    assert.equal(fechaMala.status, 400);

    const urlMala = await api('PUT', `/api/publicaciones/${publicacionId}`, {
      token: tok.admin,
      body: { enlace: 'javascript:alert(1)' }
    });
    assert.equal(urlMala.status, 400);

    const activoMalo = await api('PUT', `/api/publicaciones/${publicacionId}`, {
      token: tok.admin,
      body: { activo: 'si' }
    });
    assert.equal(activoMalo.status, 400);

    const recep = await api('PUT', `/api/publicaciones/${publicacionId}`, {
      token: tok.recep,
      body: { titulo: 'No permitida' }
    });
    assert.equal(recep.status, 403);

    const sinToken = await api('POST', '/api/publicaciones', { body: {} });
    assert.equal(sinToken.status, 401);
  });

  test('5. contacto: validación pública, bandeja, filtros y contador', async () => {
    const incompleto = await api('POST', '/api/contacto', {
      body: { nombre: 'Solo nombre', email: 'x@y.test', mensaje: 'Mensaje de prueba B6' }
    });
    assert.equal(incompleto.status, 400);
    assert.match(incompleto.json.message, /teléfono/i);

    const telefonoMalo = await api('POST', '/api/contacto', {
      body: {
        nombre: 'Contacto B6', email: 'contacto.b6@test.local', telefono: 'abc',
        asunto: 'Consulta', mensaje: 'Mensaje de prueba B6 completo.'
      }
    });
    assert.equal(telefonoMalo.status, 400);

    const valido = await api('POST', '/api/contacto', {
      body: {
        nombre: 'Contacto B6', email: 'contacto.b6@test.local', telefono: '5555-0101',
        asunto: 'Consulta B6', mensaje: 'Mensaje de prueba B6 completo.'
      }
    });
    assert.equal(valido.status, 201);
    assert.equal(await ContactMessage.countDocuments(), 1);
    contactoCreadoId = (await ContactMessage.findOne())._id;

    const publico = await api('GET', '/api/contacto');
    assert.equal(publico.status, 401);

    const bandeja = await api('GET', '/api/contacto', { token: tok.admin });
    assert.equal(bandeja.status, 200);
    assert.equal(bandeja.json.mensajes.length, 1);
    assert.equal(bandeja.json.mensajes[0].asunto, 'Consulta B6');
    assert.equal(bandeja.json.noLeidos, 1);

    const noLeidos = await api('GET', '/api/contacto?leido=false', { token: tok.admin });
    assert.equal(noLeidos.json.mensajes.length, 1);
    const leidos = await api('GET', '/api/contacto?leido=true', { token: tok.admin });
    assert.equal(leidos.json.mensajes.length, 0);
    const filtroMalo = await api('GET', '/api/contacto?leido=quizas', { token: tok.admin });
    assert.equal(filtroMalo.status, 400);

    const contador = await api('GET', '/api/contacto/contador', { token: tok.admin });
    assert.equal(contador.status, 200);
    assert.equal(contador.json.noLeidos, 1);

    const recep = await api('GET', '/api/contacto', { token: tok.recep });
    assert.equal(recep.status, 403);

    const marcarMalo = await api('PATCH', `/api/contacto/${contactoCreadoId}`, {
      token: tok.admin,
      body: { leido: 'true' }
    });
    assert.equal(marcarMalo.status, 400);

    const marcado = await api('PATCH', `/api/contacto/${contactoCreadoId}`, {
      token: tok.admin,
      body: { leido: true }
    });
    assert.equal(marcado.status, 200);
    assert.equal(marcado.json.mensaje.leido, true);

    const contadorCero = await api('GET', '/api/contacto/contador', { token: tok.admin });
    assert.equal(contadorCero.json.noLeidos, 0);
  });

  test('6. entradas inválidas no producen errores 5xx', async () => {
    const casos = [
      ['PUT', '/api/contenido/sitio', { nombre: 12 }],
      ['PUT', '/api/contenido/sitio', { telefono: {} }],
      ['POST', '/api/contenido/carrusel', { imagenUrl: [], titulo: 3, orden: 'primero' }],
      ['PUT', `/api/contenido/carrusel/${diapositivaId}`, { titulo: null }],
      ['POST', '/api/publicaciones', { titulo: {}, descripcion: [], tipo: 'OTRO' }],
      ['PUT', `/api/publicaciones/${publicacionId}`, { descripcion: {} }],
      ['POST', '/api/contacto', { nombre: {}, email: [], telefono: 1, asunto: {}, mensaje: [] }],
      ['PATCH', `/api/contacto/${contactoCreadoId}`, { leido: 1 }]
    ];
    for (const [metodo, ruta, body] of casos) {
      const r = await api(metodo, ruta, { token: tok.admin, body });
      assert.ok(r.status >= 400 && r.status < 500, `${metodo} ${ruta} devolvió ${r.status}`);
      assert.equal(r.json?.ok, false, `${metodo} ${ruta} debe devolver ok:false`);
      assert.ok(r.json?.message, `${metodo} ${ruta} debe explicar el error`);
    }
  });
});
