import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight,
  CreditCard,
  Building2,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';

export const AdminPaymentsTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');

  const transactions = [
    { id: 'INV-2026-089', cabinet: 'Clinique Dentaire Les Berges du Lac', date: '2026-11-10', amount: '1,200.000 DT', gateway: 'Virement BIAT', status: 'PAID', plan: 'Enterprise' },
    { id: 'INV-2026-088', cabinet: 'Cabinet Dr. Youssef Ben Salem', date: '2026-11-01', amount: '500.000 DT', gateway: 'Konnect Gateway', status: 'PAID', plan: 'Professionnel' },
    { id: 'INV-2026-087', cabinet: 'Cabinet d’Avocats Selim Trabelsi', date: '2026-10-28', amount: '500.000 DT', gateway: 'Carte Bancaire CMI', status: 'PAID', plan: 'Professionnel' },
    { id: 'INV-2026-086', cabinet: 'Étude Notariale Karray & Associés', date: '2026-10-25', amount: '250.000 DT', gateway: 'Flouci QR Code', status: 'PAID', plan: 'Starter' },
    { id: 'INV-2026-085', cabinet: 'Cabinet Médical Dr. Youssef Ben Salem', date: '2026-10-01', amount: '500.000 DT', gateway: 'Konnect Gateway', status: 'PAID', plan: 'Professionnel' }
  ];

  const handleDownloadInvoice = (invoiceId: string) => {
    showToast({
      title: 'Facture Téléchargée !',
      message: `La quittance officielle ${invoiceId}.pdf a été générée avec cachet fiscal.`,
      type: 'success'
    });
  };

  const filtered = transactions.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || t.cabinet.toLowerCase().includes(q) || t.gateway.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Historique des Règlements & Facturation</h1>
          <p className="text-xs text-slate-500">
            Grand livre des transactions SaaS, passerelles bancaires tunisiennes et exports comptables certifiés
          </p>
        </div>

        <button 
          onClick={() => handleDownloadInvoice('EXPORT-GLOBAL-2026')}
          className="px-4 py-2 border border-[#E8EDF4] bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-colors w-fit"
        >
          <Download className="w-4 h-4 text-[#2563EB]" />
          <span>Exporter Grand Livre (CSV / PDF)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Encaissé ce Mois</span>
          <div className="text-2xl font-black text-emerald-600 mt-2">2,450.000 DT</div>
          <span className="text-[10px] text-slate-400 mt-1 block">100% des abonnements à jour</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Factures Émises en T4</span>
          <div className="text-2xl font-black text-[#14213D] mt-2">14 factures</div>
          <span className="text-[10px] text-emerald-600 mt-1 block">Taux de recouvrement : 100%</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Paiements Échoués</span>
          <div className="text-2xl font-black text-slate-400 mt-2">0</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Aucun incident de paiement</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher facture, cabinet, passerelle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st 
                  ? 'bg-[#2563EB] text-white shadow-2xs' 
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'Tous' : st === 'PAID' ? 'Réglé' : st === 'PENDING' ? 'En cours' : 'Échoué'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#F7F9FC] border-b border-[#E8EDF4] text-slate-500 font-semibold">
              <tr>
                <th className="p-4">N° Quittance</th>
                <th className="p-4">Cabinet Client</th>
                <th className="p-4">Date de Règlement</th>
                <th className="p-4">Passerelle de Paiement</th>
                <th className="p-4">Montant TTC</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">{t.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-[#14213D]">{t.cabinet}</div>
                    <div className="text-[10px] text-slate-400">Offre {t.plan}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{t.date}</td>
                  <td className="p-4 text-slate-700 font-medium">{t.gateway}</td>
                  <td className="p-4 font-mono font-black text-slate-900">{t.amount}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(t.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#2563EB] transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
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
