import PatientMaterial from '../models/PatientMaterial.js';
import Patient from '../models/Patient.js';
import EducationalMaterial from '../models/EducationalMaterial.js';
import mongoose from 'mongoose';

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/pacientes/:pacienteId/materiales
export async function listarMaterialesPaciente(req, res, next) {
  try {
    if (!idValido(req.params.pacienteId)) {
      return res.status(404).json({ ok: false, message: 'Paciente no encontrado' });
    }
    const relaciones = await PatientMaterial.find({ paciente: req.params.pacienteId, activo: true })
      .populate('material')
      .sort({ fechaAsignacion: -1 });
    res.json({ ok: true, relaciones });
  } catch (e) {
    next(e);
  }
}

// POST /api/pacientes/:pacienteId/materiales
export async function asignarMaterial(req, res, next) {
  try {
    const { materialId, notas } = req.body || {};
    if (!materialId) {
      return res.status(400).json({ ok: false, message: 'materialId requerido' });
    }
    if (notas !== undefined && notas !== null && typeof notas !== 'string') {
      return res.status(400).json({ ok: false, message: 'Notas inválidas (deben ser texto)' });
    }
    if (!idValido(req.params.pacienteId) || !idValido(materialId)) {
      return res.status(404).json({ ok: false, message: 'Paciente o material no encontrado' });
    }
    const [paciente, material] = await Promise.all([
      Patient.findById(req.params.pacienteId),
      EducationalMaterial.findById(materialId)
    ]);
    if (!paciente || !material) {
      return res.status(404).json({ ok: false, message: 'Paciente o material no encontrado' });
    }
    // Reactivar si ya existía una relación inactiva en vez de duplicar.
    const existente = await PatientMaterial.findOne({
      paciente: req.params.pacienteId,
      material: materialId
    });
    if (existente && existente.activo) {
      return res.status(409).json({ ok: false, message: 'Ese material ya está asignado a este paciente' });
    }
    let relacion;
    if (existente) {
      existente.activo = true;
      existente.notas = notas || '';
      existente.fechaAsignacion = new Date();
      relacion = await existente.save();
    } else {
      relacion = await new PatientMaterial({
        paciente: req.params.pacienteId,
        material: materialId,
        notas: notas || ''
      }).save();
    }
    const poblada = await PatientMaterial.findById(relacion._id).populate('material');
    res.status(201).json({ ok: true, relacion: poblada });
  } catch (e) {
    next(e);
  }
}

// DELETE/PATCH /api/pacientes/:pacienteId/materiales/:relacionId/desasignar (desactivación lógica)
export async function desasignarMaterial(req, res, next) {
  try {
    if (!idValido(req.params.relacionId)) {
      return res.status(404).json({ ok: false, message: 'Asignación no encontrada' });
    }
    const relacion = await PatientMaterial.findOneAndUpdate(
      { _id: req.params.relacionId, paciente: req.params.pacienteId, activo: true },
      { activo: false },
      { new: true }
    ).populate('material');
    if (!relacion) {
      return res.status(404).json({ ok: false, message: 'Asignación no encontrada' });
    }
    res.json({ ok: true, relacion });
  } catch (e) {
    next(e);
  }
}
