import mongoose from 'mongoose';

const DoctorPatientSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  relationshipStatus: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'BLOCKED'],
    default: 'ACTIVE',
  },
  medicalNotes: {
    type: String,
  },
  firstConsultationDate: {
    type: Date,
  },
  lastConsultationDate: {
    type: Date,
  },
}, { timestamps: true });

DoctorPatientSchema.index({ tenantId: 1, doctorId: 1, patientId: 1 }, { unique: true });

export default mongoose.model('DoctorPatient', DoctorPatientSchema);
