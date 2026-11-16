import React, { useState } from 'react';
import { 
  Search, 
  Stethoscope, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Filter, 
  ArrowRight,
  Phone,
  X
} from 'lucide-react';

interface PatientFindDoctorTabProps {
  onSelectDoctorForBooking: (doctor: any) => void;
}

export const PatientFindDoctorTab: React.FC<PatientFindDoctorTabProps> = ({
  onSelectDoctorForBooking
}) => {
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL');
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<any>(null);

  const doctors = [
    {
      id: 'doc-1',
      name: 'Dr. Youssef Ben Salem',
      specialty: 'Cardiologie & Rythmologie',
      clinic: 'Cabinet Médical Dr. Ben Salem',
      address: 'Avenue Habib Bourguiba, Tunis',
      phone: '+216 71 234 567',
      price: 70,
      cnam: true,
      nextSlot: 'Demain à 10:00',
      hours: 'Lun - Ven : 08h30 - 17h30 | Sam : 08h30 - 13h00',
      bio: 'Ancien interne des hôpitaux universitaires de Tunis, spécialisé dans les explorations électrocardiographiques et la prise en charge de l’hypertension artérielle.'
    },
    {
      id: 'doc-2',
      name: 'Dr. Amira Khemir',
      specialty: 'Cardiologie Pédiatrique',
      clinic: 'Cabinet Médical Dr. Ben Salem',
      address: 'Avenue Habib Bourguiba, Tunis',
      phone: '+216 71 234 568',
      price: 70,
      cnam: true,
      nextSlot: 'Jeudi à 14:30',
      hours: 'Mar, Jeu, Ven : 09h00 - 16h00',
      bio: 'Spécialiste du suivi cardiaque des enfants et nourrissons, dépistage des malformations congénitales et échographie doppler cardiaque.'
    },
    {
      id: 'doc-3',
      name: 'Dr. Mehdi Chaouch',
      specialty: 'Chirurgie Dentaire & Implantologie',
      clinic: 'Clinique Dentaire Les Berges du Lac',
      address: 'Les Berges du Lac 2, Tunis',
      phone: '+216 70 111 222',
      price: 60,
      cnam: true,
      nextSlot: 'Vendredi à 11:00',
      hours: 'Lun - Sam : 09h00 - 18h00',
      bio: 'Chirurgien dentiste diplômé de la Faculté de Médecine Dentaire de Monastir, soins conservateurs et réhabilitation esthétique du sourire.'
    }
  ];

  const filtered = doctors.filter(doc => {
    if (specialtyFilter !== 'ALL' && !doc.specialty.toLowerCase().includes(specialtyFilter.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      return doc.name.toLowerCase().includes(q) || doc.specialty.toLowerCase().includes(q) || doc.clinic.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#14213D] tracking-tight">Trouver un Médecin Spécialiste</h1>
          <p className="text-xs text-slate-500">
            Prenez rendez-vous en ligne 24h/24 auprès de praticiens conventionnés CNAM
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8EDF4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, spécialité, ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#E8EDF4] rounded-xl text-xs text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'ALL', label: 'Toutes les spécialités' },
            { id: 'Cardio', label: 'Cardiologie' },
            { id: 'Dentaire', label: 'Dentaire' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSpecialtyFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                specialtyFilter === f.id
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-[#F7F9FC] border border-[#E8EDF4] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Cards List */}
      <div className="space-y-4">
        {filtered.map(doc => (
          <div
            key={doc.id}
            className="p-5 bg-white rounded-3xl border border-[#E8EDF4] shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xl shrink-0">
                {doc.name.split(' ')[1]?.charAt(0) || 'D'}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#14213D]">{doc.name}</h3>
                  {doc.cnam && (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Conventionné CNAM
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#2563EB] font-bold">{doc.specialty}</div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{doc.clinic} • {doc.address}</span>
                </div>

                <div className="text-[11px] text-slate-400 font-medium pt-1">
                  Tarif indicatif : <strong>{doc.price} DT</strong> • Prochain créneau : <strong className="text-emerald-600">{doc.nextSlot}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:self-center self-end shrink-0">
              <button
                onClick={() => setSelectedDoctorProfile(doc)}
                className="px-3.5 py-2.5 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E8EDF4] text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Voir Profil
              </button>
              <button
                onClick={() => onSelectDoctorForBooking(doc)}
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Prendre RDV</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor Profile Modal */}
      {selectedDoctorProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8EDF4] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
              <h3 className="font-black text-sm text-[#14213D]">Profil du Praticien</h3>
              <button onClick={() => setSelectedDoctorProfile(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-2xl shrink-0">
                {selectedDoctorProfile.name.split(' ')[1]?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-base text-[#14213D]">{selectedDoctorProfile.name}</h4>
                <div className="text-xs text-[#2563EB] font-bold">{selectedDoctorProfile.specialty}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedDoctorProfile.clinic}</div>
              </div>
            </div>

            <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF4] space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900">Présentation & Parcours :</div>
              <p className="leading-relaxed text-slate-600">{selectedDoctorProfile.bio}</p>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <strong>Horaires :</strong> {selectedDoctorProfile.hours}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-bold text-slate-900">
                Tarif : <span className="text-[#2563EB]">{selectedDoctorProfile.price} DT</span>
              </div>
              <button
                onClick={() => {
                  const doc = selectedDoctorProfile;
                  setSelectedDoctorProfile(null);
                  onSelectDoctorForBooking(doc);
                }}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Réserver un Créneau</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
