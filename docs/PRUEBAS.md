# Pruebas — SIGCA

Registro de verificaciones reales. No marcar como pasado lo no ejecutado.

## 2026-10-15 — FASE 0 (auditoría)

- `git status / log / remote -v`: OK. Sin commits, remoto configurado, solo docs. Resultado: confirmado.
- `node -v (v24.15.0), npm -v (11.12.1), git --version (2.54.0), mongosh --version (2.8.3)`: OK.
- Inspección de `Tarea 2/api-tareas` (server.js, package.json, .env) y `Tarea 3/vueApiRest` (package.json, vite.config.js): OK, sirven como referencia.
## 2026-10-15 — FASE 1 tarea 1 (backend base)

- `npm install` en backend: OK (92 paquetes, 0 vulnerabilidades).
- `mongosh --eval ping`: OK (`{ ok: 1 }`).
- `node server.js` + `GET /api/health`: OK (`ok:true, service:sigca-backend`).
- `GET /api/noexiste`: OK (404 JSON del middleware notFound).

## 2026-10-15 — FASE 1 tareas 2–3 (frontend mínimo)

- `npm install` en frontend: OK (36 paquetes; 2 vulnerabilidades heredadas: 1 moderada + 1 alta, sin corregir para no romper versiones verificadas de Tarea 3).
- `npm run dev` (5173) + `GET /api/health` (3000): OK simultáneo, HTML de Vite contiene título SIGCA, `#app` y `/src/main.js`.
- `npm run build`: OK (32 módulos, dist generado).
- Notas: `Invoke-WebRequest` no funciona en PowerShell no interactivo (usar `Invoke-RestMethod` o `Net.WebClient`); liberar puertos con `Get-NetTCPConnection -LocalPort X -State Listen` + `Stop-Process`. Servidores de prueba detenidos, puertos libres.

## 2026-10-15 — FASE 1 tarea 4 (README y cierre)

- `README.md` raíz creado: requisitos, instalación, env, comandos, credenciales (pendientes Fase 3), índice de docs.
- Criterio de finalización Fase 1 cumplido: ambos arrancan y el backend conecta a MongoDB (verificado arriba).

## 2026-10-15 — FASE 2 tarea 1 (layouts y rutas)

- `npm run build`: OK (41 módulos).
- Dev 5173: `/`, `/admin` y `/ruta-inexistente` responden 200 con index (SPA fallback OK; el router muestra Home, Admin o vista 404 según ruta).
- Render visual en navegador: NO VERIFICADO (sin navegador automatizado).

## 2026-10-15 — FASE 2 tarea 2 (componentes reutilizables)

- `npm run build`: OK (45 módulos).
- `Card` usado en Home (estado backend) y Admin (ejemplo); `FormField` con `v-model` y eco local en Admin (sin persistencia simulada).

## 2026-10-15 — FASE 2 cierre (verificación conjunta)

- Backend + frontend simultáneos: `/api/health` → `{"ok":true,...}`; `/` y `/admin` → 200.
- Transform Vite en dev de 6 módulos (vistas, router, Navbar, FormField, store): todos 200, sin errores.
- Servidores detenidos tras verificar. Criterio Fase 2 cumplido a nivel servidor; render visual y consola del navegador NO VERIFICADOS.

## 2026-10-15 — FASE 3 tarea 1 (User + JWT)

- `npm install jsonwebtoken bcryptjs`: OK (107 paquetes, 0 vulnerabilidades).
- Script node sin DB: validación OK, rol inválido rechazado, bcrypt OK, firmar/verificar JWT OK.
- Pendiente: hook pre-save solo se ejercita con guardado real (siguiente tarea: login + seed admin).

## 2026-10-15 — FASE 3 tarea 2 (login/me/roles/seed)

- Arranque crea admin `admin@sigca.local` una vez (segundo arranque: "seed omitido", sin duplicar).
- `POST /api/auth/login` OK (token, rol ADMINISTRADOR); clave mala → 401; sin campos → 400.
- `GET /api/auth/me` con token → 200 sin password; sin token → 401.
- Usuario inactivo creado y borrado tras la prueba: hash en DB (no texto plano) y login → 401.
- `permitir('ADMINISTRADOR')`: rol admin pasa, RECEPCIONISTA → 403.
- Pendiente Fase 3: vista de login + guard de rutas en frontend.

## 2026-10-15 — FASE 3 tarea 3 (login y guard en frontend)

- `npm run build`: OK (48 módulos).
- Flujo real de login en navegador (escribir credenciales, redirección, guard sin token): NO VERIFICADO, requiere prueba manual en `http://localhost:5173/login` (admin@sigca.local / Admin123).

## 2026-10-15 — FASE 4 tarea 1 paso 1 (listar + crear usuarios)

- `GET /api/users` con admin: 200, 1 usuario, sin campo password/hash.
- `POST /api/users` RECEPCIONISTA: 201 sin password; el creado inicia sesión OK.
- Rol inválido → 400; email duplicado → 409; sin token → 401; token RECEPCIONISTA listando → 403.
- Usuario de prueba borrado tras verificar; solo queda el admin. Servidor detenido.

## 2026-10-15 — FASE 4 tarea 1 paso 2 (obtener + actualizar usuarios)

- `GET /api/users/:id`: 200 sin password; id inexistente → 404.
- `PATCH /:id` nombre+rol: OK; rol inválido → 400; autodesactivación → 400; desactivar otro → OK y su login → 401.
- Usuario temporal borrado; DB queda solo con admin. Servidor detenido.

## 2026-10-15 — FASE 4 tarea 1 paso 3 (pantalla de usuarios)

- `npm run build`: OK (50 módulos). Vista `/admin/usuarios` con lista, registro y activar/desactivar.
- Uso real en navegador: NO VERIFICADO (misma limitación que login).

## 2026-10-15 — FASE 4 tarea 2 paso 1 (servicios backend)

- `POST /api/services`: 201; precio decimal → 400; sin token → 401.
- `GET /api/services` público sin token: muestra solo activos (1 → 0 tras desactivar).
- `GET /api/services/admin/todos` con admin: incluye inactivos.
- Servicio de prueba borrado; DB sin servicios. Servidor detenido.

## 2026-10-15 — FASE 4 tarea 2 paso 2 (pantalla de servicios)

- `npm run build`: OK (52 módulos). Vista `/admin/servicios` con lista, registro, edición y activar/desactivar (precio $ ↔ centavos).
- Uso real en navegador: NO VERIFICADO.

## 2026-10-15 — FASE 4 tarea 3 paso 1 (contenido genérico backend)

- Seed idempotente: 7 bloques (mision, vision, nosotros, contacto ×4).
- `GET /api/contenidos` público: 7; `GET /mision`: OK.
- `PATCH` admin cambia cuerpo y el portal lo refleja; luego restaurado al placeholder.
- POST sin token → 401; clave duplicada → 409.
- Diseño: texto libre en genérico; horarios/publicaciones/mensajes irán en modelos propios (siguientes pasos).

## 2026-10-15 — FASE 4 tarea 3 paso 2 (horarios backend)

- Seed idempotente Lun–Vie 08:00–17:00 (público muestra días 1–5).
- Crear sábado 09:00–13:00: 201; día duplicado → 409; inicio mayor que fin → 400.
- PATCH fin+desactivar OK; público vuelve a 5. Sábado de prueba borrado (quedan 5). Servidor detenido.

## 2026-10-15 — FASE 4 tarea 3 paso 3 (publicaciones backend)

- Crear EDUCATIVO + CORPORATIVO: 201; filtro `?tipo=EDUCATIVO` devuelve 1.
- Tipo inválido → 400; desactivar oculta del público (1 visible) pero admin ve 2.
- Limpieza: 2 borradas, quedan 0. Nota: dos intentos de limpieza fallaron por comillas de PowerShell con `$in`; se resolvió con script temporal (borrado tras usar).

## 2026-10-15 — FASE 4 tarea 3 paso 4 (pantalla de contenidos)

- `npm run build`: OK (54 módulos). Vista `/admin/contenidos` edita bloques, horarios y publicaciones.
- Uso real en navegador: NO VERIFICADO.

## 2026-10-15 — FASE 4 cierre + FASE 5 paso 1 (misión/visión en portal)

- Criterio Fase 4 cumplido: cambios en MongoDB reflejados en consultas (verificado por endpoint en cada módulo).
- `npm run build`: OK (54 módulos). HomeView consume `GET /api/contenidos/mision` y `/vision`.
- Verificación conjunta: API devuelve misión; HomeView transforma en dev (len 11849). Servidores detenidos.

## 2026-10-15 — FASE 5 paso 2 (carrusel)

- `npm run build`: OK (56 módulos) tras corregir duplicado de `const salud` y reposición del arreglo (errores propios al editar, detectados por el build).
- Dev sirve las 5 SVG (200). Imágenes placeholder reemplazables en `frontend/public/`.

## 2026-10-15 — FASE 5 paso 3 (servicios/horarios/contacto públicos)

- `npm run build`: OK (62 módulos). Rutas `/servicios`, `/horarios`, `/contacto` consumen la API (nombres de ruta sin colisión con admin).
- Render con datos reales: NO VERIFICADO en navegador.

## 2026-10-15 — FASE 5 paso 4 (formulario de contacto)

- `POST /api/contacto` público: 201; email inválido → 400; mensaje corto → 400.
- `GET /api/contacto` admin: 1 mensaje; sin token → 401; `PATCH leído`: OK.
- Frontend: formulario en ContactoView + build OK (62 módulos). Mensaje de prueba borrado (0). Servidor detenido.

## 2026-10-15 — FASE 5 paso 5 (solicitud de citas)

- `POST /api/solicitudes` público: 201; sin nombre → 400; servicio inválido → 400.
- `GET` admin: 1 PENDIENTE; `PATCH` → ATENDIDA; sin token → 401.
- GET/PATCH permiten ADMINISTRADOR y RECEPCIONISTA (recepción atiende solicitudes).
- Frontend: vista `/solicitar-cita` + build OK (64 módulos). Solicitud de prueba borrada (0). Servidor detenido.

## 2026-10-15 — FASE 5 paso 6 (contenido educativo/corporativo público)

- `npm run build`: OK (66 módulos). Vista `/educativo` con secciones EDUCATIVO y CORPORATIVO (imagen/enlace opcionales).
- Render con datos: NO VERIFICADO en navegador.

## 2026-10-15 — FASE 5 verificación conjunta final (cierre)

### 1. Rutas públicas registradas y navegación
- `/`, `/servicios`, `/horarios`, `/contacto`, `/solicitar-cita`, `/educativo`, `/login` → 200 con HTML que contiene `<div id="app">`.
- Navbar incluye enlaces a todas; carrusel sirve 5 SVG (200).

### 2. APIs públicas respondiendo con datos semilla
- `/api/health`: ok.
- `/api/contenidos` y `/mision` / `/vision`: 7 bloques (seed).
- `/api/services`: 0 (sin seed; lista vacía OK).
- `/api/horarios`: 5 días Lun–Vie (seed).
- `/api/publicaciones?tipo=EDUCATIVO|CORPORATIVO`: 0 (sin seed; lista vacía OK).

### 3. Formularios con validaciones y persistencia real
- **Contacto** (`POST /api/contacto`): 201; email inválido → 400; mensaje <10 → 400; admin lista 1; borrado tras prueba → 0.
- **Solicitud cita** (`POST /api/solicitudes`): 201; sin nombre → 400; servicio inválido → 400; admin/recep lista 1 (PENDIENTE) + PATCH → ATENDIDA; borrado tras prueba → 0.
- Ambas APIs y DB limpias tras pruebas.

### 4. Responsive
- Navbar: menú hamburguesa ≤640px (CSS implementado).
- Layouts flex/columna en mobile.
- No verificado en navegador real (limitación documentada).

### 5. Build
- `npm run build`: OK (66 módulos).

### Criterios de aceptación Fase 5
| Criterio | Estado |
|---|---|
| Página inicio | ✅ |
| Carrusel ≥5 imágenes | ✅ |
| Misión/visión desde MongoDB | ✅ |
| Servicios activos | ✅ (API OK; lista vacía sin seed) |
| Contenido educativo/corporativo | ✅ (API OK; lista vacía sin seed) |
| Horarios y contacto | ✅ |
| Formulario contacto | ✅ (persiste en MongoDB) |
| Formulario solicitud cita | ✅ (persiste en MongoDB) |
| Validaciones front/back | ✅ |
| Admin modifica contenido sin código | ✅ (panel contenidos verificado en FASE 4) |
| Responsive | 🔲 (CSS listo; prueba navegador pendiente) |
| Formularios E2E en navegador | 🔲 (pendiente manual) |

### Limitaciones
- Render visual, interacción y consola en navegador NO verificados (sin automatización).
- Seed de servicios/publicaciones no existe (no requerido por el plan; APIs devuelven lista vacía correcta).

**FASE 5 cerrada con pruebas automatizadas cumplidas; pruebas manuales pendientes documentadas.**

## 2026-10-15 — FASE 6 paso 1 (pacientes y responsables backend)

- Modelos: Patient (edad virtual), Responsible, PatientResponsible (N:M única).
- CRUD pacientes: paginación, búsqueda (q), activación/desactivación (no borrado físico).
- CRUD responsables: mismo patrón.
- Relaciones: asociar/desasociar responsable a paciente; validación menor de 18 años requiere ≥1 responsable activo.
- Búsqueda por nombre/apellidos/teléfono/email funciona.
- Desactivación lógica en ambos modelos.
- Verificado contra MongoDB (node script): edad 16 calculada, asociación OK, menor sin responsable detectado (false), búsqueda Juan 3 resultados, desactivación OK.

## 2026-10-15 — FASE 6 paso 2 (pantallas frontend)

- `PacientesView.vue`: lista paginada, búsqueda, crear/editar/desactivar, enlace a responsables.
- `ResponsablesView.vue`: lista paginada, búsqueda, crear/editar/desactivar.
- `PacienteResponsablesView.vue`: asociar/desasociar responsables; filtra disponibles; avisa si menor sin responsable.
- `npm run build`: OK (72 módulos).
- Uso en navegador: NO VERIFICADO (misma limitación).

## 2026-10-15 — FASE 7 paso 1 (modelo Professional + CRUD)

- Modelo Professional: nombre, apellido, especialidad, teléfono, email, DNI único, matrícula única, activo.
- CRUD completo con paginación, búsqueda (q), filtro por especialidad, activación/desactivación.
- DNI y matrícula únicos (409 en duplicado).
- Filtro por especialidad funcional (sensible a acentos; se usó "Odontologia" sin tilde en seed).
- Verificado: crear 2, listar, filtrar especialidad, DNI duplicado → 400, actualizar, desactivar, sin token → 401.

## 2026-10-15 — FASE 7 paso 2 (citas: atender solicitudes, crear, reprogramar, estados)

- Modelo Appointment: paciente, profesional, servicio, inicio/fin, precio/duración históricos, estado con transiciones, observaciones, solicitudOrigen.
- Reglas de negocio validadas (función `validarDisponibilidad`):
  - No citas en fechas/horas pasadas ✅
  - Respeta horarios de atención (Schedule) ✅
  - Bloquea traslape para mismo profesional ✅
  - Valida profesional/servicio/paciente activos ✅
  - Valida menor de edad con responsable ✅
- Transiciones de estado (controller): PROGRAMADA→CONFIRMADA/REPROGRAMADA/CANCELADA; CONFIRMADA→REPROGRAMADA/CANCELADA/COMPLETADA/NO_ASISTIO; REPROGRAMADA→CONFIRMADA/CANCELADA. Transiciones inválidas bloqueadas ✅.
- Endpoints: GET/POST /api/citas, POST /api/citas/solicitudes/:id/atender, PATCH /:id/estado, PATCH /:id/reprogramar. Todos protegidos ADMIN+RECEPCIONISTA.
- Verificación con script node: disponibilidad, traslape, horario, fecha pasada, transiciones permitidas/bloqueadas — todo OK.

## 2026-10-15 — FASE 8 paso 1 (FullCalendar frontend)

- `npm install @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/vue3`: OK.
- `CalendarioView.vue`: vista `/admin/calendario` con FullCalendar (dayGridMonth/Week/Day), eventos desde `/api/citas?desde&hasta`, colores por estado, click → detalle modal (alert).
- `npm run build`: OK (120 módulos).
- API `/api/citas?desde&hasta` verificada con 5 citas de prueba en octubre 2026; devuelve datos correctos con populate de paciente/servicio.
- Render en navegador: NO VERIFICADO.

## 2026-10-15 — FASE 8 paso 2 (CalendarioView mejorada)

- Modal de detalle en vez de `alert()` con información completa (paciente, profesional, servicio, fechas, estado con badge de color, observaciones).
- Filtros en UI: profesional (select), estado (select), rango de fechas (inputs date) — recargan eventos al cambiar.
- Leyenda de colores por estado visible.
- `getProfesionales` agregado al cliente API.
- `npm run build`: OK (120 módulos).
- Render en navegador: NO VERIFICADO.
- FASE 8 cerrada.

## 2026-10-15 — FASE 9 paso 1 (modelo EducationalMaterial + CRUD)

