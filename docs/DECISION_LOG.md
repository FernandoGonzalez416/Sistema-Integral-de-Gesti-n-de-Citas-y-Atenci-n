# Registro de Decisiones y Cambios

Este archivo documenta **qué se cambió y por qué**. Cada cambio relevante debe tener una entrada.

## Formato de entrada

```md
## [fecha] - <tipo>(<alcance>): <título>
- **Cambio:** qué se hizo
- **Motivo:** por qué se tomó esta decisión
- **Alternativas descartadas:** qué otra opción se evaluó
- **Impacto:** qué afecta (módulos, API, UI)
- **Commit relacionado:** hash o mensaje
```

---

## 2026-10-15 - docs(decisiones): crear convención de commits y log de decisiones

- **Cambio:** Se creó `COMMIT_CONVENTION.md`, `.gitmessage` y `docs/DECISION_LOG.md`.
- **Motivo:** Estandarizar mensajes con Conventional Commits para historial legible, facilitar `git log`, code review y futuro versionado automático (CHANGELOG).
- **Alternativas descartadas:** Commits libres sin formato. Se descartó por generar historial inconsistente y difícil de auditar.
- **Impacto:** Afecta flujo de trabajo Git. No afecta código funcional.
- **Commit relacionado:** pendiente de primer commit

---

## 2026-10-15 - chore(tooling): instalar gentle-ai v4.2.0

- **Cambio:** Se instaló `gentle-ai` vía `go install github.com/gentleman-programming/gentle-ai/v4/cmd/gentle-ai@latest` (Go 1.27.0). Verificado con `gentle-ai version` → `4.2.0` y `gentle-ai doctor` → `8 passed, 0 failed` (opencode ya configurado, engram reachable).
- **Motivo:** Estandarizar workflow de agentes IA (memoria con Engram, ODD, skills, review) sin atarse a un solo agente. Se eligió canal estable y método `go install` porque en Windows no hay binario oficial firmado actualmente.
- **Alternativas descartadas:** Instalación manual por `curl | bash` (es para macOS/Linux) y Homebrew (no aplica en Windows). Se descartaron por no ser el flujo soportado en Windows según `docs/quickstart.md`.
- **Impacto:** Solo tooling local/global (`C:\Users\ggonz\go\bin\gentle-ai.exe`, `~/.gentle-ai/state.json`). No cambia código del proyecto. No se ejecutó `gentle-ai install` interactivo para no sobrescribir configs sin confirmación.
- **Commit relacionado:** pendiente (solo tooling, no requiere commit salvo documentar aquí)

---

## 2026-10-15 - docs(decisiones): definir configuración gentle-ai para stack Vue+Express+Mongo

- **Cambio:** Se define configuración recomendada (pendiente de aplicar con tu OK): agente `opencode`; componentes `engram, skills, context7, gga, persona, permissions` (preset `full-gentleman`); persona `gentleman`; skills base + `judgment-day, work-unit-commits, branch-pr, issue-creation, cognitive-doc-design`; community tool `CodeGraph`.
- **Motivo:** Stack confirmado: Vue 3 + JS + Router + Pinia / CSS sin Tailwind / Express + Mongoose + JWT + bcrypt / frontend-backend separados por REST. `context7` cubre docs vivas de Vue/Express/Mongoose (Gentleman-Skills no tiene skills de Vue/Express/Mongo, solo React/Angular/TS/Tailwind). `permissions` es crítico por `.env`, URI de Mongo, JWT y hashes. `engram` evita re-explicar decisiones. `CodeGraph` ayuda con dos apps separadas. `gentleman` como mentor riguroso para proyecto final.
- **Alternativas descartadas:** Agregar más agentes (Cursor, Claude, etc.) — fragmenta configs, se queda solo `opencode` que ya usas. Preset `minimal`/`ecosystem-only` — se descartan por dejar fuera `permissions`. Persona `neutral` — queda como alternativa si quieres respuestas secas.
- **Impacto:** Solo configs globales de agente. No toca código del proyecto. Requiere previo fix de `@opencode/plugin@2.0.4` que hoy bloquea `sync` (ver `gentle-ai sync --dry-run`).
- **Commit relacionado:** pendiente
- **Comando propuesto (primero dry-run):** `gentle-ai install --agent opencode --component engram,skills,context7,gga,persona,permissions --persona gentleman --preset full-gentleman --skill judgment-day,work-unit-commits,branch-pr,issue-creation,cognitive-doc-design,skill-registry --dry-run`

