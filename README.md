# SIGCA — Sistema Integral de Gestión de Citas y Atención

Proyecto final integrador de Desarrollo Web: portal público + sistema administrativo,
comunicados por API REST con persistencia en MongoDB.

## Integrantes

> Completar los dos nombres restantes antes de la entrega.

| Integrante | Responsabilidad principal |
|---|---|
| **Fernando Javier Gonzalez Ovando** | Backend y base de datos: modelos Mongoose, API REST, MongoDB, autenticación JWT y roles. Coordinación general del proyecto. |
| _(nombre completo)_ | Frontend administrativo: vistas de gestión (citas, pacientes, pagos, caja, contenidos), router y guardias por rol. |
| _(nombre completo)_ | Portal público, pruebas y documentación: portal, colección Postman, suite automatizada, evidencias y README. |

## Stack

- Frontend: Vue 3 + Vite + Vue Router + Pinia (JavaScript, CSS convencional).
- Backend: Node.js + Express (ESM) + Mongoose + JWT + bcrypt.
- Base de datos: MongoDB. Pruebas de API: Postman.

## Requisitos

- Node.js 18+ y npm (`node -v`, `npm -v`).
- MongoDB corriendo en local (verificar con `mongosh --quiet --eval "db.runCommand({ping:1})"` → `{ ok: 1 }`).

## Base de datos (MongoDB)

El sistema **no usa datos simulados**: todo se persiste en MongoDB y la API es la
única fuente de datos del frontend.

1. Instala MongoDB Community 6 o superior. En Windows queda como servicio
   `MongoDB`; en macOS/Linux arráncalo con `mongod` o `brew services start mongodb-community`.
   También sirve Docker:

   ```
   docker run -d --name sigca-mongo -p 27017:27017 mongo:7
   ```

2. Comprueba la conexión:

   ```
   mongosh --quiet --eval "db.runCommand({ping:1})"
   # -> { ok: 1 }
   ```

3. Configura la URI en `backend/.env`. Si no existe el archivo, el backend usa
   por defecto `mongodb://localhost:27017/sigca`:

   ```
   MONGO_URI=mongodb://localhost:27017/sigca
   ```

4. Para una demo desde cero (opcional, **borra** la base de desarrollo):

   ```
   mongosh sigca --quiet --eval "db.dropDatabase()"
   cd backend && npm run seed:demo
   ```

   Mongoose crea las colecciones y los índices al arrancar; el seed solo inserta
   los documentos del conjunto B5 que falten.

## Instalación

```
cd backend && npm install
cd ../frontend && npm install
```

## Variables de entorno

- Backend: copiar `backend/.env.example` a `backend/.env` y completar valores.
  Sin `.env`, usa `PORT=3000`, `MONGO_URI=mongodb://localhost:27017/sigca`,
  `FRONTEND_URL=http://localhost:5173`.
- Frontend: copiar `frontend/.env.example` a `frontend/.env`.
  Sin `.env`, usa `VITE_API_URL=http://localhost:3000`.
- Nunca versionar archivos `.env` con secretos reales.

## Ejecución

```
# Terminal 1 — backend (http://localhost:3000, salud en /api/health)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm run dev
```

La página de inicio muestra el estado de conexión con el backend.

## Estructura del proyecto

```
ProyectoFinalDesarrolloWeb/
├── backend/
│   ├── server.js              # arranque: conexión, índices y seeds base
│   ├── src/
│   │   ├── config/            # env, conexión a MongoDB
│   │   ├── models/            # esquemas Mongoose
│   │   ├── controllers/       # lógica de negocio
│   │   ├── routes/            # rutas REST /api
│   │   ├── middlewares/       # autenticación, roles, errores
│   │   └── utils/             # seeds, comprobantes, saldos
│   ├── scripts/               # migraciones idempotentes
│   └── tests/                 # suite node:test
├── frontend/
│   └── src/
│       ├── views/             # portal público y módulos administrativos
│       ├── components/        # componentes reutilizables
│       ├── router/            # rutas y guardias por rol
│       ├── stores/            # Pinia (sesión)
│       └── api/               # cliente HTTP
├── docs/                      # plan, estado, decisiones, pruebas y evidencias
├── postman/                   # colección y entorno
└── README.md
```

