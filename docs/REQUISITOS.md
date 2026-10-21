# PROYECTO FINAL INTEGRADOR
## SIGCA — Sistema Integral de Gestión de Citas y Atención

- **Modalidad:** Grupal (3 estudiantes)
- **Punteo total:** 100 puntos
- **Tecnologías principales:** Vue.js, Node.js, Express y MongoDB

> Nota: en las rutas de la API (sección 8) el texto original perdió los parámetros (`:id`). Aquí se restauraron como `:id`. Donde el original no permitía deducir el parámetro (contenido), verificar con el docente.

---

## 1. DESCRIPCIÓN GENERAL

Una empresa dedicada a la atención psicológica y estimulación auditiva verbal requiere implementar una plataforma web que permita administrar sus operaciones y ofrecer información sobre sus servicios.

Actualmente, la empresa necesita centralizar la información de sus pacientes, responsables, servicios, citas, materiales, pagos y movimientos de caja, además de contar con un sitio web público que permita a los visitantes consultar información y solicitar citas.

Para solucionar esta necesidad, cada grupo deberá desarrollar SIGCA — Sistema Integral de Gestión de Citas y Atención, una aplicación web Full Stack que integre la administración de información institucional con las operaciones internas de un centro de atención.

El sistema deberá contar con dos áreas principales:

**A. Portal público**
Permitirá a los visitantes consultar información institucional, servicios, contenido educativo, horarios de atención, información de contacto y enviar solicitudes de citas.

**B. Sistema administrativo privado**
Permitirá a los usuarios autorizados administrar pacientes, responsables, servicios, citas, calendario, materiales, usuarios, pagos, saldos pendientes y caja diaria.

Todos los grupos deberán desarrollar el mismo sistema y cumplir los mismos requisitos funcionales, técnicos y reglas de negocio.

## 2. OBJETIVO GENERAL

Desarrollar una aplicación web empresarial Full Stack que permita gestionar integralmente las operaciones administrativas de un centro de atención, utilizando Vue.js, Node.js, Express, MongoDB y mecanismos de autenticación, autorización, validación y persistencia de datos.

## 3. OBJETIVOS ESPECÍFICOS

- Desarrollar una interfaz web responsive utilizando Vue.js.
- Implementar navegación mediante Vue Router.
- Administrar el estado global utilizando Pinia.
- Construir una API REST utilizando Node.js y Express.
- Implementar persistencia mediante MongoDB y Mongoose.
- Desarrollar operaciones CRUD.
- Implementar autenticación JWT y control de acceso basado en roles.
- Administrar pacientes y responsables.
- Gestionar servicios y programación de citas.
- Implementar un calendario de atención.
- Administrar materiales educativos.
- Registrar pagos completos y parciales.
- Calcular saldos pendientes.
- Implementar un control de caja diaria.
- Aplicar reglas de negocio y validaciones.
- Documentar correctamente la instalación y ejecución del sistema.

## 4. ESTRUCTURA GENERAL DEL SISTEMA

La aplicación deberá integrar los siguientes módulos:

**Portal público**
- Inicio.
- Misión y visión.
- Servicios.
- Contenido educativo.
- Corporativo.
- Horarios.
- Contacto.
- Solicitud de citas.

**Sistema administrativo**
- Autenticación.
- Usuarios y roles.
- Pacientes.
- Responsables.
- Profesionales.
- Servicios.
- Solicitudes de citas.
- Gestión de citas.
- Calendario.
- Materiales.
- Pagos.
- Caja diaria.
- Administración del contenido institucional.

Los módulos deberán estar integrados mediante una API REST y utilizar MongoDB para almacenar la información.

## 5. REQUISITOS FUNCIONALES

### RF-01. PORTAL PÚBLICO

El sistema deberá contar con un sitio web público que incluya:

**Inicio**
- Logotipo (queda a su imaginación pero debe ser cambiable).
- Nombre del centro (queda a su imaginación pero debe ser editable).
- Menú de navegación.
- Carrusel con al menos 5 imágenes.
- Acceso a las secciones principales.
- Pie de página.
- Contenido editable por el administrador.

**Misión y visión**
- Visualización de misión y visión.
- Información obtenida desde MongoDB.
- Contenido editable por el administrador.

