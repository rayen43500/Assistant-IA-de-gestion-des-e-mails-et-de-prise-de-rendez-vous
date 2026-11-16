import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ArrowUpRight, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  Zap,
  TrendingUp
} from 'lucide-react';

export const AdminSubscriptionsTab: React.FC = () => {
  const plans = [
    {
      id: 'plan-starter',
      name: 'Starter',
      price: '250 DT',
      cycle: '/ mois',
      description: 'Idéal pour praticien individuel démarrant l’automatisation',
      activeTenants: 1,
      mrr: '250 DT',
      features: [
        'Jusqu’à 600 e-mails traités / mois',
        'Ingestion Gmail & Tri IA 5 catégories',
        'Rappels WhatsApp 24h avant RDV',
        'Support standard sous 48h'
      ]
    },
    {
      id: 'plan-pro',
      name: 'Professionnel',
      price: '500 DT',
      cycle: '/ mois',
      popular: true,
      description: 'Pour cabinets médicaux et cabinets d’avocats en forte croissance',
      activeTenants: 2,
      mrr: '1,000 DT',
      features: [
        'Jusqu’à 2,500 e-mails traités / mois',
        'Copilot RAG Certifié (Tarifs & Procédures)',
        'Synchronisation bidirectionnelle Google Calendar',
        'Escalade Urgences SAMU 190 avec SMS prioritaire',
        'Support prioritaire 7j/7'
      ]
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      price: '1,200 DT',
      cycle: '/ mois',
      description: 'Pour cliniques multidisciplinaires et grands cabinets de groupe',
      activeTenants: 1,
      mrr: '1,200 DT',
      features: [
        'Volume e-mails illimité',
        'Workflows n8n personnalisés dédiés',
        'Praticiens et secrétaires illimités',
        'SLA 99.99% avec gestionnaire de compte dédié',
        'Hébergement souverain & audit de conformité CDC'
      ]
    }
  ];

  const tenantSubscriptions = [
    { cabinet: 'Cabinet Dr. Youssef Ben Salem', plan: 'PROFESSIONNEL', amount: '500 DT/mois', renewalDate: '2026-12-01', status: 'ACTIVE', paymentMethod: 'Prélèvement RIB BNA' },
    { cabinet: 'Cabinet d’Avocats Selim Trabelsi', plan: 'PROFESSIONNEL', amount: '500 DT/mois', renewalDate: '2026-11-28', status: 'ACTIVE', paymentMethod: 'Carte Bancaire CMI' },
    { cabinet: 'Clinique Dentaire Les Berges du Lac', plan: 'ENTERPRISE', amount: '1,200 DT/mois', renewalDate: '2026-12-10', status: 'ACTIVE', paymentMethod: 'Virement Annuel BIAT' },
    { cabinet: 'Étude Notariale Karray & Associés', plan: 'STARTER', amount: '250 DT/mois', renewalDate: '2026-11-30', status: 'ACTIVE', paymentMethod: 'Prélèvement RIB Attijari' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Gestion des Formules & Abonnements</h1>
          <p className="text-xs text-slate-500">
            Grille tarifaire SaaS, quotas mensuels et suivi du Revenu Récurrent Mensuel (MRR)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs">
            MRR Total : 2,450 DT
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => (
          <div 
            key={p.id} 
            className={`p-6 rounded-2xl bg-white border transition-all relative flex flex-col justify-between ${
              p.popular 
                ? 'border-[#2563EB] shadow-md shadow-blue-500/10 ring-1 ring-[#2563EB]' 
                : 'border-[#E8EDF4] shadow-xs'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 right-6 bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Plus Populaire
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-[#14213D]">{p.name}</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {p.activeTenants} cabinet(s)
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#14213D]">{p.price}</span>
                <span className="text-xs text-slate-400">{p.cycle}</span>
              </div>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>

              <div className="pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                {p.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">MRR Généré :</span>
                <span className="font-black text-[#14213D] font-mono">{p.mrr}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Active Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span>Abonnements en cours par Cabinet</span>
          </h2>
          <span className="text-xs text-slate-400">Paiement automatisé</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-3">Cabinet Client</th>
                <th className="p-3">Formule Active</th>
                <th className="p-3">Tarif Récurrent</th>
                <th className="p-3">Mode de Règlement</th>
                <th className="p-3">Prochain Renouvellement</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenantSubscriptions.map((sub, sIdx) => (
                <tr key={sIdx} className="hover:bg-[#F7F9FC]">
                  <td className="p-3 font-bold text-[#14213D]">{sub.cabinet}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                      {sub.plan}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">{sub.amount}</td>
                  <td className="p-3 text-slate-600 font-medium">{sub.paymentMethod}</td>
                  <td className="p-3 font-mono text-slate-500">{sub.renewalDate}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
