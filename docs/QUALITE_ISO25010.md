# Qualité logicielle – conformité ISO/IEC 25010

Ce document décrit la stratégie de test de **MediLawAI** (assistant IA de prise de rendez-vous par e-mail),
la matrice de traçabilité exigence ↔ test ↔ outil ↔ résultat, et la façon de rejouer chaque couche
en local (cmd) ou dans le pipeline CI/CD.

> **Règle d'or.** Aucun résultat n'est saisi à la main : chaque valeur provient de
> `quality/reports/summary.md`, généré par les outils eux-mêmes à chaque exécution.
> Les journaux bruts sont dans `quality/reports/*.log`.

---

## 1. Lancer les tests

### En local (Windows, cmd)

```bat
tests-qualite.bat                  :: toutes les couches (≈ 6 min)
tests-qualite.bat unit             :: une couche
tests-qualite.bat api e2e perf     :: plusieurs couches
```

Équivalents : `npm run test:quality` (racine) ou `node quality\run-all.js <couches>`.

Prérequis :

| Outil | Utilisé pour | Remarque |
|---|---|---|
| Node.js ≥ 20 | backend, frontend, outils de test | obligatoire |
| MongoDB 7/8 | intégration, API, E2E, perf | démarré automatiquement s'il est installé (`C:\Program Files\MongoDB\Server\*`) |
| Python ≥ 3.11 avec pip | service IA (pytest, Bandit, pip-audit) | `ai-service\.venv` est créé automatiquement |
| Docker | OWASP ZAP, portabilité | facultatif en local : ces couches sont marquées « Non exécuté » et tournent en CI |

Le premier lancement installe les dépendances et les navigateurs Playwright (Chromium, Firefox).

**Isolation** : la campagne démarre son propre environnement (backend sur le port **5050**, base
`ai_cabinet_qa` vidée puis ré-ensemencée, frontend de production sur **4173**). La base de travail
`ai_cabinet_db` et l'application lancée sur 5000/5173 ne sont jamais touchées.

### Couches disponibles

| Couche | Commande | Contenu |
|---|---|---|
| `unit` | `node --test` (backend) | tests unitaires, intégration MongoDB, fiabilité, couverture (seuils 70 / 60 / 60 %) |
| `python` | pytest + pytest-cov | classification IA, extraction, garde-fous, contrat FastAPI |
| `lint` | ESLint + eslint-plugin-security | SAST JavaScript/TypeScript, complexité cyclomatique |
| `dup` | jscpd | duplication de code (seuil 10 %) |
| `sca` | npm audit + pip-audit | CVE des dépendances backend, frontend, service IA |
| `sast` | Bandit | SAST du service IA Python |
| `api` | Postman / Newman | 46 requêtes, contrat HTTP, rôles, règles métier |
| `e2e` | Playwright + axe-core | parcours réels sur Chromium, Firefox et mobile ; accessibilité WCAG 2.1 |
| `perf` | autocannon | 20 utilisateurs simultanés, 15 s par scénario |
| `dast` | sondes OWASP Top 10 | application en marche : injections, IDOR, jetons, en-têtes, CORS |
| `zap` | OWASP ZAP baseline | scanner DAST (Docker) |
| `portability` | Docker Compose | validation et build des images |

### Dans le pipeline CI/CD (GitHub Actions)

`.github/workflows/ci-cd.yml` exécute **les mêmes commandes** à chaque push et pull request :

| Job | Couches | Environnement |
|---|---|---|
| `unit` | unit | Ubuntu + conteneur MongoDB 7 |
| `static` | python, lint, dup, sca, sast | Ubuntu + Python 3.12 |
| `runtime` | api, e2e, perf, dast, zap | Ubuntu + MongoDB + Chromium/Firefox + Docker (ZAP) |
| `trivy` | scan des vulnérabilités, secrets et mauvaises configurations | Trivy |
| `portability` | docker compose build + démarrage réel + `/health` | Docker |

Aucun échec n'est masqué (plus de `|| true`). Les rapports sont publiés comme artefacts de chaque
job et le résumé s'affiche dans l'onglet *Summary* de l'exécution.

---

## 2. Exigences fonctionnelles minimales (cahier des charges §4)

| Exigence | Réalisation dans MediLawAI | Preuve de test |
|---|---|---|
| ≥ 3 rôles aux droits différenciés | `SUPER_ADMIN`, `ADMIN`, `PRATICIEN`, `PATIENT` (+ invité sans compte) | Newman « 03 Contrôle d'accès », E2E `admin.spec.js`, sondes DAST A01 |
| ≥ 4 entités liées, CRUD | `Clinic` 1-N `Doctor`, `Clinic` 1-N `User`, `Doctor` 1-N `Appointment`, `Doctor` N-N `Patient` (via `DoctorPatient`), `EmailThread` 1-N `Email`, `Contact` | Newman (réservation, contacts, annulation), `db_integration.test.js` |
| Workflow à statuts avec règles de transition | Rendez-vous : `SCHEDULED → CONFIRMED → COMPLETED / NO_SHOW`, `→ CANCELLED`, états terminaux (`appointmentWorkflow.js`) | `business_rules.test.js` RM-03, Newman « transition interdite » |
| Tableau de bord (indicateurs, filtres) | Dashboard praticien, vue d'ensemble admin (`/api/admin/overview`), statistiques | E2E `praticien.spec.js`, Newman « tableau de bord global » |
| Recherche / filtrage sur une entité à fort volume | Patients (nom, e-mail, dossier), e-mails (dossier, priorité), praticiens (spécialité) | E2E « recherche dans la liste des patients » |
| Journal d'audit des actions sensibles | `AuditLog` (création/modification d'utilisateurs, cabinets, praticiens, annulations, changements de statut) | Newman « Journal d'audit contient l'annulation » |
| ≥ 5 règles métier testables | RM-01 à RM-08 ci-dessous | voir §3 |

