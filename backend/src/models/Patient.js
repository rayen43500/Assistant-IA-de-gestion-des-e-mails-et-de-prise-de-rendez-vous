import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  nationalIdOrSSN: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: String, // YYYY-MM-DD
  },
  contactPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

// Éviter les doublons de patients au sein d'un même cabinet/tenant
PatientSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.model('Patient', PatientSchema);