**Servicios**
- Listado de servicios.
- Nombre.
- Descripción.
- Imagen.
- Duración estimada.
- Botón para solicitar cita.
- Contenido editable por el administrador.

**Contenido educativo**
- Publicaciones informativas.
- Título.
- Descripción.
- Fecha de publicación.
- Imagen o enlace opcional.
- Contenido editable por el administrador.

**Corporativo**
- Capacitaciones.
- Escuela para padres.
- Descripción de actividades.
- Imágenes relacionadas.
- Contenido editable por el administrador.

**Horarios**
- Días de atención.
- Horas de inicio y finalización.
- Información configurable.

**Contacto**
- Nombre.
- Correo electrónico.
- Teléfono.
- Asunto.
- Mensaje.

El formulario deberá validar los datos y almacenar los mensajes en MongoDB.

El portal deberá ser responsive.

### RF-02. AUTENTICACIÓN Y ROLES

Implementar autenticación mediante correo electrónico, contraseña y JWT.

Los roles obligatorios serán:

**ADMINISTRADOR**
- Administrar usuarios.
- Administrar servicios.
- Administrar contenido institucional.
- Gestionar pacientes y responsables.
- Gestionar citas.
- Administrar materiales.
- Registrar y consultar pagos.
- Consultar y administrar caja diaria.
- Consultar mensajes.
- En sí debe tener control y acceder a todo.

**RECEPCIONISTA**
- Registrar pacientes.
- Administrar responsables.
- Gestionar solicitudes de citas.
- Programar, confirmar, reprogramar y cancelar citas.
- Registrar pagos.
- Consultar saldos pendientes.
- Consultar y cerrar su caja diaria.
- Consultar servicios y horarios.

**PROFESIONAL**
- Consultar sus citas asignadas.
- Consultar información básica de sus pacientes.
- Marcar citas como completadas.
- Consultar y asignar materiales.

Los permisos deberán verificarse desde el backend.

Los usuarios inactivos no podrán iniciar sesión.

### RF-03. GESTIÓN DE PACIENTES

Implementar las operaciones:
- Registrar.
- Consultar.
- Buscar.
- Actualizar.
- Desactivar mediante eliminación lógica, es decir no se borra de base de datos.

Cada paciente deberá contener:
- Identificador único.
- Fotografía.
- Nombres.
- Apellidos.
- Fecha de nacimiento.
- Sexo.
- Teléfono.
- Dirección.
- Fecha de inicio del proceso.
- Observaciones administrativas generales.
- Estado ACTIVO/INACTIVO.

La edad deberá calcularse automáticamente a partir de la fecha de nacimiento.

El sistema deberá permitir consultar las citas y pagos relacionados con cada paciente.

### RF-04. GESTIÓN DE RESPONSABLES

Cada paciente podrá tener uno o varios responsables.

Campos obligatorios:
- Identificador.
- Fotografía.
- Nombres.
- Apellidos.
- Parentesco.
- Teléfono.
- Correo electrónico.
- Dirección.

Operaciones:
- Registrar responsable.
- Consultar.
- Modificar.
- Asociar a uno o varios pacientes.
- Consultar responsables asociados.

Los pacientes menores de 18 años deberán tener al menos un responsable registrado antes de programar una cita.

### RF-05. ADMINISTRACIÓN DE SERVICIOS

Implementar CRUD de servicios.

Campos:
- Identificador.
- Nombre.
- Descripción.
- Duración en minutos.
- Precio en quetzales.
- Imagen o URL de imagen.
- Estado ACTIVO/INACTIVO.

Los servicios activos deberán aparecer en el portal público.

Los servicios inactivos no podrán utilizarse para programar nuevas citas.

El precio del servicio deberá utilizarse para determinar el costo inicial de una cita.

### RF-06. SOLICITUDES DE CITAS

El portal público deberá permitir enviar solicitudes de citas.

Campos:
- Nombre del solicitante.
- Correo.
- Teléfono.
- Servicio solicitado.
- Fecha preferida.
- Mensaje adicional.
- Estado de solicitud.

Estados:
- PENDIENTE
- ATENDIDA
- RECHAZADA

Las solicitudes no deberán reservar automáticamente horarios.

El administrador o recepcionista podrá revisar una solicitud y convertirla en una cita asociada a un paciente registrado.

