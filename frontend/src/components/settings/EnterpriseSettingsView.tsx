import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Bell, 
  Lock, 
  UserCheck, 
  Sparkles,
  Key,
  Globe,
  Save
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const EnterpriseSettingsView: React.FC = () => {
  const { 
    sector, 
    organizationName, 
    setOrganizationName, 
    aiAutonomyLevel, 
    setAiAutonomyLevel,
    confidenceThreshold,
    setConfidenceThreshold,
    showToast 
  } = useAppStore();

  const [emergencyPhone, setEmergencyPhone] = useState('+216 98 111 222');
  const [openingHours, setOpeningHours] = useState('08:30 - 17:30');

  const handleSave = () => {
    showToast({
      title: 'Paramètres mis à jour !',
      message: 'Les réglages d’autonomie IA et de sécurité ont été enregistrés.',
      type: 'success'
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#14213D] tracking-tight">Paramètres du Cabinet & Garde-fous IA</h1>
        <p className="text-xs text-slate-500">Gérez le niveau d’autonomie du modèle, les contacts d’urgence et la sécurité multi-tenant</p>
      </div>

      {/* Autonomy Level Settings */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-sm font-bold text-[#14213D]">Niveau d’Autonomie de l’IA Générative</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Définissez si les e-mails entrants doivent obligatoirement être validés par le secrétariat ou si l'IA peut répondre automatiquement au-delà d'un seuil de certitude.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'HUMAN_IN_THE_LOOP',
              title: 'Human-in-the-Loop',
              desc: 'Validation humaine en 1 clic requise avant tout envoi.',
              badge: 'Conformité 100%'
            },
            {
              id: 'SUGGEST_ONLY',
              title: 'Mode Suggestion',
              desc: 'Brouillons préparés sans jamais proposer d’envoi direct.',
              badge: 'Mode Passif'
            },
            {
              id: 'FULL_AUTONOMOUS',
              title: 'Autonomie Supervisée',
              desc: 'Envoi automatique si confiance > 90% (hors urgences).',
              badge: 'Productivité Maximale'
            }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setAiAutonomyLevel(opt.id as any)}
              className={`p-4 rounded-xl border text-left transition-all ${
                aiAutonomyLevel === opt.id
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{opt.badge}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Confidence Threshold slider */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700">Seuil de Confiance Minimal pour Proposition :</span>
            <span className="text-blue-600 font-mono font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.70"
            max="0.99"
            step="0.01"
            value={confidenceThreshold}
            onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      {/* Structure & Escalade Info */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#14213D]">Informations de la Structure & Escalade SAMU</h2>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nom Officiel du Cabinet</label>
            <input
              type="text"
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Téléphone d’Astreinte Praticien (Urgences)</label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={e => setEmergencyPhone(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
};

