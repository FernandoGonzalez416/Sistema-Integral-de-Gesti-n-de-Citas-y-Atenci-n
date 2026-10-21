import mongoose from 'mongoose';

// Relación N:M entre pacientes y materiales educativos.
// Un paciente puede tener varios materiales asignados; un material puede asignarse a varios pacientes.
const patientMaterialSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'EducationalMaterial', required: true },
    notas: { type: String, default: '', trim: true },
    fechaAsignacion: { type: Date, default: Date.now },
    // Trazabilidad: usuario que asignó el material (PENDIENTES 13).
    asignadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Un mismo material no se asigna dos veces al mismo paciente.
patientMaterialSchema.index({ paciente: 1, material: 1 }, { unique: true });

export default mongoose.model('PatientMaterial', patientMaterialSchema);
