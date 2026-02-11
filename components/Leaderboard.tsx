import React from 'react';
import { GameState, Achievement, LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, Lock, Award, Map, Sofa, Flame, Dumbbell } from 'lucide-react';

interface LeaderboardProps {
  gameState: GameState;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameState }) => {

  // --- MOCK DATA ---
  const dummyPlayers = [
    { name: "PixelFarmer99", score: 3500, avatarColor: "#EF5350" },
    { name: "CozyCat", score: 2890, avatarColor: "#AB47BC" },
    { name: "GreenThumb", score: 2100, avatarColor: "#66BB6A" },
    { name: "ZenMaster", score: 1200, avatarColor: "#42A5F5" },
    { name: "SleepyBear", score: 800, avatarColor: "#FFA726" },
  ];

  // Combine user with dummy data and sort
  const allPlayers: LeaderboardEntry[] = [
    ...dummyPlayers.map(p => ({ ...p, rank: 0, isUser: false })),
    { name: "You", score: gameState.score, avatarColor: "#FFCC80", isUser: true }
  ].sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));

  // --- ACHIEVEMENTS DEFINITION ---
  const achievements: Achievement[] = [
    {
        id: 'beginner',
        title: 'Sprout',
        description: 'Earn your first 100 coins',
        icon: Award,
        condition: (s) => s.score >= 100
    },
    {
        id: 'decorator',
        title: 'Interior Design',
        description: 'Collect 3 furniture items',
        icon: Sofa,
        condition: (s) => s.inventory.length >= 3
    },
    {
        id: 'explorer',
        title: 'Explorer',
        description: 'Unlock 2 new zones',
        icon: Map,
        condition: (s) => s.unlockedZones.length >= 3 // 'home' is default + 2 new
    },
    {
        id: 'camper',
        title: 'Happy Camper',
        description: 'Unlock the Camping Grounds',
        icon: Flame,
        condition: (s) => s.unlockedZones.includes('camping')
    },
    {
        id: 'fitness',
        title: 'Gym Rat',
        description: 'Unlock the Gym',
        icon: Dumbbell,
        condition: (s) => s.unlockedZones.includes('gym')
    },
    {
        id: 'rich',
        title: 'Coin Millionaire',
        description: 'Reach level 10',
        icon: Crown,
        condition: (s) => s.level >= 10
    }
  ];

  const unlockedCount = achievements.filter(a => a.condition(gameState)).length;

  return (
    <div className="bg-stone-800 border-4 border-stone-700 rounded-lg p-4 h-full flex flex-col pixel-corners shadow-lg overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b-2 border-stone-600 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-500 p-1 rounded pixel-corners">
            <Trophy className="text-white" size={20} />
          </div>
          <h2 className="text-2xl text-yellow-400 uppercase tracking-widest font-bold">Leaders</h2>
        </div>
        <div className="text-xs text-stone-900 bg-yellow-400 px-2 py-1 rounded border border-yellow-600 font-bold">
          TOP PLAYERS
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
        
        {/* Leaderboard List */}
        <div className="space-y-2">
            {allPlayers.map((player) => (
                <div 
                    key={player.name}
                    className={`flex items-center gap-3 p-2 rounded border-2 ${
                        player.isUser 
                        ? 'bg-yellow-900/30 border-yellow-500/50' 
                        : 'bg-stone-900 border-stone-600'
                    }`}
                >
                    <div className={`w-8 h-8 flex items-center justify-center font-bold text-lg ${
                        player.rank === 1 ? 'text-yellow-400' : 
                        player.rank === 2 ? 'text-stone-300' : 
                        player.rank === 3 ? 'text-orange-400' : 'text-stone-500'
                    }`}>
                        {player.rank === 1 ? <Crown size={20} /> : `#${player.rank}`}
                    </div>

                    <div 
                        className="w-10 h-10 shrink-0 border-2 border-stone-700 rounded flex items-center justify-center pixel-corners"
                        style={{ backgroundColor: player.avatarColor }}
                    >
                         {/* Simple face */}
                         <div className="flex gap-1">
                            <div className="w-1 h-2 bg-black/20"></div>
                            <div className="w-1 h-2 bg-black/20"></div>
                         </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                            <span className={`font-bold ${player.isUser ? 'text-yellow-200' : 'text-stone-300'}`}>
                                {player.name} {player.isUser && '(You)'}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">{player.score}</span>
                        </div>
                        <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                             <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${Math.min(100, (player.score / 4000) * 100)}%` }}
                             />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Achievements Section */}
        <div>
            <div className="flex justify-between items-end mb-3">
                <h3 className="text-stone-400 text-sm uppercase tracking-wider font-bold">Achievements</h3>
                <span className="text-stone-500 text-xs">{unlockedCount} / {achievements.length} Unlocked</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
                {achievements.map((ach) => {
                    const isUnlocked = ach.condition(gameState);
                    return (
                        <div key={ach.id} className={`p-3 rounded border-2 flex items-center gap-3 transition-colors ${
                            isUnlocked 
                            ? 'bg-stone-800 border-stone-600 opacity-100' 
                            : 'bg-stone-900 border-stone-800 opacity-60'
                        }`}>
                            <div className={`w-10 h-10 rounded flex items-center justify-center border-2 shrink-0 ${
                                isUnlocked 
                                ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300' 
                                : 'bg-stone-800 border-stone-700 text-stone-600'
                            }`}>
                                {isUnlocked ? <ach.icon size={20} /> : <Lock size={20} />}
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold ${isUnlocked ? 'text-stone-200' : 'text-stone-500'}`}>
                                    {ach.title}
                                </h4>
                                <p className="text-xs text-stone-500 leading-tight">
                                    {ach.description}
                                </p>
                            </div>
                            {isUnlocked && <div className="ml-auto text-yellow-500"><Medal size={16} /></div>}
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;