import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import DashboardView from './components/DashboardView.jsx';
import InboxView from './components/InboxView.jsx';
import CalendarView from './components/CalendarView.jsx';
import KnowledgeView from './components/KnowledgeView.jsx';
import SettingsView from './components/SettingsView.jsx';
import DevOpsView from './components/DevOpsView.jsx';
import N8nAutomationsView from './components/N8nAutomationsView.jsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeRole, setActiveRole] = useState('PRATICIEN');

  // État du cabinet (Multi-tenant)
  const [currentClinic, setCurrentClinic] = useState({
    id: 'clinic-tn-01',
    name: 'Cabinet Médical Dr. Ben Salem',
    type: 'MEDICAL',
    specialty: 'Cardiologie & Médecine Générale',
    phone: '+216 71 234 567',
    aiSettings: {
      autonomyLevel: 'HUMAN_IN_THE_LOOP',
      confidenceThreshold: 0.88,
      emergencyEscalationPhone: '+216 98 111 222',
    },
  });

  // E-mails initiaux avec cas réels tunisiens (médical et juridique)
  const [emails, setEmails] = useState([
    {
      id: 'em-1',
      sender: { name: 'Amine Jaziri', email: 'amine.jaziri@gmail.com' },
      subject: 'Demande de consultation cardiologie jeudi 10h',
      body: 'Bonjour Docteur, je ressens de légères palpitations lors de mes efforts physiques. J’aimerais savoir si vous avez une disponibilité ce jeudi vers 10h pour un contrôle de tension et ECG. Merci.',
      intent: 'APPOINTMENT',
      confidence: 0.96,
      status: 'PENDING_VALIDATION',
      draftReply: 'Bonjour M. Jaziri,\n\nNous avons bien reçu votre demande. Le Dr. Ben Salem est disponible ce jeudi à 10h00 pour votre consultation de cardiologie et ECG. Souhaitez-vous que nous confirmions ce créneau ?\n\nBien cordialement,\nLe secrétariat du Dr. Ben Salem',
    },
    {
      id: 'em-2',
      sender: { name: 'Mona Karray', email: 'm.karray@yahoo.fr' },
      subject: 'URGENT : Fortes douleurs thoraciques et essoufflement',
      body: 'Docteur, depuis ce matin 6h j\'ai de violentes douleurs dans la poitrine irradiant vers le bras gauche avec un essoufflement marqué. Pouvez-vous me recevoir en urgence ?',
      intent: 'EMERGENCY',
      confidence: 0.99,
      status: 'ESCALATED_EMERGENCY',
      draftReply: '🚨 ALERTE URGENCE VITALE : Vos symptômes imposent une prise en charge hospitalière immédiate sans attendre. Veuillez composer sans tarder le SAMU (190 / 198) ou vous présenter immédiatement au service des urgences le plus proche.',
    },
    {
      id: 'em-3',
      sender: { name: 'Karim Bouazizi', email: 'karim.b@outlook.com' },
      subject: 'Tarifs consultation et prise en charge CNAM',
      body: 'Bonjour, pourriez-vous m\'indiquer vos tarifs pour une consultation avec échocardiographie doppler ainsi que les modalités de remboursement CNAM ? Merci d\'avance.',
      intent: 'PRICING',
      confidence: 0.93,
      status: 'PENDING_VALIDATION',
      draftReply: 'Bonjour M. Bouazizi,\n\nLa consultation spécialisée est fixée à 70 DT et l\'échocardiographie Doppler à 140 DT. Notre cabinet est conventionné CNAM (filière privée et remboursement AP1 sur feuille de soins). N\'hésitez pas pour toute question complémentaire.\n\nCordialement,\nCabinet Dr. Ben Salem',
    },
    {
      id: 'em-4',
      sender: { name: 'Sonia Chebbi', email: 'sonia.chebbi@topnet.tn' },
      subject: 'Demande de duplicata de feuille de soins CNAM',
      body: 'Bonjour, j\'ai égaré le volet CNAM de ma consultation du 12 février. Serait-il possible de m\'établir un duplicata certifié conforme pour mon dossier d\'assurance ?',
      intent: 'ADMINISTRATIVE',
      confidence: 0.91,
      status: 'PENDING_VALIDATION',
      draftReply: 'Bonjour Mme Chebbi,\n\nVotre demande a été transmise à notre secrétariat. Votre duplicata de feuille de soins sera préparé et disponible au cabinet dès demain matin à partir de 09h00.\n\nBien cordialement,\nSecrétariat du Cabinet',
    },
    {
      id: 'em-5',
      sender: { name: 'Mobilier Bureau Express', email: 'contact@bureau-express-tn.com' },
      subject: 'Offre promotionnelle exclusive mobilier et imprimantes -50%',
      body: 'Découvrez notre catalogue de mobilier professionnel de bureau en promotion jusqu\'au 31 du mois avec livraison gratuite sur le grand Tunis.',
      intent: 'SPAM',
      confidence: 0.97,
      status: 'DISMISSED',
      draftReply: '',
    },
  ]);

  // Rendez-vous initiaux
  const todayStr = new Date().toISOString().split('T')[0];
  const [appointments, setAppointments] = useState([
    {
      id: 'apt-1',
      patient: { name: 'Sami Chaabane', email: 'sami.ch@gmail.com', phone: '+216 98 456 789' },
      reason: 'Bilan cardiaque annuel',
      date: todayStr,
      timeSlot: { start: '09:00', end: '09:30' },
      status: 'CONFIRMED',
      source: 'EMAIL_AI',
    },
    {
      id: 'apt-2',
      patient: { name: 'Leila Trabelsi', email: 'leila.t@gnet.tn', phone: '+216 22 334 455' },
      reason: 'Contrôle tensionnel',
      date: todayStr,
      timeSlot: { start: '11:00', end: '11:30' },
      status: 'SCHEDULED',
      source: 'MANUAL_SECRETARY',
    },
  ]);

  // Documents RAG
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'Horaires d\'ouverture et permanences 2026',
      category: 'HORAIRES',
      content: 'Le cabinet est ouvert du lundi au vendredi de 08h30 à 17h30 sans interruption, et le samedi matin de 08h30 à 13h00. Le dimanche le cabinet est fermé. En cas d\'urgence en dehors des horaires, contacter le 190.',
    },
    {
      id: 'doc-2',
      title: 'Barème officiel des honoraires et convention CNAM',
      category: 'TARIFS',
      content: 'Consultation standard : 70 DT. Électrocardiogramme au repos : 50 DT. Échocardiographie Doppler : 140 DT. Conventionnement CNAM actif avec feuille de soins et code médecin agréé.',
    },
    {
      id: 'doc-3',
      title: 'Protocole de gestion des urgences vitales',
      category: 'PROCEDURES',
      content: 'Toute détresse respiratoire, douleur thoracique aiguë ou syncope déclenche l\'alerte immédiate SAMU Tunisie (190 / 198) et la notification prioritaire au praticien.',
    },
  ]);

  // Journal d'Audit DevSecOps
  const [auditLogs, setAuditLogs] = useState([
    { action: 'SECURITY_SCAN_PASSED', resource: 'Trivy / OWASP', timestamp: 'Il y a 5 min' },
    { action: 'EMAIL_INGESTED_NLP', resource: 'Email #em-1', timestamp: 'Il y a 12 min' },
    { action: 'APPOINTMENT_DOUBLE_BOOKING_PREVENTED', resource: 'Appointment #apt-1', timestamp: 'Il y a 25 min' },
    { action: 'RAG_INDEX_SYNCED', resource: 'KnowledgeBase', timestamp: 'Il y a 1 heure' },
  ]);

  // Actions
  const handleSwitchClinic = (type) => {
    if (type === 'MEDICAL') {
      setCurrentClinic({
        id: 'clinic-tn-01',
        name: 'Cabinet Médical Dr. Ben Salem',
        type: 'MEDICAL',
        specialty: 'Cardiologie & Médecine Générale',
        phone: '+216 71 234 567',
        aiSettings: {
          autonomyLevel: 'HUMAN_IN_THE_LOOP',
          confidenceThreshold: 0.88,
          emergencyEscalationPhone: '+216 98 111 222',
        },
      });
    } else {
      setCurrentClinic({
        id: 'clinic-tn-02',
        name: 'Cabinet d\'Avocats Me. Trabelsi & Associés',
        type: 'JURIDIQUE',
        specialty: 'Droit des Affaires & Droit Civil',
        phone: '+216 71 888 999',
        aiSettings: {
          autonomyLevel: 'HUMAN_IN_THE_LOOP',
          confidenceThreshold: 0.90,
          emergencyEscalationPhone: '+216 98 444 555',
        },
      });
    }
  };

  const handleValidateEmail = (id, customizedDraft = null, sendNow = true) => {
    setEmails(prev => prev.map(e => {
      if ((e.id === id || e._id === id)) {
        return {
          ...e,
          draftReply: customizedDraft !== null ? customizedDraft : e.draftReply,
          status: sendNow ? 'VALIDATED_AND_SENT' : 'MANUAL_OVERRIDE',
        };
      }
      return e;
    }));

    setAuditLogs(prev => [
      { action: 'EMAIL_HUMAN_VALIDATION', resource: `Email #${id}`, timestamp: 'À l\'instant' },
      ...prev,
    ]);
  };

  const handleSimulateIncomingEmail = ({ subject, body, sender }) => {
    // Pipeline IA de simulation NLP
    const lower = `${subject} ${body}`.lower ? `${subject} ${body}`.toLowerCase() : '';
    let intent = 'APPOINTMENT';
    let confidence = 0.95;
    let draft = 'Bonjour, nous avons bien reçu votre demande et vous confirmons notre disponibilité.';

    if (lower.includes('urgent') || lower.includes('douleur') || lower.includes('danger')) {
      intent = 'EMERGENCY';
      confidence = 0.99;
      draft = '🚨 ALERTE URGENCE : Veuillez contacter immédiatement le SAMU (190 / 198).';
    } else if (lower.includes('tarif') || lower.includes('prix') || lower.includes('combien')) {
      intent = 'PRICING';
      confidence = 0.94;
      draft = 'Bonjour, nos tarifs sont conformes aux conventions du cabinet. N\'hésitez pas pour toute question.';
    }

    const newEmail = {
      id: `em-${Date.now()}`,
      sender,
      subject,
      body,
      intent,
      confidence,
      status: intent === 'EMERGENCY' ? 'ESCALATED_EMERGENCY' : 'PENDING_VALIDATION',
      draftReply: draft,
    };

    setEmails(prev => [newEmail, ...prev]);
    setAuditLogs(prev => [
      { action: 'SIMULATION_EMAIL_INGESTED', resource: `Email #${newEmail.id}`, timestamp: 'À l\'instant' },
      ...prev,
    ]);
  };

  const handleAddAppointment = (newApt) => {
    const aptWithId = { ...newApt, id: `apt-${Date.now()}` };
    setAppointments(prev => [...prev, aptWithId]);
    setAuditLogs(prev => [
      { action: 'APPOINTMENT_SCHEDULED', resource: `Patient: ${newApt.patient.name}`, timestamp: 'À l\'instant' },
      ...prev,
    ]);
  };

  const handleCancelAppointment = (id) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
    setAuditLogs(prev => [
      { action: 'APPOINTMENT_CANCELLED_SLOT_FREED', resource: `Apt #${id}`, timestamp: 'À l\'instant' },
      ...prev,
    ]);
  };

  const handleAddDocument = (newDoc) => {
    const docWithId = { ...newDoc, id: `doc-${Date.now()}` };
    setDocuments(prev => [...prev, docWithId]);
    setAuditLogs(prev => [
      { action: 'KNOWLEDGE_DOCUMENT_VECTORIZED', resource: newDoc.title, timestamp: 'À l\'instant' },
      ...prev,
    ]);
  };

  const handleQueryRag = async (question) => {
    // Interrogation RAG contextuelle
    const qLower = question.toLowerCase();
    const matchedDocs = documents.filter(d => 
      d.content.toLowerCase().split(' ').some(w => w.length > 3 && qLower.includes(w))
    );

    const sources = matchedDocs.length > 0 ? matchedDocs.map(d => d.title) : [documents[0]?.title || 'Guide du Cabinet'];
    const answer = matchedDocs.length > 0 
      ? `D'après les documents certifiés du cabinet : ${matchedDocs.map(d => d.content).join(' ')}`
      : 'D\'après la base de connaissances du cabinet, nous appliquons les règles conventionnées avec le praticien.';

    return { answer, sources };
  };

  const pendingCount = emails.filter(e => e.status === 'PENDING_VALIDATION').length;
  const emergencyCount = emails.filter(e => e.intent === 'EMERGENCY').length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar
        currentClinic={currentClinic}
        onSwitchClinic={handleSwitchClinic}
        activeRole={activeRole}
        onSwitchRole={setActiveRole}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingCount={pendingCount}
          emergencyCount={emergencyCount}
        />

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {currentTab === 'dashboard' && (
            <DashboardView
              emails={emails}
              appointments={appointments}
              onNavigateToInbox={() => setCurrentTab('inbox')}
              onValidateEmail={handleValidateEmail}
            />
          )}

          {currentTab === 'inbox' && (
            <InboxView
              emails={emails}
              onValidateEmail={handleValidateEmail}
              onSimulateIncomingEmail={handleSimulateIncomingEmail}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              appointments={appointments}
              onAddAppointment={handleAddAppointment}
              onCancelAppointment={handleCancelAppointment}
            />
          )}

          {currentTab === 'knowledge' && (
            <KnowledgeView
              documents={documents}
              onAddDocument={handleAddDocument}
              onQueryRag={handleQueryRag}
            />
          )}

          {currentTab === 'n8n' && (
            <N8nAutomationsView
              onSimulateEmail={(newEmail) => {
                handleSimulateIncomingEmail(newEmail);
                setAuditLogs(prev => [
                  { action: 'N8N_WORKFLOW_TRIGGERED', resource: 'Email Automation', timestamp: 'À l\'instant' },
                  ...prev,
                ]);
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              clinic={currentClinic}
              onUpdateSettings={(newSettings) => {
                setCurrentClinic(prev => ({ ...prev, ...newSettings }));
                setAuditLogs(prev => [
                  { action: 'SETTINGS_UPDATED', resource: 'AI & Autonomy', timestamp: 'À l\'instant' },
                  ...prev,
                ]);
              }}
            />
          )}

          {currentTab === 'devops' && (
            <DevOpsView auditLogs={auditLogs} />
          )}
        </main>
      </div>
    </div>
  );
}
