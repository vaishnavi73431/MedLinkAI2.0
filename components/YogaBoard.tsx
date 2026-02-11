
import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, Coins, Flower2 } from 'lucide-react';

interface YogaBoardProps {
  isOpen: boolean;
  onClose: (rewardEarned: boolean) => void;
}

const YOGA_TRAINERS = [
  { name: "Superprof Yoga", url: "https://www.superprof.co.in/lessons/yoga/online/", desc: "Find personal yoga tutors for online sessions." },
  { name: "UrbanPro Yoga", url: "https://www.urbanpro.com/online-yoga-classes", desc: "India's largest marketplace for yoga trainers." },
  { name: "Wellintra", url: "https://www.wellintra.com/trainers/", desc: "Connect with elite personal yoga trainers in India." },
  { name: "Arogya Yogshala", url: "https://www.arogyayogshala.com/", desc: "Traditional yoga and teacher training programs." },
  { name: "Sri Sri School of Yoga", url: "https://srisrischoolofyoga.org/in/", desc: "Holistic yoga education and programs by Art of Living." }
];

const YogaBoard: React.FC<YogaBoardProps> = ({ isOpen, onClose }) => {
  const [hasVisited, setHasVisited] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#E0F2F1] border-4 border-[#00796B] w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]">
        
        <div className="bg-[#00796B] p-3 flex justify-between items-center border-b-4 border-[#004D40]">
          <div className="flex items-center gap-2 text-white">
            <Flower2 className="animate-pulse" size={20} />
            <span className="font-bold uppercase text-sm tracking-widest">Zen Yoga Studio</span>
          </div>
          <button onClick={() => onClose(false)} className="text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 scrollbar-thin">
          <p className="text-[#004D40] text-[10px] uppercase font-black tracking-[0.2em] mb-4 text-center">Global Practice Directory</p>
          
          <div className="space-y-3">
            {YOGA_TRAINERS.map((trainer, i) => (
              <button
                key={i}
                onClick={() => { window.open(trainer.url, '_blank'); setHasVisited(true); }}
                className="w-full bg-white border-2 border-[#B2DFDB] p-3 rounded-lg hover:border-[#00796B] transition-all group flex gap-3 text-left shadow-sm active:scale-95"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[#004D40] text-xs font-bold leading-snug group-hover:text-[#00796B] transition-colors">{trainer.name}</h4>
                    <ExternalLink size={10} className="text-[#00796B] opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">{trainer.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#B2DFDB]/30 border-t-2 border-[#00796B]/20">
           <div className={`flex items-center justify-between p-2 rounded-lg border-2 ${hasVisited ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-white border-stone-200'}`}>
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={16} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${hasVisited ? 'text-emerald-700' : 'text-stone-400'}`}>
                   {hasVisited ? 'Zen Reward Ready' : 'Visit a Trainer to Earn'}
                </span>
              </div>
              <span className={`text-xs font-black ${hasVisited ? 'text-emerald-700' : 'text-stone-400'}`}>+50 COINS</span>
           </div>
           {hasVisited && (
             <button 
                onClick={() => onClose(true)}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs"
             >
                Claim & Return
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default YogaBoard;
