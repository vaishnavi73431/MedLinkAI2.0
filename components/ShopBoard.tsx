import React from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { FurnitureItem } from '../types';

export interface ShopItem {
    id: FurnitureItem;
    name: string;
    cost: number;
    emoji: string;
}

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'pine-tree', name: 'Pine Tree', cost: 200, emoji: '🌲' },
    { id: 'bench', name: 'Bench', cost: 350, emoji: '🪑' },
    { id: 'bench-back', name: 'Bench Back', cost: 450, emoji: '🛋️' },
    { id: 'chair', name: 'Chair', cost: 200, emoji: '🪑' },
    { id: 'flower-pot', name: 'Flower Pot', cost: 200, emoji: '🪴' }
];

interface ShopBoardProps {
    onClose: () => void;
    onBuy: (item: FurnitureItem, cost: number) => void;
    currentCoins: number;
}

const ShopBoard: React.FC<ShopBoardProps> = ({ onClose, onBuy, currentCoins }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-[100] backdrop-blur-sm bg-black/40">
            <div className="relative w-[360px] h-[600px] bg-[#FFF8E1] rounded-[40px] border-[8px] border-[#E65100] overflow-hidden flex flex-col shadow-2xl animate-[pop_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">

                {/* Header Badge */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#AED581] rounded-b-full border-b-[6px] border-[#689F38] shadow-md z-10 flex items-center justify-center">
                    <h1 className="text-4xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] font-[VT323] tracking-widest mt-1">STORE</h1>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-[#EF5350] hover:bg-[#D32F2F] text-white p-1.5 rounded-full border-[3px] border-[#B71C1C] shadow-lg active:scale-90 transition-transform z-20"
                >
                    <X size={24} strokeWidth={4} />
                </button>

                {/* Content Container */}
                <div className="flex-1 mt-20 px-4 pb-4 overflow-y-auto no-scrollbar space-y-3">
                    {SHOP_ITEMS.map((item) => {
                        const canAfford = currentCoins >= item.cost;

                        return (
                            <div key={item.id} className="bg-[#FAF3E0] rounded-2xl p-2 pr-3 flex items-center justify-between border-[3px] border-[#D7CCC8] shadow-sm hover:border-[#8D6E63] transition-colors group">
                                {/* Icon Box */}
                                <div className="w-16 h-16 bg-[#D7CCC8]/30 rounded-xl flex items-center justify-center text-4xl border-2 border-[#D7CCC8] group-hover:bg-[#D7CCC8]/50 transition-colors">
                                    {item.emoji}
                                </div>

                                <div className="flex-1 flex flex-col px-3">
                                    <div className="font-black text-[#5D4037] font-[Nunito] text-lg uppercase tracking-tight leading-none mb-1">{item.cost} COINS</div>
                                    <div className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">{item.name}</div>
                                </div>

                                <button
                                    onClick={() => canAfford && onBuy(item.id, item.cost)}
                                    disabled={!canAfford}
                                    className={`
                                        h-10 px-5 rounded-xl font-black text-white text-sm shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] transition-all border-b-[4px] uppercase tracking-wide
                                        ${canAfford
                                            ? 'bg-[#66BB6A] hover:bg-[#43A047] border-[#2E7D32] hover:brightness-110'
                                            : 'bg-stone-400 border-stone-600 cursor-not-allowed opacity-70'}
                                    `}
                                >
                                    BUY
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-5"
                    style={{ backgroundImage: 'radial-gradient(#5D4037 2px, transparent 2px)', backgroundSize: '24px 24px' }}
                />
            </div>

            <style>{`
                @keyframes pop {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default ShopBoard;