---

## 2026-10-21 - docs(proyecto): incorporar requisitos y pendientes al repositorio

- **Cambio:** Se agregaron `docs/REQUISITOS.md` y `docs/PENDIENTES.md` al control de versiones (sin modificar su contenido), en la rama `fix/validaciones-tipos`.
- **Motivo:** Eran los únicos archivos sin rastrear tras sincronizar con `origin/master`; el usuario pidió conservarlos e incorporarlos antes de avanzar.
- **Alternativas descartadas:** Dejarlos sin rastrear (se perderían en cualquier limpieza o cambio de rama).
- **Impacto:** Solo documentación (1008 líneas agregadas). Sin cambios en código.
- **Commit relacionado:** `docs(proyecto): incorporar requisitos y pendientes`

---

## 2026-10-21 - fix(api): rechazar tipos inválidos en los campos de texto

- **Cambio:** Se elimina la coerción `String(valor)` sobre campos de texto del cliente en `contact`, `requests`, `publications` (alta), `payments` (`motivoAnulacion`), `auth` (login/registro/perfil) y `services` (`incluye`), y en la validación de `telefono` de pacientes/profesionales/responsables. Los tipos inválidos responden **400** (en `incluye` se descarta el elemento).
- **Motivo:** `String({})` produce `"[object Object]"`, que pasaba las validaciones de longitud y se guardaba como dato válido sin error; cierra la observación abierta el 2026-10-16.
- **Alternativas descartadas:** Limpiar el dato después de guardarlo; coercer números a texto en `telefono`; responder 400 por elementos inválidos de `incluye` (se prefirió descartarlos para no cambiar el contrato del catálogo).
- **Impacto:** Backend, 9 controladores. Sin cambios de contrato para entradas válidas, sin dependencias nuevas y sin cambios en frontend (ya envía texto).
- **Commit relacionado:** `fix(api): rechazar tipos inválidos en los campos de texto`

## 2026-10-21 - feat(api): alinear el contrato de la API con REQUISITOS.md (B1)

- **Cambio:** se renombraron las rutas a `/api/servicios`, `/api/usuarios`, `/api/solicitudes-cita`, `/api/cajas` y `/api/contenido`; las ediciones completas pasaron a `PUT`; se añadieron `PUT /api/citas/:id`, `GET /api/citas/:id/pagos` y `GET /api/citas/:id/saldo`; se alinearon los estados de cita, solicitud y pago, y los métodos de pago a `EFECTIVO|TRANSFERENCIA|TARJETA`. Se añadió la migración idempotente `backend/scripts/migrarEstados.js` y se actualizaron seed, tests, frontend y Postman.
- **Motivo:** `docs/REQUISITOS.md` es la fuente de verdad del proyecto; el contrato anterior usaba rutas en inglés, `PATCH` para ediciones y estados que ya no existen, lo que impedía evaluar el sistema contra el RF.
- **Alternativas descartadas:** mantener alias de las rutas antiguas (duplica el contrato y las reglas de autorización); conservar `REPROGRAMADA` como estado (la reprogramación ahora es una edición que conserva el estado); migrar `OTRO` a un cuarto método (el RF solo admite tres).
- **Impacto:** backend (modelos, controladores, rutas, seed y tests), frontend (cliente API, constantes y 9 vistas), colección Postman y documentación. Sin dependencias nuevas, sin TypeScript y sin cambios en la base de desarrollo `sigca`. La migración no elimina documentos.
- **Verificación:** `npm test` **67/67 en dos corridas**; `npm run build` verde; Postman **80 peticiones / 90 asserts, 0 fallos**; migración `--dry-run` sin escrituras, aplicación correcta y segunda simulación con **0 cambios**. **UI no verificada en navegador** (solo build).
- **Commit relacionado:** `6052ad6` (backend), `ce95dca` (frontend), `1c8d821` (Postman), este commit (docs).

