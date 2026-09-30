import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import Email from '../models/Email.js';
import Appointment from '../models/Appointment.js';
import Document from '../models/Document.js';

export const seedInitialData = async () => {
  try {
    const existingClinic = await Clinic.findOne();
    if (existingClinic) {
      return; // Déjà initialisé
    }

    console.log('[Seed] Initialisation des données de démonstration (Tunisie 2026)...');

    // 1. Créer le Cabinet Médical Pilote
    const medicalClinic = await Clinic.create({
      name: 'Cabinet Médical Dr. Ben Salem - Tunis',
      type: 'MEDICAL',
      specialty: 'Cardiologie & Médecine Générale',
      address: {
        street: 'Avenue Habib Bourguiba',
        city: 'Tunis',
        country: 'Tunisie',
      },
      phone: '+216 71 234 567',
      email: 'contact@bensalem-medical.tn',
      aiSettings: {
        autonomyLevel: 'HUMAN_IN_THE_LOOP',
        confidenceThreshold: 0.88,
        emergencyEscalationPhone: '+216 98 111 222',
        emergencyEscalationEmail: 'urgence@bensalem-medical.tn',
      },
      pricing: [
        { serviceName: 'Consultation standard', priceTND: 70, description: 'Examen clinique général' },
        { serviceName: 'Électrocardiogramme (ECG)', priceTND: 50, description: 'Tracé cardiaque au repos' },
        { serviceName: 'Échocardiographie Doppler', priceTND: 140, description: 'Exploration ultrasonore' },
      ],
    });

    // 2. Créer les Utilisateurs de test (Admin, Praticien, Secrétaire)
    const adminUser = await User.create({
      name: 'Administrateur Plateforme',
      email: 'admin@cabinet-ai.tn',
      password: 'Password123!',
      role: 'ADMIN',
      clinicId: medicalClinic._id,
    });

    const docUser = await User.create({
      name: 'Dr. Youssef Ben Salem',
      email: 'dr.bensalem@cabinet-ai.tn',
      password: 'Password123!',
      role: 'PRATICIEN',
      clinicId: medicalClinic._id,
    });

    const secretaryUser = await User.create({
      name: 'Sarra Mansouri (Secrétariat)',
      email: 'secretaire@cabinet-ai.tn',
      password: 'Password123!',
      role: 'SECRETAIRE',
      clinicId: medicalClinic._id,
    });

    // 3. E-mails de démonstration pour chaque intention
    const today = new Date().toISOString().split('T')[0];

    await Email.create([
      {
        clinicId: medicalClinic._id,
        sender: { name: 'Amine Jaziri', email: 'amine.jaziri@gmail.com' },
        subject: 'Demande de RDV pour consultation de contrôle',
        body: 'Bonjour docteur, je souhaiterais prendre un rendez-vous pour un contrôle de tension ce jeudi vers 10h si vous avez de la place. Cordialement.',
        intent: 'APPOINTMENT',
        confidence: 0.96,
        status: 'PENDING_VALIDATION',
        draftReply: 'Bonjour M. Jaziri,\n\nNous avons bien reçu votre demande. Le Dr. Ben Salem est disponible ce jeudi à 10h00. Souhaitez-vous que nous confirmions ce créneau ?\n\nBien cordialement,\nLe secrétariat du Dr. Ben Salem',
        extractedEntities: { requestedDate: 'jeudi', requestedTime: '10h', specialtyOrService: 'Contrôle tension' },
      },
      {
        clinicId: medicalClinic._id,
        sender: { name: 'Mona Karray', email: 'm.karray@yahoo.fr' },
        subject: 'URGENT : Fortes douleurs thoraciques',
        body: 'Bonjour, j’ai une forte oppression dans la poitrine depuis 1h avec engourdissement du bras gauche. Que dois-je faire ?',
        intent: 'EMERGENCY',
        confidence: 0.99,
        status: 'ESCALATED_EMERGENCY',
        draftReply: 'ALERTE URGENCE : Veuillez contacter immédiatement le SAMU (198 ou 190) ou vous rendre aux urgences hospitalières les plus proches sans délai.',
        extractedEntities: { urgencyKeywords: ['douleurs thoraciques', 'engourdissement bras gauche'] },
      },
      {
        clinicId: medicalClinic._id,
        sender: { name: 'Karim Bouazizi', email: 'karim.b@outlook.com' },
        subject: 'Tarifs consultation et échocardiographie',
        body: 'Bonjour, pourriez-vous m’indiquer vos tarifs pour une consultation cardiologique avec échographie et si vous prenez en charge la convention CNAM ? Merci.',
        intent: 'PRICING',
        confidence: 0.92,
        status: 'PENDING_VALIDATION',
        draftReply: 'Bonjour M. Bouazizi,\n\nLa consultation est à 70 TND et l\'échocardiographie Doppler à 140 TND. Le cabinet est conventionné CNAM (filière privée et remboursement AP1). Nous restons à votre entière disposition.\n\nCordialement,\nCabinet Dr. Ben Salem',
      },
      {
        clinicId: medicalClinic._id,
        sender: { name: 'Société CleanOffice', email: 'promo@cleanoffice-tn.com' },
        subject: 'Promotion exceptionnelle fournitures et mobilier',
        body: 'Profitez de nos réductions exceptionnelles de 50% sur l\'ensemble des consommables de bureau jusqu\'à la fin du mois !',
        intent: 'SPAM',
        confidence: 0.98,
        status: 'DISMISSED',
        draftReply: '',
      },
    ]);

    // 4. Rendez-vous de test
    await Appointment.create([
      {
        clinicId: medicalClinic._id,
        practitionerId: docUser._id,
        patient: { name: 'Sami Chaabane', email: 'sami.ch@gmail.com', phone: '+216 98 456 789' },
        reason: 'Bilan cardiaque annuel',
        date: today,
        timeSlot: { start: '09:00', end: '09:30' },
        status: 'CONFIRMED',
        source: 'EMAIL_AI',
      },
      {
        clinicId: medicalClinic._id,
        practitionerId: docUser._id,
        patient: { name: 'Leila Trabelsi', email: 'leila.t@gnet.tn', phone: '+216 22 334 455' },
        reason: 'Contrôle post-opératoire',
        date: today,
        timeSlot: { start: '11:00', end: '11:30' },
        status: 'SCHEDULED',
        source: 'MANUAL_SECRETARY',
      },
    ]);

    // 5. Documents de connaissances (RAG)
    await Document.create([
      {
        clinicId: medicalClinic._id,
        title: 'Horaires d’ouverture et permanences',
        category: 'HORAIRES',
        content: 'Le cabinet du Dr. Ben Salem est ouvert du lundi au vendredi de 08h30 à 17h30, et le samedi matin de 08h30 à 13h00. Le dimanche le cabinet est fermé.',
        uploadedBy: docUser._id,
      },
      {
        clinicId: medicalClinic._id,
        title: 'Grille tarifaire et remboursement CNAM 2026',
        category: 'TARIFS',
        content: 'Consultation standard : 70 DT. Électrocardiogramme : 50 DT. Échocardiographie : 140 DT. Conventionnement CNAM actif avec feuille de soins délivrée sur place.',
        uploadedBy: docUser._id,
      },
    ]);

    console.log('[Seed] Données de test initialisées avec succès !');
  } catch (error) {
    console.error('[Seed] Erreur d’initialisation des données :', error.message);
  }
};
