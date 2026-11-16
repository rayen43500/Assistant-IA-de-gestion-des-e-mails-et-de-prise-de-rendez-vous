# 📋 Synthèse du Projet MediLawAI & Typologie des Acteurs

---

## 1. 🌟 Présentation Globale du Projet

**MediLawAI** (anciennement Cabinet AI) est une plateforme SaaS intelligente et sécurisée de **secrétariat virtuel augmenté par l'Intelligence Artificielle**, spécialement conçue pour répondre aux exigences strictes de deux professions réglementées en Tunisie et à l'international :
1. **Les Cabinets Médicaux & Cliniques** (Cardiologie, Pédiatrie, Médecine Générale, Dentaire, etc.).
2. **Les Cabinets d'Avocats & Conseils Juridiques** (Droit des affaires, Droit social, Contentieux).

### 🎯 Problématiques Résolues
* **Saturation du secrétariat** : Traitement instantané de 100% des e-mails entrants 24h/24 et 7j/7.
* **Non-présentation aux consultations (No-Shows)** : Réduction drastique grâce aux rappels WhatsApp automatiques 24h avant l'échéance.
* **Urgences vitales (SAMU 190)** : Détection immédiate par NLP des symptômes critiques et redirection sans délai vers les services de secours d'urgence.
* **Garantie Zéro Hallucination** : Réponses basées exclusivement sur la base documentaire certifiée du cabinet (grille tarifaire CNAM, conventions d'honoraires, horaires) via architecture RAG.
* **Contrôle Humain (Human-in-the-Loop)** : Aucun e-mail sensible n'est expédié au patient ou au justiciable sans validation préalable du secrétaire ou du praticien.

---

## 2. 👥 Typologie des Acteurs & Personas Utilisateurs

La plateforme articule ses fonctionnalités autour de **6 profils d'acteurs distincts** :

```
                        ┌────────────────────────────────────────┐
                        │       Super Administrateur SaaS        │
                        └───────────────────┬────────────────────┘
                                            │ Supervise
                        ┌───────────────────▼────────────────────┐
                        │        Administrateur Cabinet          │
                        └─────────┬────────────────────┬─────────┘
                                  │                    │
              ┌───────────────────▼──────┐  ┌──────────▼────────────────┐
              │  Praticien / Professionnel│  │ Secrétaire de Cabinet     │
              │  (Médecin ou Avocat)     │  │ (Human-in-the-Loop)       │
              └─────────┬────────────────┘  └──────────┬────────────────┘
                        │                              │
                        └──────────────┬───────────────┘
                                       │ Interagissent avec
                        ┌──────────────▼─────────────────────────┐
                        │      Patient / Client / Justiciable    │
                        └────────────────────────────────────────┘
                                       ▲
                                       │ Notifie / Relance
                        ┌──────────────┴─────────────────────────┐
                        │    Agents Systèmes & Workflows n8n     │
                        └────────────────────────────────────────┘
```

---

### Acteur 1 : Le Praticien Titulaire (Médecin Spécialiste ou Avocat Associé)
* **Profil type** : *Dr. Youssef Ben Salem* (Cardiologue) ou *Me. Selim Trabelsi* (Avocat à la Cour).
* **Objectif** : Se concentrer sur son cœur de métier (soigner ses patients ou plaider) sans être interrompu par la gestion administrative.
* **Parcours et Actions dans la plateforme** :
  * Consulte son **tableau de bord matinal** (résumé exécutif préparé par l'IA des e-mails de la nuit et de son planning).
  * Visualise son **agenda synchronisé Google Calendar** en temps réel.
  * Valide en 1 clic les réponses sensibles préparées par l'IA.
  * Reçoit les alertes d'urgence médicale SAMU 190 ou les notifications prioritaires directement sur son mobile.
  * Ajuste le niveau d'autonomie de l'IA (Validation Humaine intégrale vs Suggestion semi-automatique).

---

### Acteur 2 : Le / La Secrétaire de Cabinet (Opérateur Human-in-the-Loop)
* **Profil type** : Secrétaire médical(e) ou assistant(e) juridique.
* **Objectif** : Traiter en quelques minutes ce qui prenait auparavant 3 à 4 heures par jour au téléphone et sur la boîte e-mail.
* **Parcours et Actions dans la plateforme** :
  * Utilise la **boîte de réception 3-panneaux** avec classification automatique en 5 dossiers IA (`Urgences SAMU`, `Rendez-vous`, `Tarifs & CNAM`, `À Valider`, `Tous`).
  * Révise et ajuste les brouillons de réponse générés par l'IA grâce aux suggestions de ton (*Court & Concis*, *Formel & Déontologique*).
  * Clique sur **« Valider & Envoyer »** pour expédier le courriel officiel.
  * Crée des rendez-vous manuels avec détection automatique anti-collision de créneaux.
  * Utilise le **Copilot RAG** pour trouver instantanément une réponse tarifaire certifiée ou un protocole de préparation d'examen.

---

### Acteur 3 : Le Patient ou Client Justiciable (Utilisateur Final Externe)
* **Profil type** : Patient consultant pour un examen cardiaque ou client d'entreprise sollicitant un avis juridique.
* **Objectif** : Obtenir une réponse rapide, claire, humaine et fiable sans attendre des heures au standard téléphonique.
* **Canaux d'interaction** :
  * **E-mail standard** : Envoie sa demande en langage naturel (français, arabe dialectal ou anglais).
  * **Accusé de réception intelligent** : Reçoit une réponse immédiate, personnalisée et respectueuse de son motif de consultation.
  * **Notification WhatsApp 24h avant RDV** : Reçoit un rappel automatisé avec l'heure exacte, l'adresse du cabinet, les consignes d'accès et les documents à apporter (carte d'assuré CNAM, statuts de société).
  * **Sécurité Vitale SAMU 190** : En cas de détresse médicale signalée, reçoit immédiatement la consigne d'appeler le 190 ou 198 avec les coordonnées des urgences les plus proches.

---

### Acteur 4 : L'Administrateur du Cabinet (Directeur / Manager)
* **Profil type** : Gestionnaire de clinique, responsable de cabinet de groupe ou associé gérant.
* **Objectif** : Paramétrer la structure, piloter la rentabilité et maintenir les règles de gouvernance.
* **Parcours et Actions dans la plateforme** :
  * Gère la **Base RAG Certifiée** : Importe et met à jour les grilles tarifaires officielles (tarifs CNAM, honoraires de consultation, conventions d'assurances privées).
  * Configure les horaires d'ouverture, les créneaux d'indisponibilité et les praticiens rattachés.
  * Définit les seuils de confiance du modèle d'IA (ex: exiger validation humaine si la confiance NLP est inférieure à 88%).
  * Analyse les rapports statistiques : Taux de conversion des demandes, temps moyen de réponse, volume d'e-mails par catégorie.

---

### Acteur 5 : Le Super Administrateur de la Plateforme SaaS
* **Profil type** : Ingénieur DevOps / SRE ou Éditeur de la solution MediLawAI.
* **Objectif** : Garantir la haute disponibilité, l'isolation multi-tenant stricte et la sécurité globale de l'infrastructure.
* **Parcours et Actions dans la plateforme** :
  * Accède au module **Super Admin Platform** ([`SuperAdminPlatformView.tsx`](file:///c:/Users/AXELL/Desktop/Assistant-IA-de-gestion-des-e-mails-et-de-prise-de-rendez-vous/frontend/src/components/admin/SuperAdminPlatformView.tsx)).
  * Supervise la santé des conteneurs Docker (MongoDB, Redis, Backend Express, AI FastAPI, Prometheus, Grafana).
  * Administre les différents cabinets clients (tenants isolés par `clinicId`).
  * Analyse les métriques système via `/metrics` (Prometheus) et consulte les alertes de sécurité OWASP (protection anti-prompt injection, chiffrement JWT AES-256).

---

### Acteur 6 : Les Agents Autonomes & Workflows n8n (Acteurs Systèmes)
* **Rôle** : Travailleurs d'arrière-plan automatisant les flux critiques sans intervention humaine :
  1. **Agent d'Ingestion & Tri (Workflow 1)** : Écoute les boîtes Gmail / IMAP, nettoie le contenu, extrait les entités (dates, téléphones) et classe l'intention.
  2. **Agent de Rappels WhatsApp (Workflow 2)** : Se déclenche chaque matin à 08h00 (Africa/Tunis) pour interroger les RDV du lendemain et expédier les messages WhatsApp via l'API Twilio/Meta.
  3. **Agent de Synchronisation Calendrier (Workflow 3)** : Réserve instantanément le bloc horaire sur Google Calendar dès qu'un rendez-vous est confirmé.
  4. **Agent d'Escalade Vitale SAMU (Workflow 4)** : Détecte les mots-clés d'urgence vitale et déclenche un SMS d'alerte immédiat au praticien de garde tout en envoyant la consigne d'urgence au patient.

---

## 3. 🔐 Matrice des Permissions et des Rôles (RBAC)

| Fonctionnalité / Écran | Praticien | Secrétaire | Administrateur Cabinet | Super Admin SaaS | Patient / Client |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Consultation Boîte E-mails** | ✅ | ✅ | ✅ | ❌ *(Secret pro)* | ❌ |
| **Validation & Expédition Réponses** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Prise & Annulation de RDV** | ✅ | ✅ | ✅ | ❌ | Via e-mail |
| **Édition Base RAG (Tarifs / Horaires)** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Modification Paramètres IA & Seuils**| ✅ | ❌ | ✅ | ❌ | ❌ |
| **Gestion des Utilisateurs du Cabinet**| ❌ | ❌ | ✅ | ❌ | ❌ |
| **Supervision Conteneurs & Métriques**  | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Gestion Multi-Tenants (Cabinets)**   | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Réception Rappels WhatsApp**         | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. 🎬 Scénarios d'Usage Réels (Exemples Pratiques)

### Scénario A : Demande de Rendez-vous Médical
1. **Émission** : M. Amine Jaziri envoie un e-mail demandant un contrôle cardiologique pour jeudi à 10h.
2. **Traitement IA** : Le moteur FastText/TF-IDF classe l'e-mail dans la catégorie `APPOINTMENT` (confiance 96%), extrait la date et l'heure souhaitées.
3. **Vérification Agenda** : Le système vérifie l'absence de conflit sur Google Calendar.
4. **Génération du Brouillon** : L'IA rédige une proposition courtoise confirmant la disponibilité du Dr. Ben Salem.
5. **Validation Humaine** : La secrétaire relit le message dans l'interface et clique sur **« Valider & Envoyer »**.
6. **Confirmation & Synchronisation** : L'e-mail part vers le patient, le créneau est verrouillé sur Google Calendar et un rappel WhatsApp 24h est programmé dans n8n.

---

### Scénario B : Détection d'Urgence Vitale (SAMU 190)
1. **Émission** : Mme Mona Karray envoie un courriel décrivant de violentes douleurs thoraciques et un essoufflement marqué.
2. **Analyse Prioritaire** : Le filtre d'urgence identifie les termes critiques (`douleur thoracique`, `essoufflement`). L'e-mail est immédiatement classifié `EMERGENCY` avec priorité `CRITICAL`.
3. **Escalade Instantanée** :
   * Une notification visuelle rouge clignotante apparaît en tête de liste de l'application.
   * Le praticien reçoit une alerte prioritaire.
   * L'e-mail de réponse automatique est généré immédiatement avec les consignes vitales : composer sans délai le **190 (SAMU)** ou le **198 (Protection Civile)**.

---

### Scénario C : Consultation Juridique & Convention d'Honoraires
1. **Émission** : Une entreprise contacte le cabinet d'avocats pour un avis sur une augmentation de capital.
2. **Classification & RAG** : L'IA identifie l'intention `PRICING / APPOINTMENT`, interroge les documents certifiés du cabinet concernant le droit des sociétés.
3. **Proposition** : L'IA rédige un modèle indiquant les modalités de consultation initiale (120 DT HT) et propose deux créneaux d'audience disponibles.
4. **Accord de l'Avocat** : L'avocat valide en un clic depuis sa tablette lors d'un déplacement.

---

## 5. 🛠️ Environnements & Accès Rapides

* **Frontend Web Responsive** : Accessible sur mobile, tablette et desktop via `http://localhost:5173` ou sur le domaine de production.
* **Espace de Connexion Rapide** :
  * 🩺 **Cabinet Médical Démo** : `dr.bensalem@cabinet-ai.tn` / `Password2026!`
  * ⚖️ **Cabinet Juridique Démo** : `me.trabelsi@avocats-tunis.tn` / `Password2026!`
  * 🛡️ **Super Admin SaaS Démo** : `admin@medilaw.ai` / `AdminSecurise2026!`
* **API Backend Express** : `https://stage-cqe9.onrender.com` (Endpoints `/api/auth`, `/api/emails`, `/api/appointments`, `/api/ai`).
* **Plateforme n8n** : `http://localhost:5678` (Workflows d'automatisation Gmail, WhatsApp, Calendar, SAMU).
* **Supervision & Métriques** : `http://localhost:9090` (Prometheus) et `http://localhost:3001` (Grafana).

---
*Document certifié conforme à la version de production 2026 de MediLawAI.*