## 2026-10-21 - feat(api): caja por usuario y relación explícita pago-caja (B2)

- **Cambio:** `Payment` referencia su caja (`caja`) y guarda quién anula (`anuladoPor`); `CashSession` exige una sola caja ABIERTA por usuario (índice único parcial), guarda `totalIngresosCentavos` y calcula `totalEsperadoCentavos = monto inicial + EFECTIVO`. Se añade `GET /api/cajas/:id/movimientos`; `GET /api/cajas/actual` y la apertura/cierre pasan a ser por usuario (ADMINISTRADOR ve y cierra cualquiera, RECEPCIONISTA solo las propias). Registrar un pago exige la caja abierta del usuario y la asocia; anular exige que esa caja siga ABIERTA y registra el usuario. Se retira la inferencia por ventana de fechas. Se añade `backend/scripts/asignarCajasPagos.js` y se actualizan seed, tests, frontend y Postman.
- **Motivo:** RF-11 y RN-19…RN-29 exigen que cada pago pertenezca a una caja, una caja abierta por usuario, totales calculados desde los pagos de esa caja y efectivo esperado igual a monto inicial + EFECTIVO. B1 mantenía una caja global y una ventana temporal, y sumaba todos los métodos al efectivo esperado.
- **Alternativas descartadas:** mantener la ventana de fechas como respaldo (dos fuentes de verdad para el mismo ingreso); permitir anular pagos de cajas cerradas (RN-11 lo prohíbe); caja global para todos (impide atribuir el arqueo a un responsable).
- **Impacto:** backend (modelos, controladores de caja/pagos, seed, rutas, tests y script de migración), frontend (`CajaView`, `PagosView`, cliente API), colección Postman y README. Sin dependencias nuevas, sin TypeScript y sin tocar la base de desarrollo `sigca`. La migración no elimina documentos y solo escribe en pagos con `caja` vacía.
- **Verificación:** `npm test` **75/75**; `npm run build` verde; Postman **81 peticiones / 102 asserts, 0 fallos** en `sigca_postman_b2`; seed dos ejecuciones (31 creados → 31 omitidos) con **0 pagos sin caja**; migración `--dry-run` 4 planificados → 4 aplicados → segundo `--dry-run` con **0 pendientes**; BDs desechables eliminadas. **UI no verificada en navegador** (solo build).
- **Commit relacionado:** `c1bb8de` (backend), `910d756` (frontend), `0be4f27` (Postman), este commit (docs).

## 2026-10-21 - feat(api): completar modelos, relaciones y validaciones (B3)

