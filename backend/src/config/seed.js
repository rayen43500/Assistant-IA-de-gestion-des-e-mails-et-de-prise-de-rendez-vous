import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import DoctorPatient from '../models/DoctorPatient.js';
import InternalSchedule from '../models/InternalSchedule.js';
import Integration from '../models/Integration.js';
import Email from '../models/Email.js';
import Appointment from '../models/Appointment.js';
import Document from '../models/Document.js';
import { encryptData } from '../services/cryptoService.js';

export const seedInitialData = async () => {
  try {
    const clinicCount = await Clinic.countDocuments();
    if (clinicCount > 0) {
      console.log('[Seed] La base de données contient déjà des données. Aucun réensemencement nécessaire.');
      return;
    }

    console.log('[Seed] Initialisation des données multi-médecins et du cabinet...');

    // 1. Créer le Cabinet Médical Multi-Praticiens
    const medicalClinic = await Clinic.create({
      name: 'Cabinet Médical Dr. Ben Salem & Associés',
      type: 'MEDICAL',
      specialty: 'Cardiologie & Médecine Interne',
      address: {
        street: 'Avenue Habib Bourguiba, Immeuble Le Belvédère',
        city: 'Tunis',
        country: 'Tunisie',
      },
      phone: '+216 71 234 567',
      email: 'contact@cabinet-ai.tn',
      openingHours: {
        monday: { open: '08:30', close: '17:30', closed: false },
        tuesday: { open: '08:30', close: '17:30', closed: false },
        wednesday: { open: '08:30', close: '17:30', closed: false },
        thursday: { open: '08:30', close: '17:30', closed: false },
        friday: { open: '08:30', close: '17:30', closed: false },
        saturday: { open: '08:30', close: '13:00', closed: false },
        sunday: { closed: true },
      },
      pricing: [
        { serviceName: 'Consultation standard', priceTND: 70, description: 'Examen clinique général' },
        { serviceName: 'Électrocardiogramme (ECG)', priceTND: 50, description: 'Tracé cardiaque au repos' },
        { serviceName: 'Échocardiographie Doppler', priceTND: 140, description: 'Exploration ultrasonore' },
      ],
    });

    // 2. Utilisateurs : Admin & Médecins
    const adminUser = await User.create({
      name: 'Amine Mansour',
      email: 'admin@medilaw.ai',
      password: 'Password123!',
      role: 'SUPER_ADMIN',
      clinicId: medicalClinic._id,
    });

    const docUser1 = await User.create({
      name: 'Dr. Youssef Ben Salem',
      email: 'dr.bensalem@cabinet-ai.tn',
      password: 'Password123!',
      role: 'PRATICIEN',
      clinicId: medicalClinic._id,
    });

    const docUser2 = await User.create({
      name: 'Dr. Nadia Trabelsi',
      email: 'dr.nadia@cabinet-ai.tn',
      password: 'Password123!',
      role: 'PRATICIEN',
      clinicId: medicalClinic._id,
    });

    // 3. Modèles Doctor (Multi-praticiens)
    const doctor1 = await Doctor.create({
      tenantId: medicalClinic._id,
      userId: docUser1._id,
      name: 'Dr. Youssef Ben Salem',
      professionalEmail: 'dr.bensalem@cabinet-ai.tn',
      specialty: 'Cardiologie Interventionnelle',
      phone: '+216 98 111 222',
      appointmentDuration: 30,
      bufferTime: 5,
      bookingSettings: {
        onlineBookingEnabled: true,
        allowGuestBooking: true,
        requiresConfirmation: false,
        advanceNoticeHours: 2,
        maxBookingDaysInAdvance: 60,
      },
      status: 'ACTIVE',
    });

    const doctor2 = await Doctor.create({
      tenantId: medicalClinic._id,
      userId: docUser2._id,
      name: 'Dr. Nadia Trabelsi',
      professionalEmail: 'dr.nadia@cabinet-ai.tn',
      specialty: 'Médecine Générale & Échographie',
      phone: '+216 98 333 444',
      appointmentDuration: 30,
      bufferTime: 5,
      bookingSettings: {
        onlineBookingEnabled: true,
        allowGuestBooking: true,
        requiresConfirmation: false,
        advanceNoticeHours: 2,
        maxBookingDaysInAdvance: 60,
      },
      status: 'ACTIVE',
    });

    // 4. Horaires Internes (InternalSchedule) avec pause 12:30 - 14:00
    await InternalSchedule.create({
      tenantId: medicalClinic._id,
      doctorId: doctor1._id,
      appointmentDuration: 30,
      bufferTime: 5,
      weeklyWorkingHours: [
        { day: 'Lundi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Mardi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Mercredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Jeudi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Vendredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Samedi', active: true, start: '08:30', end: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
        { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
      ],
      breaks: [{ title: 'Pause Déjeuner', start: '12:30', end: '14:00' }],
    });

    await InternalSchedule.create({
      tenantId: medicalClinic._id,
      doctorId: doctor2._id,
      appointmentDuration: 30,
      bufferTime: 5,
      weeklyWorkingHours: [
        { day: 'Lundi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Mardi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Mercredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Jeudi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Vendredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
        { day: 'Samedi', active: false, start: '08:30', end: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
        { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
      ],
      breaks: [{ title: 'Pause Déjeuner', start: '12:30', end: '14:00' }],
    });

    // 5. Intégrations Google Individuelles Chiffrées
    const mockGoogleTokensDoc1 = {
      accessToken: 'ya29.demo_access_token_doc1',
      refreshToken: '1//demo_refresh_token_doc1',
      expiryDate: Date.now() + 3600 * 1000,
    };

    const integrationDoc1 = await Integration.create({
      tenantId: medicalClinic._id,
      doctorId: doctor1._id,
      provider: 'GOOGLE',
      providerAccountEmail: 'dr.bensalem@cabinet-ai.tn',
      encryptedCredentialReference: encryptData(mockGoogleTokensDoc1),
      calendarId: 'primary',
      connectionStatus: 'CONNECTED',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.freebusy'
      ],
      lastSynchronization: new Date(),
    });

    // 6. Patients et Relation DoctorPatient
    const patient1 = await Patient.create({
      tenantId: medicalClinic._id,
      name: 'Amine Jaziri',
      email: 'amine.jaziri@gmail.com',
      phone: '+216 98 456 789',
      contactPreferences: { email: true, sms: true, whatsapp: true },
      notes: 'Suivi pour hypertension et bilan cardiaque annuel.',
    });

    await DoctorPatient.create({
      tenantId: medicalClinic._id,
      doctorId: doctor1._id,
      patientId: patient1._id,
      relationshipStatus: 'ACTIVE',
      lastConsultationDate: new Date(),
    });

    // 7. E-mails de démonstration
    const today = new Date().toISOString().split('T')[0];

    await Email.create([
      {
        clinicId: medicalClinic._id,
        tenantId: medicalClinic._id,
        doctorId: doctor1._id,
        integrationId: integrationDoc1._id,
        recipient: 'dr.bensalem@cabinet-ai.tn',
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
        tenantId: medicalClinic._id,
        doctorId: doctor1._id,
        integrationId: integrationDoc1._id,
        recipient: 'dr.bensalem@cabinet-ai.tn',
        sender: { name: 'Mona Karray', email: 'm.karray@yahoo.fr' },
        subject: 'URGENT : Fortes douleurs thoraciques',
        body: 'Bonjour, j’ai une forte oppression dans la poitrine depuis 1h avec engourdissement du bras gauche. Que dois-je faire ?',
        intent: 'EMERGENCY',
        confidence: 0.99,
        status: 'ESCALATED_EMERGENCY',
        draftReply: '🚨 ALERTE URGENCE VITALE : Veuillez contacter immédiatement le SAMU (190 ou 198) ou vous présenter au service des urgences hospitalières le plus proche sans délai.',
        extractedEntities: { urgencyKeywords: ['douleurs thoraciques', 'engourdissement bras gauche'] },
      },
      {
        clinicId: medicalClinic._id,
        tenantId: medicalClinic._id,
        doctorId: doctor1._id,
        integrationId: integrationDoc1._id,
        recipient: 'dr.bensalem@cabinet-ai.tn',
        sender: { name: 'Karim Bouazizi', email: 'karim.b@outlook.com' },
        subject: 'Tarifs consultation et échocardiographie',
        body: 'Bonjour, pourriez-vous m’indiquer vos tarifs pour une consultation cardiologique avec échographie et si vous prenez en charge la convention CNAM ? Merci.',
        intent: 'PRICING',
        confidence: 0.92,
        status: 'PENDING_VALIDATION',
        draftReply: 'Bonjour M. Bouazizi,\n\nLa consultation est à 70 TND et l\'échocardiographie Doppler à 140 TND. Le cabinet est conventionné CNAM (filière privée et remboursement AP1). Nous restons à votre entière disposition.\n\nCordialement,\nCabinet Dr. Ben Salem',
      },
    ]);

    // 8. Rendez-vous de test avec doctorId et tenantId
    await Appointment.create([
      {
        clinicId: medicalClinic._id,
        tenantId: medicalClinic._id,
        practitionerId: docUser1._id,
        doctorId: doctor1._id,
        patientId: patient1._id,
        patient: { name: 'Sami Chaabane', email: 'sami.ch@gmail.com', phone: '+216 98 456 789' },
        reason: 'Bilan cardiaque annuel',
        date: today,
        timeSlot: { start: '09:00', end: '09:30' },
        status: 'CONFIRMED',
        source: 'EMAIL_AI',
        synchronizationStatus: 'SYNCED',
      },
      {
        clinicId: medicalClinic._id,
        tenantId: medicalClinic._id,
        practitionerId: docUser1._id,
        doctorId: doctor1._id,
        patient: { name: 'Leila Trabelsi', email: 'leila.t@gnet.tn', phone: '+216 22 334 455' },
        reason: 'Contrôle post-opératoire',
        date: today,
        timeSlot: { start: '11:00', end: '11:30' },
        status: 'SCHEDULED',
        source: 'MANUAL_CABINET',
        synchronizationStatus: 'PENDING',
      },
    ]);

    // 9. Documents de connaissances RAG
    await Document.create([
      {
        clinicId: medicalClinic._id,
        title: 'Horaires d’ouverture et permanences',
        category: 'HORAIRES',
        content: 'Le cabinet du Dr. Ben Salem est ouvert du lundi au vendredi de 08h30 à 17h30 (pause déjeuner 12h30-14h00), et le samedi matin de 08h30 à 13h00. Le dimanche le cabinet est fermé.',
        uploadedBy: docUser1._id,
      },
      {
        clinicId: medicalClinic._id,
        title: 'Grille tarifaire et remboursement CNAM 2026',
        category: 'TARIFS',
        content: 'Consultation standard : 70 DT. Électrocardiogramme : 50 DT. Échocardiographie : 140 DT. Conventionnement CNAM actif avec feuille de soins délivrée sur place.',
        uploadedBy: docUser1._id,
      },
    ]);

    console.log('[Seed] Données multi-praticiens et cabinet initialisées avec succès !');
  } catch (error) {
    console.error('[Seed] Erreur d’initialisation des données :', error.message);
  }
};
