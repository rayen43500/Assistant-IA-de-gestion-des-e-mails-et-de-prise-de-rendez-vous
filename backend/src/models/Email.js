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
  practitionerId: {
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
  gmailMessageId: {
    type: String,
    sparse: true,
    index: true,
  },
  messageId: {
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
    type: String, // Boîte e-mail réceptrice (ex: contact@medilawai.com)
    lowercase: true,
    trim: true,
  },
  recipients: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  bodyText: {
    type: String,
  },
  bodyHtml: {
    type: String,
  },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    dataOrUrl: String,
  }],
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
      // Maintien compatibilité
      'AUTO_PROCESSED',
      'VALIDATED_AND_SENT',
      'MANUAL_OVERRIDE',
      'DISMISSED'
    ],
    default: 'RECEIVED',
    index: true,
  },
  scenario: {
    type: Number,
    enum: [1, 2, 3, 4],
    index: true,
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    index: true,
  },
  isRegisteredContact: {
    type: Boolean,
    default: false,
  },
  practitionerIdentificationMethod: {
    type: String,
    enum: ['RECIPIENT_ALIAS', 'PERSONAL_LINK', 'NAME_IN_BODY', 'CLINIC_NAME', 'SPECIALTY_MATCH', 'NONE_UNASSIGNED'],
    default: 'NONE_UNASSIGNED',
  },
  clarificationSent: {
    type: Boolean,
    default: false,
  },
  clarificationMessage: {
    type: String,
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
  aiDraft: {
    type: String,
  },
  finalResponse: {
    type: String,
  },
  detectedLanguage: {
    type: String,
    enum: ['FR', 'AR', 'EN', 'OTHER'],
    default: 'FR',
    index: true,
  },
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
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
  validatedAt: {
    type: Date,
  },
  sentAt: {
    type: Date,
  },
  // Suivi de la réponse envoyée au patient (Gmail)
  replyStatus: {
    type: String,
    enum: ['DRAFT', 'SENT', 'FAILED'],
    default: 'DRAFT',
    index: true,
  },
  replyError: String,
  replyGmailMessageId: String,
  bookingDecision: String,
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
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
