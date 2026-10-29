# SIGCA — Pendientes reales

Actualizado: 2026-10-28.

La lista original de 17 bloques de desarrollo **está implementada**. Este archivo
ya no repite lo hecho: conserva el mapeo de verificación y enumera solo lo que
queda para la entrega. El histórico completo está en `docs/PLAN_DESARROLLO.md`,
`docs/PLAN_CIERRE.md` y `docs/PRUEBAS.md`.

## Estado de la lista original

| Bloque | Estado | Dónde se resolvió |
|---|---|---|
| 1. Gestión de citas | ✅ | `CitasView`, `CalendarioView`, API de citas (B1/B4) |
| 2. Solicitudes de cita | ✅ | `SolicitudesView`, atención atómica y rechazo con motivo (B4) |
| 3. Profesionales | ✅ | `ProfesionalesView`, vínculo `Professional.usuario` (B4) |
| 4. Pacientes e historial | ✅ | `PacientesView`, `PacienteHistorialView` (cierre, paso 2) |
| 5. Responsables | ✅ | `ResponsablesView`, relaciones paciente↔responsable (B3) |
| 6. Servicios | ✅ | Imagen, quetzales y snapshot de precio/duración (B3/B6) |
| 7. Pagos | ✅ | `PagosView`, comprobante y consulta global (cierre, pasos 3 y 4) |
| 8. Pagos y cajas | ✅ | `CashSession`, pago ligado a caja, bloqueo post‑cierre (B2) |
| 9. Operaciones de caja | ✅ | `CajaView`, movimientos, arqueo y diferencia (B2) |
| 10. Usuarios | ✅ | `UsersView`, reset de contraseña y baja lógica (B4) |
| 11. Portal institucional | ✅ | Contenido, carrusel, publicaciones y horarios (B6) |
| 12. Contacto | ✅ | `ContactoModal`, bandeja y badge (B6) |
| 13. Materiales | ✅ | `MaterialesView`, asignación por paciente y permisos (B3) |
| 14. Rutas de la API | ✅ | Alineación de contrato (B1) |
| 15. Navegación y permisos | ✅ | `meta.roles`, menús por rol y API como autoridad (B4) |
| 16. Modelos y relaciones | ✅ | Auditoría de integridad (B7) |
| 17. Integración general | ✅ | Suite 152/152, build y Postman |

## Pendientes para la entrega

### Bloqueantes

1. **Nombres de los integrantes** — completar los dos huecos de la tabla en
   `README.md` (Fernando Javier Gonzalez Ovando ya está).
2. **Commit y push** de los cambios de esta sesión (actualmente sin versionar en
   la rama `integracion`).

### Opcionales (no bloqueantes)

- 2 vulnerabilidades npm heredadas en el frontend (1 moderada, 1 alta),
  documentadas en `docs/PRUEBAS.md`.
- Huecos de numeración de comprobantes bajo consultas concurrentes al mismo
  pago; en uso secuencial la numeración es correlativa.
- Revisión manual exhaustiva de estilos y de todas las combinaciones de rol por
  pantalla (las pruebas de UI cubren los flujos principales).