- Modelo EducationalMaterial: título, descripción, tipo (DOCUMENTO/VIDEO/ENLACE/OTRO), URL, archivoNombre, activo.
- CRUD con paginación, búsqueda (q), filtro por tipo, activación/desactivación.
- Tipos válidos: DOCUMENTO, VIDEO, ENLACE, OTRO.
- Permisos: ADMINISTRADOR, RECEPCIONISTA, PROFESIONAL (primera ruta abierta a PROFESIONAL).
- Verificado: crear, listar, filtrar por tipo, actualizar, desactivar, sin token → 401.

## 2026-10-15 - FASE 9 paso 2 (asignacion de materiales a pacientes)

- Modelo PatientMaterial (N:M paciente-material): notas, fechaAsignacion, activo; indice unico (paciente, material).
- Endpoints: GET/POST /api/pacientes/:pacienteId/materiales, PATCH /api/pacientes/:pacienteId/materiales/:relacionId/desasignar (permisos ADMINISTRADOR/RECEPCIONISTA/PROFESIONAL).
- Verificado contra MongoDB real: crear paciente+material, asignar (201), listar con populate, duplicado (409), desasignar (activo=false), listar activas=0, reasignar reactiva la relacion (activo=true, notas actualizadas), sin token (401), pacienteId invalido (404).
- Frontend: MaterialesView.vue (CRUD: crear/editar/activar-desactivar, busqueda q, filtro tipo, paginacion) y PacienteMaterialesView.vue (asignar/desasignar a paciente); cliente API ampliado (getPaciente, getMateriales, createMaterial, updateMaterial, desactivarMaterial, getMaterialesPaciente, asignarMaterial, desasignarMaterial).
- npm run build: OK (126 modulos).
- Correccion de rutas: pantallas admin movidas de '/' a '/admin' (protegidas con requiereAuth); restaurados imports faltantes (PacienteResponsablesView en router, reactive en PacienteResponsablesView.vue).
- Render en navegador: NO VERIFICADO.

## 2026-10-15 - FASE 10 paso 1 (modelo Payment + endpoints)

- Modelo Payment: cita, paciente (desnormalizado), montoCentavos (entero), metodo (EFECTIVO/TARJETA/TRANSFERENCIA/OTRO), fecha, estado (ACTIVO/ANULADO), motivoAnulacion, anuladoEn, notas, registradoPor.
- Endpoints (ADMINISTRADOR/RECEPCIONISTA): GET /api/pagos (filtros cita/paciente/metodo/estado/desde/hasta + paginacion), GET /api/pagos/:id, GET /api/pagos/citas/:citaId/saldo, POST /api/pagos, PATCH /api/pagos/:id/anular.
- Reglas de saldo: PENDIENTE (0 pagado), PARCIAL (0 < pagado < precio), PAGADO (pagado == precio). Nunca supera el costo.
- Verificado contra MongoDB real (cita de 20000 centavos): saldo inicial PENDIENTE; pago parcial 5000 -> PARCIAL (saldo 15000); monto que excede saldo -> 400; monto no entero (100.5) -> 400; metodo invalido -> 400; pago del resto -> PAGADO (saldo 0); pago con saldo 0 -> 400; anular pago (motivo requerido) -> estado ANULADO y saldo recalculado a PARCIAL (5000); anular sin motivo -> 400; anular ya anulado -> 409; pago sobre cita CANCELADA -> 400; listar pagos por cita -> 2 (1 ACTIVO, 1 ANULADO); sin token -> 401.
- eq.usuario del middleware auth usado para registradoPor.
- Render/pantalla de pagos: PENDIENTE (paso siguiente).

## 2026-10-15 - FASE 10 paso 2 (pantalla de pagos)

- PagosView.vue (/admin/pagos): buscar citas (estado + rango de fechas, paginado), seleccionar cita, ver saldo (precio/pagado/saldo + badge PENDIENTE/PARCIAL/PAGADO), registrar pago (monto en unidades -> convertido a centavos, metodo, notas) y anular pago (motivo obligatorio via prompt).
- Cliente API ampliado: getPagos, getSaldoCita, createPago, anularPago.
- Ruta /admin/pagos + enlace en AdminLayout.
- npm run build: OK (128 modulos).
- Render e interaccion en navegador: NO VERIFICADO.

## 2026-10-15 - FASE 11 paso 1 (caja diaria: apertura/cierre/totales/bloqueos)

- Modelo CashSession: estado (ABIERTA/CERRADA), abiertaPor, fechaApertura, montoInicialCentavos, observacionesApertura; cerradaPor, fechaCierre, totalesPorMetodo {EFECTIVO,TARJETA,TRANSFERENCIA,OTRO}, totalEsperadoCentavos, totalRealCentavos, diferenciaCentavos, observacionesCierre.
- Endpoints (ADMINISTRADOR/RECEPCIONISTA): GET /api/caja (filtros + paginado), GET /api/caja/abierta, GET /api/caja/:id, POST /api/caja/abrir, POST /api/caja/:id/cerrar.
- Regla: solo una caja ABIERTA a la vez. Al cerrar: totales por metodo desde pagos ACTIVO del rango, esperado = montoInicial + cobrado, diferencia = real - esperado.
- Bloqueo post-cierre: no se registran pagos ni se anulan pagos cuya fecha cae dentro de la ventana [fechaApertura, fechaCierre] de una caja CERRADA (retroactivos).
- Verificado contra MongoDB real: caja abierta (201, inicial 10000); abrir otra -> 409; pagos EFECTIVO 3000 + TARJETA 2000 durante la sesion; cierre con real 14500 y esperado 15000 -> dif -500; totales EFECTIVO=3000 TARJETA=2000; cerrar de nuevo -> 409; /api/caja/abierta -> null tras cerrar; registrar pago con fecha dentro de caja cerrada -> 409; anular pago de la sesion -> 409; listar cajas -> 1; sin token -> 401.
- Nota: montos en centavos; arqueo de un solo total (no por metodo) en esta version.

## 2026-10-15 - FASE 11 paso 2 (pantalla de caja)

- CajaView.vue (/admin/caja): estado actual (caja abierta o ninguna), abrir caja (monto inicial en unidades -> centavos, observaciones), preview de cobros de la sesion por metodo (pagos ACTIVO desde fechaApertura), cerrar caja (total real contado, observaciones) y mensaje con la diferencia calculada, historial de cajas con totales por metodo y diferencia coloreada.
- Cliente API ampliado: getCajaAbierta, getCajas, abrirCaja, cerrarCaja.
- Ruta /admin/caja + enlace en AdminLayout.
- npm run build: OK (130 modulos).
- Render e interaccion en navegador: NO VERIFICADO.

## 2026-10-15 - FASE 12 paso 1 (seed de demostracion idempotente)

- Archivo backend/src/utils/seedDemo.js + runner backend/seedDemo.js (npm run seed:demo / seed:demo:dry).
- Claves estables: campos unicos naturales (email User/Patient/Responsible, nombre Service, dni Professional, titulo EducationalMaterial) + marcadores [seedDemo:clave] en texto (Appointment.observaciones, Payment.notas, CashSession.observacionesApertura, AppointmentRequest.mensaje).
- Sin operaciones destructivas: no usa deleteMany/deleteOne; si la clave existe, omite; no cambia contrasenas ni desactiva usuarios; no sobrescribe ajenos.
- Dry-run (solo lectura) imprime la base seleccionada (sigca @ localhost:27017) y el plan.
- Ejecucion 1 (aplicar): 30 creados, 1 omitido (admin). Ejecucion 2: 0 creados, 31 omitidos (idempotencia confirmada).
- Verificacion por consultas a MongoDB (script temporal, luego eliminado): citas=4, pagos=4, cajas=2, solicitudes=2, pacientes=3, responsables=1, materiales=3, servicios=4, profesionales=2, usuarios demo=2; sin duplicados por marcador.
- Coherencia financiera: cita-01 PAGADO (25000<=25000), cita-02 PARCIAL (15000<=30000), cita-03 PENDIENTE (0), cita-04 PENDIENTE con 1 pago ANULADO.
- Coherencia de caja: caja CERRADA suma pagos ACTIVOS ventana=35000; esperado=20000+35000=55000; diferencia=-500; exactamente 1 caja ABIERTA.
- Referencias validas: pagos->cita/paciente, citas->paciente/profesional/servicio, relaciones paciente-responsable y paciente-material.
- Usuarios demo: contrasenas hasheadas (bcrypt, no texto plano); admin intacto y activo.
- Login real: recepcion.demo@demo.sigca / Demo1234 -> RECEPCIONISTA (200 en /api/caja/abierta); profesional.demo@demo.sigca / Demo1234 -> PROFESIONAL (403 en /api/caja); password incorrecta -> 401.
- Limitacion: el seed no se ejecuta automaticamente al arrancar el backend (es opt-in). Las fechas de citas son relativas a 'hoy' (proximo dia laborable); la clave estable es el marcador, no la fecha.

# AUDITORÍA FUNCIONAL REAL (2026-10-16)

Auditoría solicitada por el usuario. **No se corrigió ningún defecto** durante esta etapa. No se modificó la base de datos de desarrollo `sigca`, ni variables de entorno, ni configuración externa.

## Método y entorno

- Entorno detenido/limpiado antes y después: se verificó que los puertos 3000, 5173 y 27017 estaban libres (salvo `mongod` en 27017, que se preservó). No había procesos que preservar.
- Etapa A: contraste real contra el backend de desarrollo (`sigca @ localhost:27017`, puerto 3000) y `npm run build` del frontend.
- Etapas B–G: se ejecutó un **arnés de auditoría aislado** (`backend/audit-harness.mjs`, eliminado al terminar). Arrancó el `app.js` real (`app.listen(3999)`) sobre una **base de auditoría dedicada y desechable** `sigca_audit` (datos 100% ficticios), creada y **eliminada** al finalizar. Esto garantiza pruebas reales por HTTP + MongoDB sin tocar la base de desarrollo ni la caja abierta existente.
- Las pruebas destructivas (abrir/cerrar caja, anular pagos) se hicieron SOLO sobre `sigca_audit`.
- Etapa H (navegador): sin navegador disponible → todo lo visual queda como **BLOQUEADA / pendiente de verificación manual** (no se sustituye por compilar).

## ETAPA A — Entorno (ejecutado)

| ID | Comprobación | Resultado observado | Estado | Método |
|---|---|---|---|---|
| A01 | Frontend instala y compila | `npm run build` OK (130 módulos, `dist/` generado) | APROBADA | Comando real |
| A02 | Backend arranca | `node server.js` → "Conectado a MongoDB" + "SIGCA backend en http://localhost:3000" | APROBADA | Comando real |
| A03 | MongoDB conecta realmente | `mongosh` ping `{ ok: 1 }` + log de conexión del backend | APROBADA | Comando real (sin exponer credenciales) |
| A04 | Express responde | `GET /api/health` → `{"ok":true,...}`; `GET /api/noexiste` → 404; validaciones → 400 | APROBADA | HTTP |
| A05 | Modelos y consultas usables | `GET /api/services`→5, `/api/contenidos`→7, y CRUD completo en el arnés | APROBADA | HTTP + Mongo |
| A06 | Variables de entorno documentadas | `backend/.env.example` y `frontend/.env.example` existen. **`backend/.env` NO existe** → el backend corre con los defaults de `src/config/env.js` | APROBADA con observación | Inspección + arranque |
| A07 | Frontend apunta al backend correcto | `frontend/.env` → `VITE_API_URL=http://localhost:3000`; `client.js` usa la misma por defecto | APROBADA | Inspección |
| A08 | Errores de conexión gestionados | Backend: si falla `connectDB` hace `console.error` + `process.exit(1)` (revisión de código, **no ejecutado**). JSON malformado → 400 (Express, cuerpo vacío). | PARCIAL / NO EJECUTADA (fallo de Mongo no forzado) | Inspección |

Observación A06: `backend/.env.example` propone `ADMIN_PASSWORD=Cambiar123` y `JWT_SECRET=cambiar-por-un-secreto-largo`, pero como **no existe `backend/.env`** el runtime usa los defaults de `env.js` (`admin@sigca.local` / `Admin123` y secreto de desarrollo). El README documenta `Admin123`. Hay inconsistencia entre `.env.example` y el valor real por defecto.

## ETAPAS B–G — Resultados de pruebas ejecutadas (84 pruebas)

Estado: **79 APROBADA · 4 FALLIDA · 1 NO EJECUTADA · 0 BLOQUEADA**. Todas las pruebas HTTP se ejecutaron contra el `app.js` real y se confirmaron consultando MongoDB.

### Seguridad y permisos (Etapa D)

| ID | Escenario | Esperado | Observado | Estado | Método | Evidencia / Defecto |
|---|---|---|---|---|---|---|
| D01 | Endpoint privado sin token | 401 | 401 | APROBADA | HTTP | `/api/pacientes` |
| D02 | Token inválido | 401 | 401 | APROBADA | HTTP | `/api/auth/me` |
| D03 | Token vencido | 401 | 401 | APROBADA | HTTP+jwt | token `exp` vencido |
| D04 | Recepcionista accede a usuarios | 403 | 403 | APROBADA | HTTP | `/api/users` |
| D05 | Profesional accede a pacientes | 403 | 403 | APROBADA | HTTP | `/api/pacientes` |
| D06 | Profesional crea citas | 403 | 403 | APROBADA | HTTP | `POST /api/citas` |
| D07 | Profesional accede a caja | 403 | 403 | APROBADA | HTTP | `/api/caja` |
| D08 | Profesional registra pagos | 403 | 403 | APROBADA | HTTP | `POST /api/pagos` |
| D09 | Admin lista usuarios | 200 | 200 | APROBADA | HTTP | `/api/users` |
| D10 | Recepcionista modifica usuarios | 403 | 403 | APROBADA | HTTP | `PATCH /api/users/:id` |
| D11 | Login usuario inactivo | 401 | 401 | APROBADA | HTTP | usuario `activo:false` |
| D12 | Login no expone password/hash | sin password | sin password | APROBADA | HTTP | revisión de respuesta |
| D13 | Listado usuarios sin password | sin password | sin password | APROBADA | HTTP | revisión de campos |
| D14 | Validación de datos (paciente incompleto) | 400 | 400 | APROBADA | HTTP | `POST /api/pacientes` |
| D15 | Profesional consulta materiales (permitido por diseño) | 200 | 200 | APROBADA | HTTP | `/api/materiales` |
| **D16** | **Profesional CREA materiales** | 403 (si es exclusivo admin) | **201** | **FALLIDA** | HTTP | `POST /api/materiales` permite PROFESIONAL (ruta `permitir('ADMINISTRADOR','RECEPCIONISTA','PROFESIONAL')`). Confirmar intención o restringir. |
| D17 | Recepcionista crea usuario admin | 403 | 403 | APROBADA | HTTP | `POST /api/users` |
| D18 | Recepcionista `/me` | 200 | 200 | APROBADA | HTTP | `/api/auth/me` |

### Portal público, contenido y solicitudes (Etapas B/C)

| ID | Escenario | Esperado | Observado | Estado | Método | Evidencia / Defecto |
|---|---|---|---|---|---|---|
| C01 | Enviar contacto válido | 201 | 201 | APROBADA | HTTP | `POST /api/contacto` |
| C02 | Contacto persiste en MongoDB | aparece | aparece | APROBADA | HTTP+Mongo | `GET /api/contacto` (admin) |
| C03 | Contacto inválido rechazado | 400 | 400 | APROBADA | HTTP | email/mensaje inválidos |
| C04 | Crear solicitud de cita | 201 | 201 | APROBADA | HTTP | `POST /api/solicitudes` |
| C05 | Solicitud persiste | aparece | aparece | APROBADA | HTTP+Mongo | `GET /api/solicitudes` |
| C06 | Contenido institucional público | 200 lista | 200 (0 en BD auditoría) | APROBADA | HTTP | `/api/contenidos` |
| C07 | Horarios públicos | 200 | 200 | APROBADA | HTTP | `/api/horarios` |
| C08 | Publicaciones públicas | 200 | 200 | APROBADA | HTTP | `/api/publicaciones` |
| **C09** | **Atender solicitud → crear cita** | 201 (conversión) | **500** `Patient validation failed: apellido required` | **FALLIDA** | HTTP+Mongo | `POST /api/citas/solicitudes/:id/atender`. **Doble defecto:** (1) `AppointmentRequest` NO tiene campo `profesional` y no hay endpoint para asignarlo; (2) al intentar crear el paciente desde la solicitud falta `apellido` → error 500 no controlado. El flujo recepción "solicitud → cita" no es utilizable. |

### Citas — reglas de negocio (Etapa E)

