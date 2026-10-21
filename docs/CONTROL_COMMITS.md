# SIGCA — Control de commits

Rama de integración: `integracion`
Convención: `COMMIT_CONVENTION.md` (Conventional Commits, encabezado ≤ 72 caracteres).

| Bloque | Rama | Commit | Mensaje | Autor | Estado |
|---|---|---|---|---|---|
| B0 | integracion | 11d8987 | chore(docs): crear control de commits | FernandoGonzalez416 | creado |
| B1 | feat/b1-alineacion | 6052ad6 | feat(api): alinear rutas, estados y edicion de citas (B1) | FernandoGonzalez416 | creado |
| B1 | feat/b1-alineacion | ce95dca | feat(ui): alinear cliente y vistas al contrato B1 | FernandoGonzalez416 | creado |
| B1 | feat/b1-alineacion | 1c8d821 | test(postman): alinear coleccion al contrato B1 | FernandoGonzalez416 | creado |
| B1 | feat/b1-alineacion | este commit | docs(b1): registrar decisiones, migracion y control | FernandoGonzalez416 | creado |
| B2 | feat/b2-caja-pagos | c1bb8de | feat(api): caja por usuario y pagos asociados a caja (B2) | FernandoGonzalez416 | creado |
| B2 | feat/b2-caja-pagos | 910d756 | feat(ui): caja propia y movimientos en pagos (B2) | FernandoGonzalez416 | creado |
| B2 | feat/b2-caja-pagos | 0be4f27 | test(postman): verificar caja por usuario y arqueo (B2) | FernandoGonzalez416 | creado |
| B2 | feat/b2-caja-pagos | este commit | docs(b2): registrar caja por usuario y migracion | FernandoGonzalez416 | creado |
| B3 | feat/b3-modelos-relaciones | 8dc8fa2 | feat(api): completar modelos, relaciones y validaciones (B3) | FernandoGonzalez416 | creado |
| B3 | feat/b3-modelos-relaciones | 506ab43 | feat(ui): completar campos de modelos en los formularios (B3) | FernandoGonzalez416 | creado |
| B3 | feat/b3-modelos-relaciones | 7b01f40 | test(postman): verificar campos y vínculos de modelos (B3) | FernandoGonzalez416 | creado |
| B3 | feat/b3-modelos-relaciones | este commit | docs(b3): registrar modelos, relaciones y migración | FernandoGonzalez416 | creado |
| B4 | feat/b4-citas-solicitudes | — | — | — | pendiente |
| B5 | feat/b5-seed | — | — | — | pendiente |
| B6 | feat/b6-portal-contenido | — | — | — | pendiente |
| B7 | feat/b7-entrega | — | — | — | pendiente |

## Notas

- No se hace `push` desde el agente; al final de cada bloque se entrega el comando exacto.
- Cada fila se completa después del commit correspondiente (el hash no puede incluirse en el mismo commit que lo crea).
- Los hashes de la fila de documentación de B1 se refieren a los commits de código y Postman; el commit de docs se identifica por su mensaje porque su propio hash no puede estar dentro de sí mismo.
