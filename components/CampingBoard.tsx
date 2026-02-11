
import React, { useState, useEffect } from 'react';
import { HealthArticle } from '../types';
import { fetchLatestCampingContent } from '../services/openaiService';
import { X, MapPin, Compass, Tent, Sparkles, Loader2, Coins, ExternalLink } from 'lucide-react';

interface CampingBoardProps {
  isOpen: boolean;
  onClose: (rewardEarned: boolean) => void;
}

const CampingBoard: React.FC<CampingBoardProps> = ({ isOpen, onClose }) => {
  const [links, setLinks] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasVisitedLink, setHasVisitedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen]);

  const loadContent = async () => {
    setLoading(true);
    const cached = localStorage.getItem('camping_travel_content');
    const lastUpdate = localStorage.getItem('camping_last_update');
    const now = Date.now();

    // 24 hour check
    if (cached && lastUpdate && now - parseInt(lastUpdate) < 86400000) {
      setLinks(JSON.parse(cached));
      setLoading(false);
    } else {
      const freshContent = await fetchLatestCampingContent();
      setLinks(freshContent);
      localStorage.setItem('camping_travel_content', JSON.stringify(freshContent));
      localStorage.setItem('camping_last_update', now.toString());
      setLoading(false);
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
    setHasVisitedLink(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-[#4A3B2A] border-4 border-[#5D4037] w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col max-h-[85vh]">

        <div className="bg-[#3E2723] p-4 flex justify-between items-center border-b-4 border-[#2D1B15]">
          <div className="flex items-center gap-3">
            <Compass className="text-emerald-400 animate-spin-slow" size={24} />
            <span className="text-orange-200 font-black uppercase text-sm tracking-[0.2em]">India Scout</span>
          </div>
          <button onClick={() => onClose(hasVisitedLink)} className="text-orange-300/50 hover:text-white transition-colors">
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-[#2D1B15] px-3 py-1 rounded-full border border-orange-900/50 mb-2">
              <Tent className="text-orange-400" size={14} />
              <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Camping India</span>
            </div>
            <h3 className="text-orange-100 font-black text-xl leading-none">Tour Recommendations</h3>
            <p className="text-orange-400/60 text-[9px] uppercase font-bold tracking-tighter mt-1">Verified Destinations • Refreshed Daily</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <Loader2 className="text-emerald-500 animate-spin" size={48} />
                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={20} />
              </div>
              <p className="text-orange-200/40 text-xs font-black uppercase tracking-widest animate-pulse text-center px-4">Scouting Indian Himalayas & Ghats...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(link.url)}
                  className="w-full bg-[#2D1B15] border-2 border-[#5D4037] p-4 rounded-xl hover:border-emerald-500/50 transition-all group flex gap-4 text-left shadow-lg active:scale-95"
                >
                  <div className="p-3 bg-[#3E2723] rounded-lg border border-[#5D4037] group-hover:bg-[#4A3B2A] transition-colors shrink-0">
                    <MapPin className="text-orange-500 group-hover:text-emerald-400" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-orange-50 font-bold text-sm leading-tight line-clamp-2 group-hover:text-emerald-300 transition-colors">{link.title}</h4>
                    <p className="text-[10px] text-orange-400/60 uppercase font-black mt-2 flex items-center gap-1.5">
                      {link.source} <ExternalLink size={10} className="opacity-40" />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 bg-[#3E2723]/80 border-t-4 border-[#2D1B15]">
          <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${hasVisitedLink ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-[#1D120F] border-[#2D1B15]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${hasVisitedLink ? 'bg-emerald-500 text-white' : 'bg-orange-950 text-orange-600'}`}>
                <Coins size={18} strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${hasVisitedLink ? 'text-emerald-400' : 'text-orange-900'}`}>
                  {hasVisitedLink ? 'Scout Reward Ready' : 'Explore Link to Earn'}
                </span>
                <span className={`text-xs font-black ${hasVisitedLink ? 'text-emerald-100' : 'text-orange-400/40'}`}>+40 Coins</span>
              </div>
            </div>
          </div>
          {hasVisitedLink && (
            <button
              onClick={() => onClose(true)}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-sm tracking-widest shadow-xl"
            >
              Claim Travel Reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampingBoard;