---

## 3. Règles métier explicites

| Id | Règle | Implémentation | Tests |
|---|---|---|---|
| **RM-01** | Un créneau ne peut être réservé qu'une fois par praticien (tampon de 5 min inclus) | `computeDaySlots`, index unique partiel `Appointment`, contrôle avant insertion → HTTP 409 | unitaire RM-01 · fiabilité « 10 réservations simultanées → 1 seule » · Newman « Double réservation → 409 » |
| **RM-02** | Réservation uniquement dans les horaires d'ouverture, hors pause, hors congés, hors jours fermés, jamais dans le passé, au moins 1 h à l'avance | `checkTimeInDay`, `loadPractitionerDay` | unitaire RM-02 · Newman « dimanche → 409 » |
| **RM-03** | Workflow : seules les transitions autorisées sont possibles ; un RDV n'est clôturé (réalisé / absent) qu'après son heure | `appointmentWorkflow.js`, `PATCH /api/appointments/:id/status` | unitaire RM-03 · Newman « annuler un RDV annulé → 409 », « clôturer un RDV futur → 409 » |
| **RM-04** | Un praticien ne voit et ne gère que ses propres patients et rendez-vous | `practitionerScope.js` | intégration « cloisonnement » · Newman RM-04 · DAST « IDOR » |
| **RM-05** | Compte : mot de passe ≥ 8 caractères, haché bcrypt, inscription publique limitée aux rôles praticien/patient | `routes/auth.js`, `passwordHasher.js` | unitaire RM-05 · intégration « inscription publique » · Newman · DAST A01/A07 |
| **RM-06** | Une adresse e-mail ne correspond qu'à un seul compte | contrôle à l'inscription + index unique `User.email` | Newman « e-mail déjà utilisé → 400 » |
| **RM-07** | Une réservation rejouée (même clé d'idempotence) ne crée pas de doublon | `idempotencyKey` | fiabilité « idempotence » |
| **RM-08** | E-mail clair → RDV réservé et confirmé automatiquement ; e-mail ambigu → l'IA demande le praticien manquant ; déplacement → l'ancien RDV est annulé | `centralEmailRouter.js`, `smartBookingDecisionService.js` | `central_email_scenarios.test.js`, `smart_booking_flow.test.js`, intégration « déplacement » |

---

## 4. Matrice de traçabilité ISO 25010

| § | Caractéristique | Exigence concrète | Tests | Outil(s) | Critère d'acceptation |
|---|---|---|---|---|---|
| 6.1 | Aptitude fonctionnelle | Fonctionnalités §4 présentes et exactes | unitaires, intégration, contrat API, E2E | node:test, pytest, Newman, Playwright | 100 % des tests réussis |
| 6.2 | Efficacité de performance | Temps de réponse sous 20 utilisateurs simultanés | `quality/perf/load-test.js` (7 scénarios) | autocannon | lectures p97,5 < 500 ms, connexion p97,5 < 2 000 ms, 0 erreur |
| 6.3 | Compatibilité | ≥ 2 navigateurs + mobile ; coexistence avec des systèmes tiers (Gmail, Google Calendar, n8n, service IA) | E2E sur 3 projets Playwright ; contrat API ; mode dégradé si l'IA est absente | Playwright (Chromium, Firefox, Pixel 7), Newman | mêmes parcours verts sur tous les moteurs |
| 6.4 | Facilité d'utilisation | Parcours patient sans compte ; accessibilité de base ; navigation clavier ; messages d'erreur clairs | `patient-booking.spec.js`, `accessibility.spec.js` | Playwright + axe-core | parcours complet réussi, 0 violation WCAG critique |
| 6.5 | Fiabilité | Pas de perte de données, reprise après panne, concurrence, rejeu | `reliability.test.js` | node:test + MongoDB réel | 0 double réservation, 0 donnée perdue, reprise sans redémarrage |
| 6.6 | Sécurité | Authentification robuste, RBAC, OWASP Top 10 | SAST, SCA, DAST, tests ReDoS, contrôle d'accès | ESLint-security, Bandit, npm audit, pip-audit, Trivy, sondes DAST, OWASP ZAP | 0 erreur SAST, 0 CVE haute/critique, 100 % des sondes conformes |
| 6.7 | Maintenabilité | Architecture en couches, complexité maîtrisée, couverture mesurée | couverture, lint, duplication | node:test coverage, pytest-cov, ESLint, jscpd | couverture ≥ 70 % des lignes, duplication < 10 % |
| 6.8 | Portabilité | Installation reproductible | `docker compose build` + démarrage + `/health` ; script `tests-qualite.bat` | Docker Compose, GitHub Actions (Ubuntu) vs poste Windows | pile démarrée et saine sur une machine vierge |

---

## 5. Résultats de la campagne

Voir **§6 Rapport de conformité**, mis à jour à partir du dernier `quality/reports/summary.md`.
