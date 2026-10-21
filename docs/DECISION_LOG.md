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