## Datos de demostración (seed)

El seed de demostración es **idempotente** y **no destructivo**: nunca borra
colecciones ni sobrescribe registros existentes; si un registro ya existe (por su
clave estable) lo omite. Requiere el backend apuntando a la misma base
(`MONGO_URI`, por defecto `mongodb://localhost:27017/sigca`).

```
cd backend
npm run seed:demo:dry   # muestra la base y el plan, sin escribir
npm run seed:demo       # crea solo lo que falta
```

Carga el conjunto B5: **6 usuarios** (1 administrador, 2 recepcionistas y 3
profesionales, cada uno vinculado a un usuario `PROFESIONAL` distinto), **10
pacientes** (4 menores, todos con responsable activo), **5 responsables**, **5
servicios** (1 inactivo), **15 citas** (pendientes, confirmadas, completadas y
canceladas, sin solapamientos por profesional), **5 materiales** y **5
asignaciones**, **5 solicitudes** (2 pendientes, 2 atendidas y 1 rechazada), **10
pagos** con comprobante real y **3 cajas** (2 cerradas y 1 abierta).

La coherencia financiera se mantiene: cada pago está asociado a su caja y a
quien lo registró, los pagos `ANULADO` no suman, ningún pago supera el costo de
la cita y los totales de cada caja se recalculan desde sus pagos `REGISTRADO`.
La caja 1 cierra con una diferencia de **-500**; la caja 3 cierra sin diferencia.
El pago anulado `pago-04` es un dato histórico ficticio dentro de una caja
cerrada: no altera el arqueo y su comprobante nace `ANULADO`.

Si la base ya tenía datos de versiones anteriores, ejecuta las migraciones
idempotentes (siempre primero en simulación):

```
cd backend
npm run migrar:estados:dry && npm run migrar:estados   # estados y métodos antiguos
npm run migrar:cajas:dry && npm run migrar:cajas       # pagos históricos sin caja
npm run migrar:relaciones:dry && npm run migrar:relaciones  # campos y vínculos de B3
```

Antes de arrancar una base con datos históricos, comprueba que ninguna solicitud
tenga más de una cita asociada (el backend aborta si no puede crear el índice
único parcial de B4):

```
cd backend
npm run verificar:solicitudes -- --dry-run
```

Ninguna migración elimina documentos; `migrar:cajas` solo escribe en pagos con
`caja` vacía y avisa de los que no encajan en ninguna caja. `migrar:relaciones`
solo completa datos faltantes (número de comprobante, fecha de inicio del
proceso, vínculo profesional↔usuario y referencias solicitud↔cita) y lista los
registros que requieren revisión manual.

## Credenciales de demostración

Son **ficticias y solo para desarrollo local**. El administrador usa las
credenciales definidas en `backend/.env` (por defecto `admin@sigca.local` /
`Admin123`; cámbialas en un entorno real). El seed crea además:

- Recepcionista: `recepcion.demo@demo.sigca` / `Demo1234`
- Recepcionista: `recepcion2.demo@demo.sigca` / `Demo1234`
- Profesional: `profesional.demo@demo.sigca` / `Demo1234`
- Profesional: `pablo.herrera@demo.sigca` / `Demo1234`
- Profesional: `valentina.ortiz@demo.sigca` / `Demo1234`

No incluir credenciales reales en el repositorio.

## Documentación

- `docs/PLAN_DESARROLLO.md` — fases y criterios de aceptación.
- `docs/PLAN_CIERRE.md` — plan de cierre del proyecto y estado de cada paso.
- `docs/ESTADO_PROYECTO.md` — avance real y pendientes.
- `docs/DECISIONES_TECNICAS.md` — decisiones de arquitectura.
- `docs/PRUEBAS.md` — pruebas ejecutadas y resultados.
- `docs/EVIDENCIAS.md` — evidencias y capturas de cada entrega.
- `docs/evidencias/` — capturas de pantalla del sistema en funcionamiento.

## Colección Postman

En `postman/` hay una colección lista para importar en Postman:

- `postman/SIGCA.postman_collection.json` - **131 peticiones** que cubren toda la API (health, auth, usuarios, servicios, contenidos, horarios, publicaciones, contacto, solicitudes, pacientes, responsables, relaciones, profesionales, citas, materiales, materiales por paciente, pagos y comprobantes, caja con movimientos y bajas lógicas). Incluye las reglas B4: email/servicio obligatorios en solicitudes, rechazo con motivo, atención idempotente, filtros validados, reset de contraseña y restricciones del rol PROFESIONAL.
- `postman/SIGCA.postman_environment.json` - entorno «SIGCA — Entorno local» con `baseUrl`, credenciales demo, tokens y `_id`.

Importa ambos archivos, selecciona el entorno y ejecuta «Login administrador» primero (guarda el token). Los POST de creación guardan sus `_id` en el entorno. Antes de crear citas, ajusta `inicioCita`, `inicioCita2`, `inicioCita3` e `inicioCita4` a días laborables futuros; cada usuario abre su propia caja antes de registrar pagos y los pagos quedan asociados a esa caja (la colección abre la del administrador). Para los casos de rol se usa el profesional demo del seed, que debe estar vinculado a su usuario. Ver `docs/PRUEBAS.md` (sección Entregables).

## Roles y solicitudes (B4)

- El backend es la autoridad: el rol `PROFESIONAL` se resuelve por el vínculo `Professional.usuario`; sin vínculo activo responde **403**.
- El profesional solo lista y completa **sus** citas `CONFIRMADA`, ve datos básicos de sus pacientes y opera sobre sus materiales. No crea citas ni gestiona usuarios/profesionales.
- Las solicitudes exigen **email** y **servicio activo**. Atender es atómico sin replica set: índice único parcial en `Appointment.solicitudOrigen`, actualización condicional y compensación; un segundo intento responde **409**.
- El rechazo formal usa `PATCH /api/solicitudes-cita/:id/rechazar` con `motivoRechazo`; el endpoint legado de cambio de estado se conserva por compatibilidad.
- El ADMINISTRADOR puede restablecer contraseñas con `PATCH /api/usuarios/:id/restablecer-password`; la contraseña se hashea en el hook del modelo y nunca se devuelve.
- Los menús y rutas del frontend se ocultan por rol (`meta.roles`), pero eso es solo experiencia de usuario: la API vuelve a validar cada permiso.

## Pruebas

Suite automatizada de las reglas de negocio con el **runner integrado de Node** (`node:test`, sin dependencias extra):

```
cd backend
npm test        # node --test "tests/**/*.test.js"
```

Corre contra bases **desechables** (`sigca_test_rules` en el puerto 3992,
`sigca_test_seed` en el 3993, `sigca_test_b6` y `sigca_test_b7`) que se eliminan
al terminar, y **no toca** la base de desarrollo `sigca`. Son **152 pruebas**:

- **119 de reglas** en 16 grupos (roles/seguridad, citas, menor de edad con
  responsable, pagos, comprobante, caja, solicitudes, materiales, contrato de
  rutas, B3 y B4).
- **11 del seed B5** (conteos, estados/métodos permitidos, vínculos
  solicitud↔cita, precio/duración, solapamientos, finanzas, cajas, comprobantes,
  dry-run, idempotencia y bloqueo de cancelación con pagos válidos).
- **6 de B6** (portal público, carrusel, publicaciones y bandeja de contacto).
- **16 de B7** (recorrido completo de la sección 16 e integridad de datos).

Detalle en `docs/PRUEBAS.md` y `docs/EVIDENCIAS.md`.

## Entregables

- **Código fuente** completo de backend y frontend, sin `node_modules` ni `dist`
  (excluidos en `.gitignore`).
- **README** con integrantes, responsabilidades, instalación, configuración de
  MongoDB, credenciales de demostración y pruebas.
- **Colección Postman** (`postman/`) con entorno local listo para importar.
- **Capturas** del sistema en funcionamiento en `docs/evidencias/`, descritas en
  `docs/EVIDENCIAS.md`.
- **Base reproducible**: el seed B5 deja 77 registros y el arranque del backend
  completa el portal (publicaciones, carrusel, contenidos y horarios).
- **Sin secretos**: no se versionan archivos `.env` reales; solo `.env.example`.