- **Cambio:** se completaron los campos y vínculos exigidos por RF-03, RF-04, RF-05, RF-06 y RF-10: `Patient.fechaInicioProceso` y `observacionesAdministrativas`; `Responsible.email`/`direccion` obligatorios y `fotoUrl`; `Professional.usuario` (vínculo único con un usuario `PROFESIONAL` activo); `Service.imagenUrl`; `ContactMessage.telefono` y `asunto` obligatorios; `AppointmentRequest.citaGenerada`, `atendidaPor`, `fechaAtencion` y `motivoRechazo`; `Payment.numeroComprobante` sincronizado desde `Receipt`; `PatientMaterial.asignadoPor`. Se añadió la migración `backend/scripts/completarRelaciones.js` y se actualizaron seed, tests, frontend, Postman y README.
- **Motivo:** `PENDIENTES.md` §16 pide completar los modelos y relaciones, y varios campos obligatorios del RF no existían o solo se inferían. Sin ellos no se puede evaluar la ficha del paciente, el responsable, el catálogo, la trazabilidad de materiales ni el número de comprobante en el pago.
- **Alternativas descartadas:** dejar el número de comprobante solo en `Receipt` (el pago no cumpliría RF-10 de forma directa); auto-vincular profesionales por nombre (riesgo de asignar el usuario equivocado); hacer obligatorio `Professional.usuario` en el esquema (rompe registros históricos; se exige en el alta y se regulariza con la migración); crear ya la pantalla de profesionales (fuera del alcance de B3).
- **Impacto:** backend (9 modelos, 7 controladores, utilidad de comprobante, seed, tests y migración), frontend (4 vistas), colección Postman y documentación. Sin dependencias nuevas, sin TypeScript y sin tocar la base de desarrollo `sigca`. La migración no elimina documentos y solo rellena datos faltantes; los datos personales incompletos se informan para revisión manual.
- **Verificación:** `npm test` **87/87**; `npm run build` verde; Postman **82 peticiones / 113 asserts, 0 fallos** en `sigca_postman_b3`; seed dos ejecuciones (32 creados → 32 omitidos) con **0 brechas** en la migración; migración `--dry-run` → aplicación → segundo `--dry-run` con **0 pendientes**, probando ambos sentidos de `solicitud↔cita` y verificando que la simulación no escribe. **UI no verificada en navegador** (solo build).
- **Commit relacionado:** `8dc8fa2` (backend), `506ab43` (frontend), `7b01f40` (Postman), este commit (docs).

## 2026-10-21 - feat(api): atender solicitudes y restringir citas por rol (B4)

- **Cambio:** se cerró B4 sobre `integracion` (`3cec9b6`) sin convertir MongoDB a replica set ni usar transacciones. Backend: `POST /api/solicitudes-cita` exige email válido y servicio existente/activo; `PATCH /api/solicitudes-cita/:id/rechazar` guarda `motivoRechazo`, `atendidaPor` y `fechaAtencion`; se valida el filtro por estado. `POST /api/citas/solicitudes/:solicitudId/atender` es idempotente con índice único parcial en `Appointment.solicitudOrigen`, reparación del enlace ante `E11000`, actualización condicional de la solicitud, compensación si falla y re-chequeo de traslape; además hay un mutex en proceso por profesional (`conBloqueo`). El rol `PROFESIONAL` se resuelve por `Professional.usuario` (sin vínculo → 403), solo lista/lee/completa sus citas `CONFIRMADA`, ve campos básicos de sus pacientes y opera materiales de pacientes con cita propia. Se añadió `PATCH /api/usuarios/:id/restablecer-password` solo para ADMINISTRADOR y el script de preflight `verificarDuplicadosSolicitud.js`. Frontend: `CitasView`, `SolicitudesView`, `ProfesionalesView`, reset en `UsersView`, menús por rol y guard `meta.roles`; `CitaModal` y el portal exigen email/servicio.
- **Motivo:** B4 debía hacer atómicas las solicitudes/citas en el MongoDB local disponible, evitar dobles conversiones y cerrar los permisos del rol PROFESIONAL. El requisito manda sobre la infraestructura: no se puede exigir replica set. La autorización por `Professional.usuario` evita inferir identidad por nombre o email; el backend debe repetir cada control aunque la UI oculte botones.
- **Alternativas descartadas:** convertir MongoDB a replica set y usar transacciones (descartado: cambia la infraestructura local exigida); auto-crear pacientes al atender (descartado en C09: duplica datos y complica la trazabilidad); autorizar al profesional por coincidencia de nombre/email (descartado: riesgo de acceso cruzado); ocultar menús solo en el frontend (descartado: la API quedaría abierta); eliminar el `PATCH /:id/estado` legado (descartado: rompe contratos y pruebas previas; se mantiene y el rechazo formal usa `/:id/rechazar`); hacer obligatorios los campos nuevos en el esquema Mongoose (descartado: rompe registros históricos; se valida en controladores con 400).
- **Impacto:** backend (modelo `Appointment`, controladores de citas/solicitudes/pacientes/materiales/usuarios, rutas, helper `utils/profesional.js`, `server.js`, script y tests), frontend (cliente API, router, layout, `CitasView`, `SolicitudesView`, `ProfesionalesView`, `UsersView`, `AdminView`, `PacientesView`, `MaterialesView`, `CitaModal`, `SolicitarCitaView`, store), colección/entorno Postman y documentación. Sin dependencias nuevas, sin TypeScript, sin Tailwind/Docker y sin tocar la base `sigca`. La atomicidad depende del índice único + actualización condicional; el mutex solo reduce colisiones dentro de un proceso y no se presenta como garantía distribuida.
- **Verificación:** `npm test` **119/119 en dos corridas** (16 grupos; A-P) contra `sigca_test_rules`, incluidos M/N/O/P de B4; `npm run build` **verde** (165 módulos); Postman **110 peticiones / 166 aserciones, 0 fallos, 0 respuestas 5xx** ejecutado por emulación contra `app.js` y `sigca_test_postman` (eliminada); script de duplicados probado en base vacía y con duplicados (sale con código 1). **UI no verificada en navegador** (sin navegador; solo build). Detalle en `docs/PRUEBAS.md`.
- **Commit relacionado:** `788677b` (backend), `aa3f9f8` (frontend), `4327baf` (Postman), este commit (docs); hashes también en `docs/CONTROL_COMMITS.md`.

