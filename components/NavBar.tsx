import React from 'react';
import { ViewState } from '../types';
import { Tent, Scroll, Smartphone, Trophy } from 'lucide-react';

interface NavBarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

// Helper for the "Sticker" look (Thick white outline + Colored fill)
const StickerIcon: React.FC<{ 
  icon: React.ElementType; 
  isActive: boolean; 
  fillColor: string;
  strokeColor: string;
}> = ({ icon: Icon, isActive, fillColor, strokeColor }) => {
  return (
    <div className={`relative flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-125 -translate-y-2' : 'scale-100 hover:scale-110'}`}>
      {/* 1. The Thick White Outline (Background) */}
      <div className="absolute top-0 left-0 text-white" style={{ filter: 'drop-shadow(0px 4px 0px rgba(0,0,0,0.2))' }}>
        <Icon 
            size={40} 
            strokeWidth={6} 
            className="text-white"
        />
      </div>

      {/* 2. The Colored Icon (Foreground) */}
      <div className="relative z-10">
        <Icon 
            size={40} 
            strokeWidth={2.5} 
            color={strokeColor} 
            fill={fillColor}
        />
      </div>
    </div>
  );
};

const NavBar: React.FC<NavBarProps> = ({ currentView, setView }) => {
  const tabs: { 
    id: ViewState; 
    icon: React.ElementType; 
    fill: string; 
    stroke: string; 
  }[] = [
    { 
      id: 'garden', 
      icon: Tent, 
      fill: '#D7CCC8',  // Beige Tent
      stroke: '#5D4037' // Brown Outline
    },
    { 
      id: 'missions', 
      icon: Scroll, 
      fill: '#FFF59D',  // Yellow Paper
      stroke: '#F57F17' // Orange Outline
    },
    { 
      id: 'chat', 
      icon: Smartphone, 
      fill: '#E1BEE7',  // Purple Screen
      stroke: '#4A148C' // Dark Purple Outline
    },
    { 
      id: 'leaderboard', 
      icon: Trophy, 
      fill: '#FFD54F',  // Gold
      stroke: '#FF6F00' // Dark Amber Outline
    },
  ];

  return (
    <nav className="w-full p-4 pb-8 flex justify-center gap-8 items-end relative z-50 pointer-events-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className="focus:outline-none touch-manipulation group"
        >
          <StickerIcon 
            icon={tab.icon} 
            isActive={currentView === tab.id}
            fillColor={tab.fill}
            strokeColor={tab.stroke}
          />
        </button>
      ))}
    </nav>
  );
};

export default NavBar;