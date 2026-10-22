import Appointment from '../models/Appointment.js';
import Professional from '../models/Professional.js';

// RF-02: el usuario PROFESIONAL se autoriza por el vínculo Professional.usuario.
// Un usuario con ese rol pero sin profesional activo vinculado no puede operar
// sobre citas ni pacientes (403 con mensaje explícito).
export async function profesionalDelUsuario(usuario) {
  if (!usuario || usuario.rol !== 'PROFESIONAL') return null;
  return Professional.findOne({ usuario: usuario._id, activo: true });
}

// true si el paciente tiene al menos una cita con el profesional. No se filtra
// por estado: el profesional conserva acceso a los pacientes que ya atendió.
export async function pacienteDelProfesional(profesionalId, pacienteId) {
  return Appointment.exists({ profesional: profesionalId, paciente: pacienteId });
}

export function idsPacientesDelProfesional(profesionalId) {
  return Appointment.distinct('paciente', { profesional: profesionalId });
}

// Campos básicos que puede leer un PROFESIONAL de sus propios pacientes.
export const CAMPOS_PACIENTE_PROFESIONAL = 'nombre apellido fechaNacimiento telefono activo';
