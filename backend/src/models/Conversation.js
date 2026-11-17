import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
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
    index: true,
  },
  channel: {
    type: String,
    enum: ['EMAIL', 'WHATSAPP', 'WEB_PORTAL'],
    default: 'EMAIL',
  },
  threadId: {
    type: String,
    index: true,
  },
  externalConversationId: {
    type: String,
    index: true,
  },
  currentIntent: {
    type: String,
    default: 'UNKNOWN',
  },
  currentState: {
    type: String,
    enum: ['ACTIVE', 'WAITING_PATIENT_REPLY', 'SLOT_PROPOSED', 'CONFIRMED', 'CLOSED'],
    default: 'ACTIVE',
  },
  proposedSlots: [{
    date: String,
    start: String,
    end: String,
  }],
  contextReference: {
    type: mongoose.Schema.Types.Mixed,
  },
  expiresAt: {
    type: Date,
  },
}, { timestamps: true });

ConversationSchema.index({ tenantId: 1, doctorId: 1, threadId: 1 });

export default mongoose.model('Conversation', ConversationSchema);
