# Plan de cierre — SIGCA

Objetivo: cerrar los huecos detectados en la auditoría del 2026-10-26 contra el
enunciado del proyecto final, sin rehacer lo que ya está verificado.

Estado de partida: backend completo, 152/152 pruebas en verde, build correcto,
todos los módulos obligatorios implementados y persistidos en MongoDB.

Cada paso se cierra con: código + verificación real + actualización de
`docs/ESTADO_PROYECTO.md`. No se avanza al siguiente sin confirmar el anterior.

---

## Paso 1 — Datos de demostración cargados

- Ejecutar `npm run seed:demo` sobre `sigca`.
- Verificar por HTTP y MongoDB los conteos de la sección 11.
- Verificar login de los usuarios demo.

**Criterio de aceptación:** el seed reporta 77 registros y una segunda corrida
reporta `0 por crear`. Login de administrador y de recepción devuelven 200.

**Estado:** ✅ completado el 2026-10-27 sobre base limpia.

- Se eliminaron los datos de prueba manuales y se resembró `sigca`: **77
  creados, 0 omitidos**.
- Conteos exactos: 6 usuarios (1 ADMIN, 2 RECEP, 3 PROF), 10 pacientes, 5
  responsables, 5 servicios, 15 citas, 5 materiales, 5 asignaciones, 5
  solicitudes, 10 pagos (9 REGISTRADO + 1 ANULADO), 10 comprobantes y 3 cajas
  (1 ABIERTA + 2 CERRADAS).
- El reinicio del backend repuebla lo que crea el arranque: 20 publicaciones,
  5 diapositivas de carrusel, 8 contenidos institucionales y 5 horarios.
- Verificado por HTTP: login de las 6 cuentas demo devuelve 200 con su rol.
- Calidad: 0 responsables sin email/dirección, 0 pagos sin caja, 0 pagos sin
  comprobante, 0 profesionales sin usuario vinculado.

---

## Paso 2 — Historial de citas y pagos por paciente

