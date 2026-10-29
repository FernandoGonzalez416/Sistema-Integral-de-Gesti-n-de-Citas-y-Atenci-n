# Evidencias SIGCA — 2026-10-16

## Health check (HTTP real, BD desechable, puerto 3990)
```
GET /api/health -> 200 {"ok":true,"service":"sigca-backend","timestamp":"2026-10-16T04:30:40.031Z"}
```
Confirmado: el backend responde correctamente sobre BD dedicada; no usa la base de desarrollo `sigca`.

## Suite de pruebas automatizadas (`npm test`)
```
ℹ suites 9
ℹ pass 43
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1758.4934
```
Todas las 43 pruebas (9 grupos) pasan. Runner nativo `node:test`, sin nuevas dependencias.

## Seed de demostración (`npm run seed:demo:dry`)
```
Resumen del plan: 0 por crear, 31 ya existentes.
Simulación finalizada. No se escribió nada.
Seed de demostración finalizado. Creados: 0, omitidos: 0.
```
El seed es idempotente y no destructivo: lee la base existente y omite lo ya creado. Prueba de que las claves naturales funcionan.

## `.gitignore` y `git check-ignore`
- `node_modules/` ignorado (cubre `backend/node_modules` y `frontend/node_modules`).
- `dist/` ignorado (cubre `frontend/dist` y `backend/dist`).
- `.env` ignorado (no se versionan secretos reales).
- Verificado con `git check-ignore -v` y `Test-Path` desde la raíz del repositorio.

## MongoDB — persistencia real `sigca` (intacta)
```
usuarios=3  servicios=5  profesionales=3  pacientes=6  citas=9  pagos=9  comprobantes=0  materiales=6  asignaciones=3  cajas=3
```
Todas las colecciones tienen el número esperado de documentos tras todas las correcciones (Fases 0‑13). Sin commits ni escritura accidental sobre la base de desarrollo.

---
*Generado automáticamente el 2026-10-16 tras la corrección transversal y el cierre de observaciones menores.*
---

## 2026-10-21 — B6: portal, carrusel, publicaciones y bandeja

### Suite automatizada (`npm test`)

```
tests 136
suites 18
pass 136
fail 0
cancelled 0
skipped 0
todo 0
```

Dos corridas consecutivas. Incluye las 6 pruebas de `backend/tests/b6.test.js`. Bases desechables: `sigca_test_rules`, `sigca_test_seed` y `sigca_test_b6`; `sigca` intacta.

### Build de producción

```
vite v5.4.21 building for production...
✓ 135 modules transformed.
✓ built
```

### Postman (emulación)

- `postman/SIGCA.postman_collection.json` + `SIGCA.postman_environment.json`.
- BD desechable `sigca_postman_b6`, puerto 3010.
- **131 peticiones, 196 pruebas, 0 fallidas, 0 respuestas 5xx**.
- Requiere BD limpia por ejecución por el horario del sábado ya existente; no es un defecto de la aplicación.

### UI en Edge headless/CDP

- Backend sobre `sigca_ui_b6` y Vite en `http://localhost:5173`.
- Portal: nombre/logo, carrusel, misión, visión, información, publicaciones y horarios.
- Admin: configuración, carrusel (alta/edición/estado/baja), publicaciones (alta/edición) y horarios.
- Contacto: validación, envío, bandeja, filtros, badge, marcado de leído y estado vacío.
- Servicios: imagen real y placeholder, precio en `Q`, enlace con `?servicio=`, modal preseleccionado y ruta directa tras recargar.
- Guardia de roles: RECEPCIONISTA fuera de `/admin/mensajes` y sin enlace en el menú.
- Menú móvil a 390×844.
- Defecto corregido: la ruta directa `/solicitar-cita?servicio=...` no preseleccionaba el servicio porque `CitaModal` montaba con `citaAbierta=true` y su `watch` no era `immediate`. Verificado después de la corrección.

Capturas temporales de la verificación en `C:\Users\ggonz\AppData\Local\Temp\sigca-ui-b6` (no versionadas).

### Publicación e integración (2026-10-21)