Una solicitud atendida deberá conservar la referencia a la cita generada.

### RF-07. GESTIÓN DE CITAS

El sistema deberá permitir:
- Programar citas.
- Consultar citas.
- Confirmar citas.
- Reprogramar citas.
- Cancelar citas.
- Marcar citas como completadas.
- Consultar historial por paciente.
- Filtrar por profesional, fecha y estado.

Cada cita deberá contener:
- Identificador.
- Paciente.
- Servicio.
- Profesional.
- Fecha.
- Hora de inicio.
- Hora de finalización.
- Precio registrado de la cita.
- Estado.
- Observaciones administrativas.
- Fecha de creación.

Estados obligatorios:
- PENDIENTE
- CONFIRMADA
- COMPLETADA
- CANCELADA

La duración y el precio deberán copiarse desde el servicio al momento de programar la cita.

Si posteriormente cambia el precio del servicio, las citas existentes deberán conservar su precio original.

### RF-08. CALENDARIO DE CITAS

Implementar un calendario que permita:
- Visualizar citas por mes.
- Identificar días con citas.
- Consultar las citas de una fecha.
- Mostrar paciente, servicio, profesional, horario y estado.
- Seleccionar una cita para consultar sus detalles.

Los datos deberán obtenerse desde MongoDB mediante la API REST.

Se permite utilizar FullCalendar o una librería equivalente.

### RF-09. GESTIÓN DE MATERIALES

El sistema deberá permitir administrar materiales educativos o de apoyo.

Cada material deberá contener:
- Identificador.
- Título.
- Descripción.
- Tipo.
- Enlace al recurso.
- Fecha de registro.
- Estado ACTIVO/INACTIVO.

Operaciones:
- Registrar.
- Consultar.
- Modificar.
- Desactivar.
- Asignar materiales a pacientes.
- Consultar materiales asignados.

No será obligatorio almacenar archivos físicos.

### RF-10. GESTIÓN DE PAGOS

El sistema deberá permitir registrar y administrar los pagos realizados por los pacientes.

Funcionalidades obligatorias:
- Registrar pagos asociados a una cita.
- Consultar pagos por paciente.
- Registrar pagos completos.
- Registrar abonos parciales.
- Calcular automáticamente el saldo pendiente.
- Consultar pagos por fecha.
- Consultar pagos por método.
- Generar un número único de comprobante interno.
- Consultar el historial de pagos de una cita.
- Anular pagos mediante una operación autorizada y justificada.

Campos obligatorios de cada pago:
- Identificador.
- Número de comprobante.
- Paciente.
- Cita.
- Monto pagado.
- Método de pago.
- Fecha y hora.
- Usuario que registró el pago.
- Estado.
- Motivo de anulación, cuando corresponda.

Métodos de pago:
- EFECTIVO
- TRANSFERENCIA
- TARJETA

Estados de cada pago:
- REGISTRADO
- ANULADO

Estados financieros de una cita:
- **PENDIENTE:** no registra pagos válidos.
- **PARCIAL:** registra pagos válidos, pero existe saldo pendiente.
- **PAGADO:** el total de pagos válidos cubre el costo de la cita.

El estado financiero deberá calcularse automáticamente y no podrá modificarse manualmente.

Ejemplo:
- Servicio: Atención psicológica.
- Costo de la cita: Q250.00
- Primer pago: Q100.00
- Saldo pendiente: Q150.00
- Estado: PARCIAL
- Segundo pago: Q150.00
- Saldo pendiente: Q0.00
- Estado: PAGADO

Los pagos deberán conservarse como registros independientes para permitir consultar todos los abonos realizados.

No se permitirá eliminar físicamente los pagos.

### RF-11. CONTROL DE CAJA DIARIA

El sistema deberá incluir un módulo para controlar los ingresos registrados durante la jornada.

Funcionalidades obligatorias:
- Abrir una caja diaria.
- Registrar el usuario responsable.
- Registrar el monto inicial de efectivo.
- Asociar automáticamente los pagos a una caja abierta.
- Consultar ingresos por método de pago.
- Consultar el total de ingresos del día.
- Calcular el efectivo esperado.
- Registrar el efectivo contado al cierre.
- Calcular diferencias de caja.
- Cerrar la caja.
- Consultar cierres anteriores.
- Impedir nuevos movimientos en cajas cerradas.

