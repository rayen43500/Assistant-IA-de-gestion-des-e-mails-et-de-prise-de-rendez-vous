import mongoose from 'mongoose';
import { hashPassword, verifyPassword } from '../services/passwordHasher.js';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'PRATICIEN', 'PATIENT'],
    default: 'PRATICIEN',
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return verifyPassword(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
