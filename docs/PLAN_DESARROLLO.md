# Plan de Desarrollo — SIGCA

Proyecto final: Sistema Integral de Gestión de Citas y Atención.
Stack obligatorio: Vue 3 + Vite + Vue Router + Pinia / Node + Express + Mongoose + JWT + bcrypt.

## Fases y criterios de aceptación

- [ ] FASE 0 — Auditoría y planificación. Criterio: diagnóstico real + este plan + estructura propuesta.
- [ ] FASE 1 — Configuración inicial. Criterio: frontend y backend arrancan; backend conecta a MongoDB; existe `GET /api/health`.
- [ ] FASE 2 — Estructura y navegación. Criterio: layout público + layout admin + router + navegación responsive sin errores.
- [ ] FASE 3 — Autenticación y autorización. Criterio: login con JWT, roles ADMINISTRADOR/RECEPCIONISTA/PROFESIONAL, `GET /api/auth/me`, rutas protegidas en front y back.
- [ ] FASE 4 — Usuarios, servicios y contenido institucional. Criterio: CRUDs persisten en MongoDB.
- [ ] FASE 5 — Portal público funcional. Criterio: formularios de contacto y solicitud de cita persisten en MongoDB; contenido editable sin tocar código.
- [ ] FASE 6 — Pacientes y responsables. Criterio: CRUD + relaciones + validación de menor de edad.
- [ ] FASE 7 — Profesionales, solicitudes y citas. Criterio: reglas de negocio verificables vía Postman (sin traslapes, sin pasado, estados válidos).
- [ ] FASE 8 — Calendario. Criterio: muestra citas reales de MongoDB.
- [ ] FASE 9 — Materiales educativos. Criterio: CRUD + asignación a pacientes.
- [ ] FASE 10 — Pagos y saldos. Criterio: pagos completos/parciales, anulaciones históricas, saldos PENDIENTE/PARCIAL/PAGADO sin superar costo.
- [ ] FASE 11 — Caja diaria. Criterio: apertura/cierre, totales por método, diferencias, bloqueos post-cierre.
- [ ] FASE 12 — Datos ficticios y pruebas. Criterio: script seed repetible sin borrar datos reales + pruebas de reglas clave.
- [ ] FASE 13 — Integración y seguridad. Criterio: revisión de roles, validaciones, errores, códigos HTTP, secretos.
- [x] FASE 14 — Entregables. Criterio: README completo, colección Postman, `.env.example`, evidencias. **Completado (2026-10-16):** README actualizado con stack/instalación/seed/Postman/pruebas; colección Postman 20 carpetas / 79 peticiones verde; `.gitignore` y `.env.example` alineados; nuevas evidencias en `docs/EVIDENCIAS.md` (health, `npm test` 43/43, seed dry-run, MongoDB intacto, .gitignore verificado).

## Estructura propuesta (sencilla, monorepo con 2 apps)

```
ProyectoFinalDesarrolloWeb/
  frontend/          # Vue 3 + Vite (JS)
    src/
      router/      # rutas públicas + admin con guards
      stores/      # Pinia (auth, contenido)
      views/       # Public/ + Admin/
      components/  # reutilizables (Navbar, Footer, Carousel, FormField...)
      api/         # cliente fetch hacia /api
  backend/           # Express ESM + Mongoose
    src/
      config/      # db.js, env.js
      models/      # User, Patient, etc. (uno por fase)
      routes/
      controllers/
      middlewares/ # auth, roles, validate, errorHandler, notFound
      utils/       # jwt, seedAdmin
    tests/           # pruebas por fase (Fase 12-13)
  docs/              # PLAN_DESARROLLO, ESTADO_PROYECTO, DECISIONES_TECNICAS, PRUEBAS
  .env.example       # plantilla (Fase 1)
```

## Variables de entorno necesarias (Fase 1)

Backend: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_URL`.
Frontend: `VITE_API_URL`.

## Instalación y ejecución (previsto Fase 1)

```
cd backend && npm install && npm run dev    # http://localhost:3000 + /api/health
cd frontend && npm install && npm run dev   # http://localhost:5173
mongosh --eval "db.runCommand({ping:1})"    # verificar Mongo local
```

## Tareas pequeñas de Fase 1 (orden)

1. Crear `backend/` Express ESM + `/api/health` + middlewares base + conexión Mongoose.
2. Crear `.env.example` (backend + frontend) sin secretos reales.
3. Crear `frontend/` Vue 3 + Vite + Router + Pinia mínimo que consume `/api/health`.
4. Verificar arranque de ambos + conexión Mongo + documentar comandos en README.