Información de una caja:
- Identificador.
- Usuario responsable.
- Fecha y hora de apertura.
- Monto inicial.
- Total en efectivo.
- Total en transferencias.
- Total en tarjeta.
- Total de ingresos.
- Efectivo esperado.
- Efectivo contado.
- Diferencia.
- Fecha y hora de cierre.
- Estado.

Estados:
- ABIERTA
- CERRADA

Ejemplo de caja diaria:
- Monto inicial: Q200.00
- Pagos en efectivo: Q500.00
- Pagos por transferencia: Q350.00
- Pagos por tarjeta: Q150.00
- Total de ingresos: Q1,000.00
- Efectivo esperado: Q200.00 + Q500.00 = Q700.00
- Efectivo contado al cierre: Q690.00
- Diferencia: Q690.00 - Q700.00 = -Q10.00

El sistema deberá mostrar una diferencia de Q10.00 faltantes.

Reglas del módulo:
- Cada usuario autorizado podrá tener únicamente una caja abierta a la vez.
- Todo pago deberá asociarse a una caja abierta del usuario que lo registra.
- Los pagos anulados no deberán contabilizarse como ingresos válidos.
- Una caja cerrada no podrá recibir nuevos pagos ni modificarse.
- La caja deberá conservar el detalle de sus movimientos.
- Para simplificar el proyecto, solamente podrán anularse pagos pertenecientes a cajas abiertas.
- Los pagos de cajas cerradas quedarán bloqueados para anulación; no se exigirá implementar devoluciones ni ajustes contables posteriores al cierre.
- El administrador podrá consultar todas las cajas.
- La recepcionista podrá consultar y cerrar sus propias cajas.
- El módulo deberá permitir consultar el detalle de los pagos que forman parte de cada cierre.

### RF-12. ADMINISTRACIÓN DE CONTENIDO INSTITUCIONAL

El administrador deberá poder modificar:
- Misión.
- Visión.
- Información principal.
- Servicios.
- Contenido educativo.
- Actividades corporativas.
- Horarios.
- Información de contacto.

Los cambios deberán guardarse en MongoDB y visualizarse en el portal público sin modificar el código fuente.

### RF-13. ADMINISTRACIÓN DE USUARIOS

El administrador deberá poder:
- Registrar usuarios.
- Consultar usuarios.
- Modificar información.
- Asignar roles.
- Activar o desactivar usuarios.
- Restablecer contraseñas mediante una operación protegida.

No deberán mostrarse contraseñas ni hashes en las respuestas de la API.

## 6. REGLAS DE NEGOCIO OBLIGATORIAS

- **RN-01.** No podrán existir citas traslapadas para un mismo profesional.
- **RN-02.** Las citas deberán respetar los horarios de atención configurados.
- **RN-03.** Toda cita deberá estar asociada a un paciente, servicio y profesional activos.
- **RN-04.** Los pacientes menores de edad deberán tener al menos un responsable antes de programar citas.
- **RN-05.** Las citas CANCELADAS no podrán pasar directamente a COMPLETADA.
- **RN-06.** Las citas COMPLETADAS no podrán reprogramarse.
- **RN-07.** Los servicios inactivos no podrán seleccionarse para nuevas citas.
- **RN-08.** Los usuarios inactivos no podrán iniciar sesión.
- **RN-09.** Los materiales solamente podrán asignarse a pacientes activos.
- **RN-10.** Las operaciones privadas deberán requerir autenticación y autorización.
- **RN-11.** No se podrán programar citas en fechas u horas pasadas.
- **RN-12.** La hora de finalización deberá calcularse utilizando la duración del servicio.
- **RN-13.** Las citas CANCELADAS y COMPLETADAS no deberán bloquear horarios futuros.
- **RN-14.** Los pacientes inactivos no podrán recibir nuevas citas.
- **RN-15.** Los pagos deberán estar asociados a citas existentes.
- **RN-16.** No podrán registrarse pagos con montos menores o iguales a cero.
- **RN-17.** El total pagado no podrá superar el costo de la cita.
- **RN-18.** El saldo pendiente deberá calcularse automáticamente.
- **RN-19.** Los pagos anulados no deberán contabilizarse en el saldo ni en los ingresos.
- **RN-20.** Los pagos deberán asociarse a una caja abierta.
- **RN-21.** No podrán registrarse pagos en cajas cerradas.
- **RN-22.** Cada usuario podrá tener una sola caja abierta.
- **RN-23.** El cierre de caja deberá calcular automáticamente los totales por método de pago.
- **RN-24.** Los registros financieros deberán conservar su historial.
- **RN-25.** Únicamente los usuarios autorizados podrán registrar pagos y cerrar cajas.
- **RN-26.** Los pagos no podrán eliminarse físicamente.
- **RN-27.** Para mantener consistencia financiera, una cita con pagos válidos no podrá cancelarse. Primero deberán anularse sus pagos mientras la caja correspondiente permanezca abierta.
- **RN-28.** El sistema deberá utilizar valores monetarios con precisión de dos decimales, evitando errores de cálculo mediante el uso de centavos enteros o una estrategia decimal equivalente.
- **RN-29.** Los pagos, anulaciones y cierres deberán registrar la fecha y el usuario responsable.
- **RN-30.** Todas las operaciones deberán validar los datos recibidos y devolver códigos HTTP adecuados.

