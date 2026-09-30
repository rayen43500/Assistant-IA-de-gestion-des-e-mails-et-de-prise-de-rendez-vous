import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const classifyEmailContent = async (emailData) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/classify`, {
      subject: emailData.subject,
      body: emailData.body,
      clinicType: emailData.clinicType || 'MEDICAL',
    }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn(`[AI-Service] Classification indisponible, utilisation du mode de secours : ${error.message}`);
    // Mode dégradé sécurisé (règle 15 : Possibilité de dégrader vers un mode manuel)
    return {
      intent: 'UNCERTAIN',
      confidence: 0.5,
      suggestedReply: 'Votre message a bien été reçu et sera traité par notre secrétariat sous peu.',
      isFallback: true,
      extractedEntities: {},
    };
  }
};

export const queryKnowledgeRAG = async (query, clinicId) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/rag-query`, {
      query,
      clinicId: clinicId.toString(),
    }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn(`[AI-Service] RAG indisponible : ${error.message}`);
    return {
      reply: 'Informations temporairement indisponibles via l\'agent RAG.',
      sources: [],
    };
  }
};

export const checkHealthAI = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
    return response.data;
  } catch (error) {
    return { status: 'DEGRADED', error: error.message };
  }
};
