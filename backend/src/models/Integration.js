import mongoose from 'mongoose';

const IntegrationSchema = new mongoose.Schema({
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
  provider: {
    type: String,
    enum: ['GOOGLE', 'OUTLOOK', 'WHATSAPP'],
    default: 'GOOGLE',
    required: true,
  },
  providerAccountEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  // Référence chiffrée (AES-256-GCM) contenant access_token, refresh_token, client_id, etc.
  encryptedCredentialReference: {
    type: String,
    required: true,
  },
  calendarId: {
    type: String,
    default: 'primary',
  },
  connectionStatus: {
    type: String,
    enum: ['CONNECTED', 'DISCONNECTED', 'REVOKED', 'SYNC_ERROR', 'PENDING'],
    default: 'PENDING',
    index: true,
  },
  scopes: [{
    type: String,
  }],
  tokenExpiration: {
    type: Date,
  },
  syncToken: {
    type: String,
  },
  gmailHistoryId: {
    type: String,
  },
  watchExpiration: {
    type: Date,
  },
  lastSynchronization: {
    type: Date,
  },
  lastError: {
    message: String,
    occurredAt: Date,
    code: String,
  },
}, { timestamps: true });

// Une boîte Gmail / un compte provider ne doit être lié qu'une seule fois par médecin
IntegrationSchema.index({ tenantId: 1, doctorId: 1, provider: 1, providerAccountEmail: 1 }, { unique: true });

export default mongoose.model('Integration', IntegrationSchema);
