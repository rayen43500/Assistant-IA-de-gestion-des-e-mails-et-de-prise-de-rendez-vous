import express from 'express';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';
import { queryKnowledgeRAG } from '../services/aiClient.js';

const router = express.Router();

// GET /api/knowledge - Liste des documents indexés
router.get('/', protect, async (req, res) => {
  try {
    const documents = await Document.find({ clinicId: req.clinicId }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des documents', error: error.message });
  }
});

// POST /api/knowledge - Ajouter un document / procédure / tarif
router.post('/', protect, authorize('ADMIN', 'PRATICIEN'), async (req, res) => {
  try {
    const { title, category, content } = req.body;

    // Découpage simple en chunks pour la base de connaissances
    const rawChunks = content.split('\n\n').filter(c => c.trim().length > 0);
    const chunks = rawChunks.map((text, index) => ({
      text: text.trim(),
      index,
    }));

    const doc = await Document.create({
      clinicId: req.clinicId,
      title,
      category: category || 'PROCEDURES',
      content,
      chunks,
      uploadedBy: req.user._id,
    });

    await AuditLog.create({
      clinicId: req.clinicId,
      userId: req.user._id,
      action: 'KNOWLEDGE_DOCUMENT_CREATED',
      resource: 'Document',
      resourceId: doc._id.toString(),
      details: { title, chunksCount: chunks.length },
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’ajout du document', error: error.message });
  }
});

// POST /api/knowledge/ask - Interrogation RAG pour tester l'agent IA
router.post('/ask', protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: 'Question requise' });
    }

    // Récupérer les documents du cabinet
    const docs = await Document.find({ clinicId: req.clinicId });
    const localContext = docs.map(d => `[${d.category} - ${d.title}]: ${d.content}`).join('\n\n');

    // Appel au microservice IA Python RAG
    const ragAnswer = await queryKnowledgeRAG(question, req.clinicId);

    res.json({
      question,
      answer: ragAnswer.reply || 'D’après les documents du cabinet...',
      sources: ragAnswer.sources || docs.map(d => d.title),
      contextLength: localContext.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’interrogation RAG', error: error.message });
  }
});

// DELETE /api/knowledge/:id
router.delete('/:id', protect, authorize('ADMIN', 'PRATICIEN'), async (req, res) => {
  try {
    await Document.findOneAndDelete({ _id: req.params.id, clinicId: req.clinicId });
    res.json({ message: 'Document supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de suppression', error: error.message });
  }
});

export default router;
