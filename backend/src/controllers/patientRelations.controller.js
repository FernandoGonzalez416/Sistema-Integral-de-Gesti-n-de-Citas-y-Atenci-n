import PatientResponsible from '../models/PatientResponsible.js';
import Patient from '../models/Patient.js';
import Responsible from '../models/Responsible.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/pacientes/:pacienteId/responsables
export async function listarRelaciones(req, res, next) {
  try {
    if (!idValido(req.params.pacienteId)) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const relaciones = await PatientResponsible.find({ paciente: req.params.pacienteId, activo: true })
      .populate('responsable');
    res.json({ ok: true, relaciones });
  } catch (e) {
    next(e);
  }
}

// POST /api/pacientes/:pacienteId/responsables
export async function asociarResponsable(req, res, next) {
  try {
    const { responsableId } = req.body || {};
    if (!responsableId) {
      return res.status(400).json({ ok: false, message: 'responsableId requerido' });
    }
    if (!idValido(req.params.pacienteId) || !idValido(responsableId)) {
      return res.status(404).json({ ok: false, message: 'Paciente o responsable no encontrado' });
    }
    const [paciente, responsable] = await Promise.all([
      Patient.findById(req.params.pacienteId),
      Responsible.findById(responsableId)
    ]);
    if (!paciente || !responsable) {
      return res.status(404).json({ ok: false, message: 'Paciente o responsable no encontrado' });
    }
    const existe = await PatientResponsible.findOne({
      paciente: req.params.pacienteId,
      responsable: responsableId,
      activo: true
    });
    if (existe) {
      return res.status(409).json({ ok: false, message: 'Ese responsable ya está asociado a este paciente' });
    }
    const relacion = new PatientResponsible({ paciente: req.params.pacienteId, responsable: responsableId });
    await relacion.save();
    const poblada = await PatientResponsible.findById(relacion._id).populate('responsable');
    res.status(201).json({ ok: true, relacion: poblada });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/pacientes/:pacienteId/responsables/:relacionId  (desactivación lógica)
export async function desasociarResponsable(req, res, next) {
  try {
    if (!idValido(req.params.relacionId)) {
      return res.status(404).json({ ok: false, message: 'Relación no encontrada' });
    }
    const relacion = await PatientResponsible.findOneAndUpdate(
      { _id: req.params.relacionId, paciente: req.params.pacienteId, activo: true },
      { activo: false },
      { new: true }
    ).populate('responsable');
    if (!relacion) {
      return res.status(404).json({ ok: false, message: 'Relación no encontrada' });
    }
    res.json({ ok: true, relacion });
  } catch (e) {
    next(e);
  }
}

// Validación: paciente menor de 18 años debe tener al menos un responsable activo.
export async function validarResponsablesMenor(pacienteId) {
  const paciente = await Patient.findById(pacienteId);
  if (!paciente) return false;
  if (paciente.edad === null || paciente.edad >= 18) return true; // mayor de edad no requiere
  const count = await PatientResponsible.countDocuments({ paciente: pacienteId, activo: true });
  return count > 0;
}