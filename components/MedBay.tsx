
import React, { useState } from 'react';
import { Activity, ExternalLink, ShieldCheck, HeartPulse, Stethoscope, ChevronLeft, Coins } from 'lucide-react';

interface TelemedicineService {
  id: string;
  name: string;
  description: string;
  url: string;
  accentColor: string;
}

const TELEMED_SERVICES: TelemedicineService[] = [
  { 
    id: 'esanjeevani', 
    name: 'eSanjeevani', 
    description: 'National Teleconsultation Service of India (MOHFW). Free OPD consultations.', 
    url: 'https://esanjeevani.mohfw.gov.in/#/', 
    accentColor: '#10b981' 
  },
  { 
    id: 'teladoc', 
    name: 'Teladoc Health', 
    description: 'Global leader in whole-person virtual care. Consult with certified experts.', 
    url: 'https://www.teladochealth.com/', 
    accentColor: '#3b82f6' 
  },
  { 
    id: 'apollo', 
    name: 'Apollo 24/7', 
    description: 'India largest healthcare platform. Book online consultations with Apollo specialists.', 
    url: 'https://www.apollo247.com/', 
    accentColor: '#ef4444' 
  },
];

interface MedBayProps {
  onReturn: (rewardEarned: boolean) => void;
}

const MedBay: React.FC<MedBayProps> = ({ onReturn }) => {
  const [hasVisited, setHasVisited] = useState(false);

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
    setHasVisited(true);
  };

  return (
    <div className="bg-stone-800 border-4 border-stone-700 rounded-lg p-4 h-full flex flex-col pixel-corners shadow-lg overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b-2 border-stone-600 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-red-500 p-1 rounded pixel-corners">
            <Activity className="text-white" size={20} />
          </div>
          <h2 className="text-2xl text-red-400 uppercase tracking-widest font-bold">Med Bay</h2>
        </div>
        <button 
          onClick={() => onReturn(false)}
          className="text-stone-500 hover:text-stone-300 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        
        {/* Banner */}
        <div className="bg-indigo-900/30 border-2 border-indigo-500/30 p-4 rounded-xl flex items-center gap-4 mb-2">
          <div className="bg-indigo-500/20 p-3 rounded-full">
            <ShieldCheck className="text-indigo-400" size={32} />
          </div>
          <div>
            <h3 className="text-indigo-200 font-bold uppercase text-sm">Verified Gateways</h3>
            <p className="text-indigo-400/70 text-[10px] leading-tight mt-0.5">Explore Indian telemedicine portals to manage your health digitally.</p>
          </div>
        </div>

        <h3 className="text-stone-400 text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            Connected Services
        </h3>

        {/* Telemedicine List */}
        <div className="space-y-4">
          {TELEMED_SERVICES.map((service) => (
            <div key={service.id} className="bg-stone-900 border-2 border-stone-600 p-4 rounded-xl flex flex-col gap-3 hover:border-stone-400 transition-colors group relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div 
                        className="p-2.5 rounded-lg border-2 border-stone-700 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${service.accentColor}22`, color: service.accentColor }}
                      >
                         {service.id === 'esanjeevani' ? <Stethoscope size={20} /> : <HeartPulse size={20} />}
                      </div>
                      <div>
                          <h4 className="text-lg font-bold text-stone-100 leading-none">{service.name}</h4>
                          <span className="text-[9px] uppercase font-black text-stone-500 tracking-tighter">Verified Portal</span>
                      </div>
                  </div>
              </div>
              
              <p className="text-stone-400 text-xs leading-snug">
                {service.description}
              </p>

              <button 
                  onClick={() => handleLinkClick(service.url)}
                  className="w-full mt-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-[10px] uppercase py-2.5 rounded border-b-2 border-stone-950 flex items-center justify-center gap-2 transition-all active:border-b-0 active:translate-y-0.5"
              >
                  Visit Website <ExternalLink size={12} className="opacity-50" />
              </button>

              {/* Background Accent Deco */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] pointer-events-none -mr-4 -mt-4">
                 <HeartPulse size={64} style={{ color: service.accentColor }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Reward Action */}
      <div className="mt-4 pt-4 border-t-2 border-stone-700">
          <div className={`p-3 rounded-xl border-2 mb-4 flex items-center justify-between transition-all duration-500 ${hasVisited ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-stone-900 border-stone-800'}`}>
              <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${hasVisited ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-stone-600'}`}>
                      <Coins size={18} strokeWidth={3} />
                  </div>
                  <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${hasVisited ? 'text-emerald-400' : 'text-stone-600'}`}>
                          {hasVisited ? 'Bonus Ready!' : 'Explore to Earn'}
                      </span>
                      <span className={`text-xs font-black ${hasVisited ? 'text-emerald-100' : 'text-stone-400/30'}`}>+50 Coins</span>
                  </div>
              </div>
              {hasVisited && <div className="text-emerald-500 animate-bounce"><ShieldCheck size={20} /></div>}
          </div>

          <button 
              onClick={() => onReturn(hasVisited)}
              className={`w-full font-black py-3 rounded-xl border-b-4 transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-2 ${
                  hasVisited 
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800 text-white shadow-lg active:border-b-0 active:translate-y-1' 
                  : 'bg-stone-700 hover:bg-stone-600 border-stone-900 text-stone-300 active:border-b-0 active:translate-y-1'
              }`}
          >
              {hasVisited ? (
                <><Coins size={18} /> Claim & Return</>
              ) : (
                'Return to Garden'
              )}
          </button>
      </div>
    </div>
  );
};

export default MedBay;