Cubre RF-03 ("consultar las citas y pagos relacionados con cada paciente"),
RF-07 ("consultar historial por paciente") y RF-10 ("consultar pagos por
paciente").

Backend: ya existe `GET /api/citas?paciente=` y `GET /api/pagos?paciente=`.
No requiere cambios de API salvo que la vista necesite un agregado.

Frontend:

- Nueva vista `frontend/src/views/PacienteHistorialView.vue`.
- Ruta `/admin/pacientes/:pacienteId/historial` con roles ADMINISTRADOR y
  RECEPCIONISTA (y PROFESIONAL solo lectura de sus pacientes, si aplica).
- Enlace "Historial" en `PacientesView.vue`.
- Mostrar: datos del paciente, total de citas, citas con estado y saldo,
  pagos con fecha/método/estado/comprobante y totales.

**Criterio de aceptación:** desde la lista de pacientes se abre el historial de
un paciente con sus citas y pagos reales; los totales coinciden con
`GET /api/citas/:id/saldo`; sin errores de consola.

**Estado:** ✅ completado el 2026-10-26.

- Vista nueva `frontend/src/views/PacienteHistorialView.vue` (scoped) con datos
  del paciente, resumen (citas, completadas, canceladas, pagado y saldo),
  tabla de citas con estado financiero y tabla de pagos con comprobante.
- Ruta `/admin/pacientes/:pacienteId/historial` (ADMIN, RECEP y PROFESIONAL) y
  enlace "Historial" en `PacientesView.vue`.
- PROFESIONAL ve solo sus citas y no ve montos ni pagos (la API le responde 403
  en `/api/pagos`).
- Verificado en Edge headless con ADMINISTRADOR y PROFESIONAL: 0 errores de
  consola. Capturas en `docs/evidencias/02-*.png`.
- De paso se corrigieron dos defectos de presentación: la tabla de pagos se
  cortaba y la lista de pacientes pegaba las acciones. Varias vistas tenían
  `<style>` sin `scoped` y se pisaban entre sí (`.contenedor` de 700 px sobre
  900/1100); se aislaron Pacientes, Responsables, Usuarios, Servicios y
  Contenidos.
- Se aplicaron las migraciones no destructivas sobre datos heredados:
  `migrar:estados` (2 citas y 7 pagos con estados antiguos), `migrar:cajas`
  (5 pagos sin caja) y `migrar:relaciones` (3 fechas de inicio de proceso).
- Re-verificado el 2026-10-27 después del reseed limpio: la vista muestra las 3
  citas y los 3 pagos reales del paciente del seed, incluido el pago ANULADO
  con su comprobante; 0 errores de consola en ADMIN y PROFESIONAL.

## Paso 3 — Comprobante de pago visible e imprimible

Cubre RF-10 ("generar un número único de comprobante interno" y consultarlo).

Estado actual: modelo `Receipt`, emisión automática y
`GET /api/pagos/:id/comprobante` ya funcionan; ninguna pantalla lo muestra.

Frontend:

- En `PagosView.vue`, mostrar `numeroComprobante` en el historial de la cita.
- Botón "Ver comprobante" que consulte `GET /api/pagos/:id/comprobante`.
- Modal o vista imprimible (`window.print()` con estilos `@media print`).

**Criterio de aceptación:** todo pago REGISTRADO muestra su número; el
comprobante abre con datos del pago, paciente, cita, monto, método, usuario y
estado; un pago ANULADO muestra su estado también en el comprobante.

**Estado:** ✅ completado el 2026-10-27.

- `PagosView.vue`: nueva columna **Comprobante**, botón **Ver comprobante** por
  pago y modal con diseño de recibo. Se compactó la tabla (la caja se consulta
  en el módulo Caja y las notas pasan a la celda de fecha) para que no desborde.
- Modal con número, estado (EMITIDO/ANULADO), paciente, servicio, cita,
  profesional, método, fecha del pago, usuario que registró, caja y total.
  Los pagos anulados muestran además motivo, fecha y usuario que anuló.
- Botón **Imprimir** con `window.print()` y hoja de estilos `@media print`:
  oculta menú, botones y resto de la interfaz; imprime solo el comprobante.
- `GET /api/pagos/:id/comprobante` ahora incluye el servicio y profesional de
  la cita y el usuario que registró/anuló el pago (datos que exige el RF-10).
- Verificado en Edge headless: modal visible, número REC-, total y datos
  completos; con medios de impresión el contenedor queda `hidden`, el recibo
  `visible` y los botones `display:none`. 0 errores de consola.
- Capturas: `docs/evidencias/03-pagos-lista.png`,
  `03-comprobante-pago.png` y `03-comprobante-anulado.png`.
- Suite backend: **152/152** en verde.

---

## Paso 4 — Consulta global de pagos por fecha y método

Cubre RF-10 ("consultar pagos por fecha" y "por método"), hoy disponible solo
en la API (`GET /api/pagos?desde=&hasta=&metodo=&paciente=&caja=`).

Frontend:

- Sección "Todos los pagos" en `PagosView.vue` o vista propia
  `PagosHistorialView.vue`.
- Filtros: desde, hasta, método, estado y paciente.
- Totales del resultado (registrado vs anulado) y paginación.

**Criterio de aceptación:** filtrar por rango y método devuelve exactamente los
pagos esperados; los anulados no suman; el total coincide con la suma de los
pagos REGISTRADO del filtro.

**Estado:** ✅ completado el 2026-10-27.

- `PagosView.vue`: tarjeta **Consulta global de pagos** con filtros por rango
  de fechas, método, estado y paciente, tabla paginada y botón **Ver** que
  reutiliza el comprobante del paso 3.
- Resumen del filtro: cantidad y monto de REGISTRADO, cantidad y monto de
  ANULADO y total de pagos. Los anulados se informan aparte y no suman.
- `GET /api/pagos` ahora devuelve `resumen` calculado con `aggregate` sobre el
  mismo filtro (no sobre la página visible) y valida `cita`, `paciente`, `caja`
  y el rango de fechas con 400.
- El filtro `desde`/`hasta` es inclusivo por día: una fecha `AAAA-MM-DD` en
  `hasta` llega hasta las 23:59:59.999 locales.
- Verificado por HTTP: 10 pagos, 9 REGISTRADO por Q1,210.00 y 1 ANULADO por
  Q250.00; los tres días del seed devuelven exactamente sus pagos; EFECTIVO
  devuelve 4 por Q700.00; fechas y ObjectId inválidos devuelven 400.
- Verificado en Edge headless: 10 filas iniciales, 4 al filtrar EFECTIVO, 1 al
  filtrar ANULADO, modal del comprobante abierto desde la consulta global y
  0 errores de consola.
- Capturas: `docs/evidencias/04-pagos-consulta.png` y
  `04-pagos-filtro-anulado.png`. Suite backend: **152/152**.

---

## Paso 5 — README como entregable

Cubre el apartado 12-C del enunciado.

- Agregar **Integrantes**.
- Agregar **Distribución de responsabilidades**.
- Reforzar **Configuración de MongoDB** (instalación local, URI, comprobación
  con `mongosh`, base de pruebas desechables).
- Enlazar `docs/PLAN_CIERRE.md` y `docs/EVIDENCIAS.md`.

**Criterio de aceptación:** una persona ajena puede instalar, configurar,
sembrar y ejecutar el proyecto siguiendo solo el README.

**Estado:** ✅ completado el 2026-10-27 (nombres de integrantes pendientes de
completar por el equipo antes de la entrega).

- Nueva sección **Integrantes** con tabla de responsabilidades. Los nombres
  quedan como `_(nombre completo)_` para que los integrantes los rellenen.
- Nueva sección **Base de datos (MongoDB)**: instalación (servicio local o
  Docker), comprobación con `mongosh`, `MONGO_URI`, y recreación limpia con
  `db.dropDatabase()` + `npm run seed:demo`.
- Nueva sección **Estructura del proyecto** con el árbol de backend, frontend,
  docs y postman.
- Nueva sección **Entregables**: código sin `node_modules`, Postman, capturas,
  base reproducible y ausencia de `.env` reales.
- Conteo de pruebas actualizado de 130 a **152** (119 reglas + 11 seed B5 + 6
  B6 + 16 B7) y bases desechables `sigca_test_b6`/`sigca_test_b7`.
- Postman actualizado a **131 peticiones** (dato verificado sobre el JSON).
- Enlaces añadidos a `docs/PLAN_CIERRE.md` y `docs/EVIDENCIAS.md`.

---

## Paso 6 — Documentación interna al día

- Actualizar `docs/ESTADO_PROYECTO.md` con los pasos 1 a 5.
- Revisar `docs/PENDIENTES.md`: liquidar lo ya implementado y dejar solo lo que
  realmente falte (hoy lista 17 bloques que ya están hechos).
- Registrar las decisiones nuevas en `docs/DECISIONES_TECNICAS.md`.

**Criterio de aceptación:** ningún documento afirma que falta algo que ya está
en el código.

**Estado:** ✅ completado el 2026-10-27.

- `docs/ESTADO_PROYECTO.md`: fecha y cabecera actualizadas; cinco entradas nuevas
  (pasos 1–5) y sección «Qué falta» reescrita con el estado real.
- `docs/PENDIENTES.md`: reescrito. La lista original de 17 bloques queda como
  tabla de verificación (dónde se resolvió cada uno) y solo se enumeran los
  pendientes reales: nombres de integrantes, pasos 7 y 8, commit/push, más tres
  opcionales no bloqueantes.
- `docs/DECISIONES_TECNICAS.md`: nueva sección «2026-10-27 — Cierre del
  proyecto» con las decisiones de base limpia, historial reutilizando la API,
  comprobante dentro de `PagosView`, consulta global embebida, totales con
  `aggregate`, `hasta` inclusivo y estilos `scoped`.

---

## Paso 7 — Evidencias (capturas)

Cubre el apartado 12-E.

- Portal: inicio con carrusel, servicios, contenido educativo/corporativo,
  horarios, contacto y solicitud de cita.
- Administración: panel, pacientes, historial, calendario, pagos con
  comprobante, caja abierta/cerrada, materiales, solicitudes y usuarios.
- Guardar en `docs/evidencias/` y referenciarlas desde `docs/EVIDENCIAS.md`.

**Criterio de aceptación:** existen capturas reales (no mockups) de cada módulo
mencionado en el enunciado.

**Estado:** ✅ completado el 2026-10-28.

- 21 capturas nuevas en `docs/evidencias/` (`01-*` portal y `05-*` administración),
  más las 7 de los pasos 2–4 (`02-*`, `03-*`, `04-*`). Total: **28 capturas**.
- Generadas con un script reproducible en Edge headless/CDP (perfil temporal,
  puerto libre dinámico, timeout de 30 s por comando y espera por el `h1` real de
  cada vista), no con recortes manuales.
- **0 errores de consola y 0 respuestas 5xx**; `faltantes: []`, `sinArchivo: []`,
  `errores: []`.
- Se sustituyeron las URLs de imagen de servicio inexistentes
  (`https://ejemplo.sigca/...`) por SVG locales en `frontend/public/servicios/`.
- Detalle y descripción de cada captura en `docs/EVIDENCIAS.md`.

---

## Paso 8 — Verificación final

- `cd backend && npm test` → todo en verde.
- `cd frontend && npm run build` → sin errores.
- Recorrido completo de la sección 16 del enunciado sobre una base limpia.
- Revisión de `.gitignore` (sin `node_modules`, `dist` ni `.env`).
- Comprobar que la colección Postman sigue pasando.

**Criterio de aceptación:** sección 16 ejecutada de principio a fin sin errores
5xx y con los datos visibles en MongoDB.

**Estado:** ✅ completado el 2026-10-28.

- `npm test` → **152/152** (19 suites), incluida la sección 16 completa en
  `tests/b7.test.js` sobre `sigca_test_b7`.
- `npm run build` → **138 módulos**, sin errores (aviso no bloqueante de *chunk*
  > 500 kB).
- Colección Postman sobre base desechable `sigca_postman_cierre`: **131
  peticiones, 196 pruebas, 0 fallidas, 0 respuestas 5xx**; base eliminada y
  `sigca` intacta.
- `.gitignore` verificado con `git check-ignore`: `node_modules`, `dist` y `.env`
  ignorados; `.env.example` versionado.
- Verificación final documentada en `docs/EVIDENCIAS.md` y `docs/DECISION_LOG.md`.

---

## Opcionales (no bloqueantes)

- Subida de fotografía (archivo) para pacientes y responsables; hoy es URL.
- Mensajes de contacto de ejemplo en el seed para demostrar la bandeja.
- Revisión manual de estilos en móvil y escritorio.