| ID | Escenario | Esperado | Observado | Estado | Método | Evidencia |
|---|---|---|---|---|---|---|
| E01 | Crear cita válida | 201 | 201 | APROBADA | HTTP | `POST /api/citas` |
| E02 | Cálculo de hora final | fin = inicio+duración | `2026-10-16T15:30:00Z` | APROBADA | HTTP+Mongo | fin correcto |
| E03 | Precio histórico copiado | 20000 | 20000 | APROBADA | HTTP | `cita.precioCentavos` |
| E04 | Traslape mismo profesional | 400 | 400 | APROBADA | HTTP | "ya tiene una cita" |
| E05 | Mismo horario, otro profesional | 201 | 201 | APROBADA | HTTP | — |
| E06 | Cita fuera de horario (07:00) | 400 | 400 | APROBADA | HTTP | "fuera del horario de atención" |
| E07 | Cita en el pasado | 400 | 400 | APROBADA | HTTP | "fechas u horas pasadas" |
| E08 | Paciente inactivo | 400 | 400 | APROBADA | HTTP | "no encontrado o inactivo" |
| E09 | Servicio inactivo | 400 | 400 | APROBADA | HTTP | "no encontrado o inactivo" |
| E10 | Profesional inactivo | 400 | 400 | APROBADA | HTTP | "no encontrado o inactivo" |
| E11 | Menor sin responsable | 400 | 400 | APROBADA | HTTP | "menor de 18 años debe tener responsable" |
| E12 | Reprogramar cita | 200 REPROGRAMADA | 200/REPROGRAMADA | APROBADA | HTTP | — |
| E13 | Cancelar cita | 200 CANCELADA | 200/CANCELADA | APROBADA | HTTP | — |
| E14 | Completar cita cancelada | 400 | 400 | APROBADA | HTTP | transición bloqueada |
| E15 | Reprogramar cita completada | 400 | 400 | APROBADA | HTTP | transición bloqueada |
| E16 | Precio original si cambia el servicio | precio sin cambios | 20000→20000 | APROBADA | HTTP | cambio de precio del servicio no altera cita |

### CRUD de módulos (Etapa C, módulos 8–14)

| ID | Escenario | Esperado | Observado | Estado | Método |
|---|---|---|---|---|---|
| M01 | Crear paciente válido | 201 | 201 | APROBADA | HTTP |
| M02 | Persistencia y edad virtual | 200 + edad | 200, edad=8 | APROBADA | HTTP+Mongo |
| M03 | Crear responsable | 201 | 201 | APROBADA | HTTP |
| M04 | Asociar responsable a paciente | 201 | 201 | APROBADA | HTTP |
| M05 | Evitar relación duplicada | 409 | 409 | APROBADA | HTTP |
| M06 | Crear profesional | 201 | 201 | APROBADA | HTTP |
| M07 | Crear servicio (admin) | 201 | 201 | APROBADA | HTTP |
| M08 | Crear horario (admin) | 201 | 201 | APROBADA | HTTP |
| M09 | Crear publicación (admin) | 201 | 201 | APROBADA | HTTP |
| M10 | Crear material (admin) | 201 | 201 | APROBADA | HTTP |
| M11 | Asignar material a paciente | 201 | 201 | APROBADA | HTTP |
| M12 | Material asignado visible | aparece | aparece | APROBADA | HTTP+Mongo |
| M13 | Admin crea usuario | 201 | 201 | APROBADA | HTTP |
| M14 | Email duplicado rechazado | 409 | 409 | APROBADA | HTTP |
| M15 | Listado de citas filtrado (base del calendario) | 200 | 200 | APROBADA | HTTP |

### Pagos y caja (Etapa F) — cantidades conocidas

Precio de cita de prueba: 20000 centavos. Caja: monto inicial 10000.

| ID | Escenario | Esperado | Observado | Estado | Método | Evidencia / Defecto |
|---|---|---|---|---|---|---|
| **F01** | **Pago sin caja abierta** | rechazar (400/409) | **201** | **FALLIDA** | HTTP | El sistema permite registrar pagos aunque no exista una `CashSession` ABIERTA. No valida sesión activa. |
| F02 | Abrir caja | 201 | 201 | APROBADA | HTTP | — |
| F03 | Abrir segunda caja | 409 | 409 | APROBADA | HTTP | una sola ABIERTA |
| F04 | Abono parcial | 201 PARCIAL | 201/PARCIAL | APROBADA | HTTP | — |
| F05 | Segundo abono liquida saldo | 201 PAGADO | 201/PAGADO | APROBADA | HTTP | 5000+15000=20000 |
| F06 | Pago cero | 400 | 400 | APROBADA | HTTP | — |
| F07 | Pago negativo | 400 | 400 | APROBADA | HTTP | — |
| F08 | Pago mayor al saldo (saldo 0) | 400 | 400 | APROBADA | HTTP | "supera el saldo pendiente" |
| F09 | Comprobante único (recibo) | entidad/endpoint | no existe | NO EJECUTADA | Revisión | No hay modelo ni endpoint de comprobante/recibo. Funcionalidad ausente. |
| F10 | Anular sin motivo | 400 | 400 | APROBADA | HTTP | — |
| F11 | Anulación no autorizada (profesional) | 403 | 403 | APROBADA | HTTP | — |
| F12 | Anulación autorizada con justificación | 200 ANULADO | 200/ANULADO | APROBADA | HTTP | motivo + `anuladoEn` |
| F13 | Historial de anulados se conserva | sigue ANULADO | 200/ANULADO | APROBADA | HTTP+Mongo | no se borra |
| F14 | Saldo tras anulación | PENDIENTE | PENDIENTE | APROBADA | HTTP | saldo recalculado |
| F15 | Caja abierta recuperable | 200 con `_id` | 200 | APROBADA | HTTP | `/api/caja/abierta` |
| F16 | Totales por método en cierre | EFECTIVO 5000, TARJETA 15000 | EFECTIVO 5000, TARJETA 15000 | APROBADA | HTTP+Mongo | snapshot de cierre |
| F17 | Total esperado y diferencia | esperado 30000 | esperado 30000, real 30000, dif 0 | APROBADA | HTTP | `totalEsperado=montoInicial+cobrado` |
| F18 | Bloqueo de anulación post-cierre | 409 | 409 | APROBADA | HTTP | pago ACTIVO dentro de caja CERRADA |
| F19 | Bloqueo de pago dentro de caja cerrada | 409 | 409 | APROBADA | HTTP | retroactivo bloqueado |
| **F20** | **Cancelar cita con pagos válidos** | rechazar (400) | **200** | **FALLIDA** | HTTP | Se permite cancelar una cita que tiene pagos ACTIVO; no hay restricción. |

### Datos de prueba — Seed (Etapa G)

| ID | Escenario | Esperado | Observado | Estado | Método |
|---|---|---|---|---|---|
| G01 | Seed crea registros | total aumenta | 34 → 65 | APROBADA | script+Mongo |
| G02 | Seed idempotente (2ª ejecución) | no crea | 65 → 65 | APROBADA | script+Mongo |
| G03 | Sin claves naturales duplicadas | únicas (1) | ok | APROBADA | Mongo |
| G04 | Referencias válidas (citas/pagos) | 0 inválidas | 0 | APROBADA | Mongo |
| G05 | Coherencia financiera (pagos ≤ precio) | 0 inconsistencias | 0 | APROBADA | Mongo |
| G06 | Credenciales demo de 3 roles | login 200 | recep 200 / prof 200 | APROBADA | HTTP |

Nota G (defecto menor de código): `seedDemo.js` guarda `creados/omitidos/plan` en variables de **módulo** (no se reinician por llamada). Al invocarlo dos veces en el **mismo proceso**, los contadores se acumulan (la 2ª llamada reporta mal), aunque **la BD sí es idempotente** (comprobado por conteo real: 65→65). El runner CLI (un proceso por ejecución) no se ve afectado.

## ETAPA H — Interfaz y experiencia de usuario: BLOQUEADA

Sin navegador ni automatización disponible. **No verificado** (no se marca como aprobado):

- Login/cierre de sesión en navegador, redirección y guard de rutas protegidas.
- Navegación por rutas públicas y administrativas.
- Formularios, botones, filtros y acciones de cada vista.
- Mensajes de error/confirmación en UI; ausencia de falsos mensajes de éxito.
- Diseño escritorio/móvil (CSS responsive implementado, sin comprobar).
- Errores de consola y peticiones HTTP fallidas desde el navegador.

El lado servidor de cada módulo sí fue verificado (Etapas B–G). La capa de presentación queda **pendiente de verificación manual**.

## ETAPA I — Documentación y entregables

| Elemento | Estado observado | Estado |
|---|---|---|
| README de instalación/ejecución | Completo (stack, requisitos, instalación, env, ejecución, seed, credenciales, índice de docs) | APROBADA |
| Configuración MongoDB / env | `backend/.env.example` y `frontend/.env.example` presentes; `backend/.env` ausente → defaults | APROBADA con observación (A06) |
| Credenciales demo ficticias | Documentadas en README (`Admin123`, `Demo1234`); login verificado | APROBADA |
| Comandos de ejecución | Documentados y verificados (`npm run dev`, `npm run build`, `node server.js`, `npm run seed:demo`) | APROBADA |
| **Colección Postman** | **No existe** en el repositorio (buscada recursivamente). `ESTADO_PROYECTO.md` la lista como pendiente de Fase 14 | **FALLIDA (entregable ausente)** |
| Script de datos de prueba | `backend/seedDemo.js` + scripts npm `seed:demo`/`seed:demo:dry` | APROBADA |
| Estructura de carpetas | Monorepo `backend/` + `frontend/` + `docs/` coherente | APROBADA |
| Ausencia de secretos en Git | Repo git SIN commits (rama `master` vacía, nada rastreado). **No existe `.gitignore`** en ninguna carpeta | **FALLIDA (riesgo)** |
| Evidencias | `docs/PRUEBAS.md` (este documento) + `docs/ESTADO_PROYECTO.md` | APROBADA |

Detalle Git: `git status` muestra `backend/`, `frontend/`, `docs/` y archivos raíz sin rastrear; sin `.gitignore`, un `git add .` incluiría `node_modules/` y `frontend/.env` (que existe y está protegido por el harness). No hay `.env` real con secretos en Git porque no hay commits, pero el riesgo existe.

## Resumen de la auditoría

- **Ejecutadas:** 84 (HTTP real + consultas MongoDB + build + seed).
- **APROBADA:** 79 · **FALLIDA:** 4 (D16, C09, F01, F20) · **NO EJECUTADA:** 1 (F09) · **BLOQUEADA:** 0.
- **Incompletas/ausentes:** comprobante/recibo de pago (F09), conversión solicitud→cita (C09), restricción de pago sin caja (F01), restricción de cancelación con pagos activos (F20), colección Postman, `.gitignore`.
- **UI (Etapa H):** toda pendiente de verificación manual.

(El plan de corrección priorizado se entrega en la respuesta al usuario; no se aplicaron correcciones en esta etapa.)

## 2026-10-16 — Corrección F20 (cancelar cita con pagos ACTIVO)

Primer defecto corregido tras la auditoría. Seleccionado por ser el **de mayor prioridad que puede corregirse de forma aislada** (C09, de prioridad superior, requiere cambios coordinados en modelo+ruta+controlador y no es aislable). Se corrigió únicamente F20.

### Problema (evidencia)

- Auditoría, prueba **F20**: cancelar una cita que tenía un pago `ACTIVO` devolvía **200** (se cancelaba) en lugar de rechazarse. Reproducido en la BD de auditoría `sigca_audit`.
- Prueba de reproducción aislada (base dedicada y desechable `sigca_test_cancel`, puerto 3998): `F20b` → observado **200** (FALL). Las regresiones R1–R6 pasaban antes.

### Reproducción

1. Registrar una cita y un pago `ACTIVO` sobre ella (`POST /api/pagos`).
2. `PATCH /api/citas/:id/estado` con `{ "estado": "CANCELADA" }`.
3. **Antes:** `200 { ok:true, cita:{ estado:"CANCELADA" } }` con el pago aún `ACTIVO`. **Después:** `409` con mensaje de rechazo.

### Causa y archivos implicados

- `backend/src/controllers/appointments.controller.js` → `cambiarEstadoCita()`: validaba la transición de estado (`validarTransicion`) pero **no consultaba los pagos** de la cita. No existía ninguna regla que impidiera cancelar con pagos válidos.
- Único archivo modificado: ese controlador (se añadió el import del modelo `Payment` y la verificación). No se tocaron modelos, rutas ni frontend.

### Prueba que demuestra el fallo (y su corrección)

Ejecutada contra el `app.js` real sobre la BD desechable `sigca_test_cancel` (script temporal, eliminado tras verificarse):

| ID | Caso | Esperado | Antes | Después |
|---|---|---|---|---|
| F20a | Registrar pago ACTIVO | 201 | 201 | 201 |
| **F20b** | **Cancelar cita con pago ACTIVO** | **409 (rechazo)** | **200 (FALL)** | **409 (OK)** |
| R1 | Cancelar cita **sin** pagos | 200 CANCELADA | OK | OK |
| R2 | PROGRAMADA→CONFIRMADA→COMPLETADA | 200/200 | OK | OK |
| R3 | Transición inválida (COMPLETADA→PROGRAMADA) | 400 | OK | OK |
| R4 | Registrar pago y saldo PAGADO | 201/PAGADO | OK | OK |
| R5 | Tras anular el pago, la cita sí se cancela | 200 CANCELADA | OK | OK |
| R6 | Reprogramar cita | 200 REPROGRAMADA | OK | OK |

Resultado tras la corrección: **las 8 comprobaciones pasan** (0 fallos). La BD `sigca_test_cancel` se elimina automáticamente al terminar.

### Alcance / no regresión

- El check solo se activa cuando el nuevo estado es `CANCELADA`; afecta únicamente a `PATCH /api/citas/:id/estado`.
- Se permite cancelar si **todos** los pagos están `ANULADO` (R5).
- El frontend **no** expone cambio de estado de citas (no hay botón de cancelar; solo filtro en el calendario), por lo que no hay impacto en UI y no se modificó ningún archivo de frontend.
- Comprobado que la BD de desarrollo `sigca` no se tocó y que la BD de prueba quedó eliminada.

## 2026-10-16 — Corrección F01 (registrar pagos sin caja ABIERTA)

Segundo defecto corregido tras la auditoría, autorizado expresamente. Se corrigió **únicamente F01** (no se tocó frontend ni otros módulos).

### Problema (evidencia)

- Auditoría, prueba **F01**: registrar un pago sin ninguna `CashSession` en estado `ABIERTA` devolvía **201** (se registraba) en lugar de rechazarse.
- Efecto colateral observado (consecuencia del defecto): al permitirse pagos fuera de caja, el cierre de caja dejaba de cuadrar (los pagos previos a la apertura quedaban fuera del arqueo) y se podía superar el saldo de la cita de forma inconsistente.

### Reproducción

1. Sin abrir ninguna caja, `POST /api/pagos` con una cita programada.
2. **Antes:** `201 { ok:true, pago:{...} }`. **Después:** `409` con mensaje de rechazo.

### Causa y archivos implicados

- `backend/src/controllers/payments.controller.js` → `registrarPago()`: validaba cita, saldo y caja **cerrada**, pero **no exigía una caja abierta**.
- Archivos modificados:
  - `backend/src/controllers/cash.controller.js`: nuevo helper exportado `cajaAbiertaActual()` (devuelve la sesión `ABIERTA` o `null`).
  - `backend/src/controllers/payments.controller.js`: se importa y usa el helper; si no hay caja abierta → **409**.
- No se modificaron modelos, rutas ni frontend.

### Prueba que demuestra el fallo (y su corrección)

Ejecutada contra el `app.js` real sobre la BD desechable `sigca_test_f01` (puerto 3997; script temporal, eliminado tras verificarse):

| ID | Caso | Esperado | Antes | Después |
|---|---|---|---|---|
| **F01a** | **Registrar pago sin caja ABIERTA** | **409** | **201 (FALL)** | **409 (OK)** |
| F01b | Abrir caja | 201 ABIERTA | OK | OK |
| F01c | Pago con caja abierta (saldo parcial) | 201 PARCIAL | OK | OK |
| F01d | Liquidar saldo con caja abierta | 201 PAGADO | **400 (FALL)** | 201/PAGADO (OK) |
| F01e | Pagos asociados a su caja (arqueo) | EFECTIVO 5000 / TARJETA 15000 / esperado 30000 / dif 0 | **incorrecto (TARJETA 0, dif 15000)** | **correcto** |
| F01f | Pagos dentro de la ventana de la caja (MongoDB) | 2 | **1 (FALL)** | 2 (OK) |
| F01g | Tras cerrar la caja, nuevo pago se rechaza | 409 | **201 (FALL)** | 409 (OK) |
| R1 | Abrir una nueva caja tras cerrar la anterior | 201 | OK | OK |
| R2 | Pago retroactivo dentro de caja CERRADA | 409 | OK | OK |
| R3 | Pago normal en caja abierta | 201 | OK | OK |
| R4 | Anular pago de caja CERRADA | 409 | OK | OK |
| R5 | Anular pago de caja ABIERTA | 200 ANULADO | OK | OK |
| R6 | Cancelar cita con pago ACTIVO (F20) | 409 | OK | OK |
| R7 | Cancelar cita sin pagos | 200 CANCELADA | OK | OK |
| R8 | Saldo tras anulación coherente | PENDIENTE | OK | OK |

Resultado: **antes** 5 fallos atribuibles al defecto (F01a, F01d, F01e, F01f, F01g) y regresión en verde; **después** las **15 comprobaciones pasan** (0 fallos). La BD `sigca_test_f01` se elimina automáticamente al terminar.

Nota: F01d/F01e/F01f no eran fallos independientes, sino la **consecuencia en cadena** del pago colado sin caja (superaba el saldo y descuadraba el arqueo). Tras la corrección desaparecen.

### Alcance / no regresión

- La nueva verificación (`cajaAbiertaActual`) solo se ejecuta en `POST /api/pagos`; afecta únicamente a registrar pagos.
- Se mantiene el bloqueo post‑cierre existente (pagos/anulaciones con fecha dentro de una caja cerrada) — verificado en R2 y R4.
- Las reglas de cancelación de citas siguen intactas (R6 = 409 con pago activo; R7 = 200 sin pagos).
- El frontend **ya muestra** los errores del backend (`PagosView.vue` hace `error.value = e.message`), por lo que el nuevo 409 se presenta al usuario **sin modificar la UI**.
- Comprobado que la BD de desarrollo `sigca` conserva sus datos (usuarios=3, citas=9, pagos=9, cajas=3) y que la BD de prueba quedó eliminada.