- `git merge-base --is-ancestor d1b1ad4 feat/b6-portal-contenido` → **ok**: la rama B6 incluye el merge de B5.1 y sale de `82a389d`, el commit de docs posterior en `integracion`.
- `content.routes.js` declara `GET/PUT /sitio` y monta `/carrusel` **antes** de `GET /:clave` y `PUT /:id`; `carousel.routes.js` declara `/admin/todos` antes de `/:id`. En ejecución, `GET /api/contenido/sitio` responde 200 y `PUT` responde 200/400/401/403 (no lo captura `/:clave`).
- Regresión antes de publicar: `npm test` **136/136** y `npm run build` **135 módulos**.
- `origin/feat/b6-portal-contenido` publicado; merge `--no-ff` en `integracion` = **`145babb`** (35 archivos, +3200/−337), publicado en `origin/integracion`.

## B7 — sección 16 e integridad (2026-10-21)

### Prueba automatizada

```
$ node --test tests/b7.test.js
▶ B7 — sección 16 e integridad de datos
  ✔ 1. inicio de sesión como administrador (paso 1)
  ✔ 2. registrar paciente y asociar responsable (pasos 2-3)
  ✔ 3. crear servicio con precio (paso 4)
  ✔ 4. programar cita y rechazar horario ocupado (pasos 5-6)
  ✔ 5. confirmar la cita y consultarla en el calendario (pasos 7-8)
  ✔ 6. abrir caja con monto inicial (paso 9)
  ✔ 7. abono parcial y consulta de saldo (pasos 10-11)
  ✔ 8. segundo pago y estado financiero PAGADO (pasos 12-13)
  ✔ 9. consultar el comprobante interno (paso 14)
  ✔ 10. pagos con distintos métodos e ingresos del día (pasos 15-16)
  ✔ 11. efectivo contado, cierre y bloqueo de la caja cerrada (pasos 17-19)
  ✔ 12. historial de pagos del paciente (paso 20)
  ✔ 13. solicitud del portal convertida en cita (integridad solicitud→cita)
  ✔ 14. integridad de modelos, relaciones e históricos (paso 21)
  ✔ 15. permisos por rol (paso 22)
  ✔ 16. ninguna petición de la pasada devuelve 5xx
ℹ tests 16
ℹ pass 16
ℹ fail 0
```

Base desechable `sigca_test_b7` (puerto 3991), eliminada al terminar; `sigca` intacta.

Datos verificados directamente en MongoDB:

- Citas → paciente/profesional/servicio existentes y `fin > inicio`.
- Pagos → cita y caja existentes; `pago.paciente` coincide con la cita.
- Comprobantes → un comprobante por pago, con monto y método copiados.
- Relaciones paciente–responsable y vínculo profesional–usuario con rol PROFESIONAL.
- Snapshot de caja: ingresos guardados = suma de pagos REGISTRADO; esperado = inicial + EFECTIVO; diferencia = contado − esperado.
- Precio y duración de una cita no cambian al actualizar el servicio (25000/30 frente a 30000/45).

### UI en Edge headless/CDP

Base `sigca_ui_b7` (seed de 76 registros), backend `:3000` y Vite `:5173`.

- Pacientes: 10 filas del seed; alta de "Lucía Morales" con fecha de inicio y observaciones; desactivación (sale del filtro Activos), visualización como inactiva y reactivación.
- Responsables: alta de "Carlos Morales" con email y dirección; asociación desde la ficha del paciente y listado de responsables actuales.
- Materiales: alta de "Guía B7 de hábitos" (DOCUMENTO) y asignación desde la ficha del paciente.
- Caja: apertura con Q100.00, ingreso de Q25.00, efectivo esperado Q125.00, cierre con efectivo contado Q125.00 y diferencia **Q0.00**.
- Pagos: cita PENDIENTE seleccionada, abono de Q25.00 con cambio a PARCIAL, pago REGISTRADO en el historial y formulario deshabilitado tras cerrar la caja.
- Smoke: Citas (15 filas), Solicitudes (2), Profesionales (3), Calendario (15 eventos) y panel administrativo.
- **0 errores de consola y 0 respuestas 5xx** durante todo el recorrido.

Capturas temporales en `C:\Users\ggonz\AppData\Local\Temp\sigca-ui-b7` (no versionadas): `01-panel` a `08-pago-bloqueado`.

### Defecto corregido

