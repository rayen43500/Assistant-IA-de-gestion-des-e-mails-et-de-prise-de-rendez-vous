import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  Clock, 
  DollarSign, 
  Save, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function SettingsView({ clinic, onUpdateSettings }) {
  const [autonomyLevel, setAutonomyLevel] = useState(clinic?.aiSettings?.autonomyLevel || 'HUMAN_IN_THE_LOOP');
  const [threshold, setThreshold] = useState(clinic?.aiSettings?.confidenceThreshold || 0.88);
  const [phone, setPhone] = useState(clinic?.phone || '+216 71 234 567');
  const [emergencyPhone, setEmergencyPhone] = useState(clinic?.aiSettings?.emergencyEscalationPhone || '+216 98 111 222');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings({
      phone,
      aiSettings: {
        autonomyLevel,
        confidenceThreshold: parseFloat(threshold),
        emergencyEscalationPhone: emergencyPhone,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>Paramètres du Cabinet & Niveaux d'Autonomie IA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurez les seuils de confiance et les garde-fous de sécurité du système.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Paramètres enregistrés avec succès</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Niveaux d'Autonomie IA */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Niveau d'Autonomie de l'Assistant IA</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Conformément aux exigences de déontologie médicale et juridique, le mode par défaut impose une validation humaine (Human-in-the-Loop) avant tout envoi définitif.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              {
                id: 'HUMAN_IN_THE_LOOP',
                title: 'Human-in-the-Loop (Recommandé)',
                badge: 'Sécurité Maximale',
                desc: 'L\'IA classe et prépare tous les brouillons. Aucune réponse n\'est envoyée sans validation préalable en un clic de la secrétaire ou du praticien.',
              },
              {
                id: 'SEMI_AUTONOMOUS',
                title: 'Semi-Autonome',
                badge: 'Équilibré',
                desc: 'Réponse automatique pour les questions de routine (horaires, tarifs certifiés). Brouillons soumis à validation pour rendez-vous et cas complexes.',
              },
              {
                id: 'FULL_AUTONOMOUS',
                title: 'Autonome avec Seuil',
                badge: 'Avancé',
                desc: 'Envoi automatique uniquement si le score de confiance NLP dépasse le seuil configuré. Escalade systématique des cas critiques ou urgences.',
              },
            ].map((option) => (
              <label
                key={option.id}
                onClick={() => setAutonomyLevel(option.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  autonomyLevel === option.id
                    ? 'bg-blue-600/15 border-blue-500/60 shadow-md shadow-blue-500/10'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{option.title}</span>
                    <input
                      type="radio"
                      name="autonomy"
                      value={option.id}
                      checked={autonomyLevel === option.id}
                      onChange={() => setAutonomyLevel(option.id)}
                      className="text-blue-500 focus:ring-0"
                    />
                  </div>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {option.badge}
                  </span>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Curseur Seuil de Confiance */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Seuil de confiance minimal requis pour action :</span>
              <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                {Math.round(threshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.70"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Coordonnées & Escalade d'Urgence */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Protocole d'Escalade et Contacts d'Urgence</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Téléphone standard du cabinet</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ligne rouge d'escalade d'urgence (Médecin / Avocat)</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
