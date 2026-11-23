import mongoose from 'mongoose';

/**
 * Modèle Contact pour MediLawAI
 * Représente soit un patient/client inscrit avec compte, soit un contact externe non inscrit.
 * Règle fondamentale : un correspondant externe n'a pas besoin de compte pour échanger.
 */
const ContactSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    index: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
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
    trim: true,
    default: '',
  },
  type: {
    type: String,
    enum: ['REGISTERED_PATIENT', 'EXTERNAL_CONTACT'],
    default: 'EXTERNAL_CONTACT',
    index: true,
  },
  isRegistered: {
    type: Boolean,
    default: false,
    index: true,
  },
  // Référence vers l'utilisateur s'il est inscrit
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Référence vers le patient s'il existe dans le dossier médical
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
  },
  // Praticiens avec lesquels ce contact a déjà échangé
  linkedPractitioners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  }],
  notes: {
    type: String,
    default: '',
  },
  firstContactAt: {
    type: Date,
    default: Date.now,
  },
  lastContactAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
