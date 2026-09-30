import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Calendar, 
  BookOpen, 
  Sliders, 
  Activity, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, pendingCount, emergencyCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { 
      id: 'inbox', 
      label: 'Boîte de Réception IA', 
      icon: Inbox, 
      badge: pendingCount > 0 ? pendingCount : null,
      urgentBadge: emergencyCount > 0 ? emergencyCount : null 
    },
    { id: 'calendar', label: 'Rendez-vous & Agenda', icon: Calendar },
    { id: 'knowledge', label: 'Base de Connaissances RAG', icon: BookOpen },
    { id: 'settings', label: 'Autonomie IA & Paramètres', icon: Sliders },
    { id: 'devops', label: 'Supervision & DevSecOps', icon: Activity },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation Principale
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.urgentBadge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {item.urgentBadge}
                  </span>
                )}
                {item.badge && !item.urgentBadge && (
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Carte d'information bas de menu */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/50 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Mode Human-in-the-Loop</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Toute réponse aux e-mails sensibles est validée par un humain avant envoi réel.
        </p>
      </div>
    </aside>
  );
}
