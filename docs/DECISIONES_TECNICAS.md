# Decisiones Técnicas — SIGCA

Ver `docs/DECISION_LOG.md` para el formato detallado de cada entrada. Aquí solo decisiones de arquitectura verificadas.

## 2026-10-15 — Estructura monorepo con frontend/ y backend/ separados

- Decisión: dos apps separadas comunicadas solo por REST (`VITE_API_URL` → `/api`).
- Motivo: requisito académico, simple de calificar y de desplegar por separado.
- Descartado: monorepo con servidor sirviendo el frontend (acopla despliegues).

## 2026-10-15 — Backend Express con módulos ES (ESM)

- Decisión: usar `"type": "module"` + `import/export` como en Tarea 3.
- Motivo: consistencia con el ecosistema Vue/Vite y requisito del plan ("ES cuando la configuración lo permita").
- Nota: Tarea 2 usaba CommonJS; no se copiará tal cual, solo como referencia de patrones.

## 2026-10-15 — bcryptjs en lugar de bcrypt nativo

- Decisión: usar `bcryptjs` (API compatible con `bcrypt`, 100% JavaScript).
- Motivo: `bcrypt` nativo exige herramientas de compilación en Windows; `bcryptjs` se instala sin compiladores y es suficiente para un proyecto académico.
- Descartado: `bcrypt` nativo por fricción de instalación en Windows.

## 2026-10-15 — Contenido institucional mixto (genérico + específicos)

- Decisión: `InstitutionalContent { clave, titulo, cuerpo, activo }` para textos libres (misión, visión, nosotros, datos de contacto visibles); modelos separados `Schedule`, `Publication` y `ContactMessage` para lo estructurado.
- Motivo: horarios y publicaciones se validarán/ordenarán por campos (Fase 7, Fase 5); forzarlos a texto impediría esas reglas.
- Descartado: todo en un solo campo de texto.

## 2026-10-15 — Sin Tailwind / sin TypeScript / sin Docker

- Decisión: CSS convencional + JS simple, como exige el plan.
- Motivo: mantener el proyecto comprensible y dentro de tecnologías obligatorias.

## 2026-10-15 — Pagos: monto en centavos y saldo calculado

- Decisión: `Payment.montoCentavos` entero (igual que `precioCentavos`); el saldo de una cita se calcula sumando solo los pagos `ACTIVO` y nunca supera el `precioCentavos` de la cita. Estados de saldo: `PENDIENTE` / `PARCIAL` / `PAGADO`.
- Decisión: los pagos no se borran; se marcan `ANULADO` con `motivoAnulacion` y `anuladoEn` (histórico).
- Decisión: no se registran pagos sobre citas `CANCELADA` (regla de negocio verificable).
- Motivo: evitar errores de punto flotante, conservar trazabilidad y cumplir el criterio de Fase 10.

## 2026-10-15 — Caja diaria: una sesión abierta y bloqueo post-cierre

- Decisión: `CashSession` con estado `ABIERTA`/`CERRADA`; solo puede existir una `ABIERTA` a la vez.
- Decisión: al cerrar se guarda un snapshot de totales por método (pagos `ACTIVO` del rango), `totalEsperadoCentavos = montoInicial + cobrado`, y `diferencia = real − esperado`.
- Decisión: bloqueo post-cierre = no se registran ni anulan pagos cuya `fecha` cae dentro de la ventana `[fechaApertura, fechaCierre]` de una caja ya cerrada (evita alterar cierres pasados).
- Motivo: cumplir el criterio de Fase 11 (apertura/cierre, totales por método, diferencias, bloqueos post-cierre).

## 2026-10-15 — Seed de demostración idempotente y no destructivo

- Decisión: `backend/seedDemo.js` carga datos ficticios identificados por **claves estables**: campos únicos naturales + marcadores `[seedDemo:clave]` en campos de texto para modelos sin clave natural.
- Decisión: nunca borra ni sobrescribe; si la clave existe, omite. No cambia contraseñas ni desactiva usuarios. Soporta `--dry-run` que solo imprime base y plan.
- Decisión: los pagos de demostración respetan la coherencia financiera (activos ≤ precio de la cita) y caen dentro de la caja correspondiente; las cajas se calculan a partir de sus propios pagos.
- Motivo: criterio de Fase 12 (seed repetible sin borrar datos reales) y trazabilidad en una base con datos previos.

## 2026-10-16 — Atender solicitud → cita (contrato del endpoint)

- Contexto: `POST /api/citas/solicitudes/:id/atender` devolvía HTTP 500 (auto‑creaba un `Patient` sin `apellido`, campo obligatorio) y, aun resolviéndolo, no podía convertir porque `AppointmentRequest` no tiene `profesional`.
- Decisión (autorizada por el usuario, Opción A): la conversión parte de un **paciente ya registrado**. El body es `{ pacienteId, profesionalId, servicioId?, inicio, observaciones? }`.
  - `pacienteId` y `profesionalId` son **obligatorios** y deben existir y estar activos.
  - `servicioId` es opcional: si falta, se usa `solicitud.servicio`; si tampoco hay, responde **400** controlado.
  - Se conservan las reglas existentes: menor de edad con responsable activo, disponibilidad (sin pasado, dentro de horario, sin traslape), estados y `solicitudOrigen`; la solicitud pasa a `ATENDIDA`.
- Motivo: el endpoint necesita paciente/profesional/servicio/inicio que la solicitud no aporta; el diseño es coherente con `crearCita` y con el comentario del modelo (“citas con pacientes registrados”). No se auto‑crean pacientes (evita datos incompletos y el 500).
- Alcance: solo `backend/src/controllers/appointments.controller.js`. No cambian modelo, rutas ni frontend.

## 2026-10-16 — Roles de materiales educativos (D16)

- Contexto: `POST/PATCH /api/materiales` permitía el rol PROFESIONAL (201/200). La nota de FASE 9 decía que la ruta se abrió a PROFESIONAL “a propósito”, pero la auditoría (D16) esperaba 403 → intención contradictoria.
- Decisión (autorizada por el usuario, Opción A): **lectura** del catálogo = `ADMINISTRADOR` + `RECEPCIONISTA` + `PROFESIONAL`; **gestión** (crear/editar/desactivar) = `ADMINISTRADOR` + `RECEPCIONISTA`.
- Implementación: en `backend/src/routes/materials.routes.js` se reemplaza el `router.use(...)` único por dos middlewares (`lectura` y `gestion`) aplicados por método (`GET` → lectura; `POST/PATCH/PATCH desactivar` → gestión).
- Motivo: PROFESIONAL usa los materiales pero no administra el catálogo; RECEPCIONISTA conserva la gestión que ya tenía.
- Alcance: solo `materials.routes.js`. No se modifica la asignación paciente‑material (`patientMaterials.routes.js`), que es otro permiso.

