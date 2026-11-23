import mongoose from 'mongoose';

/**
 * Modèle KnowledgeBase pour MediLawAI
 * Stocke les règles, spécialités, tarifs et consignes propres à chaque praticien ou cabinet.
 * L'IA consulte cette base pour répondre sans jamais inventer de faits médicaux ou juridiques.
 */
const KnowledgeBaseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true,
  },
  category: {
    type: String,
    enum: ['GENERAL', 'SPECIALTY', 'PRICING', 'PROCEDURE', 'EMERGENCY_PROTOCOL', 'HOURS', 'DOCUMENTS_REQUIRED'],
    default: 'GENERAL',
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.models.KnowledgeBase || mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
