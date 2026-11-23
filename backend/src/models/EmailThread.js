import mongoose from 'mongoose';

/**
 * Modèle EmailThread pour MediLawAI
 * Conserve l'historique complet d'une conversation par threadId stable.
 * Évite les confusions entre correspondants et gère la reprise après demande de clarification.
 */
const EmailThreadSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    index: true,
  },
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true,
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    index: true,
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  contactName: {
    type: String,
    default: '',
  },
  isRegistered: {
    type: Boolean,
    default: false,
    index: true,
  },
  status: {
    type: String,
    enum: [
      'RECEIVED',
      'CONTACT_IDENTIFIED',
      'EXTERNAL_CONTACT',
      'UNASSIGNED',
      'NEEDS_CLARIFICATION',
      'WAITING_FOR_REPLY',
      'PRACTITIONER_IDENTIFIED',
      'PROCESSING',
      'PENDING_VALIDATION',
      'VALIDATED',
      'REJECTED',
      'SENT',
      'FAILED',
      'ESCALATED_EMERGENCY',
      'CLOSED'
    ],
    default: 'RECEIVED',
    index: true,
  },
  subject: {
    type: String,
    default: '',
  },
  emails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  clarificationSentAt: {
    type: Date,
  },
  clarificationPrompt: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.models.EmailThread || mongoose.model('EmailThread', EmailThreadSchema);
