# SIGCA — LISTA DE DESARROLLO PENDIENTE

## 1. GESTIÓN DE CITAS
- Implementar el endpoint `PUT /api/citas/:id`.
- Crear la interfaz para programar, editar, confirmar, reprogramar, cancelar y completar citas.
- Implementar filtros por fecha, paciente, profesional y estado.
- Utilizar únicamente los estados exigidos por los requisitos.
- Validar horarios disponibles y evitar conflictos.

## 2. GESTIÓN DE SOLICITUDES DE CITA
- Crear una pantalla administrativa para listar y gestionar solicitudes.
- Permitir aceptar, rechazar y convertir solicitudes en citas.
- Hacer obligatorios los campos requeridos, incluidos correo y servicio.
- Evitar generar citas duplicadas al atender una solicitud.
- Implementar el estado RECHAZADA.

## 3. GESTIÓN DE PROFESIONALES
- Crear la pantalla administrativa para gestionar profesionales.
- Relacionar cada profesional con su usuario del sistema.
- Permitir que cada profesional consulte sus propias citas.
- Restringir el acceso a los pacientes y datos autorizados.
- Permitir completar las citas según sus permisos.

## 4. DATOS E HISTORIAL DE PACIENTES
- Agregar fecha de inicio del proceso y observaciones administrativas.
- Implementar la carga de fotografías de pacientes.
- Crear una pantalla con el historial de citas, pagos y servicios de cada paciente.
- Conservar el historial cuando se modifiquen datos relacionados.

## 5. GESTIÓN DE RESPONSABLES
- Agregar dirección y fotografía del responsable.
- Implementar los campos obligatorios establecidos en los requisitos.
- Completar la gestión de relaciones entre pacientes y responsables.
- Validar la asignación de responsables a menores cuando corresponda.

## 6. GESTIÓN DE SERVICIOS
- Agregar imágenes a los servicios.
- Mostrar las imágenes en las pantallas correspondientes.
- Utilizar quetzales (Q) en lugar de dólares.
- Impedir nuevas asignaciones de servicios inactivos.
- Conservar el precio y la duración históricos de las citas existentes.

## 7. GESTIÓN DE PAGOS
- Relacionar cada pago con su caja correspondiente.
- Utilizar los estados y métodos de pago permitidos por los requisitos.
- Registrar quién realiza cada anulación.
- Implementar `GET /api/citas/:id/pagos`.
- Completar la consulta de pagos e historial financiero.
- Mostrar, consultar e imprimir los comprobantes desde la interfaz.
- Calcular correctamente los saldos pendientes.

## 8. RELACIÓN ENTRE PAGOS Y CAJAS
- Asociar explícitamente cada pago con la caja en la que se registra.
- Permitir una caja abierta por usuario.
- Impedir registrar pagos sin una caja propia abierta.
- Excluir pagos anulados de los cálculos financieros.
- Impedir operaciones no permitidas cuando una caja esté cerrada.

## 9. OPERACIONES DE CAJA
- Implementar `GET /api/cajas/:id/movimientos`.
- Completar la consulta de ingresos del día.
- Mostrar el detalle de pagos y los totales por método.
- Calcular correctamente el efectivo esperado.
- Registrar el efectivo contado al cerrar la caja y calcular la diferencia.
- Restringir el acceso a los movimientos según los permisos.

## 10. GESTIÓN DE USUARIOS
- Implementar recuperación y restablecimiento de contraseñas.
- Completar la administración de roles.
- Permitir activar y desactivar usuarios.
- Impedir el inicio de sesión de usuarios inactivos.
- Evitar exponer contraseñas cifradas o hashes en las respuestas de la API.

## 11. PORTAL INSTITUCIONAL
- Permitir configurar el nombre y el logotipo institucional.
- Implementar un carrusel administrable.
- Permitir editar la misión y visión institucionales.
- Completar la edición de publicaciones.
- Gestionar las secciones corporativas, cursos y demás contenidos solicitados.
- Permitir administrar horarios y reflejar los cambios en el portal público.

## 12. FORMULARIO Y MENSAJES DE CONTACTO
- Agregar teléfono y asunto al formulario.
- Implementar las validaciones correspondientes.
- Guardar los mensajes en la base de datos.
- Crear una bandeja administrativa para consultar los mensajes.
- Permitir marcar los mensajes como leídos.

## 13. GESTIÓN DE MATERIALES
- Completar la asignación de materiales a pacientes.
- Impedir asignaciones a pacientes inactivos.
- Restringir las operaciones según el rol del usuario.
- Validar que los profesionales solo gestionen pacientes autorizados.

## 14. ALINEACIÓN DE RUTAS DE LA API
- Revisar las rutas actuales y alinearlas con los requisitos originales.
- Implementar o adaptar las rutas de servicios, solicitudes de cita y cajas.
- Corregir las rutas utilizadas por el frontend.
- Implementar los endpoints que todavía falten.
- Mantener compatibilidad entre modelos, controladores y vistas.

## 15. NAVEGACIÓN Y PERMISOS
- Incorporar las pantallas de profesionales, solicitudes y mensajes.
- Completar las operaciones de citas y comprobantes.
- Mostrar los menús según el rol del usuario.
- Aplicar las restricciones tanto en el frontend como en el backend.

## 16. MODELOS Y RELACIONES DE DATOS
- Completar los campos faltantes de los modelos.
- Revisar las relaciones entre usuarios, profesionales, pacientes, responsables, servicios, citas, solicitudes, pagos y cajas.
- Incorporar las validaciones necesarias.
- Evitar pérdida de información histórica y referencias inconsistentes.

## 17. INTEGRACIÓN Y CONSISTENCIA GENERAL
- Unificar los estados de citas, solicitudes y pagos con los requisitos originales.
- Eliminar métodos de pago y estados que no estén permitidos.
- Completar formularios y pantallas que todavía estén incompletos.
- Integrar correctamente el frontend con el backend.
- Corregir inconsistencias entre los requisitos, los modelos, los endpoints y las interfaces.
