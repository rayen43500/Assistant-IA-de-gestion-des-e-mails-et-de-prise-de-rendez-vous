import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
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
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true,
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
    index: true,
  },
  timeSlot: {
    start: { type: String, required: true }, // Format HH:mm
    end: { type: String, required: true },
  },
  startAt: {
    type: Date,
    index: true,
  },
  endAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW', 'REJECTED'],
    default: 'SCHEDULED',
    index: true,
  },
  source: {
    type: String,
    enum: ['EMAIL_AI', 'WHATSAPP_AI', 'MANUAL_SECRETARY', 'MANUAL_CABINET', 'PATIENT_PORTAL', 'PUBLIC_GUEST'],
    default: 'EMAIL_AI',
  },
  emailReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
  },
  googleCalendarEventId: {
    type: String,
  },
  googleEventId: {
    type: String,
  },
  synchronizationStatus: {
    type: String,
    enum: ['SYNCED', 'PENDING', 'FAILED', 'DISABLED'],
    default: 'PENDING',
  },
  idempotencyKey: {
    type: String,
    sparse: true,
    index: true,
  },
  guestManagementToken: {
    type: String,
    sparse: true,
    index: true,
  },
  reminderSent24h: {
    type: Boolean,
    default: false,
  },
  notes: String,
}, { timestamps: true });

// Synchronisation automatique tenantId <-> clinicId avant sauvegarde
AppointmentSchema.pre('save', function (next) {
  if (this.clinicId && !this.tenantId) {
    this.tenantId = this.clinicId;
  } else if (this.tenantId && !this.clinicId) {
    this.clinicId = this.tenantId;
  }
  if (this.googleCalendarEventId && !this.googleEventId) {
    this.googleEventId = this.googleCalendarEventId;
  }
  next();
});

// Protection stricte contre les doubles réservations (double booking prevention)
AppointmentSchema.index(
  { clinicId: 1, practitionerId: 1, date: 1, 'timeSlot.start': 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['SCHEDULED', 'CONFIRMED'] } } }
);

AppointmentSchema.index(
  { tenantId: 1, doctorId: 1, date: 1, 'timeSlot.start': 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['SCHEDULED', 'CONFIRMED'] }, doctorId: { $exists: true } } }
);

export default mongoose.model('Appointment', AppointmentSchema);