## 2026-10-16 — Comprobante/recibo de pago (F09)

- Contexto: la auditoría detectó (F09) que no existía **comprobante/recibo** de pago: ni modelo ni endpoint (`GET/POST /api/pagos/:id/comprobante` → 404). Es una funcionalidad **ausente**, no un bug; `FASE 10` (pagos) no la había incluido.
- Decisión (autorizada por el usuario, **Opción A**): el comprobante se **emite automáticamente** al registrar el pago y se consulta con `GET /api/pagos/:id/comprobante`. Solo backend (sin tocar el frontend).
  - Modelo `Receipt` (`backend/src/models/Receipt.js`): relación **1:1** con `Payment` (`pago` único) y `numero` **único** con formato `REC-AAAA-000001`.
  - Numeración **atómica** con `Counter` (`backend/src/models/Counter.js`, `findOneAndUpdate` + `$inc`, `upsert`): no colisiona con altas simultáneas. La emisión vive en `backend/src/utils/receipt.js` (`emitirComprobante`) y es **idempotente** (un comprobante por pago); ante carrera (`E11000`) devuelve el ya existente.
  - El endpoint `GET /api/pagos/:id/comprobante` está bajo el mismo permiso que pagos (`auth` + `ADMINISTRADOR`/`RECEPCIONISTA`) y, si el pago no tuviera comprobante (p. ej. pagos previos a esta versión), lo **emite al consultarlo**.
  - Coherencia: al anular el pago, su comprobante pasa a `estado: ANULADO` (`anularPago`); un comprobante de un pago ya anulado nace `ANULADO`.
- Descartado: emisión manual/bajo demanda (`POST`) y comprobante imprimible HTML/PDF (más alcance del requerido por la auditoría: “entidad/endpoint”).
- Motivo: garantizar que **todo pago** tenga un recibo con número único y recuperable, con el mínimo cambio y sin romper el contrato existente de `POST /api/pagos` (su respuesta no cambió).
- Alcance: `Receipt.js`, `Counter.js`, `utils/receipt.js`, `controllers/payments.controller.js`, `routes/payments.routes.js`. No se tocaron modelos de pago, frontend ni el resto de módulos.

## 2026-10-16 — Entregables: colección Postman, `.gitignore` y `.env.example`

- Contexto: la auditoría dejó tres entregables pendientes (FASE 14): no existía colección Postman, no existía `.gitignore` (riesgo de versionar `node_modules/`, `dist/` y `frontend/.env`) y `backend/.env.example` proponía `ADMIN_PASSWORD=Cambiar123`, contradiciendo el default de `env.js` y el README (`Admin123`).
- Decisión (autorizada por el usuario): resolver los tres antes de avanzar de fase; colección Postman **completa** (todas las rutas) con **entorno**; `.env.example` **alineado** a `Admin123`.
  - **Postman:** `postman/SIGCA.postman_collection.json` (v2.1, 20 carpetas / 79 peticiones) + `postman/SIGCA.postman_environment.json` (variables `baseUrl`, credenciales, tokens y `_id`). Cada POST de creación guarda su `_id` en el entorno para encadenar el resto; los inicios de cita usan `inicioCita`/`inicioCita2`/`inicioCita3` (ajustables) y la caja se abre antes de los pagos.
  - **`.gitignore`** en la raíz: ignora `node_modules/`, `dist/`, `.env`, `.env.*.local`, logs, `coverage/`, ficheros de SO/IDE; **no** ignora los `.env.example`.
  - **`.env.example`:** `ADMIN_PASSWORD=Admin123`.
- Motivo: `.gitignore` evita subir dependencias/artefactos/secretos sin afectar a las plantillas; la colección permite verificar las reglas de negocio vía Postman (criterio de FASE 7/14); alinear el ejemplo evita que copiar `.env.example` rompa la credencial de demostración documentada.
- Verificación: la colección se ejecutó de principio a fin (emulación de Postman: sustitución de variables, capturas y códigos esperados) contra el `app.js` real en la BD desechable `sigca_test_postman` → **79/79 en verde**; `git check-ignore` confirmó los ignorados y que `.env.example` se conserva.
- Alcance: se añaden `postman/*`, `.gitignore` y una línea de `backend/.env.example`. No se modificó código de la aplicación ni el frontend; **no se hizo ningún commit**.

## 2026-10-16 — FASE 12, paso 2: pruebas de reglas clave (`node:test`)

- Contexto: la FASE 12 pide un seed repetible (paso 1, ya hecho) y **pruebas de reglas clave** (paso 2). El proyecto no tenía runner de pruebas ni dependencias de test.
- Decisión: usar el **runner integrado de Node** (`node:test` + `node:assert/strict`), disponible desde Node 18, **sin añadir dependencias** (evita la aprobación de dependencias nuevas y mantiene el stack mínimo). La suite vive en `backend/tests/` (ubicación ya prevista en el plan) y se lanza con `npm test`.
- Aislamiento: se ejecuta contra una BD **desechable** propia (`sigca_test_rules`) y un puerto propio (3992), con `dropDatabase()` al inicio y al final; **nunca** toca la BD de desarrollo `sigca`. Se reutiliza la misma metodología que en las correcciones (app real + HTTP real + BD dedicada).
- Motivo del glob en el script: el runner se acota a `tests/**/*.test.js` para que `node --test` no recorra y ejecute `backend/test-prof.js` (archivo preexistente que apunta a `sigca`).
- Cobertura: roles/seguridad, citas (fechas/traslapes/transiciones), menor de edad con responsable, saldo de pagos, caja obligatoria y post‑cierre, comprobante (F09), anulación y cancelación con pagos (F20), atender solicitud (C09) y materiales por rol (D16).
- Verificación: **43/43 en dos corridas consecutivas**; BD de prueba eliminada; `sigca` intacta. Sin cambios en la app ni en el frontend; **sin commits**.

### Reglas clave y su código (trazabilidad)

