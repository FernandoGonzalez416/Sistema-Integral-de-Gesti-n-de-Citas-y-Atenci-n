# Convención de Commits

Este proyecto usa **Conventional Commits** para mantener un historial legible y permitir versionado automático.

## Formato obligatorio

```
<tipo>(<alcance>): <descripción corta en minúsculas>
```

- Máximo 72 caracteres en el encabezado.
- Sin punto final.
- En español o inglés, pero consistente. Se recomienda minúsculas.
- `alcance` es opcional pero recomendado (ej: `auth`, `citas`, `api`, `ui`).

## Tipos permitidos

| Tipo       | Uso |
|------------|-----|
| `feat`     | Nueva funcionalidad |
| `fix`      | Corrección de bug |
| `docs`     | Solo documentación |
| `style`    | Formato, sin cambio lógico |
| `refactor` | Refactorización sin cambio funcional |
| `test`     | Agregar o corregir tests |
| `chore`    | Tareas de mantenimiento, config, deps |
| `perf`     | Mejora de rendimiento |
| `ci`       | Cambios en CI/CD |
| `revert`   | Revierte un commit anterior |

## Ejemplos válidos

```
feat(citas): agregar reserva de cita por paciente
fix(auth): corregir validación de token expirado
docs(decisiones): registrar decisión de stack
refactor(api): simplificar servicio de citas
test(citas): agregar prueba de cancelación
chore(deps): actualizar dependencias
```

## Reglas

1. Un commit = un cambio lógico.
2. Si el cambio rompe compatibilidad, agregar `!` y explicar en el cuerpo:
   ```
   feat(api)!: cambiar respuesta de citas a paginada
   ```
3. Cuerpo opcional para explicar el **por qué**, no el qué.
4. Todo cambio relevante debe registrarse en `docs/DECISION_LOG.md`.

## Referencia

https://www.conventionalcommits.org/
