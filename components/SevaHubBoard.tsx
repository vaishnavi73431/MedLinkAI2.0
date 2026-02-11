import React from 'react';
import { X, ExternalLink, Heart, Trees, Trash2, Coins, Globe } from 'lucide-react';

interface SevaHubBoardProps {
  isOpen: boolean;
  onClose: (rewardEarned: boolean) => void;
}

const ORGANIZATIONS = [
  {
    category: "Clean & Protect",
    icon: <Trash2 className="text-cyan-400" size={18} />,
    items: [
      { name: "Swachh Bharat Mission", url: "https://swachhbharatmission.gov.in/", desc: "National campaign for a cleaner India." },
      { name: "Environment Defense Fund", url: "https://www.edf.org/", desc: "Global cleanup and pollution initiatives." },
      { name: "Clean Air Asia", url: "https://cleanairasia.org/", desc: "Improving air quality in Asian cities." }
    ]
  },
  {
    category: "Grow the Future",
    icon: <Trees className="text-emerald-400" size={18} />,
    items: [
      { name: "SankalpTaru", url: "https://sankalptaru.org/", desc: "Plant trees and track their growth online." },
      { name: "SayTrees", url: "https://www.saytrees.org/", desc: "Reforestation and urban gardening groups." },
      { name: "Cauvery Calling", url: "https://www.ishaoutreach.org/en/cauvery-calling", desc: "Large scale river basin restoration." }
    ]
  },
  {
    category: "Support & Donate",
    icon: <Heart className="text-red-400" size={18} />,
    items: [
      { name: "GiveIndia", url: "https://www.giveindia.org/", desc: "India's largest trusted giving platform." },
      { name: "Akshaya Patra", url: "https://www.akshayapatra.org/", desc: "Providing meals to school children." },
      { name: "Helpage India", url: "https://www.helpageindia.org/", desc: "Supporting the elderly and disaster relief." }
    ]
  }
];

const SevaHubBoard: React.FC<SevaHubBoardProps> = ({ isOpen, onClose }) => {
  const [hasVisited, setHasVisited] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-stone-800 border-4 border-amber-600 w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]">
        
        <div className="bg-stone-900 p-3 flex justify-between items-center border-b-4 border-amber-700">
          <div className="flex items-center gap-2">
            <Globe className="text-amber-400 animate-pulse" size={20} />
            <span className="text-stone-200 font-bold uppercase text-sm tracking-widest">Seva Hub</span>
          </div>
          <button onClick={() => onClose(false)} className="text-stone-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 scrollbar-thin">
          <p className="text-stone-400 text-[10px] uppercase font-black tracking-[0.2em] mb-4 text-center">Community Care Radar</p>
          
          <div className="space-y-6">
            {ORGANIZATIONS.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-stone-700 pb-1">
                  {cat.icon}
                  <h3 className="text-stone-200 font-black uppercase text-xs tracking-wider">{cat.category}</h3>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { window.open(item.url, '_blank'); setHasVisited(true); }}
                      className="w-full bg-stone-900 border-2 border-stone-700 p-3 rounded-lg hover:border-amber-500/50 transition-all group flex gap-3 text-left shadow-md active:scale-95"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-stone-100 text-xs font-bold leading-snug group-hover:text-amber-400 transition-colors">{item.name}</h4>
                          <ExternalLink size={10} className="text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-stone-900/50 border-t-2 border-stone-700">
           <div className={`flex items-center justify-between p-2 rounded-lg border-2 ${hasVisited ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-stone-950 border-stone-800'}`}>
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={16} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${hasVisited ? 'text-emerald-400' : 'text-stone-500'}`}>
                   {hasVisited ? 'Service Reward Ready' : 'Visit an NGO to Earn'}
                </span>
              </div>
              <span className={`text-xs font-black ${hasVisited ? 'text-emerald-400' : 'text-stone-500'}`}>+100 COINS</span>
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

export default SevaHubBoard;