## 2026-10-21 - feat(seed): completar datos demo para b5

- **Cambio:** se amplió `backend/src/utils/seedDemo.js` para dejar 6 usuarios (1 administrador, 2 recepcionistas y 3 profesionales), 10 pacientes (4 menores con responsable), 5 responsables, 5 servicios (1 inactivo), 15 citas, 5 materiales con 5 asignaciones, 5 solicitudes (2 pendientes, 2 atendidas y 1 rechazada), 10 pagos con comprobante, 10 comprobantes y 3 cajas. Se conservaron las claves estables, los marcadores `[seedDemo:clave]`, el `--dry-run` y la regla de no borrar ni sobrescribir datos ajenos.
- **Motivo:** el seed anterior no alcanzaba para demostrar los flujos de B4/B5 (solicitudes atendidas, pagos completos/parciales/anulados, cierre con diferencia y varias cajas) y sus contadores de módulo se acumulaban entre llamadas.
- **Alternativas descartadas:** reemplazar el seed por una carga destructiva (riesgo para datos reales); usar `deleteMany` para limpiar la demostración (viola la garantía no destructiva); crear una segunda base de seed separada (duplica el mantenimiento).
- **Impacto:** solo backend (`seedDemo.js`). Sin dependencias nuevas, sin cambios de API/modelos/frontend y sin tocar la base `sigca`. La segunda ejecución crea 0 registros y no reemite comprobantes.
- **Verificación:** primera ejecución **77 creados**; segunda **0 creados / 77 omitidos**. `npm test` **130/130** (119 existentes + 11 de seed). Detalle en `docs/PRUEBAS.md`.
- **Commit relacionado:** `cb133bc`.

## 2026-10-21 - test(seed): verificar invariantes e idempotencia b5

- **Cambio:** se agregó `backend/tests/seedDemo.test.js` (11 pruebas) contra `sigca_test_seed` (puerto 3993) y el `app.js` real. Comprueba conteos, roles, edades y responsables, estados/métodos permitidos, fechas futuras, precio/duración, solapamientos, enlaces solicitud↔cita, comprobantes 1:1, finanzas por cita, totales de caja, `--dry-run`, idempotencia y el **409** al cancelar una cita con pagos válidos.
- **Motivo:** B5 exige que el seed no solo exista, sino que mantenga invariantes verificables y que una segunda ejecución no altere datos ni numeración.
- **Alternativas descartadas:** validar solo con inspección manual (no repetible); usar la base de desarrollo `sigca` (prohibido); depender de una librería de test nueva (el runner integrado de Node es suficiente).
- **Impacto:** solo backend (`tests/seedDemo.test.js`). La base de pruebas y el servidor auxiliar se eliminan/detienen al terminar.
- **Verificación:** `npm test` **130/130 en dos corridas consecutivas**; `sigca` intacta.
- **Commit relacionado:** `1875f39`.

## 2026-10-21 - docs(seed): documentar seed b5 y verificacion

- **Cambio:** se actualizaron `README.md`, `docs/CONTROL_COMMITS.md`, `docs/DECISION_LOG.md`, `docs/DECISIONES_TECNICAS.md`, `docs/PRUEBAS.md` y `docs/ESTADO_PROYECTO.md` con el conjunto B5, los conteos, los totales de caja, la excepción documentada de `pago-04`, la verificación 130/130 y los hashes de los commits.
- **Motivo:** dejar trazabilidad reproducible del seed definitivo y de sus límites, sin presentar la UI como verificada en navegador.
- **Alternativas descartadas:** documentar solo en el README (los documentos de pruebas/decisiones quedarían desactualizados); incluir hashes inventados (se completan después de crear los commits de seed y tests).
- **Impacto:** solo documentación. Sin cambios funcionales.
- **Commit relacionado:** este commit (docs); hashes de seed/tests en `docs/CONTROL_COMMITS.md`.

## 2026-10-21 - fix(ui): calendario y filtros activos

- **Cambio:** `CalendarioView.vue` pasa todas las opciones de FullCalendar por `:options` (plugins, vista inicial, eventos, click, locale español, toolbar y altura) y se alinea `@fullcalendar/vue3` de 7.1.2 a `^6.1.21`. `FormField.vue` soporta checkbox con `:checked` y emisión booleana, usado por los filtros "Activos" de pacientes, responsables y materiales.
- **Motivo:** la UI reportaba `viewType "" is not available`; la causa era doble: faltaba el prop `options` que exige el conector Vue y la versión 7 del conector traía su propio core 7 frente a core/daygrid/interaction 6. El checkbox emitía `$event.target.value` (`"on"`) en lugar de `checked` y no marcaba el filtro.
- **Alternativas descartadas:** pasar `:plugins` y mantener `@fullcalendar/vue3` 7.x (se probó y el error persistía por el core duplicado); crear checkboxes nativos en cada vista en lugar de corregir el componente compartido (duplicaba lógica y dejaba el mismo defecto latente).
- **Impacto:** frontend (`package.json`, `package-lock.json`, `CalendarioView.vue`, `FormField.vue`). Sin cambios de API, backend ni seed.
- **Verificación:** build **verde** (131 módulos); UI en Edge headless sobre `sigca_ui_calendar`: 15 eventos, Mes/Semana/Día, modal de detalle, 0 errores de consola y filtros `activo=true` correctos; `npm test` **130/130**. Base desechable eliminada; `sigca` intacta.
- **Commit relacionado:** `a6cd08f`.

## 2026-10-21 - docs(ui): registrar verificación visual y límite del mutex

- **Cambio:** se documenta la verificación real en navegador del calendario y los filtros "Activos", y se deja explícita la diferencia entre `conBloqueo` (mutex en memoria de un proceso) y el índice único parcial (garantía real).
- **Motivo:** la defensa no debe presentar el mutex como una garantía distribuida; además, B4/B5 habían quedado documentados como "UI no verificada".
- **Impacto:** solo documentación.
- **Commit relacionado:** este commit (docs).

## 2026-10-21 - feat(api): configuración, carrusel, publicaciones y bandeja B6

- **Cambio:** se agregó `GET/PUT /api/contenido/sitio` reutilizando `InstitutionalContent` para nombre, logo, misión, visión, información principal y contacto; el modelo `CarouselSlide` y su CRUD ADMIN con listado público ordenado; `PUT /api/publicaciones/:id` para edición completa; filtros `?leido=`, contador y marcado de leídos en contacto; y el seed de logo/carrusel.
- **Motivo:** B6 exige contenido institucional administrable sin duplicar fuentes, carrusel con al menos cinco elementos, publicaciones editables, horarios/servicios reflejados en el portal y una bandeja ADMIN con contador.
- **Alternativas descartadas:** duplicar el contenido en un modelo nuevo (rompía la fuente única existente); guardar imágenes como archivos (fuera de alcance); exigir replica set o dependencias nuevas (restricción del proyecto).
- **Impacto:** backend y pruebas. Sin cambios al calendario ni a los checkboxes de B5.1. Validaciones en controladores; no se agregó `required` a campos existentes.
- **Verificación:** `npm test` **136/136 en dos corridas** (18 suites); B6 cubre sitio, carrusel, publicaciones, contacto y errores 4xx sin 5xx. Detalle en `docs/PRUEBAS.md`.
- **Commit relacionado:** `a671ec3`.

## 2026-10-21 - feat(ui): portal editable y bandeja B6

- **Cambio:** Home, Navbar y Footer consumen la configuración y el carrusel de la API (con fallback a los SVG locales); `ContentView` administra configuración, carrusel, horarios y publicaciones; `MensajesView` muestra bandeja, filtros, marcado y estado vacío; `AdminLayout` agrega badge y guardia de menú; Servicios muestra imagen/placeholder, precio compartido y enlace con `?servicio=`.
- **Motivo:** conectar la API B6 con las pantallas reales y mantener la experiencia pública cuando la API no devuelve carrusel.
- **Impacto:** frontend. Sin dependencias nuevas. Se conserva `CalendarioView` y la corrección de filtros de B5.1.
- **Verificación:** `npm run build` **verde (135 módulos)**; UI en Edge headless sobre `sigca_ui_b6` (portal, admin, bandeja, servicios, horarios, contacto y menú móvil). Detalle en `docs/PRUEBAS.md`.
- **Commit relacionado:** `98c53ef`.

## 2026-10-21 - test(postman): contenido y contacto B6

- **Cambio:** se amplió la colección con sitio GET/PUT, carrusel CRUD/público/admin/400/403, publicación PUT/400/403, filtros/contador/403 de contacto y `diapositivaId` en el entorno.
- **Motivo:** verificar el contrato B6 completo por HTTP real, incluyendo permisos, validaciones y errores claros.
- **Impacto:** solo Postman. Sin cambios de aplicación.
- **Verificación:** emulación completa contra `app.js` real en `sigca_postman_b6`: **131 peticiones, 196 pruebas, 0 fallidas, 0 respuestas 5xx**. Requiere BD limpia por corrida por el horario del sábado ya existente; no es un defecto de la app.
- **Commit relacionado:** `ccab98f`.

## 2026-10-21 - fix(ui): cita directa con servicio preseleccionado

- **Síntoma:** `/solicitar-cita?servicio=<id>` abría el modal sin el servicio en el resumen.
- **Causa raíz:** `ServiciosView` abría el modal antes de que `CitaModal` se montara; como `citaAbierta` ya era `true`, el `watch` sin `immediate` no ejecutaba `reiniciar(citaServicioInicial)`.
- **Corrección:** `watch(citaAbierta, ..., { immediate: true })` en `CitaModal.vue`. Se revisaron todas las llamadas a `abrirCita`/`citaAbierta`; el watch es el único punto de inicialización.
- **Verificación:** ruta directa con nombre, duración y precio preseleccionados y apertura en el paso de datos; el flujo desde el catálogo sigue funcionando. Build **135 módulos** verde.
- **Commit relacionado:** `8c0813e`.

## 2026-10-21 - docs(b6): registrar portal, pruebas y verificación

