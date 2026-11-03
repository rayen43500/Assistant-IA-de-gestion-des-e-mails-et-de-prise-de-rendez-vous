import React, { useState } from 'react';
import { 
  Building2, 
  Stethoscope, 
  Scale, 
  Mail, 
  Calendar, 
  Bot, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Users, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Lock,
  MessageSquare
} from 'lucide-react';

interface PublicLandingPageProps {
  onEnterApp: () => void;
  onOpenOnboarding: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onEnterApp, onOpenOnboarding }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MEDICAL' | 'LEGAL'>('ALL');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5EAF2]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#14213D]">MediLaw<span className="text-blue-600">AI</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Secrétariat Intelligent 24/7</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
            <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions Métiers</a>
            <a href="#automation" className="hover:text-blue-600 transition-colors">Orchestration n8n</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onEnterApp}
              className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3.5 py-2 transition-colors"
            >
              Connexion Espace Pro
            </button>
            <button
              onClick={onOpenOnboarding}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Essai Gratuit 14 Jours</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Plateforme SaaS Dédiée aux Cabinets Médicaux & Juridiques</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#14213D] tracking-tight max-w-4xl mx-auto leading-tight">
            Votre secrétariat intelligent, disponible <span className="text-blue-600">24h/24</span> grâce à l'IA.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Automatisez le tri de vos e-mails entrants, la confirmation des rendez-vous sans double réservation et les rappels WhatsApp avec les garanties de sécurité Human-in-the-Loop.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenOnboarding}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              <span>Démarrer la configuration du cabinet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onEnterApp}
              className="px-6 py-3.5 rounded-xl bg-white border border-[#E5EAF2] hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Explorer la démo en direct</span>
            </button>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conformité RGPD & Secret Médical</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Validation Humaine en 1 clic</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Intégration Google Calendar & Gmail</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Moteur d'Orchestration n8n Inclus</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Frame matching screenshot 1 */}
        <div className="max-w-6xl mx-auto mt-14 bg-white p-3 rounded-2xl shadow-2xl border border-[#E5EAF2]">
          <div className="bg-[#14213D] text-white p-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-bold">Aperçu Espace Praticien — Cabinet Médical Pilote</span>
            </div>
            <span className="text-slate-300 font-mono text-[11px]">Précision NLP : 94.2% • Temps de réponse : ~25ms</span>
          </div>
          <div className="p-6 bg-[#F7F9FC] rounded-b-xl grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            {[
              { label: 'E-mails Reçus & Classés', val: '142', sub: '+12.5% vs semaine dernière', color: 'text-blue-600' },
              { label: 'RDV Confirmés Aujourd’hui', val: '18', sub: '100% sans collision', color: 'text-emerald-600' },
              { label: 'Urgences SAMU Détectées', val: '3', sub: 'Escalade immédiate 190', color: 'text-rose-600' },
              { label: 'Temps Économisé / Semaine', val: '16.5 h', sub: 'Secrétariat automatisé', color: 'text-purple-600' }
            ].map((kpi, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-[#E5EAF2] shadow-xs">
                <span className="text-xs text-slate-500 font-medium">{kpi.label}</span>
                <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.val}</div>
                <span className="text-[10px] text-slate-400 mt-1 block">{kpi.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-6 bg-white border-t border-[#E5EAF2]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#14213D]">Fonctionnalités Conçues pour l’Excellence</h2>
            <p className="text-sm text-slate-600">Une suite tout-en-un alliant intelligence artificielle générative certifiée et automatisation no-code.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: 'Tri & Réponse E-mail par IA',
                desc: 'Classification NLP automatique (>94% F1-score) en 5 catégories : Demande de RDV, Tarifs, Administratif, Urgence et Spam.',
                tag: 'Deep Learning'
              },
              {
                icon: Calendar,
                title: 'Agenda & Anti-Double Réservation',
                desc: 'Index d’unicité au niveau de la base et synchronisation continue avec Google Calendar et Outlook pour éliminer les conflits.',
                tag: 'Zéro Collision'
              },
              {
                icon: MessageSquare,
                title: 'Rappels WhatsApp 24h Avant',
                desc: 'Envoi automatique de messages personnalisés aux patients/clients la veille de leur consultation pour réduire l’absentéisme de 70%.',
                tag: 'WhatsApp API'
              },
              {
                icon: ShieldCheck,
                title: 'Garde-fous Human-in-the-Loop',
                desc: 'Toute réponse sensible ou acte médical/juridique est préalablement soumis à la relecture en 1 clic de votre secrétariat.',
                tag: 'Sécurité Maximale'
              },
              {
                icon: Zap,
                title: 'Orchestration n8n Native',
                desc: '4 workflows de production préconfigurés pour automatiser Gmail, Calendar, Twilio et l’escalade SAMU 190 en arrière-plan.',
                tag: 'Workflows Actifs'
              },
              {
                icon: Bot,
                title: 'Moteur RAG sans Hallucination',
                desc: 'L’agent conversationnel répond exclusivement à partir des fiches tarifaires, horaires et documents certifiés de votre structure.',
                tag: 'Base Certifiée'
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-[#E5EAF2] bg-[#F7F9FC] hover:bg-white hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/50">{f.tag}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions Medical vs Legal Section */}
      <section id="solutions" className="py-16 px-6 bg-[#F7F9FC] border-t border-[#E5EAF2]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#14213D]">Adapté à Votre Profession</h2>
            <p className="text-sm text-slate-600">Choisissez votre univers pour découvrir comment MediLawAI transforme votre quotidien.</p>
            
            <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 mt-2">
              <button
                onClick={() => setActiveTab('MEDICAL')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'MEDICAL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Cabinets Médicaux & Dentaires</span>
              </button>
              <button
                onClick={() => setActiveTab('LEGAL')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'LEGAL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Cabinets d'Avocats & Juristes</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5EAF2] p-8 shadow-sm">
            {activeTab !== 'LEGAL' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Secteur Médical & Santé</span>
                  <h3 className="text-2xl font-bold text-[#14213D]">Protection Vitale & Sérénité pour Votre Cabinet</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Conçu pour les cardiologues, généralistes, dentistes et spécialistes. Détecte immédiatement les mots-clés d'urgence vitale pour diriger les patients vers le SAMU Tunisie (190 / 198) tout en alertant le médecin par SMS.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Prise en compte des tarifs et conventions CNAM (feuille de soins).</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rappels WhatsApp 24h avant la consultation cardiologique ou dentaire.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Aucun avis médical généré sans la signature du médecin.</li>
                  </ul>
                  <button onClick={onOpenOnboarding} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all">
                    Activer le Mode Médical
                  </button>
                </div>
                <div className="bg-[#F7F9FC] p-6 rounded-xl border border-[#E5EAF2] space-y-3 font-mono text-xs text-slate-700">
                  <div className="font-bold text-blue-600 border-b pb-2">Exemple de Flux Réel Médical</div>
                  <div className="p-2.5 bg-white rounded border">
                    <span className="text-slate-400">Patient :</span> "Bonjour Docteur, palpitations depuis ce matin, dispo jeudi 10h ?"
                  </div>
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded">
                    <span className="text-blue-700 font-bold">Réponse IA Prête :</span> "Bonjour, le créneau de jeudi 10h00 est réservable pour votre consultation ECG."
                  </div>
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1.5 font-sans font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Validé en 1 clic par Sarra (Secrétariat)
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Secteur Juridique & Avocats</span>
                  <h3 className="text-2xl font-bold text-[#14213D]">Gestion Déontologique des Consultations & Dossiers</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Spécifiquement paramétré pour les cabinets d'avocats et cabinets de conseil. Catégorise les e-mails par type de contentieux, demande d'actes juridiques, honoraires et préparation d'audiences.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Secret professionnel strict et anonymisation préalable.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Synchronisation du calendrier des audiences et rendez-vous clients.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> RAG indexé sur vos conditions d'honoraires et domaines de spécialité.</li>
                  </ul>
                  <button onClick={onOpenOnboarding} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-all">
                    Activer le Mode Juridique
                  </button>
                </div>
                <div className="bg-[#F7F9FC] p-6 rounded-xl border border-[#E5EAF2] space-y-3 font-mono text-xs text-slate-700">
                  <div className="font-bold text-indigo-600 border-b pb-2">Exemple de Flux Juridique</div>
                  <div className="p-2.5 bg-white rounded border">
                    <span className="text-slate-400">Client :</span> "Maître, nous souhaitons planifier un échange pour les statuts de notre filiale."
                  </div>
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded">
                    <span className="text-indigo-700 font-bold">Réponse IA Prête :</span> "Maître Trabelsi vous reçoit vendredi à 14h30 au cabinet d'affaires."
                  </div>
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1.5 font-sans font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Notification d'agenda synchronisée sur Google Calendar
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 bg-white border-t border-[#E5EAF2]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#14213D]">Tarification Transparente & Sans Engagement</h2>
            <p className="text-sm text-slate-600">Choisissez la formule adaptée à la taille de votre cabinet.</p>

            <div className="inline-flex items-center gap-3 p-1 bg-slate-100 rounded-xl mt-4">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  billingCycle === 'MONTHLY' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  billingCycle === 'ANNUAL' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                }`}
              >
                Annuel (-20% de remise)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                desc: 'Idéal pour praticien individuel ou avocat indépendant.',
                price: billingCycle === 'ANNUAL' ? '89 TND' : '110 TND',
                features: ['1 boîte e-mail connectée (Gmail)', 'Jusqu’à 500 e-mails/mois classés par l’IA', 'Prise de RDV sans collision', 'Rappels WhatsApp 24h basiques', 'Support par e-mail sous 24h'],
                cta: 'Commencer en Starter',
                popular: false
              },
              {
                name: 'Professionnel',
                desc: 'Pour cabinets médicaux et études d’avocats en forte activité.',
                price: billingCycle === 'ANNUAL' ? '189 TND' : '230 TND',
                features: ['Boîtes illimitées + Google Calendar', 'E-mails IA illimités avec RAG certifié', 'Escalade d’Urgence SMS / SAMU 190', '4 workflows n8n inclus & modifiables', 'Multi-utilisateurs (Médecin + Secrétaire)', 'Support prioritaire 7j/7'],
                cta: 'Choisir l’Offre Pro',
                popular: true
              },
              {
                name: 'Clinique & Entreprise',
                desc: 'Pour cliniques polyvalentes et cabinets d’avocats associés.',
                price: 'Sur Devis',
                features: ['Multi-praticiens & Multi-sites', 'Hébergement dédié / On-premise disponible', 'Modèles Deep Learning fine-tunés sur mesure', 'Accès API & webhooks illimités', 'Responsable de compte dédié'],
                cta: 'Contacter notre équipe',
                popular: false
              }
            ].map((plan, idx) => (
              <div 
                key={idx}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  plan.popular 
                    ? 'border-blue-600 bg-white shadow-xl ring-2 ring-blue-500/20 relative' 
                    : 'border-[#E5EAF2] bg-[#F7F9FC]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-wider shadow-sm">
                    Recommandé
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                  
                  <div className="my-6">
                    <span className="text-3xl font-black text-[#14213D]">{plan.price}</span>
                    {plan.price !== 'Sur Devis' && <span className="text-xs text-slate-500 ml-1">/ mois</span>}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={onOpenOnboarding}
                  className={`mt-8 w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#14213D] text-slate-400 text-xs py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <span className="text-lg font-black text-white">MediLaw<span className="text-blue-500">AI</span></span>
            <p className="text-xs leading-relaxed text-slate-400">
              Plateforme d'intelligence artificielle et d'automatisation pour les professions de santé et du droit.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Produit</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white">Tri des e-mails IA</a></li>
              <li><a href="#features" className="hover:text-white">Gestion de calendrier</a></li>
              <li><a href="#automation" className="hover:text-white">Orchestration n8n</a></li>
              <li><a href="#pricing" className="hover:text-white">Grille tarifaire</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Conformité</h4>
            <ul className="space-y-2">
              <li><span>Sécurité DevSecOps & Chiffrement</span></li>
              <li><span>Protection Données Médicales</span></li>
              <li><span>Sauvegardes Automatisées</span></li>
              <li><span>Journal d'Audit Immutable</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Contact & Support</h4>
            <p className="text-xs">Support technique basé en Tunisie disponible 7j/7.</p>
            <div className="mt-3 font-semibold text-white">contact@medilawai.tn</div>
            <div className="text-xs mt-1">+216 71 234 567</div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>© 2026 MediLawAI SaaS. Tous droits réservés.</div>
          <div className="flex items-center gap-4">
            <button onClick={onEnterApp} className="text-blue-400 hover:underline">Accès Espace Démo</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
