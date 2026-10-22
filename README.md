# SIGCA — Sistema Integral de Gestión de Citas y Atención

Proyecto final integrador de Desarrollo Web: portal público + sistema administrativo,
comunicados por API REST con persistencia en MongoDB.

## Stack

- Frontend: Vue 3 + Vite + Vue Router + Pinia (JavaScript, CSS convencional).
- Backend: Node.js + Express (ESM) + Mongoose + JWT + bcrypt.
- Base de datos: MongoDB. Pruebas de API: Postman.

## Requisitos

- Node.js 18+ y npm (`node -v`, `npm -v`).
- MongoDB corriendo en local (verificar con `mongosh --quiet --eval "db.runCommand({ping:1})"` → `{ ok: 1 }`).

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

Carga: usuarios de los 3 roles, servicios, profesionales, pacientes (incluye un
menor con responsable), materiales educativos y sus asignaciones, solicitudes,
citas (pagada, parcial, pendiente y con pago anulado) y cajas (una cerrada con
diferencia de arqueo y una abierta), manteniendo la coherencia financiera: cada
pago queda asociado a la caja en que se registró, los pagos anulados no suman y
ningún pago supera el costo de la cita.

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
- Profesional: `profesional.demo@demo.sigca` / `Demo1234`
- Profesional: `pablo.herrera@demo.sigca` / `Demo1234`

No incluir credenciales reales en el repositorio.

## Documentación

- `docs/PLAN_DESARROLLO.md` — fases y criterios de aceptación.
- `docs/ESTADO_PROYECTO.md` — avance real y pendientes.
- `docs/DECISIONES_TECNICAS.md` — decisiones de arquitectura.
- `docs/PRUEBAS.md` — pruebas ejecutadas y resultados.

## Colección Postman

En `postman/` hay una colección lista para importar en Postman:

- `postman/SIGCA.postman_collection.json` - 110 peticiones que cubren toda la API (health, auth, usuarios, servicios, contenidos, horarios, publicaciones, contacto, solicitudes, pacientes, responsables, relaciones, profesionales, citas, materiales, materiales por paciente, pagos y comprobantes, caja con movimientos y bajas lógicas). Incluye las reglas B4: email/servicio obligatorios en solicitudes, rechazo con motivo, atención idempotente, filtros validados, reset de contraseña y restricciones del rol PROFESIONAL.
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

Corre contra una base de datos **desechable** (`sigca_test_rules`, puerto 3992) que se elimina al terminar, y **no toca** la base de desarrollo `sigca`. Son **119 pruebas** en 16 grupos: roles/seguridad, citas (fechas, traslapes, transiciones), menor de edad con responsable, saldo de pagos, comprobante (F09), anulación y cancelación con pagos (F20), caja por usuario con movimientos y arqueo, atender solicitud (C09), materiales por rol (D16), contrato de rutas, edición/reprogramación de citas, modelos y relaciones (B3) y las reglas B4 (restricciones PROFESIONAL, solicitudes atómicas, reset de contraseña, índices y filtros). Detalle en `docs/PRUEBAS.md`.
