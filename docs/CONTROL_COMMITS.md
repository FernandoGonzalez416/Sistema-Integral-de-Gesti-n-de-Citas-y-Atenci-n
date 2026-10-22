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
| B4 | feat/b4-citas-solicitudes | 788677b | feat(api): atender solicitudes y restringir citas por rol (B4) | FernandoGonzalez416 | creado |
| B4 | feat/b4-citas-solicitudes | aa3f9f8 | feat(ui): agregar citas, solicitudes y roles de acceso (B4) | FernandoGonzalez416 | creado |
| B4 | feat/b4-citas-solicitudes | 4327baf | test(postman): cubrir solicitudes, roles y reset (B4) | FernandoGonzalez416 | creado |
| B4 | feat/b4-citas-solicitudes | este commit | docs(b4): registrar reglas, permisos y verificacion | FernandoGonzalez416 | creado |
| B5 | feat/b5-seed | cb133bc | feat(seed): completar datos demo para b5 | FernandoGonzalez416 | creado |
| B5 | feat/b5-seed | 1875f39 | test(seed): verificar invariantes e idempotencia b5 | FernandoGonzalez416 | creado |
| B5 | feat/b5-seed | este commit | docs(seed): documentar seed b5 y verificacion | FernandoGonzalez416 | creado |
| B5.1 | fix/calendario-checkbox | a6cd08f | fix(ui): corregir calendario y filtros activos | FernandoGonzalez416 | creado |
| B5.1 | fix/calendario-checkbox | este commit | docs(ui): registrar verificacion visual y limite del mutex | FernandoGonzalez416 | creado |
| B6 | feat/b6-portal-contenido | a671ec3 | feat(api): agregar configuracion, carrusel y bandeja b6 | FernandoGonzalez416 | creado |
| B6 | feat/b6-portal-contenido | 98c53ef | feat(ui): conectar portal editable y bandeja b6 | FernandoGonzalez416 | creado |
| B6 | feat/b6-portal-contenido | ccab98f | test(postman): cubrir contenido y contacto b6 | FernandoGonzalez416 | creado |
| B6 | feat/b6-portal-contenido | 8c0813e | fix(ui): preseleccionar cita en ruta directa b6 | FernandoGonzalez416 | publicado |
| B6 | feat/b6-portal-contenido | b6bd61e | docs(b6): registrar portal, pruebas y verificacion | FernandoGonzalez416 | publicado |
| B6 | integracion | 145babb | merge(b6): portal de contenido, carrusel y bandeja | FernandoGonzalez416 | integrado |
| B6 | integracion | este commit | docs(b6): registrar publicacion e integracion | FernandoGonzalez416 | integrado |
| B7 | feat/b7-entrega | — | — | — | pendiente |

## Notas

- Los `push` se hacen solo con instrucción explícita del usuario. B5 y B5.1 se publicaron en `origin/integracion`; el merge de B5.1 es `d1b1ad4`. B6 se publicó en `origin/feat/b6-portal-contenido` y se integró con `--no-ff` en `145babb`; `origin/integracion` quedó en ese commit. Antes de integrar se verificó que `d1b1ad4` es ancestro de la rama (`git merge-base --is-ancestor`) y que `/sitio` y `/carrusel` se declaran antes de `/:clave` y `/:id` en `content.routes.js`.
- Cada fila se completa después del commit correspondiente (el hash no puede incluirse en el mismo commit que lo crea).
- Los hashes de la fila de documentación de B1 se refieren a los commits de código y Postman; el commit de docs se identifica por su mensaje porque su propio hash no puede estar dentro de sí mismo.