## 2026-10-16 — Reproducción y corrección C09 (atender solicitud → cita)

Tercer defecto en revisión. Se autorizó corregir **C09** (el flujo "atender solicitud → cita" devuelve HTTP 500). Se reprodujo el fallo con evidencia real, pero **no se modificó código**: la causa raíz revela una **decisión funcional ambigua** (de dónde salen el `profesional` y los datos obligatorios del paciente), y la instrucción vigente indica detenerse y pedir autorización en ese caso.

### Evidencia de la reproducción (antes de tocar código)

Ejecutado contra el `app.js` real sobre la BD desechable `sigca_test_c09` (puerto 3996; script temporal, eliminado). Peticiones reales por HTTP:

| Caso | Petición | HTTP | Respuesta / error real del servidor | Persistencia |
|---|---|---|---|---|
| 1. Solicitud nueva (sin paciente registrado) | `POST /api/citas/solicitudes/:id/atender` `{ inicio }` | **500** | `{"ok":false,"message":"Patient validation failed: apellido: Path \`apellido\` is required."}` (log del `errorHandler`) | citas=0 · solicitud sigue PENDIENTE · pacientes=0 |
| 2. Solicitud con paciente ya registrado (coincide teléfono) | `POST /api/citas/solicitudes/:id/atender` `{ inicio }` | **400** | `{"ok":false,"message":"La solicitud debe tener profesional y servicio asignados antes de atender"}` | citas=0 · solicitud sigue PENDIENTE |

`POST /api/solicitudes` (público) devolvió **201** en ambos casos.

### Causa raíz demostrada (doble)

1. **500 no controlado** — `backend/src/controllers/appointments.controller.js` → `atenderSolicitud()` intenta **auto‑crear** un `Patient` a partir de la solicitud con `apellido: ''`. El modelo `backend/src/models/Patient.js` exige `apellido` (`required: true`) → `ValidationError` → `errorHandler` responde **500**. La solicitud del portal **no** recoge `apellido`, `fechaNacimiento` ni `sexo` (obligatorios del paciente).
2. **Conversión imposible** — `atenderSolicitud()` lee `solicitud.profesional`, pero `backend/src/models/AppointmentRequest.js` **no tiene** campo `profesional` ni existe endpoint/contrato para asignarlo. Aun resolviendo el paciente, la conversión devuelve **400** siempre.

### Decisión funcional (autorizada por el usuario)

Convertir una solicitud en cita requiere `paciente`, `profesional`, `servicio` e `inicio`; la solicitud solo aporta `nombre`, `telefono`, `email`, `servicio` (opcional) y `fechaPreferida` (opcional). No existía contrato documentado del cuerpo de `atender`, ni pantalla admin, ni colección Postman. Se detuvo **sin modificar código** y se pidió autorización. El usuario eligió la **Opción A: paciente ya registrado**.

### Corrección aplicada (Opción A)

`backend/src/controllers/appointments.controller.js` → `atenderSolicitud()` reescrito para recibir `{ pacienteId, profesionalId, servicioId?, inicio, observaciones? }`:
- Exige `pacienteId`, `profesionalId` e `inicio`; el **paciente debe existir y estar activo** (ya no se auto‑crea → desaparece el 500).
- El **servicio** se toma de `servicioId` (cuerpo) o, si falta, de `solicitud.servicio`; si no hay ninguno → **400 controlado**.
- Se conservan: validación de menor de edad con responsable, disponibilidad (pasado/horario/traslape), estados y `solicitudOrigen`; la solicitud pasa a `ATENDIDA`.
- Único archivo de código modificado. No se tocaron modelos, rutas ni frontend (el endpoint ya estaba protegido con `auth` + `permitir('ADMINISTRADOR','RECEPCIONISTA')`).

### Verificación después de la corrección (BD desechable `sigca_test_c09`, HTTP real + MongoDB)

| ID | Caso | Esperado | Observado | Estado |
|---|---|---|---|---|
| C09-1 | Solicitud válida → conversión | 201 | 201 | APROBADA |
| C09-2 | Cita persistida en Mongo (refs/precio/estado/`solicitudOrigen`) | correcto | correcto | APROBADA |
| C09-3 | Solicitud marcada `ATENDIDA` en Mongo | ATENDIDA | ATENDIDA | APROBADA |
| C09-4 | Re‑atender solicitud ya atendida | 400 | 400 | APROBADA |
| C09-5 | No se crean citas duplicadas | 1 | 1 | APROBADA |
| C09-6 | Solicitud sin servicio y sin `servicioId` | 400 | 400 | APROBADA |
| C09-7 | `servicioId` del body tiene prioridad | 201 / 15000 | 201 / 15000 | APROBADA |
| C09-8 | Traslape mismo profesional/horario | 400 | 400 | APROBADA |
| C09-9 | Falta `pacienteId` | 400 | 400 | APROBADA |
| C09-10 | `pacienteId` inexistente | 400 | 400 | APROBADA |
| C09-11 | `profesionalId` inexistente | 400 | 400 | APROBADA |
| C09-12 | `servicioId` inválido | 400 | 400 | APROBADA |
| C09-13 | `inicio` inválido | 400 | 400 | APROBADA |
| C09-14 | Menor sin responsable activo | 400 | 400 | APROBADA |
| C09-15 | Solicitud inexistente (ObjectId válido) | 404 | 404 | APROBADA |
| C09-16 | `solicitudId` mal formado | 404 | 404 | APROBADA |
| C09-17 | Sin token | 401 | 401 | APROBADA |
| C09-18 | Rol PROFESIONAL | 403 | 403 | APROBADA |
| C09-19 | Rol RECEPCIONISTA | 201 | 201 | APROBADA |
| R-F01 | Regresión: pago sin caja ABIERTA | 409 | 409 | APROBADA |
| R-F20a/b/c | Regresión: crear cita + pago con caja → cancelar con pago ACTIVO | 201/201/409 | 201/201/409 | APROBADA |
| **NO-500** | Ninguna petición devuelve 5xx en toda la suite | 0 | 0 | APROBADA |

Resultado: **25/25 comprobaciones APROBADA** (antes: 500 en caso 1 y 400 en caso 2, sin conversión posible).

### Alcance / no regresión

- El cambio afecta **solo** a `POST /api/citas/solicitudes/:id/atender`. El resto de endpoints no se tocó.
- Regresiones F01 (pago sin caja → 409) y F20 (cancelar con pago → 409) verificadas en verde.
- El frontend no invoca este endpoint (no hay pantalla admin de solicitudes), por lo que no hay impacto en UI.
- `sigca_test_c09` eliminada; `sigca` intacta (usuarios=3, citas=9, pagos=9, cajas=3, solicitudes=2).

### Limitaciones

- La conversión exige un paciente **previamente registrado** (decisión del usuario). Atender una solicitud de una persona no registrada devuelve **400** si no se aporta `pacienteId` válido (comportamiento esperado, no un defecto).
- La UI admin para atender solicitudes no existe (fuera de alcance de C09).
- Verificación de UI: **NO EJECUTADA** (sin navegador).

## 2026-10-16 — Corrección D16 (sobre‑permiso de PROFESIONAL en materiales)

Cuarto defecto corregido (autorizado). Se corrigió **únicamente D16**.

### Problema (evidencia)

- Auditoría, prueba **D16**: el rol **PROFESIONAL** podía **crear/editar/desactivar** materiales (`POST/PATCH /api/materiales` → 201/200), cuando la expectativa era **403**.
- Reproducción aislada (BD desechable `sigca_test_d16`, puerto 3995): PROFESIONAL `GET` → 200 (consulta correcta), `POST` → **201**, `PATCH` → 200, `PATCH /desactivar` → 200.

### Causa raíz

- `backend/src/routes/materials.routes.js` aplicaba **un único** `router.use(auth, permitir('ADMINISTRADOR','RECEPCIONISTA','PROFESIONAL'))` a **todos** los métodos. Al abrir el catálogo a PROFESIONAL para **leer** (D15, permitido por diseño) se les concedió también **escribir**.

### Decisión funcional (autorizada por el usuario)

Política elegida (**Opción A**): **lectura** del catálogo = ADMINISTRADOR + RECEPCIONISTA + PROFESIONAL; **gestión** (crear/editar/desactivar) = ADMINISTRADOR + RECEPCIONISTA. Se detuvo antes de tocar código porque la intención documentada era contradictoria (la nota de FASE 9 decía que la ruta se abrió a PROFESIONAL “a propósito”, pero D16 esperaba 403).

### Corrección aplicada

`backend/src/routes/materials.routes.js`: se separan permisos por método con dos middlewares (`lectura` y `gestion`); `GET` usa `lectura`, `POST/PATCH/PATCH desactivar` usan `gestion`. Único archivo modificado. No se tocaron controlador, modelos, frontend ni la ruta de asignación paciente‑material.

### Verificación después de la corrección (BD desechable `sigca_test_d16`, HTTP real + MongoDB)

| ID | Caso | Esperado | Observado | Estado |
|---|---|---|---|---|
| D16-1/2 | PROFESIONAL consulta lista y detalle | 200 | 200 | APROBADA |
| D16-3 | PROFESIONAL crea material | **403** | 403 | APROBADA |
| D16-4 | PROFESIONAL no crea material (sin persistencia) | sin cambio | sin cambio | APROBADA |
| D16-5/6 | PROFESIONAL edita / desactiva | 403 | 403 | APROBADA |
| D16-7 | Material no fue desactivado por PROFESIONAL | activo | activo | APROBADA |
| D16-8/9 | RECEPCIONISTA crea material + persistido en Mongo | 201 / sí | 201 / sí | APROBADA |
| D16-10 | RECEPCIONISTA edita | 200 | 200 | APROBADA |
| D16-11 | RECEPCIONISTA desactiva (`activo=false`) | 200/false | 200/false | APROBADA |
| D16-12 | ADMINISTRADOR crea material | 201 | 201 | APROBADA |
| D16-13 | Sin token | 401 | 401 | APROBADA |

Antes: PROFESIONAL `POST` → 201. Después: **403**. **22/22 comprobaciones APROBADA** (antes: 4 fallos).

### Regresiones

| ID | Caso | Resultado |
|---|---|---|
| RG-1 | RECEPCIONISTA asigna material a paciente (flujo relacionado) | 201 APROBADA |
| RG-4 | C09: atender solicitud → cita (regresión) | 201 APROBADA |
| RG-5 | F01: pago sin caja ABIERTA → 409 | APROBADA |
| RG-6 | F20: cancelar cita con pago ACTIVO → 409 | APROBADA |
| NO-500 | Ninguna petición devuelve 5xx | APROBADA |

### Hallazgo aparte (PREEXISTENTE, NO corregido — fuera de alcance de D16)

- `app.js` monta `/api/pacientes` (con `permitir('ADMINISTRADOR','RECEPCIONISTA')`) **antes** de `/api/pacientes/:id/materiales` y `/api/pacientes/:id/responsables`. Por eso **PROFESIONAL recibe 403 en cualquier subruta de `/api/pacientes/*`**, incluso donde el propio archivo de ruta permite PROFESIONAL (asignar materiales). No lo causa D16 (mi cambio no interviene en esa ruta). Verificado: PROFESIONAL `GET /api/pacientes/:id` → 403 (RG-2) y asignar material → 403 (RG-3). **Se documenta, no se corrige** por estar fuera del alcance autorizado.

### Limpieza

- `sigca_test_d16` eliminada; script temporal eliminado. `sigca` intacta (usuarios=3, citas=9, pagos=9, cajas=3, solicitudes=2, materiales=6).
- Verificación de UI: **NO EJECUTADA** (sin navegador).

## 2026-10-16 — Corrección F09 (comprobante/recibo de pago — funcionalidad ausente)

Quinto defecto abordado (autorizado). F09 **no era un bug: era una funcionalidad ausente** (no existía modelo ni endpoint). Se implementó con la Opción A autorizada (comprobante automático + `GET`), solo en backend.

### Problema (evidencia de la ausencia)

Auditoría, prueba **F09**: “no hay modelo ni endpoint de comprobante/recibo”. Reproducción aislada contra el `app.js` real sobre la BD desechable `sigca_test_f09` (script temporal, eliminado tras verificarse), con un pago previamente registrado:

| Petición | HTTP | Interpretación |
|---|---|---|
| `GET /api/pagos/:id` | 200 | el pago existe |
| `GET /api/pagos/:id/comprobante` | **404** | ruta inexistente |
| `POST /api/pagos/:id/comprobante` | **404** | ruta inexistente |
| `GET /api/pagos/:id/recibo` | **404** | ruta inexistente |
| Colecciones en MongoDB | … | **no existía** colección de comprobantes/recibos |

### Causa

La FASE 10 (pagos y saldos) no incluyó comprobante/recibo; solo aparecía en el informe de auditoría como ausente (`entidad/endpoint`). No había nada que “arreglar”, sino que **implementar**, por lo que primero se detuvo y se pidió la decisión de diseño (era ambigua).

### Decisión funcional (autorizada por el usuario)

**Opción A:** comprobante **1:1** con el pago, **emitido automáticamente** al registrar el pago, con **número único** (`REC-AAAA-000001`), recuperable con `GET /api/pagos/:id/comprobante`. Solo backend (sin tocar el frontend).

### Corrección aplicada

- **Nuevos:** `backend/src/models/Receipt.js` (comprobante: `numero` y `pago` únicos, referencias, monto, método, fecha, `estado EMITIDO/ANULADO`) y `backend/src/models/Counter.js` (secuencia atómica `$inc`/`upsert`).
- **Nuevo:** `backend/src/utils/receipt.js` → `emitirComprobante(pago)` (idempotente; numeración `REC-AAAA-000001`; 1 comprobante por pago; tolera carrera `E11000`).
- `backend/src/controllers/payments.controller.js`: emite el comprobante en `registrarPago()` (tras guardar el pago); nuevo `obtenerComprobantePago()` (emite si faltara y devuelve poblado); en `anularPago()` el comprobante pasa a `ANULADO`.
- `backend/src/routes/payments.routes.js`: nueva ruta `GET /:id/comprobante` (bajo `auth` + `ADMINISTRADOR`/`RECEPCIONISTA`, misma que pagos).
- **No** se modificó la respuesta de `POST /api/pagos` (contrato intacto) ni se tocó el frontend.

### Verificación después de la corrección (BD desechable `sigca_test_f09`, puerto 3994, HTTP real + MongoDB)

| ID | Caso | Esperado | Observado | Estado |
|---|---|---|---|---|
| F09-1 | Registrar pago (contrato intacto) | 201 | 201 | APROBADA |
| F09-2 | `GET /api/pagos/:id/comprobante` | 200 | 200 | APROBADA |
| F09-3 | Número único `REC-AAAA-000001` | `REC-2026-000001` | `REC-2026-000001` | APROBADA |
| F09-4 | Comprobante coherente (monto/método/estado/refs) | correcto | correcto | APROBADA |
| F09-5 | Persistencia en Mongo + secuencia | 1 / seq 1 | 1 / seq 1 | APROBADA |
| F09-6 | Idempotencia (2º GET, mismo número, sin duplicar) | 1 | 1 | APROBADA |
| F09-7 | 2º comprobante usa secuencia siguiente | `…-000002` | `…-000002` | APROBADA |
| F09-8 | `GET` emite comprobante de un pago previo sin comprobante | `…-000003` | `…-000003` | APROBADA |
| F09-9 | Todos los números de comprobante únicos | 3 únicos | 3 únicos | APROBADA |
| F09-10 | Pago inexistente (ObjectId válido) | 404 | 404 | APROBADA |
| F09-11 | `id` mal formado | 404 | 404 | APROBADA |
| F09-12 | Sin token | 401 | 401 | APROBADA |
| F09-13 | Rol PROFESIONAL | 403 | 403 | APROBADA |
| F09-14 | Rol RECEPCIONISTA | 200 | 200 | APROBADA |
| F09-15 | Anular pago | 200 | 200 | APROBADA |
| F09-16 | Comprobante pasa a `ANULADO` (API y Mongo) | ANULADO/ANULADO | ANULADO/ANULADO | APROBADA |

**Resultado: 16/16 comprobaciones F09 APROBADA** (antes: 404, funcionalidad ausente).

### Regresiones

| ID | Caso | Esperado | Observado | Estado |
|---|---|---|---|---|
| RG-1 | F20: cancelar cita con pago ACTIVO | 409 | 409 | APROBADA |
| RG-2 | C09: atender solicitud → cita | 201 | 201 | APROBADA |
| RG-3 | D16: PROFESIONAL crea material | 403 | 403 | APROBADA |
| RG-4 | F01: pago sin caja ABIERTA | 409 | 409 | APROBADA |
| **NO-500** | Ninguna petición devuelve 5xx en toda la suite | 0 | 0 | APROBADA |

Total de la suite: **21/21 comprobaciones en verde** (16 F09 + 4 regresiones + guardia 5xx).

### Alcance / no regresión

