// Catálogos compartidos por la UI. Deben coincidir con los enums del backend.

// Estados de una cita (RF-07): PENDIENTE → CONFIRMADA → COMPLETADA.
// CANCELADA es terminal y solo se alcanza desde PENDIENTE o CONFIRMADA.
export const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA'];

export const COLORES_ESTADO_CITA = {
  PENDIENTE: '#e6a23c',
  CONFIRMADA: '#2ecc71',
  COMPLETADA: '#9b59b6',
  CANCELADA: '#e74c3c'
};

export const ESTADOS_SOLICITUD = ['PENDIENTE', 'ATENDIDA', 'RECHAZADA'];

export const ESTADOS_PAGO = ['REGISTRADO', 'ANULADO'];

// RF-10: solo se aceptan estos tres métodos de pago.
export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];

export const TIPOS_MATERIAL = ['DOCUMENTO', 'VIDEO', 'ENLACE', 'OTRO'];