## 7. BASE DE DATOS

La aplicación deberá utilizar MongoDB y Mongoose.

Colecciones mínimas:
- usuarios
- pacientes
- responsables
- servicios
- citas
- solicitudesCita
- materiales
- asignacionesMateriales
- contenidoInstitucional
- horarios
- mensajesContacto
- pagos
- cajas

Las relaciones deberán implementarse mediante referencias cuando corresponda.

Los pagos deberán relacionarse con las citas y las cajas.

Las cajas deberán relacionarse con el usuario responsable.

Se deberá utilizar `populate()` u otra estrategia adecuada para consultar información relacionada.

Los totales financieros deberán calcularse a partir de registros válidos y no depender exclusivamente de valores almacenados manualmente.

## 8. API REST

El backend deberá implementar endpoints organizados por módulos.

**Autenticación**
- `POST /api/auth/login`
- `GET /api/auth/me`

**Usuarios**
- `GET /api/usuarios`
- `POST /api/usuarios`
- `PUT /api/usuarios/:id`

**Pacientes**
- `GET /api/pacientes`
- `GET /api/pacientes/:id`
- `POST /api/pacientes`
- `PUT /api/pacientes/:id`
- `PATCH /api/pacientes/:id/estado`

**Responsables**
- `GET /api/responsables`
- `POST /api/responsables`
- `PUT /api/responsables/:id`

**Servicios**
- `GET /api/servicios`
- `POST /api/servicios`
- `PUT /api/servicios/:id`

**Citas**
- `GET /api/citas`
- `GET /api/citas/:id`
- `POST /api/citas`
- `PUT /api/citas/:id`
- `PATCH /api/citas/:id/estado`

**Solicitudes**
- `POST /api/solicitudes-cita`
- `GET /api/solicitudes-cita`

**Materiales**
- `GET /api/materiales`
- `POST /api/materiales`
- `PUT /api/materiales/:id`

**Pagos**
- `GET /api/pagos`
- `GET /api/pagos/:id`
- `POST /api/pagos`
- `PATCH /api/pagos/:id/anular`
- `GET /api/citas/:id/pagos`
- `GET /api/citas/:id/saldo`

**Caja**
- `POST /api/cajas/abrir`
- `GET /api/cajas/actual`
- `GET /api/cajas`
- `GET /api/cajas/:id`
- `GET /api/cajas/:id/movimientos`
- `POST /api/cajas/:id/cerrar`

**Contenido**
- `GET /api/contenido`
- `PUT /api/contenido/:id` *(el original no indica el parámetro; puede ser `:id` o `:clave`)*

**Contacto**
- `POST /api/contacto`
- `GET /api/contacto`

Los estudiantes deberán implementar los endpoints adicionales necesarios para completar las funcionalidades solicitadas.

La API deberá devolver respuestas JSON y utilizar códigos HTTP apropiados.

## 9. SEGURIDAD

Implementar:
- Hashing de contraseñas.
- JWT.
- Protección de rutas.
- Autorización por roles.
- Validación de entradas.
- Manejo centralizado de errores.
- Variables de entorno.
- Protección de información privada.
- Validación de operaciones financieras.
- Prevención básica de vulnerabilidades OWASP.

