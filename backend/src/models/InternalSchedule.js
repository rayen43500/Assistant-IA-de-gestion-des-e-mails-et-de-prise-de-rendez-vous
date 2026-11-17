import mongoose from 'mongoose';

const DayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    required: true,
  },
  active: { type: Boolean, default: true },
  start: { type: String, default: '08:30' }, // HH:mm
  end: { type: String, default: '17:30' },
  hasBreak: { type: Boolean, default: true },
  breakStart: { type: String, default: '12:30' },
  breakEnd: { type: String, default: '14:00' },
}, { _id: false });

const InternalScheduleSchema = new mongoose.Schema({
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
    unique: true,
    index: true,
  },
  weeklyWorkingHours: {
    type: [DayScheduleSchema],
    default: () => [
      { day: 'Lundi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
      { day: 'Mardi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
      { day: 'Mercredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
      { day: 'Jeudi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
      { day: 'Vendredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
      { day: 'Samedi', active: true, start: '08:30', end: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
      { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
    ]
  },
  breaks: [{
    title: { type: String, default: 'Pause Déjeuner' },
    start: { type: String, default: '12:30' },
    end: { type: String, default: '14:00' },
  }],
  holidays: [{
    id: String,
    title: String,
    start: String, // YYYY-MM-DD
    end: String,
    type: { type: String, default: 'VACATION' },
  }],
  appointmentDuration: {
    type: Number,
    default: 30,
  },
  bufferTime: {
    type: Number,
    default: 5,
  },
  bookingRules: {
    antiDoubleBookingEnabled: { type: Boolean, default: true },
    maxConcurrentAppointments: { type: Number, default: 1 },
    allowWeekendBooking: { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.model('InternalSchedule', InternalScheduleSchema);