La cabecera de `/admin/pacientes/:id/responsables` quedaba vacía ("Responsables de ( años)") y no mostraba el aviso de menor porque la vista buscaba el ObjectId como texto con `getPacientes({ q })`. Ahora usa `getPaciente(id)`; verificado con "Responsables de Lucía Morales (14 años)" y el aviso visible.

### Regresión final

```
npm test        → tests 152 / pass 152 / fail 0 (19 suites)
npm run build   → 135 modules transformed · built
```

## Cierre 2026-10-27 — historial, comprobante y consulta de pagos

Base `sigca` limpia y resembrada con el conjunto B5 (77 registros). Todas las
capturas se tomaron en Edge headless (CDP) contra el backend real en
`http://localhost:3000` y Vite en `http://localhost:5173`.

### `02-pacientes-historial-enlace.png`

- Tabla de pacientes con la acción **Historial** y las fechas en una sola línea,
  sin desbordar la tarjeta.
- Verificado con ADMINISTRADOR.

### `02-historial-paciente.png`

- Historial consolidado de un paciente con sus citas y sus pagos reales.
- Incluye el pago **ANULADO** con motivo y su comprobante.
- Verificado también con PROFESIONAL: ve el historial clínico pero **no** montos
  ni pagos (la API responde 403 en `/api/pagos`).
- 0 errores de consola en ambos roles.

### `03-pagos-lista.png`

- Tabla de pagos de una cita con la columna **Comprobante**, el número
  (`REC-2026-…`), el estado y las acciones **Ver comprobante** / **Anular**.

### `03-comprobante-pago.png`

- Modal del comprobante de un pago REGISTRADO: número, estado, paciente,
  servicio, cita, profesional, método, fecha, usuario que registró, caja y total.
- En modo impresión (`Emulation.setEmulatedMedia: print`) el contenedor queda
  `hidden`, la hoja `visible` y los botones `display: none`.

### `03-comprobante-anulado.png`

- Comprobante de un pago ANULADO (`REC-2026-000003`, Q250.00) con el bloque rojo
  de motivo, fecha de anulación y usuario que anuló.

### `04-pagos-consulta.png`

- Consulta global de pagos sin filtros: **10 pagos**, 9 REGISTRADO por
  **Q1,210.00** y 1 ANULADO por **Q250.00**.

### `04-pagos-filtro-anulado.png`

- Consulta global filtrada por estado ANULADO: 1 pago, con su comprobante y la
  opción de abrirlo desde la propia tabla.
- El filtro por método EFECTIVO devuelve 4 pagos por Q700.00 y los filtros de
  fecha por día coinciden con los pagos del seed.

### Regresión

```
npm test        → tests 152 / pass 152 / fail 0 (19 suites)
npm run build   → 138 modules transformed · built
```

## Cierre 2026-10-28 — capturas del portal y de la administración

21 capturas nuevas en `docs/evidencias/`, tomadas en Edge headless (CDP) contra el
backend real (`http://localhost:3000`) y Vite (`http://localhost:5173`) sobre la
base `sigca` con el conjunto B5 (77 registros). **0 errores de consola y 0 respuestas
5xx** en todo el recorrido; `faltantes: []`, `sinArchivo: []`, `errores: []`.

### Portal público

| Captura | Contenido |
| --- | --- |
| `01-portal-inicio.png` | Portada: logotipo, menú, carrusel de 5 diapositivas, accesos, indicadores (4 servicios, 3 áreas, horario), servicios destacados, misión/visión, publicaciones y horarios. |
| `01-portal-servicios.png` | Catálogo agrupado por área con buscador y filtros; primer servicio expandido mostrando su **imagen real** (`/servicios/consulta-odontologica.svg`). |
| `01-portal-contenido.png` | Contenido educativo y corporativo con las publicaciones sembradas y su tipo (ARTÍCULO, VIDEO, DOCUMENTO). |
| `01-portal-contacto.png` | Modal **Contacto** (`#cm-titulo`) con nombre, correo, teléfono, motivo y mensaje. |
| `01-portal-solicitud.png` | Modal **Solicitar cita** (`#ct-titulo`) con servicio preseleccionado, datos del paciente y fecha. |