| Regla | Pruebas | Dónde vive |
|---|---|---|
| Rol obligatorio / 401-403 | A1–A4, I1–I3 | `middlewares/auth.js`, `middlewares/roles.js`, `routes/materials.routes.js` |
| Sin traslapes / no pasado / horario | B1–B4 | `controllers/appointments.controller.js` (`validarDisponibilidad`, `buscarHorario`) |
| Transiciones de estado de cita | B5–B7 | `models/Appointment.js` (`TRANSICIONES_CITA`) + controlador |
| Menor con responsable activo | C1–C3 | `controllers/appointments.controller.js` |
| Saldo PENDIENTE/PARCIAL/PAGADO | D3–D5 | `controllers/payments.controller.js` (`calcularSaldo`) |
| Caja obligatoria para cobrar (F01) | D1 | `controllers/payments.controller.js` + `cajaAbiertaActual()` |
| Comprobante único/secuencial (F09) | E1–E3 | `utils/receipt.js`, `models/Receipt.js`, `models/Counter.js` |
| No cancelar con pagos activos (F20) | F1, F4, F6 | `controllers/appointments.controller.js` |
| Caja única + post‑cierre + arqueo | G1–G5 | `controllers/cash.controller.js` |
| Atender solicitud (C09) | H1–H3 | `controllers/appointments.controller.js` (`atenderSolicitud`) |

## 2026-10-16 — FASE 13: endurecimiento de secretos (S13.1) y manejo de errores (S13.2)

- Contexto: en la revisión de seguridad de FASE 13 se detectaron dos hallazgos: (S13.1) `JWT_SECRET` caía a un valor por defecto **público** si faltaba `.env`, permitiendo falsificar tokens; (S13.2) `errorHandler` devolvía `err.message` también en errores **500**, filtrando detalles internos.
- Decisión (criterios aprobados por el usuario):
  - **S13.1:** abortar el arranque **solo cuando `NODE_ENV=production`** y falte `JWT_SECRET`; en desarrollo se mantiene el valor por defecto (no rompe dev ni pruebas). Implementado en `backend/src/config/env.js`.
  - **S13.2:** responder un mensaje **genérico** para `status >= 500` y **conservar** `err.message` para `status < 500` (los 400/404/409 que muestra la UI); el detalle completo sigue en `console.error(err)`. Implementado en `backend/src/middlewares/errorHandler.js`.
- Motivo: elimina el riesgo de forja de tokens en producción sin afectar el flujo de desarrollo, y evita la fuga de información interna sin cambiar los mensajes funcionales.
- Descartado: exigir `JWT_SECRET` también en desarrollo (rompería el arranque sin `.env`); ocultar también los mensajes 4xx (rompería los mensajes que la UI necesita mostrar).
- Verificación: reproducción real **antes** (token forjado → **200**; `GET /api/pagos?cita=abc` → **500** con `Cast to ObjectId…`) y comprobación **después** (prod sin secreto → arranque bloqueado; forjado con el default → **401**; 500 → mensaje genérico; 400 → mensaje conservado) + regresión `npm test` **43/43**. Ver `docs/PRUEBAS.md`.

## 2026-10-16 — FASE 13: orden de montaje de rutas de pacientes

- Contexto: `app.js` montaba `app.use('/api/pacientes', patientsRoutes)` **antes** de las subrutas `/api/pacientes/:pacienteId/responsables` y `/api/pacientes/:pacienteId/materiales`. Como `patientsRoutes` aplica `router.use(autenticar, permitir(ADMIN, RECEP))` a **todo** su prefijo, cualquier petición a `/api/pacientes/*` pasaba primero por ese guard; para PROFESIONAL, `permitir` respondía **403** antes de llegar a la subruta (que sí lo autoriza en materiales).
- Opciones: **(A)** reordenar los montajes para que las subrutas se registren **antes** de `/api/pacientes` (cambio mínimo, 2 líneas movidas); (B) dejar documentado el comportamiento y no tocar el módulo de pacientes.
- Decisión (aprobada por el usuario): **Opción A**. Motivo: la ruta hija declara explícitamente que PROFESIONAL puede asignar/ver/desasignar materiales; el orden de montaje anulaba esa intención. Reordenar es el cambio mínimo y no altera la autorización de ningún otro endpoint.
- Descartado: (B) dejar el 403 documentado (mantendría inoperante una función declarada por su propio router).
- Verificación: reproducción **antes** (BD desechable): PROF → **403** en `GET/POST/PATCH /api/pacientes/:id/materiales*` (11/16); **después**: **16/16 OK** con flujo funcional real (PROF asigna 201 → lista 200 → desasigna 200) y sin regresiones (PROF sigue 403 en `/api/pacientes`, `/api/pacientes/:id` y en la subruta de responsables, cuya autorización es ADMIN+RECEP). Regresión `npm test` **43/43** y matriz de roles **74/74**. Ver `docs/PRUEBAS.md`.

## 2026-10-16 — FASE 13, tarea 3: validaciones y manejo de errores (sin hallazgos)

- Contexto: último punto de la revisión de FASE 13 (validaciones, errores, códigos HTTP). Objetivo: comprobar que las rutas que **escriben** nunca devuelven **5xx** y que todo error responde `{ ok:false, message }`.
- Decisión: **no cambiar código**. El barrido (38 rutas × 2 payloads inválidos + casos específicos + JSON malformado = **84 comprobaciones**) resultó **84/84 OK con 0 respuestas 5xx**; los controladores validan campos obligatorios y valores de enum antes de persistir, y el `errorHandler` (tras S13.2) ya no filtra internals en 5xx.
- Observación (no defecto, sin cambio): `POST /api/caja/abrir` **sin body** abre la caja con `montoInicialCentavos = 0` (default documentado del módulo de caja; monto 0 es válido). Se mantiene el contrato actual.
- Verificación: ver `docs/PRUEBAS.md` (sección tarea 3). Sin efectos secundarios (ninguna colección cambió).

## 2026-10-16 — Módulo Materiales: validación de tipos en la escritura y saneo de la consulta

- Contexto: la verificación funcional del módulo de materiales (FASE 9) encontró **5 respuestas 500** por **falta de validación de tipos** en la escritura y por no sanear entradas de consulta: `q` con regex inválida (`?q=(`), `page` fuera de rango (`?page=0` → `skip` negativo), `PATCH` con `_id` o valores con tipo inválido (`titulo:{}`, `tipo:null`…), `POST` con tipos inválidos o `titulo` en blanco, `activo:null` (corrupción) y `notas` no‑texto en la asignación. Todo **alcanzable desde la UI** (buscador libre; botón «Activar» que usa `PATCH {activo:true}`).
- Opciones: **(A)** corregir **solo el módulo** (validar tipos + lista blanca de campos + escaper la búsqueda + sanear paginación); (B) corregir además la asignación masiva `Object.assign(doc, req.body)` en **todos** los controladores (cambio transversal / arquitectónico).
- Decisión (aprobada por el usuario, alcance "solo este módulo"): **Opción A**. Motivo: el defecto y su arreglo son **locales** a `materials.controller.js` y `patientMaterials.controller.js`; la lista blanca usa exactamente los campos que el módulo ya expone (y que la UI usa), sin inventar contrato nuevo.
- Descartado: (B) por ahora — el patrón se repite en otros 8 controladores; arreglarlo es una **revisión transversal** y se deja como hallazgo documentado (posible helper común), fuera del alcance de esta verificación.
- Detalle del arreglo: `listarMateriales` escapa `q` como texto literal y sanea `page`/`limit` (enteros ≥ 1; 1 y 20 por defecto); `validarMaterial` exige tipos (texto no vacío en titulo/descripcion; `tipo ∈ TIPOS_MATERIAL`; url/archivoNombre texto; activo booleano); `actualizarMaterial` reemplaza `Object.assign` por lista blanca `[titulo, descripcion, tipo, url, archivoNombre, activo]`; `asignarMaterial` valida que `notas` sea texto.
- Verificación: **antes** 85/90 (5×500); **después** **90/90 OK y 0 respuestas 5xx** por HTTP real, con persistencia comprobada en MongoDB; regresión `npm test` **43/43**. Se preserva el uso legítimo (`PATCH {activo:true}`, `GET …?limit=200`). Ver `docs/PRUEBAS.md`.

