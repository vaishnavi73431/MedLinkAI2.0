
import React, { useState, useEffect } from 'react';
import { HealthArticle } from '../types';
import { fetchLatestHealthContent } from '../services/openaiService';
import { X, ExternalLink, Youtube, Newspaper, Sparkles, Loader2, Coins } from 'lucide-react';

interface TrainBoardProps {
  isOpen: boolean;
  onClose: (rewardEarned: boolean) => void;
}

const TrainBoard: React.FC<TrainBoardProps> = ({ isOpen, onClose }) => {
  const [articles, setArticles] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasVisitedLink, setHasVisitedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen]);

  const loadContent = async () => {
    setLoading(true);
    const cached = localStorage.getItem('train_health_content');
    const lastUpdate = localStorage.getItem('train_last_update');
    const now = Date.now();

    if (cached && lastUpdate && now - parseInt(lastUpdate) < 86400000) {
      setArticles(JSON.parse(cached));
      setLoading(false);
    } else {
      const freshContent = await fetchLatestHealthContent();
      setArticles(freshContent);
      localStorage.setItem('train_health_content', JSON.stringify(freshContent));
      localStorage.setItem('train_last_update', now.toString());
      setLoading(false);
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
    setHasVisitedLink(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-stone-800 border-4 border-stone-600 w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh]">

        <div className="bg-stone-900 p-3 flex justify-between items-center border-b-4 border-stone-700">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400 animate-pulse" size={20} />
            <span className="text-stone-200 font-bold uppercase text-sm tracking-widest">Knowledge Cargo</span>
          </div>
          <button onClick={() => onClose(hasVisitedLink)} className="text-stone-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 scrollbar-thin">
          <div className="mb-4 text-center">
            <h3 className="text-yellow-400 font-bold text-lg leading-tight">Daily Wellness Brief</h3>
            <p className="text-stone-500 text-[10px] uppercase font-bold tracking-tighter mt-1">Verified sources • Refreshed every 24h</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="text-yellow-500 animate-spin" size={40} />
              <p className="text-stone-500 text-xs font-bold animate-pulse">Sourcing from medical journals...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(article.url)}
                  className="w-full bg-stone-900 border-2 border-stone-700 p-3 rounded-lg hover:border-yellow-500/50 transition-all group flex gap-3 text-left"
                >
                  <div className="p-2 bg-stone-800 rounded border border-stone-700 group-hover:bg-stone-700 transition-colors">
                    {article.type === 'video' ? <Youtube className="text-red-500" size={18} /> : <Newspaper className="text-blue-400" size={18} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-stone-200 text-xs font-bold leading-snug group-hover:text-yellow-400 transition-colors">{article.title}</h4>
                    <p className="text-[9px] text-stone-500 uppercase font-black mt-1 flex items-center gap-1">
                      {article.source} <ExternalLink size={8} />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-stone-900/50 border-t-2 border-stone-700">
          <div className={`flex items-center justify-between p-2 rounded-lg border-2 ${hasVisitedLink ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-stone-950 border-stone-800'}`}>
            <div className="flex items-center gap-2">
              <Coins className="text-yellow-500" size={16} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${hasVisitedLink ? 'text-emerald-400' : 'text-stone-500'}`}>
                {hasVisitedLink ? 'Reward Ready!' : 'Read to Claim'}
              </span>
            </div>
            <span className={`text-xs font-black ${hasVisitedLink ? 'text-emerald-400' : 'text-stone-500'}`}>+50 COINS</span>
          </div>
          {hasVisitedLink && (
            <button
              onClick={() => onClose(true)}
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs"
            >
              Claim Reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainBoard;