- El cambio añade entidad y endpoint; no modifica el contrato de los endpoints existentes (`POST /api/pagos` sigue devolviendo `pago` + `saldo`; los demás no cambian).
- Regresiones F20/F01/C09/D16 verificadas en verde.
- El frontend no consulta todavía el comprobante (no hay pantalla de recibo); no se modificó ningún archivo de frontend.
- `sigca_test_f09` eliminada; `sigca` intacta (usuarios=3, citas=9, pagos=9, cajas=3, solicitudes=2, materiales=6; sin colecciones de comprobantes/counters).

### Limitaciones

- El comprobante se devuelve como **JSON** (no HTML/PDF imprimible): la auditoría pedía “entidad/endpoint”.
- No hay UI de recibo (fuera de alcance de F09).
- Verificación de UI: **NO EJECUTADA** (sin navegador).

## 2026-10-16 — Entregables (colección Postman, `.gitignore`, `.env.example`)

Revisión y resolución de los tres entregables pendientes de FASE 14 (autorizado por el usuario). Antes: los tres estaban ausentes/inconsistentes.

### Estado inicial (evidencia)

| Entregable | Estado inicial | Evidencia |
|---|---|---|
| Colección Postman | **Ausente** | Búsqueda recursiva `**/*postman*` → 0 archivos. |
| `.gitignore` | **Ausente** | No existía en ninguna carpeta. Repo git sin commits (0 rastreados, rama sin nacer). Riesgo real: `backend/node_modules`, `frontend/node_modules`, `frontend/dist` y `frontend/.env` existían y un `git add .` los incluiría. |
| `.env` inconsistente | **Confirmada** | `backend/.env.example` → `ADMIN_PASSWORD=Cambiar123`; `env.js` (default) y README → `Admin123`; `backend/.env` no existe → runtime usaba `Admin123`. Copiar el ejemplo dejaba el admin en `Cambiar123`, contra el README. |

### Corrección aplicada

1. **Colección Postman** — creada `postman/SIGCA.postman_collection.json` (formato v2.1; 20 carpetas, **79 peticiones** que cubren todas las rutas de `/api`) y `postman/SIGCA.postman_environment.json` (variables `baseUrl`, credenciales demo, tokens `token`/`tokenAdmin`/`tokenRecep`/`tokenProf` e `_id`). Los POST de creación guardan su `_id` en el entorno; los logins guardan los tokens; la caja se abre antes de los pagos y las bajas lógicas quedan al final.
2. **`.gitignore`** — en la raíz del repo: ignora `node_modules/`, `dist/`, `dist-ssr/`, `.env`, `.env.local`, `.env.*.local`, logs, `coverage/` y ficheros de SO/IDE. **No** ignora los `.env.example`.
3. **`.env.example`** — `backend/.env.example`: `ADMIN_PASSWORD=Cambiar123` → **`Admin123`**.
4. Documentación: sección «Colección Postman» en `README.md`.

### Verificación

**Colección Postman ejecutada de principio a fin** contra el `app.js` real, en la BD **desechable** `sigca_test_postman` (puerto 3993). Se emuló a Postman (sustitución de `{{variables}}`, capturas de los test-scripts y comprobación del código esperado) y se añadió detección de variables sin resolver para evitar falsos positivos.

| Grupo | Peticiones | Resultado |
|---|---|---|
| Health + Autenticación | 5 | 200/200/200/200/200 |
| Usuarios | 4 | 200/201/200/200 |
| Servicios | 5 | 200/200/201/200/200 |
| Contenidos | 5 | 200/200/200/201/200 |
| Horarios | 4 | 200/200/201/200 |
| Publicaciones | 6 | 200/200/200/201/200/200 |
| Contacto | 3 | 201/200/200 |
| Solicitudes | 2 | 201/200 |
| Pacientes | 4 | 200/201/200/200 |
| Responsables | 4 | 200/201/200/200 |
| Relaciones paciente–responsable | 3 | 200/201/200 |
| Profesionales | 4 | 200/201/200/200 |
| Citas | 6 | 200/201/200/201/200/200 |
| Materiales | 6 | 200/201/200/200/**403** (PROFESIONAL D16) |
| Materiales por paciente | 3 | 200/201/200 |
| Caja — apertura | 4 | 200/200/201/200 |
| Pagos y comprobantes | 6 | 200/200/201/200/200/200 |
| Caja — cierre | 1 | 200 |
| Bajas y cambios finales | 5 | 200/200/200/200/200 |

**Resultado: 79/79 peticiones con el código esperado, 0 fallos.**

**`.gitignore`** verificado con `git check-ignore`:

| Ruta | Resultado |
|---|---|
| `backend/node_modules` | ignorado (`.gitignore:2:node_modules/`) |
| `frontend/node_modules` | ignorado |
| `frontend/dist` | ignorado (`.gitignore:5:dist/`) |
| `frontend/.env` | ignorado (`.gitignore:9:.env`) |
| `backend/.env.example` | **NO** ignorado (correcto) |
| `frontend/.env.example` | **NO** ignorado (correcto) |

Con el `.gitignore`, `git status --untracked-files=all` lista **126 archivos** (solo fuentes/plantillas) y **ninguno** de `node_modules`, `dist` o `.env`.

### Limpieza

- BD `sigca_test_postman` eliminada; scripts temporales (`build-postman.mjs`, `verify-postman.mjs`) borrados.
- `sigca` intacta (usuarios=3, citas=9, pagos=9, cajas=3, solicitudes=2, materiales=6; sin receipts/counters).
- **Sin commits**: el repositorio sigue sin nada versionado.

### Limitaciones

- No se ejecutó la colección desde la app de Postman (no disponible); se verificó mediante una emulación fiel sobre HTTP real.
- Crear citas requiere ajustar `inicioCita`/`inicioCita2`/`inicioCita3` a un día laborable futuro (documentado en la colección).

## 2026-10-16 — FASE 12, paso 2: pruebas de reglas clave

Suite automatizada y repetible de las reglas de negocio, con el **runner integrado de Node** (`node:test`, **sin dependencias nuevas**) y aserciones de `node:assert/strict`.

### Cómo ejecutarla

```
cd backend
npm test        # equivale a: node --test "tests/**/*.test.js"
```

- Archivo: `backend/tests/reglas.test.js`.
- **Aislamiento:** corre contra la BD **desechable** `sigca_test_rules` en un puerto propio (3992); hace `dropDatabase()` al iniciar y al terminar, y **no toca** la BD de desarrollo `sigca`.
- El runner se acotó con el glob `tests/**/*.test.js` para que `node --test` **no** recoja el archivo preexistente `backend/test-prof.js`.

### Cobertura (43 pruebas, 9 grupos)

| Grupo | Regla verificada | Pruebas |
|---|---|---|
| A. Roles y seguridad | 401 sin token; 403 de PROFESIONAL en usuarios y pagos; `/api/health` público | 4 |
| B. Citas | pasado → 400; día sin horario → 400; traslape → 400; alta válida → 201 PROGRAMADA; transición inválida (CANCELADA→CONFIRMADA) → 400; reprogramar → 200 REPROGRAMADA; cancelar sin pagos → 200 CANCELADA | 7 |
| C. Menor de edad | cita de menor sin responsable → 400; asociar responsable → 201; cita del menor con responsable → 201 | 3 |
| D. Pagos | sin caja abierta → **409** (F01); supera saldo → 400; parcial → PARCIAL; completo → PAGADO; método inválido → 400; pago sobre cita CANCELADA → 400; monto no entero → 400 | 8 |
| E. Comprobante (F09) | número `REC-AAAA-000001`, referencia 1:1, idempotente, secuencial y distinto entre pagos | 3 |
| F. Anulación (F20) | cancelar cita con pagos ACTIVO → **409**; anular sin motivo → 400; anular recalcula saldo; tras anular todos, cancelar → 200; comprobante → ANULADO | 7 |
| G. Caja | segunda caja abierta → 409; cierre con snapshot `totalesPorMetodo`/`totalEsperado`/`diferencia`; pago retroactivo en caja cerrada → 409; anular pago de caja cerrada → 409 | 5 |
| H. Atender solicitud (C09) | conversión con paciente registrado → 201 y solicitud ATENDIDA; sin servicio → 400; atender dos veces → 400 | 3 |
| I. Materiales (D16) | PROFESIONAL consulta → 200; PROFESIONAL crea → 403; RECEPCIONISTA crea → 201 | 3 |

### Resultado

```
tests 43 · suites 9 · pass 43 · fail 0 · duration_ms ~1.7s
```

Ejecutada **dos veces consecutivas** con el mismo resultado (**43/43**), lo que confirma que la suite es **repetible** (crea su propia data y borra la BD al final).

### Limpieza y garantías

- BD `sigca_test_rules` eliminada tras cada corrida (no figura en `listDatabases`).
- `sigca` intacta: usuarios=3, citas=9, pagos=9, cajas=3, solicitudes=2, materiales=6; receipts=0, counters=0.
- `backend/test-prof.js` (preexistente) intacto y **excluido** de la suite.
- Sin dependencias nuevas, sin cambios en la app y **sin commits**.

## 2026-10-16 — Verificación funcional del módulo Caja diaria (FASE 11)

**Alcance:** verificación funcional del **último módulo implementado**, *Caja diaria* (FASE 11), ejecutando operaciones **reales** contra el `app.js` real y confirmando la persistencia en **MongoDB**. Se incluyen como **regresión relacionada** las funcionalidades acopladas: Pagos (FASE 10), comprobante (F09) y la regla F01.

**Método y aislamiento**

- HTTP real (401/403/400/404/409) + consulta directa a MongoDB; sin mockear la lógica.
- BD **dedicada y desechable** `sigca_verif_caja` en puerto propio **3991**; se eliminó al terminar. **La BD de desarrollo `sigca` NO se tocó.**
- Script temporal (eliminado tras la corrida). **68 comprobaciones** agrupadas en 18 bloques.

**Resultado global: 68/68 comprobaciones OK, 0 fallos.**

### 1. Permisos y seguridad
| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 1.1 | `GET /api/caja` sin token | 401 | 401 |
| 1.2 | `GET /api/caja` con PROFESIONAL | 403 | 403 |
| 1.3 | `POST /api/caja/abrir` con PROFESIONAL | 403 | 403 |
| 1.4 | `GET /api/caja` con RECEPCIONISTA | 200 | 200 |
| 1.5 | `GET /api/caja` con ADMINISTRADOR | 200 | 200 |

### 2–3. Estado inicial y regla F01 (cobrar sin caja)
| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 2.1 | `GET /api/caja/abierta` sin caja | 200 y `caja: null` | OK |
| 2.2 | `GET /api/caja` lista | 200 y `[]` | OK |
| 3.1 | Crear cita para el flujo | 201 | 201 |
| 3.2 | `POST /api/pagos` **sin** caja abierta | **409** | 409 |

### 4–7. Apertura: inválidos, válido, unicidad y persistencia
| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 4.1 | `montoInicialCentavos: 10.5` | 400 | 400 |
| 4.2 | el error trae `message` (que la UI muestra) | message no vacío | OK |
| 4.3 | `montoInicialCentavos: -100` | 400 | 400 |
| 4.4 | `montoInicialCentavos: "100"` (string) | 400 | 400 |
| 5.1 | abrir con 5000 | 201 `ABIERTA` | 201 |
| 5.2 | `montoInicialCentavos` = 5000 | 5000 | 5000 |
| 5.3 | `abiertaPor` = admin | correcto | OK |
| 5.4 | `fechaApertura` presente | sí | OK |
| 6.1 | abrir una 2ª caja | **409** | 409 |
| 6.2 | mensaje claro para la UI | «Ya hay una caja abierta…» | OK |
| 7.1 | la caja existe en **MongoDB** | sí | OK |
| 7.2 | estado en Mongo = `ABIERTA` | `ABIERTA` | OK |
| 7.3 | monto en Mongo = 5000 | 5000 | 5000 |

### 8–10. Cobros, preview (lo que ve la UI) y anulación
| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 8.1 | pago EFECTIVO 10000 | 201 `PARCIAL` | 201 |
| 8.2–8.4 | pagos TARJETA 5000 / TRANSFERENCIA 2000 / OTRO 1000 | 201 | 201 |
| 8.5 | pago que supera el saldo | 400 | 400 |
| 8.6 | método inválido | 400 | 400 |
| 9.1–9.5 | preview `GET /api/pagos?desde=<apertura>&estado=ACTIVO` por método | 10000 / 5000 / 2000 / 1000 / total 18000 | OK |
| 10.1 | anular el pago OTRO | 200 `ANULADO` | OK |
| 10.2–10.3 | preview tras anular | OTRO 0 / total 17000 | OK |

### 11–13. Cierre: inválidos, arqueo y doble cierre
| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 11.1 | `totalRealCentavos: 10.5` | 400 | 400 |
| 11.2 | `totalRealCentavos: -1` | 400 | 400 |
| 11.3 | cerrar id inválido `abc` | 404 | 404 |
| 11.4 | cerrar caja inexistente | 404 | 404 |
| 11.5 | cerrar con PROFESIONAL | 403 | 403 |
| 12.1 | cerrar con real 17500 | 200 `CERRADA` | 200 |
| 12.2 | `totalesPorMetodo.EFECTIVO` | 10000 | 10000 |
| 12.3 | `totalesPorMetodo.TARJETA` | 5000 | 5000 |
| 12.4 | `totalesPorMetodo.TRANSFERENCIA` | 2000 | 2000 |
| 12.5 | `totalesPorMetodo.OTRO` (anulado excluido) | 0 | 0 |
| 12.6 | `totalEsperado = 5000 + 17000` | 22000 | 22000 |
| 12.7 | `totalRealCentavos` | 17500 | 17500 |
| 12.8 | `diferenciaCentavos` | −4500 (faltante) | −4500 |
| 12.9 | `fechaCierre` y `cerradaPor` | presentes | OK |
| 13.1 | cerrar la misma caja otra vez | **409** | 409 |

### 14–18. Reapertura, bloqueo post‑cierre, consultas, persistencia y regresiones
| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 14.1 | abrir nueva caja con monto 0 | 201 | 201 |
| 14.2 | `GET /api/caja/abierta` devuelve la nueva | sí | OK |
| 14.3 | abrir otra vez | 409 | 409 |
| 15.1 | pago con fecha **dentro** de la caja cerrada | **409** | 409 |
| 15.2 | mensaje menciona «cerrada» (UI) | sí | OK |
| 15.3 | anular un pago de la caja cerrada | **409** | 409 |
| 15.4 | mensaje menciona «cerrada» (UI) | sí | OK |
| 16.1 | `GET /api/caja/:id` | 200 `CERRADA` | OK |
| 16.2 | `?estado=CERRADA` | 1 caja | OK |
| 16.3 | `GET /api/caja/:id` inválido | 404 | 404 |
| 17.1 | comprobante del pago (regresión F09) | 200 `REC-AAAA-000001` | OK |
| 17.2 | cancelar cita con pagos ACTIVO (regresión F20) | **409** | 409 |
| 18.1 | 2 `CashSession` en MongoDB | 2 | 2 |
| 18.2 | 1ª `CERRADA` con totales y diferencia | correcto | OK |
| 18.3 | 2ª `ABIERTA` con monto 0 | correcto | OK |
| 18.4 | 4 pagos (1 ANULADO) | 4 / 1 | 4 / 1 |
| 18.5 | 4 comprobantes (1 ANULADO) | 4 / 1 | 4 / 1 |

### Evidencia de persistencia (consulta directa a MongoDB)
```
db.cashsessions.findOne({estado:'CERRADA'})
{
  estado: 'CERRADA',
  montoInicialCentavos: 5000,
  totalesPorMetodo: { EFECTIVO: 10000, TARJETA: 5000, TRANSFERENCIA: 2000, OTRO: 0 },
  totalEsperadoCentavos: 22000,
  totalRealCentavos: 17500,
  diferenciaCentavos: -4500
}
```
Conteos: `cajas=2` (1 `CERRADA`), `pagos=4` (1 `ANULADO`), `receipts=4` (1 `ANULADO`).

### Mensajes de error devueltos (lo que la UI muestra con `error.value = e.message`)
| Situación | HTTP | `message` |
|---|---|---|
| Monto inicial no entero/negativo | 400 | `montoInicialCentavos debe ser un entero >= 0` |
| Segunda caja abierta | 409 | `Ya hay una caja abierta. Debe cerrarla antes de abrir otra.` |
| Cerrar caja ya cerrada | 409 | `La caja ya está cerrada` |
| Pago retroactivo en caja cerrada | 409 | `La caja de ese período ya está cerrada; no se pueden registrar pagos retroactivos` |
| Anular pago de caja cerrada | 409 | `La caja de ese período ya está cerrada; no se puede anular un pago de una caja cerrada` |

### Interfaz de usuario
- **Comprobado (contrato):** todos los errores de caja devuelven `{ ok:false, message }` y el cliente (`client.js`) lanza `new Error(datos.message || 'Error <status>')`; `CajaView.vue` los pinta en `error.value = e.message`. La vista además valida el monto en cliente y arma el «preview de cobros» con `getPagos(desde=fechaApertura, estado=ACTIVO)` — **el preview se verificó por HTTP (bloque 9/10) con los mismos parámetros que usa la vista**.
- **NO EJECUTADO (runtime de navegador):** abrir/cerrar caja desde la pantalla y ver el mensaje en pantalla. **Sin navegador disponible** (limitación vigente, Etapa H). No se afirma que la UI funcione de extremo a extremo hasta probarla manualmente.

### Defectos encontrados
- **Ninguno.** Las 68 comprobaciones (válidas, inválidas, permisos, límites y reglas de negocio) pasaron sin hallazgos; **no fue necesario corregir código**.

### Regresiones ejecutadas
- F01 (cobrar sin caja → 409): 3.2 ✔
- F09 (comprobante): 17.1 ✔
- F20 (cancelar con pagos activos → 409): 17.2 ✔
- Pagos/saldo y anulación dentro de caja: bloques 8–10 ✔

### Limpieza
- BD `sigca_verif_caja` **eliminada** (no figura en `listDatabases`); script temporal borrado.
- `sigca` intacta: usuarios=3, citas=9, pagos=9, cajas=3, receipts=0. Sin commits.

### Limitaciones
- UI en navegador: **NO EJECUTADA** (sin navegador).
- La verificación cubre Caja + regresiones; no repite la suite completa de todos los módulos (ya cubierta por la auditoría y `npm test`).

## 2026-10-16 — Verificación funcional del módulo Comprobante / recibo (F09)

**Alcance:** verificación funcional del **módulo Comprobante** (F09), ejecutando operaciones **reales** por HTTP contra el `app.js` real y confirmando la persistencia en **MongoDB**. Cubre emisión automática, numeración/secuencia, consulta, idempotencia, concurrencia, coherencia con la anulación, permisos y casos inválidos.

**Método y aislamiento**

- HTTP real (201/200/400/401/403/404/409) + consulta directa a MongoDB con `mongosh`; sin mockear la lógica.
- BD **dedicada y desechable** `sigca_verif_comprobante` (puerto 3990), eliminada al terminar. **`sigca` NO se tocó.**
- Script temporal (eliminado al terminar). **56 comprobaciones en 11 bloques.**

**Resultado global: 56/56 comprobaciones OK, 0 defectos.**

| Bloque | Qué se probó | Resultado |
|---|---|---|
| 1 | Emisión automática al registrar pago: existe 1 comprobante, 1:1, `EMITIDO`, campos (número/monto/método/cita/paciente) copiados | 8/8 |
| 2 | Permisos del endpoint: sin token 401 · PROFESIONAL 403 · RECEP 200 · ADMIN 200 | 4/4 |
| 3 | Secuencia incremental `…-000001/2/3`, números únicos; contador `comprobante`.seq = 3 | 4/4 |
| 4 | El número usa el **año de la fecha del pago** (pago con fecha 2023 → `REC-2023-000004`) | 2/2 |
| 5 | `GET /api/pagos/:id/comprobante`: 200, populate (pago/cita/paciente), **idempotente**, no duplica; la ruta no es capturada por `/:id` | 8/8 |
| 6 | 404: id inválido (`abc`) y pago inexistente | 2/2 |
| 7 | Pago **pre‑F09 sin recibo** (fixture): al consultar se emite con el siguiente número (`…-000005`) | 5/5 |
| 8 | **Concurrencia**: 10 consultas a 10 pagos → 10 comprobantes con números únicos; **6 consultas al mismo pago** → 1 solo comprobante y mismo número en las 6 respuestas | 6/6 |
| 9 | **Coherencia con anulación**: anular pago → comprobante `ANULADO`; número no cambia; doble anulación → 409 y sin duplicado | 6/6 |
| 10 | **Pagos rechazados no emiten comprobante**: cita CANCELADA, supera saldo, método inválido, monto no entero, citaId inválido → 400 y conteo sin cambios | 6/6 |
| 11 | Integridad: 16 comprobantes, 1:1 (0 pagos con >1), números únicos y con formato `REC-AAAA-NNNNNN` | 5/5 |

**Evidencia de persistencia (consulta directa `mongosh`):**
```
receipts=16   EMITIDO=15   ANULADO=1
numeros unicos=16   pagos con mas de 1 comprobante=0
counter comprobante seq=21
```
Muestra de documentos:
```
{"numero":"REC-2026-000001","estado":"EMITIDO","montoCentavos":10000,"metodo":"EFECTIVO"}
{"numero":"REC-2026-000002","estado":"ANULADO","montoCentavos":5000,"metodo":"TARJETA"}
{"numero":"REC-2026-000003","estado":"EMITIDO","montoCentavos":3000,"metodo":"TRANSFERENCIA"}
{"numero":"REC-2023-000004","estado":"EMITIDO","montoCentavos":2000,"metodo":"OTRO"}
```

**Observación (NO es defecto) — huecos de numeración bajo concurrencia al mismo pago.** El contador quedó en **21** con **16** comprobantes: **5 números consumidos sin recibo**. Causa: `emitirComprobante()` toma el número (`siguienteSecuencia`) **antes** de guardar; si varias peticiones concurrentes compiten por **el mismo pago**, las que pierden (`error 11000`) devuelven el existente pero ya habían consumido un número. En el flujo normal (secuencial, como la UI) la numeración es **correlativa y sin huecos** (probado: `…-000001`…`…-000005`). Se preservan las garantías: **números únicos, 1:1 pago↔comprobante y formato correcto**. Corregir los huecos exigiría un cambio de diseño en la emisión (p. ej. emitir con transacción y consumir la secuencia solo al crear el documento) → **se consulta antes de tocarlo** (regla de ambigüedad funcional).

**Defectos encontrados:** **ninguno**. Las 56 comprobaciones pasaron sin hallazgos; **no fue necesario corregir código**.

**Interfaz de usuario:** **NO EJECUTADA** — el comprobante **no tiene UI** (0 referencias a `comprobante`/`Receipt` en `frontend/src`); no hay pantalla desde la que visualizarlo. No se puede verificar «en la interfaz» algo que no existe en la interfaz.

**Limpieza:** BD `sigca_verif_comprobante` **eliminada**; script temporal borrado. `sigca` **intacta**: usuarios=3, citas=9, pagos=9, cajas=3, receipts=0, counters=0. Sin commits.

## 2026-10-16 — FASE 13, tarea 1: revisión de secretos y configuración

Revisión **de solo lectura** (sin cambios de código) de cómo el backend maneja secretos, contraseñas y configuración. Evidencia tomada del código real y de comprobaciones de `git`.

**Comprobado y correcto**

| Aspecto | Evidencia | Estado |
|---|---|---|
| Contraseñas nunca en texto plano | `User.js`: hook `pre('save')` con `bcrypt.hash(password, 10)` | OK |
| Hash nunca expuesto | `password` con `select: false`; `publico()` y `/api/users` no lo devuelven | OK |
| Comparación segura | `compararPassword()` usa `bcrypt.compare` | OK |
| Login sin enumeración | email inexistente / inactivo / password errónea → mismo **401** «Credenciales inválidas» | OK |
| JWT mínimo | `jwt.js`: payload solo `{ id, rol }` (nada sensible) | OK |
| `.env` fuera de control de versiones | `git check-ignore` marca `backend/.env` y `frontend/.env` como ignorados (`.gitignore:9`) | OK |
| `.env.example` sí versionado | `git check-ignore backend/.env.example` → sin resultado (no ignorado) | OK |
| Sin secretos en el `.env` del frontend | `frontend/.env` = `VITE_API_URL=http://localhost:3000` (no es secreto) y está ignorado | OK |
| Sin contraseñas/tokens en logs | no hay `console.log` con `password`/`token`; `seedDemo` imprime solo credenciales **ficticias** de demo | OK |
| `.gitignore` consistente | ignora `node_modules/`, `dist/`, `.env`, `.env.local`, `.env.*.local`, logs, `coverage/`; mantiene `.env.example` | OK |