## 2026-10-16 — Corrección transversal: entradas no validadas y asignación masiva

- Contexto: al cerrar la verificación de Materiales quedó documentado como **hallazgo transversal** que la asignación masiva (`Object.assign(doc, req.body)`, `new Model(req.body)`) y las entradas de consulta no saneadas (`new RegExp(q)` sin escapar, `skip` negativo) se repetían en varios controladores. El usuario autorizó atacarlo.
- Decisión (aprobada): **arreglo transversal mínimo** con **helpers comunes** y una **red de seguridad central**, sin tocar la lógica de negocio:
  1. `backend/src/utils/consulta.js` → `regexBusqueda(valor)` (escapa el texto; nunca lanza por regex inválida) y `paginacion(query)` (enteros ≥ 1; `page` 1 y `limit` 20 por defecto; calcula `skip`).
  2. `backend/src/utils/campos.js` → `soloCampos(body, campos)` y `aplicarCamposPermitidos(doc, body, campos)` (listas blancas).
  3. Aplicados en `listar` de pacientes, profesionales, responsables, citas, pagos, caja y materiales (paginación) y en la búsqueda `q` de pacientes, profesionales, responsables y materiales.
  4. **Listas blancas** en pacientes/profesionales/responsables (POST con `soloCampos`, PATCH con `aplicarCamposPermitidos`).
  5. `errorHandler`: `ValidationError`/`CastError` de Mongoose → **400** (dato de entrada inválido), no 500.
- Motivo: elimina la clase de defectos "entrada no validada → 500" y la asignación masiva en toda la app con cambios pequeños y reutilizables, en línea con el criterio del usuario de **no devolver 5xx** por datos de cliente.
- Descartado: (a) validar tipos campo a campo en cada controlador (duplicación y riesgo de inventar contratos) — se resuelve con el mapeo central; (b) dejar solo el arreglo de Materiales (dejaría 22 respuestas 500 y el alta con `_id` manipulable).
- Matices documentados: `activo` sigue siendo un campo **expuesto** en el `PATCH` (botones Activar/Desactivar); el **alta** ya no lo acepta (ver la decisión siguiente).

## 2026-10-16 — Cierre de observaciones menores: alta sin `activo` y sin coerción de tipos

- Decisión (aprobada): **cerrar** las dos observaciones dejadas como "menores".
  1. **El alta no acepta `activo`**: en pacientes/profesionales/responsables se separa la lista blanca del alta (`CAMPOS_*_CREAR`, sin `activo`) de la de edición (`CAMPOS_*`, con `activo`). El registro **nace activo**; el estado se cambia con `PATCH {activo}` (justo lo que usa la UI).
  2. **Sin coerción a texto**: contenidos (`clave`/`titulo`/`cuerpo`) y usuarios (`nombre`/`email`/`password`) exigen que los valores sean **texto** (no vacío en edición) → **400**; se elimina `String(valor).trim()` sobre la entrada del cliente. El chequeo de password pasa a `password.length`.
- Motivo: cierra la clase "tipo inválido → texto basura" en esos dos módulos y evita que un alta imponga un estado no previsto, **sin** tocar reglas de negocio ni permisos.
- Descartado: (a) prohibir `activo` también en el `PATCH` (rompería Activar/Desactivar de la UI); (b) extender el arreglo al resto de `String()` (contact/requests/publications/payments/auth) — **autorizado y cerrado el 2026-10-21** (ver la decisión siguiente).
- Verificación: reproducción **antes** (alta inactiva; `"[object Object]"` en contenidos/usuarios en alta y edición) y **después** (**0 respuestas 5xx**; alta con `activo:true`; inválidos → **400** sin cambios en BD; `PATCH {activo:false}` → 200; altas/ediciones válidas → 201/200). Regresión `npm test` **43/43**. Ver `docs/PRUEBAS.md`.
- Verificación: reproducción **antes** **22×500** + `_id` del cliente honrado en el alta; **después** **0 respuestas 5xx**, tipos inválidos → 400, `PATCH {_id}` ignorado, alta con `_id` nuevo; búsqueda/paginación positivas intactas. Regresión `npm test` **43/43** y módulo Materiales **24/24**. Ver `docs/PRUEBAS.md`.

## 2026-10-21 — Cierre de la coerción de tipos a texto en el resto de la API

- Decisión (autorizada por el usuario al crear la rama `fix/validaciones-tipos`): **cerrar** la observación pendiente del 2026-10-16 y aplicar una regla única: **todo campo de texto que llega del cliente debe ser `string`; si no, se rechaza (400) y nunca se coerciona**.
- Alcance: `contact` (nombre/email/mensaje), `requests` (nombre/teléfono/email/mensaje), `publications` alta (título/descripción/imagenUrl/enlace), `payments.anularPago` (`motivoAnulacion`), `auth` (login, registro, cambio de contraseña, `perfil` y `contactoEmergencia`), `services.catalogo` (`incluye`) y la validación de `telefono` en pacientes/profesionales/responsables.
- Motivo: `String(valor)` sobre un objeto produce `"[object Object]"`, que supera las validaciones de longitud y **se guarda como dato válido** (dato corrupto sin error visible). Rechazar el tipo es explícito, consistente con contenidos/usuarios (2026-10-16) y no altera los flujos válidos.
- Descartado: (a) seguir coercionando y limpiar después (el dato ya está corrupto); (b) aceptar números convirtiéndolos a texto en `telefono` (una API JSON debe exigir el tipo declarado); (c) responder 400 por elementos inválidos de `incluye` (se prefirió **descartarlos** para no cambiar el contrato del catálogo, que ya normaliza listas).
- `String()` que se conserva: usos **internos** (route params, ObjectIds, numeración de comprobantes, seeds) y de **solo validación** sobre valores que no se persisten (`limpiar` en `auth`, cuyos usos pasan por regex o por chequeo `typeof`; `regexBusqueda` escapado; test de forma ISO de `fechaPreferida`).
- Verificación: reproducción **antes** (6 endpoints guardaban `"[object Object]"`; `telefono` numérico coercionado; login 401) y **después** (tipos inválidos → **400**; `incluye` filtra; **0 documentos** basura; **0 respuestas 5xx**; 9 flujos válidos intactos). Regresión `npm test` **43/43**. Ver `docs/PRUEBAS.md`.