Las 5 imágenes de servicio eran URLs a un dominio inexistente
(`https://ejemplo.sigca/...`) y la app caía al placeholder. Se sustituyeron por
SVG locales en `frontend/public/servicios/` (mismo estilo que el carrusel) y se
actualizaron los 5 documentos de la colección `services`. Verificado en el DOM:
`4/4` miniaturas con `naturalWidth = 200`.

### Administración

| Captura | Contenido |
| --- | --- |
| `05-admin-panel.png` | Panel de gestión con los accesos por módulo. |
| `05-admin-citas.png` | Citas con paciente, profesional, servicio, fecha, estado y acciones. |
| `05-admin-solicitudes.png` | Solicitudes del portal con estado y conversión a cita. |
| `05-admin-calendario.png` | Calendario de citas con las 15 citas del seed y leyenda de estados. |
| `05-admin-pacientes.png` | Pacientes con filtros, acciones e **Historial**. |
| `05-admin-responsables.png` | Responsables con email y dirección completos. |
| `05-admin-materiales.png` | Materiales educativos con tipo y enlace. |
| `05-admin-profesionales.png` | Profesionales con su usuario vinculado. |
| `05-admin-usuarios.png` | Usuarios por rol. |
| `05-admin-servicios.png` | Servicios con precio, duración, categoría y estado. |
| `05-admin-contenidos.png` | Contenido institucional, carrusel y publicaciones. |
| `05-admin-mensajes.png` | Bandeja de mensajes de contacto (estado vacío real: 0 mensajes en el seed). |
| `05-admin-paciente-responsables.png` | Ficha de responsables de un paciente con el aviso de menor. |
| `05-admin-paciente-materiales.png` | Materiales asignados a un paciente. |
| `05-admin-caja-abierta.png` | Caja ABIERTA de `recepcion.demo` con monto inicial e ingresos. |
| `05-admin-caja-cerrada.png` | Caja CERRADA de `recepcion2.demo` con el resumen del cierre. |

### Nota sobre el método

Durante la primera tanda, `/admin/calendario` salía teñido de naranja. Se
inspeccionó el DOM y la capa era `div#coverTemperature` (`z-index: 99999999`,
`opacity: 0.3`), **inyectada por una extensión del navegador**, no por la
aplicación: no aparece ni en `src/`, ni en `frontend/public/`, ni en
`node_modules`. Las capturas definitivas se tomaron con
`--disable-extensions --disable-component-extensions-with-background-pages`, y el
script verifica en cada captura que `#coverTemperature` no exista
(`overlayNavegador: false` en las 21).

## Verificación final 2026-10-28

### Suite automatizada (`npm test`)

```
tests 152
suites 19
pass 152
fail 0
cancelled 0
skipped 0
todo 0
```

Incluye `tests/b7.test.js` (16 pruebas), que ejecuta el recorrido completo de la
**sección 16** del enunciado sobre la base desechable `sigca_test_b7`.

### Build de producción (`npm run build`)

```
vite v5.4.21 building for production...
✓ 138 modules transformed.
dist/assets/index-D412tKY-.css   137.55 kB │ gzip:  26.82 kB
dist/assets/index-azqu-Vyk.js    605.66 kB │ gzip: 189.26 kB
✓ built in 6.14s
```

Aviso no bloqueante de Vite: el *chunk* principal supera los 500 kB (sin
code-splitting). No impide la entrega.

### Colección Postman

- Base desechable `sigca_postman_cierre` (puerto 3011) sembrada con `seed:demo`
  (77 registros) y eliminada al terminar; `sigca` sin cambios.
- **131 peticiones, 196 pruebas, 0 fallidas, 0 respuestas 5xx.** Todas las
  respuestas fueron 2xx, incluidos los códigos de error esperados (401/403/404/
  409) que la colección provoca a propósito.
- Se ejecutó con un emulador fiel (sustitución de `{{variables}}`, tokens,
  `pm.test`/`pm.expect` y `pm.response`); no sustituye una corrida desde la app
  de Postman, que no está disponible en el entorno.

### `.gitignore`

```
git check-ignore -v
.gitignore:2:node_modules/  backend/node_modules
.gitignore:2:node_modules/  frontend/node_modules
.gitignore:5:dist/          frontend/dist
.gitignore:9:.env           backend/.env
```

`backend/.env.example` y `frontend/.env.example` sí se versionan (sin secretos).
`docs/evidencias/` se versiona a propósito: es entregable.


