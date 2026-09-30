import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  patient: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  reason: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Format YYYY-MM-DD
    required: true,
  },
  timeSlot: {
    start: { type: String, required: true }, // Format HH:mm
    end: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW'],
    default: 'SCHEDULED',
  },
  source: {
    type: String,
    enum: ['EMAIL_AI', 'WHATSAPP_AI', 'MANUAL_SECRETARY', 'PATIENT_PORTAL'],
    default: 'EMAIL_AI',
  },
  emailReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
  },
  googleCalendarEventId: String,
  reminderSent24h: {
    type: Boolean,
    default: false,
  },
  notes: String,
}, { timestamps: true });

// Protection contre les doubles réservations (double booking prevention)
AppointmentSchema.index({ clinicId: 1, practitionerId: 1, date: 1, 'timeSlot.start': 1 }, { unique: true, partialFilterExpression: { status: { $in: ['SCHEDULED', 'CONFIRMED'] } } });

export default mongoose.model('Appointment', AppointmentSchema);
