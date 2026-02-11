import React, { useState, useEffect } from 'react';
import { HealthArticle } from '../types';
import { fetchGymsNearMe } from '../services/openaiService';
import { X, MapPin, Dumbbell, Sparkles, Loader2, Coins, ExternalLink, Navigation, Zap } from 'lucide-react';

interface GymBoardProps {
  isOpen: boolean;
  onClose: (rewardEarned: boolean) => void;
}

const GymBoard: React.FC<GymBoardProps> = ({ isOpen, onClose }) => {
  const [gyms, setGyms] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVisitedLink, setHasVisitedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getLocationAndFetch();
    }
  }, [isOpen]);

  const getLocationAndFetch = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await fetchGymsNearMe(latitude, longitude);
          setGyms(data);
        } catch (err) {
          setError("Failed to scout local fitness studios.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Location access denied. Enable GPS to find studios within 30km.");
        setLoading(false);
      }
    );
  };

  const handleLinkClick = (name: string, url: string) => {
    // Construct a Google Maps search URL to ensure the user is redirected to the map as requested
    const mapsUrl = url.includes('google.com/maps')
      ? url
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

    window.open(mapsUrl, '_blank');
    setHasVisitedLink(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-[#1A1A1C] border-4 border-[#3E3E42] w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_50px_rgba(173,20,87,0.4)] flex flex-col max-h-[85vh]">

        <div className="bg-[#880E4F] p-4 flex justify-between items-center border-b-4 border-[#560027]">
          <div className="flex items-center gap-3">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} />
            <span className="text-white font-black uppercase text-sm tracking-widest">Power Pulse Gym</span>
          </div>
          <button onClick={() => onClose(hasVisitedLink)} className="text-white/50 hover:text-white transition-colors">
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin bg-stone-900">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-[#AD1457] px-3 py-1 rounded-full border border-[#D81B60] mb-2 shadow-lg">
              <Navigation className="text-white" size={14} />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">30km Radius Radar</span>
            </div>
            <h3 className="text-stone-100 font-black text-xl leading-none">Scouted Fitness Studios</h3>
            <p className="text-pink-500/60 text-[9px] uppercase font-bold tracking-tighter mt-1 italic text-center">Click a gym to view on Google Maps</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <Loader2 className="text-pink-600 animate-spin" size={48} />
                <Dumbbell className="absolute -top-2 -right-2 text-yellow-400 animate-bounce" size={20} />
              </div>
              <p className="text-stone-400 text-xs font-black uppercase tracking-widest animate-pulse text-center px-4">Calibrating workout zones...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4 bg-[#2C2C2E] rounded-lg border-2 border-red-900/50">
              <p className="text-red-400 text-sm font-bold">{error}</p>
              <button
                onClick={getLocationAndFetch}
                className="mt-4 bg-red-900/20 text-red-400 border border-red-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase active:scale-95 transition-transform"
              >
                Retry Radar Sweep
              </button>
            </div>
          ) : gyms.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-stone-500 text-sm">No gym signals detected within range. Sprout suggests checking closer to the city heart!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gyms.map((place, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(place.title, place.url)}
                  className="w-full bg-[#2C2C2E] border-2 border-[#3E3E42] p-4 rounded-xl hover:border-pink-500/50 transition-all group flex gap-4 text-left shadow-lg active:scale-95 relative overflow-hidden"
                >
                  <div className="p-3 bg-[#1A1A1C] rounded-lg border border-[#3E3E42] group-hover:bg-[#880E4F] transition-colors shrink-0">
                    <Dumbbell className="text-pink-500 group-hover:text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-stone-100 font-bold text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">{place.title}</h4>
                      <ExternalLink size={12} className="text-stone-500 shrink-0 ml-2" />
                    </div>
                    <p className="text-[10px] text-stone-500 uppercase font-black mt-2 flex items-center gap-1.5">
                      {place.source} • Open in Maps
                    </p>
                  </div>
                  {place.title.includes("TUF") && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black px-2 py-0.5 rounded-bl text-[8px] font-black uppercase tracking-tighter shadow-sm">Sprout's Choice</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 bg-[#1A1A1C] border-t-4 border-[#3E3E42]">
          <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${hasVisitedLink ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-stone-900 border-stone-800'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${hasVisitedLink ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-stone-600'}`}>
                <Coins size={18} strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${hasVisitedLink ? 'text-emerald-400' : 'text-stone-700'}`}>
                  {hasVisitedLink ? 'Fitness Reward Ready' : 'Visit a Studio to Earn'}
                </span>
                <span className={`text-xs font-black ${hasVisitedLink ? 'text-emerald-100' : 'text-stone-500'}`}>+50 Coins</span>
              </div>
            </div>
          </div>
          {hasVisitedLink && (
            <button
              onClick={() => onClose(true)}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-sm tracking-widest shadow-xl"
            >
              Claim Fitness Reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GymBoard;