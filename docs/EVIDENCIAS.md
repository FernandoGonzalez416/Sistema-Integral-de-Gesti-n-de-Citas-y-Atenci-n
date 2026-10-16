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