**Hallazgos (NO corregidos — pendientes de autorización)**

- **S13.1 (riesgo de seguridad) — `JWT_SECRET` con valor por defecto embebido.** `backend/src/config/env.js` usa `process.env.JWT_SECRET || 'sigca-secreto-solo-desarrollo'`. Si falta `.env`/`JWT_SECRET`, el backend firma tokens con un secreto **público y conocido** → cualquiera podría **falsificar tokens**. En desarrollo local es tolerable, pero en un despliegue real es un riesgo alto. (`.env.example` ya propone `cambiar-por-un-secreto-largo`.) *Corregirlo implica una decisión de comportamiento* (p. ej. abortar el arranque si `JWT_SECRET` no está definido en producción) → **se consulta antes de tocar.**
- **S13.2 (fuga de información menor) — `errorHandler` devuelve `err.message` también en 500.** `backend/src/middlewares/errorHandler.js` responde `{ message: err.message || 'Error interno del servidor' }` con el código `err.status || 500`. En un error inesperado (p. ej. de Mongoose/DB) el mensaje crudo llega al cliente. El detalle sí queda en el servidor (`console.error(err)`, correcto). Lo esperable es mensaje genérico para 500 y detalle solo en logs. *Es un cambio pequeño pero altera respuestas* → pendiente de autorización.
- **S13.3 (config de desarrollo, aceptable/documentado).** `env.js` define por defecto `mongoUri` local, `adminPassword: 'Admin123'` y `.env.example` trae `ADMIN_PASSWORD=Admin123`. Son credenciales **ficticias de desarrollo**, coherentes con el README, no secretos reales.

**Resultado:** ningún defecto funcional nuevo; **2 hallazgos de seguridad/robustez (S13.1, S13.2)** documentados. Ambos se corrigieron después (ver abajo).

### Correcciones S13.1 y S13.2 (2026-10-16)

**Criterios aprobados por el usuario:** **S13.1** → abortar el arranque **solo en producción** si falta `JWT_SECRET` (en desarrollo se mantiene el valor por defecto); **S13.2** → mensaje **genérico en 5xx**, conservando los mensajes de 400/404/409 (que usa la UI), con el detalle solo en los logs.

**Reproducción ANTES (contra el `app.js` real, BD desechable `sigca_fix_fase13`):**
- **S13.1:** con `NODE_ENV=production` y sin `JWT_SECRET`, la app **arrancó**; el `JWT_SECRET` efectivo era `sigca-secreto-solo-desarrollo`; un **token forjado** con ese secreto público obtuvo **200** en `GET /api/auth/me`.
- **S13.2:** `GET /api/pagos?cita=abc` → **500** con el mensaje interno filtrado: `Cast to ObjectId failed for value "abc" (type string) at path "cita" for model "Payment"`.

**Corrección (mínima):**
- `backend/src/config/env.js`: si `NODE_ENV === 'production'` y falta `JWT_SECRET`, se lanza un error al importar (aborta el arranque).
- `backend/src/middlewares/errorHandler.js`: para `status >= 500` responde `'Error interno del servidor'`; conserva `err.message` para `status < 500`. El detalle completo sigue registrándose en el servidor (`console.error(err)`).

**Verificación DESPUÉS (comprobada):**

| Prueba | Esperado | Obtenido |
|---|---|---|
| prod **sin** `JWT_SECRET` → arranque | BLOQUEADO, mensaje claro | **BLOQUEADO** |
| prod **con** `JWT_SECRET` → arranque | OK con el secreto propio | **ARRANCA_OK** |
| dev sin `JWT_SECRET` → arranque | OK (default) | **ARRANCA_OK** (default) |
| prod con secreto propio: token **forjado** con el default | **401** | **401** |
| prod con secreto propio: token legítimo | **200** | **200** |
| `GET /api/pagos?cita=abc` (error inesperado) | 500 genérico | `Error interno del servidor` |
| `POST /api/pagos {}` (400) | mensaje específico conservado | `citaId, montoCentavos y metodo requeridos` |

**Regresión:** `npm test` → **43/43 en verde, 0 fallos** (roles, citas, pagos/saldo, F01/F20/F09/C09/D16, caja). Sin dependencias nuevas.

**Aislamiento y limpieza:** probado contra `app.js` real en BD desechable `sigca_fix_fase13` (eliminada); scripts temporales borrados; `sigca` **intacta** (usuarios=3, citas=9, pagos=9, cajas=3, receipts=0). Sin commits.

## 2026-10-16 — FASE 13, tarea 2: matriz de roles y códigos HTTP

**Alcance:** verificar por **HTTP real** que cada ruta respeta el control de acceso (401 sin token, 403 con rol no autorizado) y que los códigos HTTP son coherentes.

**Método y aislamiento**
- **73 rutas × 4 identidades** (sin token, ADMINISTRADOR, RECEPCIONISTA, PROFESIONAL) = **292 peticiones** contra el `app.js` real.
- BD **desechable** `sigca_verif_roles` (puerto 3986), eliminada al terminar; **`sigca` intacta**.
- Peticiones **sin efectos**: `GET` tal cual; `POST/PATCH` con cuerpo vacío o id inexistente; `POST /api/caja/abrir` con monto inválido. Se comprobó que **ninguna colección cambió** durante el barrido.

**Regla verificada (en las 73 rutas)**

| Identidad | Esperado | Observado |
|---|---|---|
| Sin token (ruta protegida) | 401 | **401 en todas** |
| Rol NO autorizado | 403 | **403 en todas** |
| Rol autorizado | nunca 401/403 | 200 / 201 / 400 / 404 / 409 según el caso |
| Ruta pública | accesible sin token | 200 / 400 |

**Matriz por conjunto de roles** (`none` = sin token)

| Roles permitidos | Rutas | none | ADMIN | RECEP | PROF |
|---|---|---|---|---|---|
| **PÚBLICO** | `GET /api/health`, `GET /api/services`, `GET /api/services/:id`, `GET /api/contenidos`, `GET /api/contenidos/:clave`, `GET /api/horarios`, `GET /api/publicaciones`, `GET /api/publicaciones/:id`, `POST /api/contacto`, `POST /api/solicitudes` | 200/400/404 | ídem | ídem | ídem |
| **ADMINISTRADOR** | `/api/users` (GET, POST, GET :id, PATCH :id); `/api/services/admin/todos`, `POST/PATCH /api/services`; `/api/contenidos/admin/todos`, `POST/PATCH /api/contenidos`; `/api/horarios/admin/todos`, `POST/PATCH /api/horarios`; `/api/publicaciones/admin/todas`, `POST/PATCH /api/publicaciones`; `GET/PATCH /api/contacto` | 401 | 200/400/404 | **403** | **403** |
| **ADMIN + RECEP** | `/api/solicitudes` (GET, PATCH :id); `/api/pacientes/*`; `/api/responsables/*`; `/api/pacientes/:id/responsables/*`; `/api/profesionales/*`; `/api/citas/*`; `/api/pagos/*`; `/api/caja/*` | 401 | 200/400/404 | 200/400/404 | **403** |
| **ADMIN + RECEP + PROF (lectura)** | `GET /api/materiales`, `GET /api/materiales/:id` | 401 | 200/404 | 200/404 | 200/404 |
| **ADMIN + RECEP (gestión)** | `POST/PATCH /api/materiales`, `PATCH /api/materiales/:id/desactivar` | 401 | 200/400/404 | 200/400/404 | **403** |
| **ADMIN + RECEP (efectivo)** | `GET/POST/PATCH /api/pacientes/:id/materiales*` | 401 | 200/400/404 | 200/400/404 | **403** |

**Códigos HTTP misceláneos**

| Caso | Esperado | Obtenido |
|---|---|---|
| ruta inexistente (sin token / con token) | 404 | 404 |
| método no soportado en ruta existente | 404 | 404 |
| `POST /api/auth/login` credenciales inválidas | 401 | 401 |
| `POST /api/auth/login` sin body | 400 | 400 |
| token corrupto en ruta protegida | 401 | 401 |
| colecciones modificadas por el barrido | 0 | **0** |

**Hallazgo preexistente confirmado (NO corregido):** `GET/POST/PATCH /api/pacientes/:pacienteId/materiales*` — **PROFESIONAL recibe 403** aunque la ruta hija (`patientMaterials.routes.js`) lo permite, porque `app.js` monta **`/api/pacientes`** (ADMIN/RECEP) **antes** que las subrutas. Corregirlo exige **cambiar el orden de montaje** (afecta al módulo de pacientes) → **requiere decisión del usuario** (ya documentado desde D16).

**Resultado: 80/80 comprobaciones OK, 0 fallos (292 peticiones).** Sin defectos nuevos. Sin cambios de código, sin commits.

## 2026-10-16 — FASE 13: corrección del orden de montaje (rutas de pacientes)

**Defecto (preexistente):** `GET/POST/PATCH /api/pacientes/:pacienteId/materiales*` devolvían **403 a PROFESIONAL** aunque la ruta hija (`patientMaterials.routes.js`) lo permite. Causa: `app.js` montaba **`/api/pacientes`** (guard `permitir ADMIN/RECEP`) **antes** que las subrutas, y el guard interceptaba las subrutas.

**Reproducción ANTES** (HTTP real, BD desechable `sigca_verif_montaje`, puerto 3985): **11/16** — 5 fallos, todos en las subrutas de materiales para PROF: `GET → 403`, `POST → 403`, `PATCH /desasignar → 403`.

**Corrección (mínima, `backend/src/app.js`):** se movieron los montajes de las subrutas **antes** de `/api/pacientes`:

```
app.use('/api/pacientes/:pacienteId/responsables', patientRelationsRoutes);
app.use('/api/pacientes/:pacienteId/materiales', patientMaterialsRoutes);
app.use('/api/pacientes', patientsRoutes);
```