No se permitirá almacenar contraseñas en texto plano.

No deberán incluirse claves privadas ni credenciales reales en GitHub.

Los pagos serán registros administrativos. No se exigirá conexión con bancos, pasarelas de pago ni facturación electrónica.

## 10. REQUISITOS DE INTERFAZ

La aplicación deberá:
- Ser responsive.
- Utilizar componentes reutilizables.
- Implementar Vue Router.
- Utilizar Pinia.
- Consumir la API REST.
- Mostrar mensajes de confirmación y error.
- Validar formularios.
- Diferenciar el portal público del sistema administrativo.
- Mostrar información financiera en quetzales.
- Presentar correctamente los estados de citas y pagos.
- Mostrar un resumen de caja diaria.

El diseño podrá personalizarse siempre que conserve las funcionalidades obligatorias.

## 11. DATOS DE PRUEBA

El proyecto deberá incluir un script para cargar datos ficticios.

Mínimos:
- 1 administrador.
- 2 recepcionistas.
- 3 profesionales.
- 10 pacientes.
- 5 responsables.
- 5 servicios.
- 15 citas.
- 5 materiales.
- 5 solicitudes de cita.
- 10 pagos.
- 3 cajas, incluyendo abiertas y cerradas.
- Contenido institucional.
- Horarios configurados.

Los datos deberán permitir demostrar pagos completos, pagos parciales, saldos pendientes, anulaciones y cierres de caja.

## 12. ENTREGABLES

Cada grupo deberá entregar:

**A. Código fuente**
- Frontend.
- Backend.
- Modelos.
- Controladores.
- Rutas.
- Configuración.
- Script de datos de prueba.
- Archivo `.env.example`.

**B. Repositorio GitHub**
- Enlace al repositorio con historial de commits de los integrantes.

**C. Documentación README**
- Descripción del proyecto.
- Integrantes.
- Tecnologías.
- Requisitos de instalación.
- Configuración de MongoDB.
- Variables de entorno.
- Comandos de ejecución.
- Datos de prueba.
- Credenciales de demostración.
- Distribución de responsabilidades.

**D. Colección Postman**
- Exportación de solicitudes para probar los módulos principales, incluyendo pagos y caja.

**E. Evidencias**
- Capturas del portal público, administración, pacientes, calendario, pagos y caja.

**F. Entrega Canvas**
- Archivo ZIP del proyecto y enlace al repositorio GitHub.
- No incluir `node_modules` ni archivos `.env` con credenciales reales.

## 13. ORGANIZACIÓN DEL EQUIPO

El proyecto deberá desarrollarse en grupos de tres estudiantes.

Distribución sugerida:

**Integrante 1 — Backend y base de datos**
- Modelos MongoDB.
- API REST.
- Pacientes.
- Responsables.
- Servicios.

**Integrante 2 — Frontend e integración**
- Vue.js.
- Vue Router.
- Pinia.
- Portal público.
- Formularios.
- Calendario.
- Integración con API.

**Integrante 3 — Seguridad y gestión financiera**
- Autenticación.
- Roles.
- Gestión de citas.
- Pagos.
- Caja diaria.
- Validaciones.

La distribución es orientativa.

Todos los integrantes deberán conocer el funcionamiento general del proyecto.

## 14. ETAPAS DE DESARROLLO

**Avance 1 — Configuración y estructura**
- Configuración frontend/backend.
- Conexión MongoDB.
- Modelos principales.
- Autenticación.
- Usuarios.
- Servicios.
- Portal público inicial.

**Avance 2 — Gestión operativa**
- Pacientes.
- Responsables.
- Profesionales.
- Solicitudes.
- Citas.
- Calendario.
- Materiales.
- Reglas de negocio.

**Entrega final — Integración financiera**
- Gestión de pagos.
- Abonos.
- Saldos.
- Caja diaria.
- Cierres.
- Seguridad.
- Validaciones.
- Documentación.
- Pruebas.
- Defensa.

Las fechas de los avances serán establecidas en Canvas.

## 15. RÚBRICA DE EVALUACIÓN

