import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  professionalEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  specialty: {
    type: String,
    default: 'Médecine Générale',
  },
  phone: {
    type: String,
  },
  timezone: {
    type: String,
    default: 'Africa/Tunis',
  },
  appointmentDuration: {
    type: Number,
    default: 30, // en minutes
  },
  bufferTime: {
    type: Number,
    default: 5, // en minutes
  },
  bookingSettings: {
    onlineBookingEnabled: { type: Boolean, default: true },
    allowGuestBooking: { type: Boolean, default: true },
    requiresConfirmation: { type: Boolean, default: false },
    advanceNoticeHours: { type: Number, default: 2 },
    maxBookingDaysInAdvance: { type: Number, default: 60 },
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
    default: 'ACTIVE',
    index: true,
  },
}, { timestamps: true });

DoctorSchema.index({ tenantId: 1, professionalEmail: 1 }, { unique: true });

export default mongoose.model('Doctor', DoctorSchema);
