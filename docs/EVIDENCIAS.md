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