## 2026-10-21 — B1: alineación del contrato con `REQUISITOS.md`

- **Contexto:** la implementación usaba rutas en inglés (`/api/users`, `/api/services`, `/api/contenidos`, `/api/caja`, `/api/solicitudes`), métodos `PATCH` para ediciones completas, estados de cita `PROGRAMADA`/`REPROGRAMADA`/`NO_ASISTIO`, pagos `ACTIVO` y método `OTRO`. El documento `docs/REQUISITOS.md` es la fuente de verdad y define otro contrato.
- **Decisión:** alinear la API, el cliente y la documentación al contrato del RF sin conservar alias de las rutas antiguas (un contrato único evita dos caminos con reglas distintas).

### Rutas y métodos

- Rutas en español: `/api/servicios`, `/api/usuarios`, `/api/solicitudes-cita`, `/api/cajas` y `/api/contenido`.
- `PUT` para ediciones completas: `usuarios/:id`, `pacientes/:id`, `responsables/:id`, `servicios/:id`, `citas/:id`, `materiales/:id` y `contenido/:id`.
- `PATCH` queda reservado a acciones: `pacientes/:id/estado`, `citas/:id/estado`, `pagos/:id/anular`, `solicitudes-cita/:id/estado` y las subrutas de desasociar.
- Se eliminaron los endpoints `desactivar` de responsables y materiales: la baja lógica se hace con `PUT { activo: false }`. El paciente conserva `PATCH /estado`, que acepta `{ activo }` o `{ estado: 'ACTIVO'|'INACTIVO' }`.

### Citas y pagos

- Estados de cita: `PENDIENTE → CONFIRMADA → COMPLETADA` y `PENDIENTE|CONFIRMADA → CANCELADA`. `COMPLETADA` y `CANCELADA` son terminales. Las citas nuevas nacen `PENDIENTE`.
- Solo `PENDIENTE` y `CONFIRMADA` ocupan horario (RN-13).
- `PUT /api/citas/:id` edita o reprograma conservando el estado. Revalida fecha futura, horario, traslape, paciente/profesional/servicio activo y recalcula precio/duración si cambia el servicio. Una cita `COMPLETADA` responde 409 (RN-06); `CANCELADA` también es inmutable.
- Se añadieron `GET /api/citas/:id/pagos` (historial + saldo) y `GET /api/citas/:id/saldo`. El cálculo se centralizó en `backend/src/utils/saldo.js` y se retiró la ruta antigua `/api/pagos/citas/:id/saldo`.
- Estados de pago: `REGISTRADO|ANULADO`; métodos: `EFECTIVO|TRANSFERENCIA|TARJETA` (se elimina `OTRO`).
- Estados de solicitud: `PENDIENTE|ATENDIDA|RECHAZADA` (se elimina `CANCELADA`).
- Caja usa `GET /api/cajas/actual`; se elimina el total `OTRO` del arqueo.

### Migración de datos

- `backend/scripts/migrarEstados.js` es idempotente, admite `--dry-run` y no elimina documentos. Mapea `PROGRAMADA→PENDIENTE`, `REPROGRAMADA→CONFIRMADA`, `NO_ASISTIO→CANCELADA`, pago `ACTIVO→REGISTRADO`, pago/comprobante `OTRO→TRANSFERENCIA`, solicitud `CANCELADA→RECHAZADA` y suma el total de caja `OTRO` a `TRANSFERENCIA`.
- Scripts: `npm run migrar:estados` y `npm run migrar:estados:dry`.

### Frontend y Postman

- `frontend/src/constants/sigca.js` centraliza estados de cita, colores, estados de solicitud/pago, métodos y tipos de material. Calendario, Pagos, Caja, Usuarios, Servicios, Pacientes, Responsables, Materiales y Contenido consumen el nuevo contrato.
- La colección Postman se actualizó con las rutas nuevas, `PUT` de edición, `GET /api/citas/:id/pagos`, `GET /api/citas/:id/saldo`, `PATCH /api/pacientes/:id/estado` y los estados/métodos nuevos.

### Verificación

- `backend`: `npm test` → **67/67 en dos corridas consecutivas** contra `sigca_test_rules` (puerto 3992).
- `frontend`: `npm run build` → **verde**.
- Postman: **80 peticiones / 90 asserts, 0 fallos** contra una BD desechable (`sigca_postman_b1`) y el `app.js` real.
- Migración: `--dry-run` sin escrituras → aplicación correcta → segundo `--dry-run` con **0 documentos por migrar**.
- **UI no verificada en navegador** (no hay navegador disponible en el entorno); solo se validó el build.

### Diferido

- La relación explícita pago/caja y la caja por usuario se abordan en B2.
- La atención de solicitudes atómica y el flujo de rechazo se abordan en B4.
- La deduplicación de helpers HTTP y de formato monetario del frontend queda pendiente para un bloque posterior (no bloquea el contrato).

## 2026-10-21 — B2: caja por usuario y relación explícita pago↔caja

- **Contexto:** B1 mantuvo la caja global y el bloqueo por ventana de fechas. RF-11 y RN-19…RN-27 exigen que **cada pago pertenezca a una caja**, que **cada usuario tenga como máximo una caja abierta** y que los totales se calculen desde los pagos de esa caja, no desde un rango temporal. Además, el cierre de B1 calculaba el **efectivo esperado** como `monto inicial + todos los ingresos`, cuando el RF lo define como `monto inicial + EFECTIVO`.
- **Decisión:** reemplazar la inferencia por fecha por una **referencia explícita** `Payment.caja`, y hacer la caja **por usuario**.

### Modelo y persistencia

