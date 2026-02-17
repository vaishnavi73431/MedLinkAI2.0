
import React, { useState, useEffect } from 'react';
import { HealthArticle } from '../types';
import { fetchHealthyRestaurants } from '../services/openaiService';
import { X, MapPin, Utensils, Sparkles, Loader2, Coins, ExternalLink, Navigation } from 'lucide-react';

interface RestaurantBoardProps {
  isOpen: boolean;
  onClose: (rewardEarned: boolean) => void;
  onAddRestaurantXP: (amount: number) => void;
}

const RestaurantBoard: React.FC<RestaurantBoardProps> = ({ isOpen, onClose, onAddRestaurantXP }) => {
  const [restaurants, setRestaurants] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVisitedLink, setHasVisitedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getLocationAndFetch();
      setHasVisitedLink(false); // Reset reward state on open
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
          const data = await fetchHealthyRestaurants(latitude, longitude);
          setRestaurants(data);
        } catch (err) {
          setError("Failed to fetch local restaurants.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Location access denied. Please enable GPS to find local outlets.");
        setLoading(false);
      }
    );
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
    setHasVisitedLink(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-[#2E3B2E] border-4 border-[#3E4D3E] w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col max-h-[85vh]">

        <div className="bg-[#1E2B1E] p-4 flex justify-between items-center border-b-4 border-[#141B14]">
          <div className="flex items-center gap-3">
            <Utensils className="text-emerald-400" size={24} />
            <span className="text-emerald-100 font-black uppercase text-sm tracking-[0.2em]">Healthy Diner</span>
          </div>
          <button onClick={() => onClose(hasVisitedLink)} className="text-emerald-500/50 hover:text-white transition-colors">
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-[#141B14] px-3 py-1 rounded-full border border-emerald-900/50 mb-2">
              <Navigation className="text-emerald-400" size={14} />
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Local Discovery</span>
            </div>
            <h3 className="text-emerald-50 font-black text-xl leading-none">Healthy Outlets Near You</h3>
            <p className="text-emerald-400/60 text-[9px] uppercase font-bold tracking-tighter mt-1">Sourced via Gemini Maps Grounding</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <Loader2 className="text-emerald-500 animate-spin" size={48} />
                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={20} />
              </div>
              <p className="text-emerald-200/40 text-xs font-black uppercase tracking-widest animate-pulse text-center px-4">Scanning your city for healthy bites...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <p className="text-red-400 text-sm font-bold">{error}</p>
              <button
                onClick={getLocationAndFetch}
                className="mt-4 text-emerald-400 underline text-xs font-bold uppercase"
              >
                Retry Search
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-emerald-400/60 text-sm">No healthy outlets found nearby. Sprout suggests checking the main city center!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurants.map((place, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(place.url)}
                  className="w-full bg-[#141B14] border-2 border-[#3E4D3E] p-4 rounded-xl hover:border-emerald-500/50 transition-all group flex gap-4 text-left shadow-lg active:scale-95"
                >
                  <div className="p-3 bg-[#1E2B1E] rounded-lg border border-[#3E4D3E] group-hover:bg-[#2E3B2E] transition-colors shrink-0">
                    <MapPin className="text-emerald-500 group-hover:text-emerald-400" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-emerald-50 font-bold text-sm leading-tight line-clamp-2 group-hover:text-emerald-300 transition-colors">{place.title}</h4>
                    <p className="text-[10px] text-emerald-400/60 uppercase font-black mt-2 flex items-center gap-1.5">
                      {place.source} <ExternalLink size={10} className="opacity-40" />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 bg-[#1E2B1E]/80 border-t-4 border-[#141B14]">
          <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${hasVisitedLink ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-[#0A0F0A] border-[#141B14]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${hasVisitedLink ? 'bg-emerald-500 text-white' : 'bg-emerald-900 text-emerald-600'}`}>
                <Coins size={18} strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${hasVisitedLink ? 'text-emerald-400' : 'text-emerald-900'}`}>
                  {hasVisitedLink ? 'Discovery Bonus Ready' : 'Visit an Outlet to Earn'}
                </span>
                <span className={`text-xs font-black ${hasVisitedLink ? 'text-emerald-100' : 'text-emerald-400/40'}`}>+60 Coins</span>
              </div>
            </div>
          </div>
          {hasVisitedLink && (
            <button
              onClick={() => {
                onClose(true);
                onAddRestaurantXP(30);
              }}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-sm tracking-widest shadow-xl"
            >
              Claim Diner Reward (+30 XP)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantBoard;