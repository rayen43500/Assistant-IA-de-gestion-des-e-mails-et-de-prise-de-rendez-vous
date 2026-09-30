import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['TARIFS', 'HORAIRES', 'PROCEDURES', 'PIECES_REQUISES', 'SPECIALITES', 'AUTRE'],
    default: 'PROCEDURES',
  },
  content: {
    type: String,
    required: true,
  },
  chunks: [{
    text: String,
    embedding: [Number], // Vecteur d'embedding
    index: Number,
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);