- `Payment.caja` (`ref: CashSession`) se escribe siempre en los pagos nuevos; queda `null` solo en registros históricos (se regularizan con un script). Se añade `Payment.anuladoPor` (RN-29) y el índice `{ caja, estado }`.
- `CashSession` gana `totalIngresosCentavos` (suma de pagos `REGISTRADO` de todos los métodos) y un **índice único parcial** `{ abiertaPor: 1 }` con `estado: 'ABIERTA'`, que hace cumplir RN-22 también ante aperturas simultáneas (`E11000` → 409).
- `totalEsperadoCentavos` pasa a ser `montoInicialCentavos + totalesPorMetodo.EFECTIVO` (RF-11). `totalRealCentavos` es el **efectivo contado** y `diferenciaCentavos = contado − esperado`.

### API

- `GET /api/cajas/actual` devuelve la caja ABIERTA **del usuario autenticado** (o `null`) y un `resumen` con totales por método y total de ingresos.
- `GET /api/cajas`: ADMINISTRADOR ve todas (filtro opcional `?usuario=`); RECEPCIONISTA solo las propias.
- `GET /api/cajas/:id` y `GET /api/cajas/:id/movimientos`: ADMINISTRADOR cualquiera; RECEPCIONISTA solo las suyas (**403** en las ajenas). `movimientos` incluye pagos (con paciente, cita, usuario que registró/anuló) y `resumen` calculado solo con `REGISTRADO`.
- `POST /api/cajas/abrir` abre la caja del usuario; si ya tiene una ABIERTA → **409** (RN-22).
- `POST /api/cajas/:id/cerrar`: ADMINISTRADOR puede cerrar cualquiera; RECEPCIONISTA solo la propia (**403**). Calcula los totales desde `Payment.find({ caja })` y guarda el snapshot.
- `POST /api/pagos` exige la caja ABIERTA **del usuario que registra** (409 si no la tiene), asocia `caja` y valida que la fecha no sea anterior a la apertura ni futura. Se elimina la comprobación por ventana de cajas cerradas: la pertenencia explícita la sustituye.
- `PATCH /api/pagos/:id/anular`: solo si la caja del pago está **ABIERTA** (409 si está cerrada), RECEPCIONISTA solo sobre su propia caja (403) y registra `anuladoPor` + `anuladoEn`.
- `GET /api/pagos` admite el filtro `caja` y devuelve la caja y el usuario que anuló.

### Migración

- `backend/scripts/asignarCajasPagos.js` (idempotente, `--dry-run`, no destructivo) asigna `caja` a los pagos históricos cuya fecha cae en la ventana `[fechaApertura, fechaCierre]` de una caja; prioriza la caja del usuario que registró el pago y la ventana más corta. Los pagos sin caja compatible se informan y quedan intactos. Scripts `npm run migrar:cajas` y `npm run migrar:cajas:dry`.

### Seed, frontend y Postman

- El seed crea las cajas **antes** de los pagos, asocia cada pago a su caja (incluido el anulado) y recalcula los totales de la caja cerrada desde sus pagos `REGISTRADO` solo si lleva el marcador del seed.
- `CajaView` consume `GET /cajas/actual` + `/movimientos` (sin inferir por fechas), muestra total de ingresos y efectivo esperado. `PagosView` muestra la caja propia, bloquea el alta si no existe y muestra la caja de cada pago.
- Postman: 81 peticiones; «Caja actual», «Abrir caja», «Registrar pago», «Movimientos de la caja» y «Cerrar caja» verifican la caja por usuario, la asociación del pago y las fórmulas del arqueo.

### Verificación

- `backend`: `npm test` → **75/75** contra `sigca_test_rules` (puerto 3992).
- `frontend`: `npm run build` → **verde**.
- Postman: **81 peticiones / 102 asserts, 0 fallos** contra `sigca_postman_b2` y el `app.js` real.
- Seed: `--dry-run` sin escrituras; dos ejecuciones (31 creados → 31 omitidos); **0 pagos sin caja**.
- Migración: `--dry-run` con 4 pagos planificados → aplicación 4/4 → segundo `--dry-run` con **0 pendientes**; BD desechable eliminada.
- **UI no verificada en navegador** (sin navegador); solo build.

## 2026-10-21 — B3: campos faltantes, vínculos y validaciones de modelos

- **Contexto:** la revisión de `REQUISITOS.md` y `PENDIENTES.md` (§16) mostró campos exigidos por RF-03, RF-04, RF-05, RF-06 y RF-10 que no existían en los modelos, y relaciones que solo se inferían (profesional↔usuario, solicitud↔cita, material↔usuario que lo asigna). B3 completa esos datos sin romper registros históricos.
- **Decisión:** agregar los campos y vínculos que exige el RF, con validación en el modelo **y** en el controlador, y una migración idempotente que solo rellena datos faltantes.

### Modelos y API

- `Patient` gana `fechaInicioProceso` y `observacionesAdministrativas` (máx. 2000). La API acepta ambos; la fecha no puede ser futura y `''` se normaliza a `null` para poder limpiarla. La foto (`fotoUrl`) ya existía.
- `Responsible` exige `email` (formato válido) y `direccion`; agrega `fotoUrl` (RF-04). El alta y la actualización rechazan email vacío o inválido y dirección menor a 5 caracteres.
- `Professional.usuario` (`ref: User`) vincula al profesional con su usuario del sistema. Índice único parcial sobre `usuario` objectId: un usuario no puede representar a dos profesionales. La API de alta exige `usuarioId`, valida que el usuario exista, esté activo y tenga rol `PROFESIONAL`, y devuelve el usuario poblado. La actualización permite cambiar el vínculo pero no dejarlo vacío; un conflicto de índice responde **409**. Los profesionales históricos sin vínculo se regularizan con la migración.
- `Service.imagenUrl` se persiste y se expone en el catálogo público (RF-05).
- `ContactMessage` exige `telefono` y `asunto` (RF-01). El formulario público los envía; el backend valida formato de teléfono, longitud de asunto y de mensaje.
- `AppointmentRequest` gana `citaGenerada` (`ref: Appointment`), `atendidaPor`, `fechaAtencion` y `motivoRechazo`. `GET /api/solicitudes-cita` devuelve la cita y el usuario que atendió (RF-06). El flujo transaccional de atención/rechazo queda para B4.
- `Payment.numeroComprobante` se copia desde el `Receipt` al emitirlo; `Receipt` sigue siendo la fuente de verdad. Índice único parcial por número. Así el propio pago cumple RF-10, sin depender de consultar el comprobante.
- `PatientMaterial.asignadoPor` registra al usuario autenticado que asigna el material (PENDIENTES §13) y se devuelve poblado en las consultas.

### Migración