- **Cambio:** se actualizaron `docs/CONTROL_COMMITS.md`, `docs/DECISION_LOG.md`, `docs/DECISIONES_TECNICAS.md`, `docs/EVIDENCIAS.md`, `docs/ESTADO_PROYECTO.md` y `docs/PRUEBAS.md` con alcance, endpoints, 136/136, build 135 módulos, Postman 131/196/0, evidencia UI, el defecto de la ruta directa y sus hashes.
- **Motivo:** dejar trazabilidad reproducible de B6 y distinguir lo verificado en navegador de lo no ejercitado.
- **Impacto:** solo documentación.
- **Commit relacionado:** este commit (docs).

## 2026-10-21 - merge(b6): publicación e integración en `integracion`

- **Cambio:** se publicó `feat/b6-portal-contenido` y se integró con `--no-ff` en `integracion`.
- **Verificación previa:** `git merge-base --is-ancestor d1b1ad4 feat/b6-portal-contenido` → ok (B6 sale de `82a389d`, docs posterior al merge de B5.1). En `content.routes.js`, `/sitio` y `/carrusel` se declaran antes de `/:clave` y `/:id`; en `carousel.routes.js`, `/admin/todos` antes de `/:id`. `GET /api/contenido/sitio` y su `PUT` responden por sus propias rutas (200/200/400/401/403), sin caer en `/:clave`.
- **Regresión:** `npm test` **136/136** y `npm run build` **135 módulos**, verdes antes del push.
- **Impacto:** sin cambios de código; no hubo conflictos. 35 archivos, +3200/−337.
- **Integración:** `git merge --no-ff feat/b6-portal-contenido` → **`145babb`**, publicado en `origin/integracion` (`82a389d..145babb`). `origin/feat/b6-portal-contenido` conserva los 5 commits de B6.
- **Siguiente:** B7 con la pasada completa de la sección 16 y la auditoría de pantallas históricas (pacientes, responsables, materiales, pagos y caja).

## 2026-10-21 - test(api): sección 16 e integridad de datos B7

- **Cambio:** nueva suite `backend/tests/b7.test.js` (16 pruebas) que recorre los **22 pasos de la sección 16** por HTTP real y audita modelos, relaciones, validaciones e integridad.
- **Motivo:** cerrar la validación funcional del enunciado con evidencia reproducible y sin tocar `sigca`.
- **Aislamiento:** base desechable `sigca_test_b7`, puerto 3991; horarios 07:00–20:00 los 7 días para no depender del día de ejecución; la base se elimina al terminar.
- **Cobertura:** login, paciente, responsable, servicio, cita, traslape, confirmación, calendario, caja, abonos, saldo PENDIENTE/PARCIAL/PAGADO, comprobante, métodos de pago, ingresos del día, arqueo/cierre, bloqueo post-cierre, historial, integridad de referencias y permisos por rol.
- **Integridad adicional:** snapshots de precio/duración, `pago.paciente` = `cita.paciente`, comprobante 1:1, `solicitudOrigen` único, totales de caja recalculados y vínculo `Professional.usuario` único con rol PROFESIONAL.
- **Verificación:** **16/16** pruebas de B7 en verde; regresión **152/152** (19 suites).
- **Commit relacionado:** `2762377`.

## 2026-10-21 - fix(ui): paciente y edad en sus responsables B7

- **Síntoma:** `/admin/pacientes/:id/responsables` mostraba "Responsables de ( años)" y no el aviso de menor de edad.
- **Causa raíz:** la vista cargaba el paciente con `getPacientes({ q: pacienteId })`, buscando el ObjectId como texto en nombre/apellido/teléfono/email; nunca había coincidencia y quedaba el objeto por defecto (`nombre: ''`, `edad: null`).
- **Corrección:** usar `getPaciente(auth.token, pacienteId)` (`GET /api/pacientes/:id`) para cargar el paciente. Solo cambia el import y la llamada.
- **Verificación:** en Edge headless la cabecera muestra nombre y edad reales, aparece el aviso de menor y la asociación de responsables funciona. **0 errores de consola** y **0 respuestas 5xx** en el recorrido.
- **Commit relacionado:** `0df5711`.
