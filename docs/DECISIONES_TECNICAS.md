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
- Descartado: (a) prohibir `activo` también en el `PATCH` (rompería Activar/Desactivar de la UI); (b) extender el arreglo al resto de `String()` (contact/requests/publications/payments/auth) — sería **otra** revisión transversal, **no autorizada** → queda como observación.
- Verificación: reproducción **antes** (alta inactiva; `"[object Object]"` en contenidos/usuarios en alta y edición) y **después** (**0 respuestas 5xx**; alta con `activo:true`; inválidos → **400** sin cambios en BD; `PATCH {activo:false}` → 200; altas/ediciones válidas → 201/200). Regresión `npm test` **43/43**. Ver `docs/PRUEBAS.md`.
- Verificación: reproducción **antes** **22×500** + `_id` del cliente honrado en el alta; **después** **0 respuestas 5xx**, tipos inválidos → 400, `PATCH {_id}` ignorado, alta con `_id` nuevo; búsqueda/paginación positivas intactas. Regresión `npm test` **43/43** y módulo Materiales **24/24**. Ver `docs/PRUEBAS.md`.
