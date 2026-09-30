import mongoose from 'mongoose';

const ClinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['MEDICAL', 'JURIDIQUE'],
    required: true,
    default: 'MEDICAL',
  },
  specialty: {
    type: String,
    default: 'Généraliste',
  },
  address: {
    street: String,
    city: { type: String, default: 'Tunis' },
    country: { type: String, default: 'Tunisie' },
  },
  phone: String,
  email: String,
  openingHours: {
    monday: { open: { type: String, default: '08:30' }, close: { type: String, default: '17:30' }, closed: { type: Boolean, default: false } },
    tuesday: { open: { type: String, default: '08:30' }, close: { type: String, default: '17:30' }, closed: { type: Boolean, default: false } },
    wednesday: { open: { type: String, default: '08:30' }, close: { type: String, default: '17:30' }, closed: { type: Boolean, default: false } },
    thursday: { open: { type: String, default: '08:30' }, close: { type: String, default: '17:30' }, closed: { type: Boolean, default: false } },
    friday: { open: { type: String, default: '08:30' }, close: { type: String, default: '17:30' }, closed: { type: Boolean, default: false } },
    saturday: { open: { type: String, default: '08:30' }, close: { type: String, default: '13:00' }, closed: { type: Boolean, default: false } },
    sunday: { closed: { type: Boolean, default: true } },
  },
  pricing: [{
    serviceName: String,
    priceTND: Number,
    description: String,
  }],
  aiSettings: {
    autonomyLevel: {
      type: String,
      enum: ['HUMAN_IN_THE_LOOP', 'SEMI_AUTONOMOUS', 'FULL_AUTONOMOUS'],
      default: 'HUMAN_IN_THE_LOOP', // Sécurité par défaut imposée par le CDC
    },
    confidenceThreshold: {
      type: Number,
      default: 0.85,
    },
    emergencyEscalationPhone: String,
    emergencyEscalationEmail: String,
  },
}, { timestamps: true });

export default mongoose.model('Clinic', ClinicSchema);
