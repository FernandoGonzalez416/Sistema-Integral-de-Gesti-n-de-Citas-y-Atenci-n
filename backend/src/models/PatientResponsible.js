import mongoose from 'mongoose';

// Relación N:M entre pacientes y responsables.
// Un paciente menor puede tener varios responsables; un responsable puede tener varios pacientes.
const patientResponsibleSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Responsible', required: true },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Un mismo responsable no se asocia dos veces al mismo paciente.
patientResponsibleSchema.index({ paciente: 1, responsable: 1 }, { unique: true });

export default mongoose.model('PatientResponsible', patientResponsibleSchema);