**Verificación DESPUÉS:** **16/16 OK**, incluido un flujo **funcional real**: ADMIN crea un material (`POST /api/materiales` → 201); **PROFESIONAL asigna** ese material a un paciente (`POST /api/pacientes/:id/materiales` → **201**), **lo lista** (`GET` → 200, 1 ítem) y **lo desasigna** (`PATCH .../desasignar` → **200**). Sin cambios indeseados: PROF sigue en **403** en `GET /api/pacientes`, `GET /api/pacientes/:id` y en la subruta de **responsables** (router ADMIN+RECEP); ADMIN/RECEP siguen con 200; sin token → 401.

**Regresión:**
- **Matriz de roles completa re-ejecutada** (`sigca_verif_roles`): **74/74 OK** con la expectativa actualizada — las subrutas de materiales ahora son ADMIN+RECEP+**PROF** (antes 403).
- **`npm test` → 43/43 en verde, 0 fallos.**

**Aislamiento y limpieza:** BD `sigca_verif_montaje` y `sigca_verif_roles` eliminadas; scripts temporales borrados; `sigca` **intacta**. Sin commits.

## 2026-10-16 — FASE 13, tarea 3: validaciones y manejo de errores

**Alcance:** comprobar que las rutas que **escriben** nunca devuelven **5xx** y que todos los errores responden `{ ok:false, message }`.

**Método:** 38 rutas × 2 payloads (**vacío** y **«basura»** con tipos/enums inválidos) + 5 casos específicos + JSON malformado + control de efectos secundarios = **84 comprobaciones** por HTTP real; BD desechable `sigca_verif_valid` (puerto 3984), eliminada al terminar; **`sigca` intacta**.

**Resultado: 84/84 OK, 0 respuestas 5xx (de 76 peticiones del barrido).**

| Comprobación | Resultado |
|---|---|
| 38 rutas × payload vacío | 400 / 404 / 409 (**nunca 5xx**) |
| 38 rutas × payload «basura» (tipos y enums inválidos) | 400 / 404 / 409 (**nunca 5xx**) |
| Toda respuesta de error trae `{ ok:false, message }` | sí |
| `POST /api/users` password corta → 400 | 400 |
| `POST /api/users` rol inválido → 4xx | 400 |
| `POST /api/users` email duplicado → 4xx | 4xx |
| `POST /api/pacientes` fecha inválida → 4xx | 4xx |
| `POST /api/materiales` tipos/enum inválidos → 4xx | 4xx |
| body JSON malformado → 400 + `{ok:false,message}` | 400 |
| colecciones modificadas por el barrido | **0** |

**Observación (NO es defecto):** `POST /api/caja/abrir` **sin body** abre la caja con `montoInicialCentavos = 0` (valor por defecto). Es el contrato ya documentado del módulo de caja (monto 0 es válido) → se deja igual.

**Conclusión:** **sin defectos** de validación/errores. Sin cambios de código. Sin commits.

## 2026-10-16 — Verificación funcional del módulo Materiales educativos / asignación a pacientes (FASE 9) y corrección de validaciones de escritura

**Alcance:** catálogo `/api/materiales` (listar/obtener/crear/actualizar/desactivar) y asignación N:M `/api/pacientes/:pacienteId/materiales` (listar/asignar/desasignar), incluido el efecto del arreglo de orden de montaje sobre PROFESIONAL.

**Método:** HTTP real contra `app.js` sobre BD **dedicada y desechable** `sigca_verif_materiales` (puerto 3983), eliminada al terminar; **`sigca` intacta**. **90 comprobaciones** + sondeo de casos límite. Permisos con 4 identidades (sin token / ADMINISTRADOR / RECEPCIONISTA / PROFESIONAL).

**Resultado inicial: 85/90 OK — 5 FALL (todas respuestas 500).** Permisos, CRUD, asignación/desasignación, reactivación, N:M, índice único, filtros, búsqueda, paginación válida y persistencia en MongoDB: OK.

### Defecto encontrado — falta de validación de TIPOS en la escritura del módulo (500 y datos basura)

| Petición (HTTP real) | Antes | Causa |
|---|---|---|
| `GET /api/materiales?q=(` | **500** | `new RegExp('(', 'i')` → `SyntaxError` (regex construida con entrada del usuario sin escapar) |
| `GET /api/materiales?q=[` | **500** | idem |
| `GET /api/materiales?page=0` | **500** | `skip = (page-1)*limit = -20` → MongoDB `BSON field 'skip' value must be >= 0` |
| `GET /api/materiales?page=-1` | **500** | idem (`-40`) |
| `PATCH /api/materiales/:id` con `_id` en el body | **500** | `Object.assign(material, req.body)` → asignación masiva del `_id` → `DocumentNotFoundError` |
| `PATCH … {"titulo":{}}` / `{"descripcion":{}}` / `{"tipo":null}` / `{"tipo":""}` / `{"archivoNombre":{}}` | **500** | tipos no validados → error de casteo/validación de Mongoose |
| `POST /api/materiales` con `descripcion` / `url` / `archivoNombre` objeto | **500** | idem |
| `POST /api/materiales` con `titulo:"   "` | **500** | `String(titulo).trim()` → `""` → falla `required` |
| `POST /api/materiales` con `{"titulo":{}}` | **201 basura** | creaba `titulo:"[object Object]"` |
| `PATCH … {"activo":null}` | **200 corrupción** | `activo` quedaba `null` (asignación masiva sin validar) |
| `POST /api/pacientes/:id/materiales` con `notas:{}` / `[]` | **500** | `notas` sin validar → casteo a String falla |

**Alcanzable desde la interfaz:** el buscador de `MaterialesView` es texto libre → escribir `(` o `[` producía **500** (mostrado como «Error interno del servidor»). El botón «Activar» usa `PATCH {activo:true}`, así que `activo` debe seguir siendo actualizable.

**Causa raíz:** el módulo validaba **presencia** (truthiness) pero **no tipos**, y `actualizarMaterial` aplicaba `Object.assign(doc, req.body)` (asignación masiva); la búsqueda construía un `RegExp` sin escapar y la paginación no saneaba `page`/`limit`.

**Corrección (mínima, SOLO este módulo):**
- `backend/src/controllers/materials.controller.js`
  - `listarMateriales`: **escapa** `q` (búsqueda literal) y **sanea** `page`/`limit` (enteros ≥ 1; por defecto 1 y 20).
  - `validarMaterial`: valida **tipos** (titulo/descripcion: texto no vacío; tipo ∈ `TIPOS_MATERIAL`; url/archivoNombre: texto; activo: booleano).
  - `actualizarMaterial`: sustituye `Object.assign` por **lista blanca** (`titulo, descripcion, tipo, url, archivoNombre, activo`); ignora `_id`, `createdAt`, `updatedAt`, `__v` y claves desconocidas.
- `backend/src/controllers/patientMaterials.controller.js`: valida que `notas` sea texto (o ausente/nulo) → **400**.

**Verificación DESPUÉS: 90/90 OK, 0 respuestas 5xx**; el sondeo de casos límite queda sin 5xx (400/404/200 coherentes) y `activo` ya no se corrompe. Se preserva el uso legítimo (`PATCH {activo:true}`, `PATCH {titulo,descripcion,tipo,url}`, `GET …?limit=200`).

**Regresión:** `npm test` → **43/43**; las 32 comprobaciones de permisos del propio módulo siguen en verde (PROF 403 al escribir en el catálogo; PROF 200 en las subrutas paciente‑material; sin token 401).

**NO EJECUTADO:** prueba en navegador (Etapa H, sin navegador). El módulo sí presenta los errores en la UI (`MaterialesView` / `PacienteMaterialesView` hacen `error.value = e.message`); con la corrección esos casos dejan de ser «Error interno del servidor» y pasan a mensajes 400 concretos, pero **no se comprobó visualmente**.

**Observaciones (no defectos, sin cambios):** (1) `GET /api/pacientes/:id/materiales` con `pacienteId` válido pero inexistente responde **200 con lista vacía** (no 404); (2) `POST /api/materiales` acepta `descripcion`/`url` como texto libre (sin longitud máxima); (3) el mismo patrón `Object.assign(doc, req.body)` (asignación masiva sin lista blanca) existe en otros controladores (users, services, contenidos, horarios, publicaciones, pacientes, responsables, profesionales) → **hallazgo transversal, NO tocado aquí**.

**Aislamiento y limpieza:** BD `sigca_verif_materiales` eliminada; scripts temporales borrados; `sigca` **intacta**. Sin commits.

## 2026-10-16 — Corrección TRANSVERSAL: entradas no validadas y asignación masiva (búsqueda/paginación, PATCH y POST)

**Contexto:** tras la verificación del módulo Materiales se documentó como **hallazgo transversal** que el patrón `Object.assign(doc, req.body)` (asignación masiva sin lista blanca) se repetía en otros controladores. El usuario autorizó su corrección.

**Reproducción ANTES** (HTTP real, BD desechable `sigca_verif_transversal`, puerto 3981): **22 respuestas 500** + asignación masiva en el alta:
- `GET …?q=(` → **500** en `/api/pacientes`, `/api/profesionales`, `/api/responsables` (regex inválida).
- `GET …?page=0` y `?page=-1` → **500** en `/api/pacientes`, `/api/profesionales`, `/api/responsables`, `/api/citas`, `/api/pagos`, `/api/caja` (skip negativo).
- `PATCH {_id}` → **500** en pacientes/profesionales/responsables (asignación masiva del `_id` → `DocumentNotFoundError`).
- `PATCH {<campoTexto>:{}}` → **500** en pacientes/profesionales/responsables/**services** (casteo).
- `POST {…, _id, activo:false}` → **201 honrando el `_id` del cliente** en pacientes/profesionales/responsables (asignación masiva en el alta).

**Corrección (transversal, mínima):**
- Nuevos helpers `backend/src/utils/consulta.js` (`regexBusqueda`, `paginacion`) y `backend/src/utils/campos.js` (`soloCampos`, `aplicarCamposPermitidos`).
- `paginacion()` aplicado en `listar` de **pacientes, profesionales, responsables, citas, pagos, caja y materiales**; `regexBusqueda()` en **pacientes, profesionales, responsables y materiales**.
- **Listas blancas** en pacientes/profesionales/responsables: `crear` usa `soloCampos(...)` y `actualizar` usa `aplicarCamposPermitidos(...)` (ya **no** `new Model(req.body)` ni `Object.assign`).
- `backend/src/middlewares/errorHandler.js`: los errores de Mongoose **`ValidationError`/`CastError`** (datos de entrada inválidos) ahora responden **400**, no 500 → arreglo central que cubre los casteos de **todos** los módulos.

**Verificación DESPUÉS** (mismo guion): **0 respuestas 5xx**; `?q=(` / `?page=0` / `?page=-1` / `?limit=abc` → **200** en las 7 rutas; `PATCH {_id}` → 200 (ignorado); tipos inválidos → **400**; `POST {_id,activo}` → 201 con `_id` **nuevo** (`idIgualAlPedido=false`: ya no honra el `_id` del cliente). Búsqueda y paginación positivas intactas (`?q=lopez` y `?q=LOPEZ` → 1; `?limit=1` → 1 con `total` global correcto; `?page=2&limit=1` → 1).

**Regresión:** `npm test` → **43/43**; re‑chequeo del módulo Materiales refactorizado → **24/24 OK** (crear/editar/desactivar, tipos 400, `activo:true`, `_id` ignorado, PROF 403 al escribir, asignación/duplicado/desasignación/notas).

**Observaciones (no defectos, sin cambios):** (1) `activo` sigue siendo un campo **expuesto** (el alta puede crear con `activo:false`; el `PATCH` lo cambia) — comportamiento preexistente, no forma parte del defecto corregido; (2) `PATCH /api/contenidos/:id {titulo:{}}` y `PATCH /api/users/:id {nombre:{}}` convierten a `"[object Object]"` (200) por coerción explícita `String(...)`: **sin 500**, calidad de dato menor, no se tocó.

**Aislamiento y limpieza:** BD `sigca_verif_transversal` y `sigca_verif_materials2` eliminadas; scripts temporales borrados; `sigca` **intacta**. Sin commits.

## 2026-10-16 — Cierre de las 2 observaciones menores (alta con `activo` y coerción de tipos a texto)

**Contexto:** tras la corrección transversal quedaron abiertas dos observaciones "menores". El usuario autorizó cerrarlas.

**Reproducción ANTES** (HTTP real, BD desechable `sigca_verif_obs`, puerto 3979):
- **(a)** `POST /api/pacientes|profesionales|responsables` con `{activo:false}` → **201** y el registro **nacía inactivo** (`bd.activo=false`).
- **(b)** `PATCH /api/contenidos/:id {titulo:{}}` → **200** con `bd.titulo="[object Object]"`; `POST /api/contenidos {titulo:{}}` → **201** idem; `PATCH /api/users/:id {nombre:{}}` → **200** con `bd.nombre="[object Object]"`; `POST /api/users {nombre:{}}` → **201** idem.

**Causa raíz:** (a) la lista blanca del **alta** incluía `activo`; (b) coerción explícita `String(valor).trim()` **antes** de guardar, que convierte cualquier objeto en `"[object Object]"` en lugar de rechazarlo.

**Corrección (mínima, por módulo):**
- **(a)** Pacientes/profesionales/responsables: `CAMPOS_*_CREAR = CAMPOS_*.filter(c => c !== 'activo')`; el **alta ya no acepta `activo`** (el registro nace siempre activo). El `PATCH {activo}` **sigue permitido** (lo usa la UI para Activar/Desactivar).
- **(b)** Contenidos: `clave/titulo/cuerpo` deben ser **texto** (alta) y `titulo/cuerpo` **texto no vacío** (edición) → **400** en caso contrario; se elimina la coerción con `String()`. Usuarios: `nombre/email/password` deben ser **texto** (alta) y `nombre` **texto no vacío** (edición) → **400**; el chequeo de password pasa a `password.length` (antes `String(password).length`).

**Verificación DESPUÉS** (mismo guion): **(a)** alta con `{activo:false}` → **201 con `activo=true`** (ignorado; `bd.activo=true`). **(b)** los 5 casos inválidos → **400** y **sin cambios en BD** (p. ej. `bd.titulo="QS"` intacto). **0 respuestas 5xx.**
**Positivos intactos:** `PATCH {activo:false}` sobre un paciente → **200** (`bd.activo=false`); alta+edición válida de contenido → **201/200** (`bd.titulo="Nuevo"`); alta+edición válida de usuario → **201/200** (`bd.nombre="Val2"`).

**Regresión:** `npm test` → **43/43**; `node --check` de los 5 archivos tocados → OK.

**Observación relacionada → ✅ CERRADA el 2026-10-21** (ver la sección siguiente: "Cierre de la coerción de tipos a texto").

**Aislamiento y limpieza:** BD `sigca_verif_obs` eliminada; script temporal borrado; `sigca` **intacta**. Sin commits.

## 2026-10-21 — Cierre de la coerción de tipos a texto (`String(...)`) en contact/requests/publications/payments/auth

**Contexto:** el 2026-10-16 quedó abierta la observación (no defecto) de que el patrón `String(valor).trim()` convierte cualquier tipo inválido en `"[object Object]"` en lugar de rechazarlo. El usuario autorizó cerrarla en la rama `fix/validaciones-tipos`.

**Regla aplicada:** todo campo de **texto** que llega del cliente debe ser `string`; si no lo es → **400** (sin guardar nada). No se coerciona ningún valor de entrada antes de persistirlo.

**Reproducción ANTES** (HTTP real + lectura en MongoDB, BD desechable `sigca_verif_coercion_before`, puerto 3995, 19 peticiones):

| Caso | Antes | Dato guardado |
|---|---|---|
| `POST /api/contacto {nombre:{}}` | **201** | `nombre = "[object Object]"` |
| `POST /api/solicitudes {nombre:{}}` | **201** | `nombre = "[object Object]"` |
| `POST /api/publicaciones {titulo:{}}` (ADMIN) | **201** | `titulo = "[object Object]"` |
| `PATCH /api/pagos/:id/anular {motivoAnulacion:{}}` | **200** | `motivoAnulacion = "[object Object]"` |
| `POST /api/services {incluye:[{}, "Limpieza"]}` | **201** | `incluye = ["[object Object]", "Limpieza"]` |
| `PATCH /api/auth/perfil {perfil:{contactoEmergencia:{nombre:{}}}}` | **200** | `perfil.contactoEmergencia.nombre = "[object Object]"` |
| `POST /api/pacientes {telefono:1234567890}` (número) | **201** | `telefono` coercionado a texto |
| `POST /api/auth/login {email:{}, password:{}}` | **401** | (no guarda; coerción en la consulta) |

**Causa raíz:** coerción explícita `String(valor)` **antes** de asignar/guardar (o antes de comparar, en `login`): un objeto se convierte en `"[object Object]"`, que supera las validaciones de longitud y se persiste como texto válido.

**Corrección (mínima, por controlador):**
- `contact.controller.js`: `nombre`/`email`/`mensaje` deben ser texto → **400**; se guarda `nombre.trim()` (sin `String()`).
- `requests.controller.js`: `nombre`/`telefono`/`email`/`mensaje` deben ser texto → **400**; se elimina `String()` de las comprobaciones y del alta.
- `publications.controller.js` (alta): `titulo`/`descripcion` (y `imagenUrl`/`enlace` si llegan) deben ser texto → **400**; se guarda `titulo.trim()`.
- `payments.controller.js` (`anularPago`): `motivoAnulacion` debe ser texto no vacío → **400**; se guarda `motivoAnulacion.trim()`.
- `services.controller.js` (`catalogo`): `incluye` solo conserva elementos de texto (los demás se descartan) y se recortan.
- `auth.controller.js`: `login` exige `email`/`password` de texto (**400** si no); `registro` no coerciona `email` (sigue devolviendo **400** "Correo electrónico inválido"); `cambiarPassword` exige `actual` de texto; `sanitizarPerfil` exige `telefono` y `contactoEmergencia.{nombre,telefono}` de texto (**400**).
- `patients/professionals/responsibles.controller.js`: `telefono` debe ser texto (antes solo se medía su longitud coercionando); los teléfonos válidos se comportan igual.

**Verificación DESPUÉS** (mismo guion, BD `sigca_verif_coercion_after`, puerto 3994, 19 peticiones): los casos con tipo inválido → **400** (salvo `incluye`, que devuelve **201** guardando solo `["Limpieza"]`); **0 documentos** con `"[object Object]"` en las 6 colecciones; **0 respuestas 5xx**.

**Positivos intactos (9/9):** alta válida de contacto (**201**), solicitud (**201**), publicación (**201**, `titulo` recortado), servicio (**201**, `incluye` intacto), perfil (**200**, `contactoEmergencia` guardado), paciente (**201**, `telefono` texto), anulación (**200**, motivo recortado), profesional (**201**) y responsable (**201**).

**Regresión:** `npm test` → **43/43**.

**`String()` que se mantiene (solo validación o uso interno; no pueden guardar datos coercionados):** `auth` `limpiar()` (sus usos pasan por `RE_NOMBRE`/`RE_TELEFONO` o por el chequeo `typeof`), `utils/consulta.js` `regexBusqueda` (búsqueda escapada, no persiste), `content.controller.js` (`req.params.clave`, siempre texto), `receipt.js`/`seedDemo.js`/`users.controller.js` (ObjectIds y numeración internos) y `requests.controller.js` (test de forma ISO sobre `fechaPreferida`, ya validada con `new Date` y no persistida tal cual).

**Aislamiento y limpieza:** BDs `sigca_verif_coercion_before`/`_after` eliminadas; script temporal borrado; `sigca` **intacta**.

## 2026-10-21 - B4: solicitudes/citas, permisos PROFESIONAL y reset

**Alcance verificado:** alta de solicitudes con email/servicio obligatorios, filtro por estado, rechazo con motivo, conversión atómica sin replica set, reparación de enlaces, permisos del rol PROFESIONAL, reset de contraseña y filtros/IDs inválidos sin 5xx.

**Suite de reglas (`npm test`):**

- Comando: `cd backend && npm test` (`node --test "tests/**/*.test.js"`).
- BD desechable `sigca_test_rules` (puerto 3992), eliminada al terminar; `sigca` intacta.
- Resultado: **119/119 pass, 0 fail en dos corridas consecutivas**; 16 grupos A-P.
- Grupos B4: **M** restricciones PROFESIONAL (13), **N** solicitudes/concurrencia/índice (11), **O** reset (3), **P** índices, filtros y robustez (5).
- Casos destacados: `atender` concurrente de la misma solicitud → 1 éxito y 1 cita; dos `crearCita` concurrentes en el mismo horario → 1 cita; `E11000` repara enlace; profesional sin vínculo → 403; cita ajena → 404; paciente con cita → solo campos básicos; rechazo doble → 409; filtros/IDs inválidos → 400/404, nunca 5xx.

