import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const classifyEmailContent = async (emailData) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/classify`, {
      subject: emailData.subject,
      body: emailData.body,
      clinicType: emailData.clinicType || 'MEDICAL',
    }, { timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS) || 5000 });
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
    }, { timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS) || 5000 });
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

export const analyzeEmailStructured = async ({
  subject,
  body,
  senderEmail,
  doctorContext,
  availableSlots,
  practiceName
}) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analyze-email`, {
      email_subject: subject,
      email_body: body,
      sender_email: senderEmail,
      doctor_context: doctorContext,
      available_slots: availableSlots,
      practice_name: practiceName
    }, { timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS) || 5000 });
    return response.data;
  } catch (error) {
    console.warn(`[AI-Service] /analyze-email indisponible, bascule sur classifyEmailContent: ${error.message}`);
    const fallback = await classifyEmailContent({ subject, body });
    return {
      intent: fallback.intent === 'APPOINTMENT' ? 'BOOKING_REQUEST' : fallback.intent,
      urgency: fallback.isEmergency ? 'CRITICAL' : 'LOW',
      preferred_date: fallback.extractedEntities?.requestedDate,
      preferred_time: fallback.extractedEntities?.requestedTime,
      patient_phone: fallback.extractedEntities?.phone,
      reason_summary: subject,
      requires_human: true,
      confidence: fallback.confidence || 0.6,
      suggested_slots: availableSlots?.slice(0, 3) || [],
      reply_draft: fallback.suggestedReply || 'Votre message a bien été reçu.'
    };
  }
};

export const queryAiService = classifyEmailContent;