- `backend/scripts/completarRelaciones.js` (`--dry-run`, idempotente, no destructivo) sincroniza `Payment.numeroComprobante` desde `Receipt`, completa `Patient.fechaInicioProceso` desde `createdAt`, vincula profesionales con usuarios por email exacto (solo `PROFESIONAL` activos y sin vínculo previo) y reconstruye `solicitud↔cita` en ambos sentidos cuando falta una de las dos referencias. Informa —sin modificar— responsables sin email/dirección, mensajes sin teléfono/asunto y asignaciones sin `asignadoPor`. Scripts `npm run migrar:relaciones` y `npm run migrar:relaciones:dry`.

### Seed, frontend y Postman

- El seed crea un segundo usuario `PROFESIONAL` (`pablo.herrera@demo.sigca`) y vincula ambos profesionales; agrega dirección al responsable, fechas/observaciones a los pacientes, imágenes a los servicios, `asignadoPor` a las asignaciones y `citaGenerada`/`atendidaPor` a la solicitud atendida; además emite los comprobantes de sus pagos. Todo sigue siendo idempotente y no sobrescribe.
- Frontend: `PacientesView` muestra/edita fecha de inicio y observaciones; `ResponsablesView` exige email y dirección y agrega foto; `ServicesView` agrega imagen; `ContactoView` agrega teléfono y asunto. La vinculación profesional↔usuario se expone por API/seed/Postman (no existe todavía pantalla de profesionales; queda para un bloque posterior).
- Postman: 82 peticiones; se agrega «Crear usuario profesional», se envían los nuevos campos y se verifica su persistencia, el vínculo `PROFESIONAL`, el `numeroComprobante` del pago y el mensaje de contacto con teléfono/asunto.

### Verificación

- `backend`: `npm test` → **87/87** contra `sigca_test_rules` (puerto 3992).
- `frontend`: `npm run build` → **verde**.
- Postman: **82 peticiones / 113 asserts, 0 fallos** contra `sigca_postman_b3` y el `app.js` real.
- Seed: `--dry-run` sin escrituras; dos ejecuciones (32 creados → 32 omitidos); **0** brechas en la migración posterior.
- Migración: `--dry-run` con cambios planificados → aplicación → segundo `--dry-run` con **0 pendientes**; se probaron ambos sentidos de `solicitud↔cita` y se verificó que el `--dry-run` no escribe.
- **UI no verificada en navegador** (sin navegador); solo build.

## 2026-10-21 - B4: solicitudes/citas atómicas sin replica set y permisos por rol

### Contexto y restricción

- MongoDB local se mantiene **standalone**. No se convierte a replica set, no se usan transacciones y no se agregan dependencias. La consistencia se apoya en el índice único, operaciones atómicas de un documento y compensación explícita.
- La autoridad de permisos es el backend. El frontend solo oculta rutas/menús con `meta.roles`; cada endpoint vuelve a validar rol y vínculo.

### Conversión de solicitud en cita

1. Se valida la solicitud, el paciente, el profesional y el servicio; el servicio debe estar activo. El email y el servicio de la solicitud se exigen en el alta (400 si faltan o son inválidos).
2. `Appointment.solicitudOrigen` tiene un **índice único parcial** (`partialFilterExpression: { solicitudOrigen: { $type: 'objectId' } }`). Las citas directas sin solicitud no quedan afectadas.
3. El alta de la cita ocurre dentro de un bloqueo en proceso por profesional (`conBloqueo`). Si otro proceso ya creó la cita, `E11000` se interpreta como “solicitud ya atendida”: se repara el enlace de la solicitud y se responde **409**.
4. Después de insertar, se re-chequea el traslape; si apareció una cita concurrente, se elimina la recién creada y se responde **409**.
5. La solicitud se marca con un `findOneAndUpdate` condicional `{ _id, estado: 'PENDIENTE' }`. Si otra petición ganó o la rechazó, se elimina la cita y se responde **409**.
6. `server.js` ejecuta `Appointment.createIndexes()` al arrancar. Si hay duplicados y el índice no puede crearse, aborta con un mensaje que remite a `npm run verificar:solicitudes`. El script es de solo lectura, informa duplicados y sale con código 1; en una base sin colección también responde sin error.
7. El mutex es una optimización local, no una garantía distribuida. La garantía última es el índice único + el update condicional.

### Rol PROFESIONAL

- Se resuelve con `Professional.findOne({ usuario: req.usuario._id, activo: true })`. Sin vínculo activo, las rutas de citas/pacientes/materiales responden **403**.
- `GET /api/citas` ignora el filtro `profesional` del cliente y fuerza el profesional autenticado. `GET /api/citas/:id` devuelve **404** para citas ajenas. Solo puede ejecutar `PATCH /:id/estado` con `COMPLETADA` y sobre una cita propia `CONFIRMADA`; otras transiciones dan **400** (propias) o **404** (ajenas).
- `GET /api/pacientes` devuelve solo pacientes con alguna cita del profesional y los campos `nombre apellido fechaNacimiento telefono activo`; las rutas de detalle ajeno dan **404**.
- `GET/POST/PATCH` de materiales por paciente validan que el paciente tenga cita con el profesional; un paciente inactivo sigue dando **409** (RN-09). La lectura del catálogo de materiales se mantiene para PROFESIONAL; la gestión sigue en ADMIN/RECEP.
- Se permite la lectura de profesionales a PROFESIONAL (necesaria para mostrar nombres), pero crear/editar/desactivar sigue restringido.

### Reset de contraseña y contrato legado

- `PATCH /api/usuarios/:id/restablecer-password` es solo ADMINISTRADOR. Valida `passwordNueva` (texto, 6–72), asigna `passwordHash` y deja que el hook `pre('save')` hashee; nunca devuelve contraseña ni hash. RECEPCIONISTA/PROFESIONAL reciben **403**.
- `PATCH /api/solicitudes-cita/:id/estado` se conserva por compatibilidad. El rechazo nuevo usa `PATCH /api/solicitudes-cita/:id/rechazar`, exige `motivoRechazo`, solo acepta `PENDIENTE` (**409** en otro estado) y registra auditoría.

### Frontend

- `CitasView` permite listar/filtrar, crear, reprogramar, cambiar estado y completar; `SolicitudesView` atiende/rechaza; `ProfesionalesView` gestiona el vínculo con usuarios; `UsersView` incorpora el reset.
- `AdminLayout` y el router usan `meta.roles` para menús y guardias. `PacientesView` y `MaterialesView` se adaptan a la lectura de PROFESIONAL. `CitaModal` y `SolicitarCitaView` exigen email y servicio.
- No se verificó la interfaz en navegador; solo build de producción.

### Verificación

