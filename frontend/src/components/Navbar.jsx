import React from 'react';
import { Bot, Bell, ShieldCheck, Stethoscope, Scale, Sparkles } from 'lucide-react';

export default function Navbar({ currentClinic, onSwitchClinic, activeRole, onSwitchRole }) {
  const isMedical = currentClinic?.type === 'MEDICAL';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Cabinet<span className="text-blue-400">AI</span> Assistant
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SaaS Tunisie 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            {isMedical ? 'Spécialité Médicale & Cardiologie' : 'Cabinet d\'Avocats & Conseil Juridique'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Sélecteur de Cabinet Multi-tenant */}
        <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700/60">
          <button
            onClick={() => onSwitchClinic('MEDICAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isMedical 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cabinet Médical</span>
          </button>
          <button
            onClick={() => onSwitchClinic('JURIDIQUE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              !isMedical 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cabinet Juridique</span>
          </button>
        </div>

        {/* Sélecteur de rôle RBAC */}
        <div className="text-xs flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/40">
          <span className="text-slate-400">Rôle :</span>
          <select 
            value={activeRole} 
            onChange={(e) => onSwitchRole(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="PRATICIEN" className="bg-slate-900">Praticien / Titulaire</option>
            <option value="SECRETAIRE" className="bg-slate-900">Secrétaire</option>
            <option value="ADMIN" className="bg-slate-900">Administrateur</option>
          </select>
        </div>

        {/* Badge IA active */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>IA Opérationnelle (v2026.1)</span>
        </div>
      </div>
    </header>
  );
}
