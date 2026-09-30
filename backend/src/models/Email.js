import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  sender: {
    name: String,
    email: { type: String, required: true },
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  intent: {
    type: String,
    enum: ['APPOINTMENT', 'PRICING', 'EMERGENCY', 'ADMINISTRATIVE', 'SPAM', 'UNCERTAIN'],
    default: 'UNCERTAIN',
  },
  confidence: {
    type: Number,
    default: 0.0,
  },
  status: {
    type: String,
    enum: ['PENDING_VALIDATION', 'AUTO_PROCESSED', 'VALIDATED_AND_SENT', 'MANUAL_OVERRIDE', 'ESCALATED_EMERGENCY', 'DISMISSED'],
    default: 'PENDING_VALIDATION',
  },
  draftReply: {
    type: String,
  },
  extractedEntities: {
    requestedDate: String,
    requestedTime: String,
    specialtyOrService: String,
    urgencyKeywords: [String],
    phone: String,
  },
  validationNotes: String,
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receivedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: Date,
}, { timestamps: true });

export default mongoose.model('Email', EmailSchema);