- `backend`: `npm test` → **119/119 en dos corridas** contra `sigca_test_rules` (puerto 3992); 16 grupos A-P, incluidos M (roles), N (solicitudes/concurrencia), O (reset) y P (índices/filtros/robustez).
- `frontend`: `npm run build` → **verde** (165 módulos).
- Postman: **110 peticiones / 166 aserciones, 0 fallos, 0 respuestas 5xx** contra `app.js` real y BD desechable `sigca_test_postman` (eliminada). La ejecución fue por emulación de los scripts de la colección, no desde la app Postman.
- Script de duplicados: base vacía → “colección aún no existe”; base con dos citas de la misma solicitud → informe y salida 1.
- **UI no verificada en navegador** (sin navegador); solo build.

## 2026-10-21 - B5: seed definitivo, reparaciones seguras e invariantes

- **Contexto:** el seed de FASE 12 quedó corto para la demostración final (3 pacientes, 4 citas, 2 cajas) y sus contadores de módulo se acumulaban entre llamadas en el mismo proceso. B5 debía dejar un conjunto suficiente, coherente e idempotente sin borrar datos ni tocar `sigca`.
- **Decisión:** ampliar `backend/src/utils/seedDemo.js` conservando las claves estables y marcadores `[seedDemo:clave]`, el `--dry-run` y la regla de no sobrescribir registros ajenos. Cada llamada reinicia `refs`, `plan`, `creados`, `omitidos` y `advertencias`.
- **Conjunto B5:** 6 usuarios (1 administrador, 2 recepcionistas, 3 profesionales), 10 pacientes (4 menores con responsable activo), 5 responsables, 5 servicios (1 inactivo), 15 citas, 5 materiales y 5 asignaciones, 5 solicitudes (2/2/1), 10 pagos, 10 comprobantes y 3 cajas. La primera ejecución crea 77 registros; la segunda crea 0.
- **Citas y solicitudes:** los estados activos usan días laborables futuros; precio, duración y `fin` se copian del servicio; el planificador evita solapamientos por profesional. `cita-02`↔`sol-02` y `cita-07`↔`sol-04` se enlazan en ambos sentidos con `solicitudOrigen` único. Las citas canceladas de demostración no tienen pagos válidos.
- **Pagos y comprobantes:** todos los pagos tienen `caja`, `registradoPor` y recibo real emitido con `emitirComprobante` (incluido el `ANULADO`). La suma de pagos `REGISTRADO` nunca supera el precio de la cita. Los pagos se reparten en caja 1 (cerrada), caja 2 (abierta) y caja 3 (cerrada).
- **Cajas:** los totales se recalculan desde los pagos `REGISTRADO` de cada caja con marcador del seed. Caja 1 cierra con `44500 - 45000 = -500`; caja 3 cierra con `55000 - 55000 = 0`; caja 2 queda abierta y sin campos de cierre. Solo hay una diferencia negativa.
- **Disponibilidad de cajas:** la caja abierta se comprueba por `abiertaPor` (no globalmente). Si la caja 2 tiene un estado/owner inesperado o el recepcionista ya tiene otra caja abierta, se planifica `OMITIR` y se omiten `pago-05`, `pago-07` y `pago-11`; nunca se cierra ni reabre una caja existente. Lo mismo aplica a cajas cerradas con estado inesperado.
- **Reparaciones seguras:** solo sobre registros del seed y solo campos nulos: vínculo `Professional.usuario`, `Payment.caja`/`registradoPor`/`paciente`, campos de anulación, `Appointment.solicitudOrigen`, `AppointmentRequest.citaGenerada` y `Patient.fechaInicioProceso`. Si el destino ya está usado por otro registro, no se sobrescribe y se emite una advertencia.
- **Excepción documentada:** `pago-04` es un pago `ANULADO` dentro de la caja 1 cerrada. Es un dato histórico ficticio, no una anulación ejecutada por la API después del cierre; no suma al arqueo y su recibo nace `ANULADO`. La regla que responde **409** al intentar anular un pago de una caja cerrada sigue vigente y se prueba en `reglas.test.js`.
- **Verificación:** `backend/tests/seedDemo.test.js` usa `sigca_test_seed` (puerto 3993) y el `app.js` real. `npm test` → **130/130 en dos corridas** (119 existentes + 11 nuevas). Comprueba conteos, estados/métodos, fechas futuras, precio/duración, solapamientos, enlaces únicos, comprobantes, coherencia financiera, cajas, dry-run, idempotencia y el **409** al cancelar una cita con pagos válidos. Las bases desechables se eliminaron; `sigca` no se modificó.
- **Fuera de alcance:** portal/logo/carrusel/bandeja, subida de fotos, historial, comprobante imprimible y cambios de API.
- **Commit relacionado:** `cb133bc` (seed), `1875f39` (tests), este commit (docs); hashes también en `docs/CONTROL_COMMITS.md`.

## 2026-10-21 - B5.1: calendario, checkboxes y nota de concurrencia

- **Calendario:** `@fullcalendar/vue3` recibe todas las opciones en un único prop `options`; las props sueltas (`initialView`, `plugins`, `events`, etc.) se ignoraban y producían `viewType "" is not available`. Se pasó `:options="calendarOptions"` con `plugins`, `initialView`, `events`, `eventClick`, `locale: esLocale`, `headerToolbar` y `dayMaxEventRows`. También se alineó `@fullcalendar/vue3` a `^6.1.21` (antes 7.1.2 convivía con core/daygrid/interaction 6.x).
- **Checkboxes:** `FormField` ahora distingue checkbox de texto: usa `:checked`, emite Boolean y se alinea en fila. Con eso funcionan los filtros "Activos" de `PacientesView`, `ResponsablesView` y `MaterialesView`; al marcar, "Buscar" envía `activo=true` y al desmarcar lo omite.
- **Nota para la defensa (B4):** `conBloqueo` es un mutex **en memoria**. Solo serializa operaciones dentro de **un mismo proceso Node**; no coordina dos instancias ni dos procesos. Por tanto, no es la garantía de atomicidad. La garantía real es el **índice único parcial de `Appointment.solicitudOrigen`** junto con el `findOneAndUpdate` condicional de la solicitud y el manejo de `E11000`/compensación. Para un despliegue multi-proceso habría que sustituirlo por un lock compartido en base de datos; el proyecto local no lo requiere.
- **Verificación:** `npm run build` → **verde** (131 módulos). UI en Edge headless contra BD desechable `sigca_ui_calendar` con el seed B5: calendario renderizado en octubre 2026 con **15 eventos**, vistas Mes/Semana/Día operativas, modal de detalle abierto al hacer clic y **0 errores de consola**; checkboxes alternan y los tres filtros envían/omiten `activo=true` correctamente. `npm test` → **130/130**. Base, servidores y script temporal eliminados; `sigca` intacta.
- **Commit relacionado:** `a6cd08f`.

