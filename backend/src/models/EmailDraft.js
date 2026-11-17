import mongoose from 'mongoose';

const EmailDraftSchema = new mongoose.Schema({
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
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true,
    index: true,
  },
  generatedContent: {
    type: String,
    required: true,
  },
  proposedSlots: [{
    date: String,
    start: String,
    end: String,
  }],
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'AUTO_SENT', 'EDITED'],
    default: 'PENDING',
    index: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sentAt: {
    type: Date,
  },
  deliveryStatus: {
    type: String,
    enum: ['QUEUED', 'SENT', 'FAILED'],
  },
  sendError: {
    type: String,
  },
}, { timestamps: true });

EmailDraftSchema.index({ tenantId: 1, doctorId: 1, approvalStatus: 1 });

export default mongoose.model('EmailDraft', EmailDraftSchema);