**Build frontend:**

- `cd frontend && npm run build` → **verde**, `165 módulos transformados`; `dist/` no se versiona.
- **UI no verificada en navegador** (no hay navegador disponible); no se afirma funcionamiento visual de `CitasView`, `SolicitudesView`, `ProfesionalesView`, menús ni reset.

**Colección Postman:**

- Archivos: `postman/SIGCA.postman_collection.json` y `postman/SIGCA.postman_environment.json`.
- **110 peticiones / 166 aserciones, 0 fallos, 0 respuestas 5xx**.
- Ejecución por **emulación** de las peticiones y test-scripts de la colección (variables de entorno, tokens, `pm.test`/`pm.expect`) contra `app.js` real, en la BD desechable `sigca_test_postman` con seed demo; la BD se eliminó al terminar.
- Cobertura B4 añadida: reset (200, login con nueva contraseña, 403 para PROFESIONAL, 400 sin `passwordNueva`), solicitud sin email/servicio, servicio inactivo, filtro inválido, rechazo con/sin motivo y doble rechazo, atender duplicado 409, listado y lectura PROFESIONAL, creación/cancelación denegadas, cita propia PENDIENTE→COMPLETADA 400, confirmación por recepción y COMPLETADA propia 200, cita ajena 404, pacientes básicos sin datos sensibles.
- La emulación se hizo con un script temporal (no versionado) y no sustituye una ejecución desde la aplicación Postman; queda documentado como verificación por HTTP real y scripts equivalentes.

**Script de duplicados (`npm run verificar:solicitudes -- --dry-run`):**

- Base vacía `sigca_test_dup`: responde “la colección de citas aún no existe” sin error.
- Base con dos citas apuntando a la misma solicitud: informa 1 solicitud duplicada, lista las dos citas y termina con **código 1**.
- BD temporal eliminada; `sigca` intacta.

**Limpieza:** BDs `sigca_test_rules`, `sigca_test_postman` y `sigca_test_dup` eliminadas; scripts temporales de verificación borrados; sin cambios en `sigca`.

## 2026-10-21 - B5: seed definitivo y verificación de invariantes

**Alcance:** completar `backend/src/utils/seedDemo.js` con el conjunto de demostración B5 y agregar `backend/tests/seedDemo.test.js`. No se modificaron modelos, controladores, rutas, frontend ni la base de desarrollo `sigca`.

**Preflight de solo lectura sobre `sigca`:** `npm run verificar:solicitudes -- --dry-run` no encontró solicitudes duplicadas. Las migraciones se ejecutaron únicamente con `--dry-run` (9 documentos legados, 9 pagos sin caja, 3 cajas disponibles, 6 pacientes sin fecha de inicio y 0 profesionales vinculables); **no se aplicó ninguna migración** ni se escribió en `sigca`.

**Conjunto creado (primera ejecución, BD desechable):**

| Entidad | Total | Detalle |
|---|---:|---|
| Usuarios | 6 | 1 ADMINISTRADOR, 2 RECEPCIONISTA, 3 PROFESIONAL |
| Profesionales | 3 | Cada uno con un usuario PROFESIONAL distinto |
| Pacientes | 10 | 4 menores con responsable activo |
| Responsables | 5 | Todos con al menos un vínculo activo |
| Servicios | 5 | 1 inactivo (`Evaluación inicial`) |
| Citas | 15 | PENDIENTE, CONFIRMADA, COMPLETADA y CANCELADA |
| Materiales / asignaciones | 5 / 5 | Todos con `asignadoPor` |
| Solicitudes | 5 | 2 PENDIENTE, 2 ATENDIDA, 1 RECHAZADA |
| Pagos | 10 | EFECTIVO, TARJETA y TRANSFERENCIA; 1 ANULADO |
| Comprobantes | 10 | `REC-AAAA-NNNNNN`, 1:1 y únicos |
| Cajas | 3 | 2 CERRADA y 1 ABIERTA |

La primera ejecución creó **77 registros** (los 10 comprobantes se emiten aparte) y la segunda **0**. El `--dry-run` no escribió nada.

**Invariantes comprobadas:**

- Los estados de cita y pago y los métodos de pago pertenecen a los enums permitidos.
- `PENDIENTE`/`CONFIRMADA` tienen fecha futura; `precioCentavos`, `duracionMinutos` y `fin` coinciden con el servicio.
- No hay intervalos solapados para un mismo profesional.
- Cada `solicitudOrigen` es único y el enlace solicitud↔cita es bidireccional; las dos solicitudes `ATENDIDA` tienen cita.
- Todo pago tiene `caja` y `registradoPor`; los comprobantes están sincronizados con `numeroComprobante`.
- La suma de pagos `REGISTRADO` no supera el precio de la cita; existen casos completo, parcial y pendiente.
- Existe una cita `CANCELADA` sin pagos válidos y una cita activa con pagos válidos; `PATCH /api/citas/:id/estado` a `CANCELADA` responde **409** en esta última.
- Caja 1: `EFECTIVO 25000`, `TARJETA 10000`, total `35000`, esperado `45000`, real `44500`, diferencia **-500**.
- Caja 2: abierta, total `20000`, esperado `15000`, sin fecha de cierre.
- Caja 3: `EFECTIVO 40000`, `TARJETA 8000`, `TRANSFERENCIA 18000`, total `66000`, esperado/real `55000`, diferencia **0**.
- Solo existe una diferencia negativa (caja 1).

**Excepción documentada:** `pago-04` nace `ANULADO` dentro de `caja-01` cerrada. No representa una anulación ejecutada por la API después del cierre: es un dato histórico ficticio, no suma al arqueo y su comprobante nace `ANULADO`. La regla que bloquea anulaciones en cajas cerradas permanece intacta.

**Pruebas:** `backend/tests/seedDemo.test.js` usa `sigca_test_seed` (puerto 3993) y el `app.js` real; se ejecutó **`npm test` 130/130 en dos corridas consecutivas** (119 de reglas + 11 de seed). Las bases `sigca_test_rules`, `sigca_test_seed` y cualquier base temporal se eliminaron al terminar; `sigca` quedó intacta.

**Fuera de alcance:** portal/logo/carrusel/bandeja de contacto, subida de fotos, pantalla de historial, comprobante imprimible y cambios de API.

## 2026-10-21 - B5.1: verificación visual del calendario y filtros

**Entorno:** backend con `MONGO_URI=mongodb://localhost:27017/sigca_ui_calendar`, seed B5 (77 registros), frontend Vite en `http://localhost:5173`, Edge headless controlado por CDP. Base desechable eliminada al terminar; `sigca` intacta.

**Calendario (`/admin/calendario`):**

- Render correcto: `.fc` presente y título `octubre de 2026`.
- **15 eventos** visibles (los 15 del seed) y **0 errores de consola**.
- Vistas **Mes**, **Semana** y **Día** conmutan y actualizan el título (`19 – 25 oct 2026`, `21 de octubre de 2026`).
- Clic en un evento abre el modal **Detalle de la cita** con paciente, profesional, servicio, inicio, fin, estado y observaciones.
- La causa del fallo anterior era que el conector Vue recibe las opciones en `:options`; las props sueltas se ignoraban. Además, `@fullcalendar/vue3` 7.1.2 traía un core 7 anidado frente a core/daygrid/interaction 6.1.x.

**Filtros "Activos":**

- `PacientesView`: inicia marcado; al desmarcar y pulsar **Buscar** la petición es `/api/pacientes?page=1&limit=20`; al volver a marcar y buscar, `/api/pacientes?page=1&limit=20&activo=true`.
- `ResponsablesView`: mismo comportamiento con `/api/responsables`.
- `MaterialesView`: inicia desmarcado; al marcar y buscar envía `/api/materiales?...&activo=true`; al desmarcar lo omite.

**Build y pruebas:** `npm run build` **verde** (131 módulos) y `npm test` **130/130**. Sin cambios de API ni de seed.

## 2026-10-21 - B6: portal institucional, carrusel, publicaciones y bandeja de contacto

**Alcance:** RF-01, RF-12 y sección 10 de `docs/REQUISITOS.md`; pendientes 11, 12 y 15. Sin dependencias nuevas, sin TypeScript, Tailwind, Docker ni replica set.

### Backend y validaciones

- `GET/PUT /api/contenido/sitio`: configuración pública y actualización solo ADMINISTRADOR. Reutiliza `InstitutionalContent` (`contacto-nombre`, `sitio-logo`, `mision`, `vision`, `nosotros`, `contacto-*`) para no duplicar contenido.
- `CarouselSlide` + `/api/contenido/carrusel`: CRUD solo ADMINISTRADOR; el listado público devuelve únicamente activas y ordenadas por `orden`. El seed crea cinco diapositivas solo si la colección está vacía.
- `PUT /api/publicaciones/:id`: edición completa (título, descripción, tipo, fecha, imagen, enlace y activo), conservando `PATCH` por compatibilidad. Las URLs aceptan rutas locales, `http(s)`, y en enlaces también `mailto`/`tel`. Escrituras solo ADMINISTRADOR.
- Contacto: nombre, email, teléfono, asunto y mensaje validados en el controlador; errores 400 con `{ ok:false, message }`. La bandeja admite `?leido=true|false`, devuelve `noLeidos`, expone `/api/contacto/contador` y permite marcar leído/no leído con `PATCH`.
- No se agregó `required` a campos existentes ni se modificaron los esquemas de citas/calendario. Las entradas inválidas de B6 no producen 5xx.

### Pruebas automatizadas

- `backend/tests/b6.test.js`: **6 pruebas** (configuración y seed idempotente, roles/validaciones de sitio, CRUD de carrusel, publicaciones, bandeja de contacto e inválidos sin 5xx).
- `npm test`: **136/136 en dos corridas consecutivas** (130 previas + 6 de B6), **18 suites**, 0 fallos. Bases `sigca_test_rules` (3992), `sigca_test_seed` (3993) y `sigca_test_b6` (3994); `sigca` intacta.
- `npm run build`: **verde**, **135 módulos**.

### Frontend

- `HomeView`, `Navbar` y `Footer` consumen nombre, logo, misión, visión, información principal y contacto desde la API; si el carrusel no devuelve elementos se conservan los cinco SVG locales.
- `ContentView` administra configuración, carrusel (alta, edición, activar/desactivar y eliminar), horarios y publicaciones completas; `MensajesView` muestra la bandeja descendente, filtros, marcado de leído, estado vacío y contador; `AdminLayout` oculta la bandeja y el badge a roles distintos de ADMINISTRADOR.
- Servicios públicos muestran imagen real o placeholder, nombre, descripción, duración y precio en quetzales con el util compartido; el botón lleva a `/solicitar-cita?servicio=...` y abre el modal con el servicio preseleccionado.
- Contacto público valida nombre, email, teléfono, asunto y mensaje; muestra errores reales del backend y un estado de éxito.

### Postman

- `postman/SIGCA.postman_collection.json` y `SIGCA.postman_environment.json` actualizados con sitio GET/PUT, carrusel CRUD/público/admin/400/403, publicación PUT/400/403, filtros/contador/403 de contacto y `diapositivaId`.
- Ejecución completa por emulación contra `app.js` real en la BD desechable `sigca_postman_b6` (puerto 3010): **131 peticiones, 196 pruebas, 0 fallidas, 0 respuestas 5xx**.
- La colección requiere una BD limpia por ejecución: una segunda corrida sobre la misma BD falla por el horario del sábado ya existente, no por un defecto de la aplicación. La emulación no sustituye una ejecución desde la aplicación Postman.

### Verificación UI (Edge headless/CDP)

Entorno: backend con `MONGO_URI=mongodb://localhost:27017/sigca_ui_b6`, frontend Vite en `http://localhost:5173` y Edge headless controlado por CDP. Base desechable; `sigca` intacta.

- Home/Navbar/Footer con nombre y logo editables; carrusel con cinco diapositivas; misión, visión, información principal, publicaciones y tabla de horarios.
- Contacto: validación de campos obligatorios, envío exitoso, mensaje visible en la bandeja, badge y contador; filtro de no leídos, marcado como leído, retiro del badge y estado vacío.
- Configuración guardada desde admin y reflejada en el portal; carrusel agregado, editado, desactivado y eliminado desde la UI; publicación creada y editada (título, descripción, tipo, imagen, enlace y activo) y visible en corporativo con su imagen.
- Horario del lunes modificado de `08:00–17:00` a `09:30–16:30` y verificado en el portal público.
- Servicios: un servicio con imagen real y los demás con placeholder; detalle con foto; precio en `Q`; enlace con `?servicio=` y modal con servicio, duración y precio preseleccionados. También se verificó la ruta directa `/solicitar-cita?servicio=...` tras recargar.
- Menú móvil a 390×844: botón hamburguesa visible, menú colapsado/desplegable y “Contacto” disponible.
- Guardia de roles: RECEPCIONISTA no ve la bandeja ni el enlace, y `/admin/mensajes` redirige a `/admin`.

### Defecto encontrado y corregido durante la verificación

- **Síntoma:** al abrir directamente `/solicitar-cita?servicio=<id>`, el modal se mostraba pero el resumen decía “Elige un servicio…”.
- **Causa raíz:** `ServiciosView` llamaba `abrirCita(id)` durante su setup, antes de que `CitaModal` se montara. `citaAbierta` ya valía `true` cuando el componente montó, y el `watch` sin `immediate` no ejecutaba `reiniciar(citaServicioInicial)`.
- **Corrección:** `watch(citaAbierta, ..., { immediate: true })` en `frontend/src/components/CitaModal.vue`. Se buscaron todas las llamadas a `abrirCita`/`citaAbierta`; el watch es el único punto de inicialización del modal.
- **Verificación posterior:** la ruta directa conserva el `servicio`, muestra nombre/duración/precio y abre en el paso “Tus datos”; el flujo desde el catálogo sigue funcionando. Build **135 módulos** verde.

### Límites

- La validación de UI cubrió los flujos B6 descritos; no se recorrieron todas las pantallas históricas del sistema.
- La emulación de Postman no es una corrida desde la aplicación Postman.
- No se implementó subida de archivos: logo e imágenes se editan por URL.