| Criterio | Puntos |
|---|---|
| Portal público y navegación | 8 |
| Administración de contenido institucional | 7 |
| Autenticación, roles y seguridad | 15 |
| Gestión de pacientes y responsables | 12 |
| Gestión de citas y calendario | 15 |
| Gestión de pagos y control financiero | 12 |
| Gestión de materiales | 5 |
| Integración Vue.js, API REST y MongoDB | 13 |
| Validaciones y reglas de negocio | 5 |
| Documentación y ejecución | 4 |
| Defensa individual | 4 |
| **TOTAL** | **100** |

- **Portal público (8 puntos):** navegación, servicios, horarios, contacto y diseño responsive.
- **Contenido institucional (7 puntos):** administración y actualización de información desde MongoDB.
- **Seguridad (15 puntos):** login, JWT, hashing, roles y protección de endpoints.
- **Pacientes (12 puntos):** CRUD, responsables y relaciones.
- **Citas (15 puntos):** programación, calendario, estados, restricciones y consultas.
- **Pagos (12 puntos):** registro, abonos, saldos, comprobantes, anulaciones, caja diaria y cierres.
- **Materiales (5 puntos):** CRUD y asignación a pacientes.
- **Integración (13 puntos):** funcionamiento conjunto de frontend, backend y MongoDB.
- **Reglas de negocio (5 puntos):** validaciones y restricciones obligatorias.
- **Documentación (4 puntos):** instalación, configuración y ejecución.
- **Defensa individual (4 puntos):** explicación y comprensión del proyecto.

## 16. PROCEDIMIENTO DE EVALUACIÓN FUNCIONAL

Durante la demostración, el docente podrá solicitar:

1. Iniciar sesión como administrador.
2. Registrar un paciente.
3. Asociar un responsable.
4. Crear un servicio con precio.
5. Programar una cita.
6. Intentar programar otra cita en un horario ocupado.
7. Confirmar la cita.
8. Consultarla en el calendario.
9. Abrir una caja con monto inicial.
10. Registrar un abono parcial.
11. Consultar el saldo pendiente.
12. Registrar un segundo pago.
13. Verificar que el estado financiero cambie a PAGADO.
14. Consultar el comprobante interno.
15. Registrar pagos utilizando diferentes métodos.
16. Consultar los ingresos del día.
17. Registrar el efectivo contado.
18. Cerrar la caja.
19. Verificar que no puedan registrarse nuevos pagos en la caja cerrada.
20. Consultar el historial de pagos del paciente.
21. Verificar los registros en MongoDB.
22. Intentar acceder a funciones restringidas utilizando otro rol.

El docente podrá solicitar pruebas adicionales relacionadas con los requisitos establecidos.

## 17. PRESENTACIÓN Y DEFENSA

Cada grupo deberá presentar el sistema funcionando.

Los integrantes deberán explicar:
- Arquitectura general.
- Componentes Vue.
- Vue Router y Pinia.
- API REST.
- MongoDB y Mongoose.
- Autenticación JWT.
- Relaciones entre entidades.
- Reglas de negocio.
- Gestión de pagos.
- Cálculos financieros.
- Funcionamiento de caja diaria.
- Manejo de errores.

El docente podrá solicitar modificaciones pequeñas durante la presentación para comprobar el conocimiento del código.

## 18. CONSIDERACIONES FINALES

- Todos los grupos desarrollarán el mismo sistema.
- El proyecto deberá funcionar con datos persistidos en MongoDB.
- No se aceptarán operaciones simuladas.
- No se aceptarán interfaces sin funcionalidad.
- Los pagos deberán registrarse correctamente.
- Los saldos deberán calcularse automáticamente.
- Las cajas deberán conservar su historial.
- No deberán utilizarse datos reales de pacientes.
- El proyecto deberá poder ejecutarse localmente.
- Todos los integrantes deberán participar y comprender la solución.
- La documentación deberá permitir instalar y ejecutar el sistema.
- Las funcionalidades adicionales no sustituirán los requisitos obligatorios.

## RESULTADO ESPERADO

Una aplicación web empresarial funcional que permita administrar integralmente un centro de atención, desde la publicación de servicios y registro de pacientes hasta la programación de citas, asignación de materiales, registro de pagos, control de saldos y cierre de caja diaria.

El objetivo es demostrar la integración de las tecnologías estudiadas durante el curso mediante una solución completa, organizada, segura y con persistencia de datos.
