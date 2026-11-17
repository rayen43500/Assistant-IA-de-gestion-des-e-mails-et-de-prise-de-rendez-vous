import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    index: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true,
  },
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    index: true,
  },
  providerMessageId: {
    type: String,
    sparse: true,
    index: true,
  },
  threadId: {
    type: String,
    index: true,
  },
  sender: {
    name: String,
    email: { type: String, required: true },
    phone: String,
  },
  recipient: {
    type: String, // Boîte e-mail réceptrice (ex: drrayen@gmail.com)
    lowercase: true,
    trim: true,
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
    enum: ['APPOINTMENT', 'PRICING', 'EMERGENCY', 'ADMINISTRATIVE', 'SPAM', 'UNCERTAIN', 'CANCEL', 'RESCHEDULE'],
    default: 'UNCERTAIN',
    index: true,
  },
  confidence: {
    type: Number,
    default: 0.0,
  },
  status: {
    type: String,
    enum: ['PENDING_VALIDATION', 'AUTO_PROCESSED', 'VALIDATED_AND_SENT', 'MANUAL_OVERRIDE', 'ESCALATED_EMERGENCY', 'DISMISSED'],
    default: 'PENDING_VALIDATION',
    index: true,
  },
  processingStatus: {
    type: String,
    enum: ['RECEIVED', 'CLASSIFIED', 'DRAFT_GENERATED', 'AWAITING_APPROVAL', 'SENT', 'FAILED', 'UNRESOLVED_MAILBOX'],
    default: 'RECEIVED',
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    index: true,
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
    index: true,
  },
  processedAt: Date,
}, { timestamps: true });

EmailSchema.pre('save', function (next) {
  if (this.clinicId && !this.tenantId) {
    this.tenantId = this.clinicId;
  } else if (this.tenantId && !this.clinicId) {
    this.clinicId = this.tenantId;
  }
  next();
});

// Éviter l'ingestion en double d'un même message externe pour une intégration donnée
EmailSchema.index({ integrationId: 1, providerMessageId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Email', EmailSchema);
