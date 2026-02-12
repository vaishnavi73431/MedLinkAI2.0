import React from 'react';
import { Play, LogIn } from 'lucide-react';

interface WelcomeScreenProps {
    onLogin: () => void;
    onSignup: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onSignup }) => {
    return (
        <div className="w-full h-full relative overflow-hidden bg-[#4FC3F7] flex flex-col items-center justify-center font-mono select-none">
            {/* Background Elements */}

            {/* Clouds */}
            <div className="absolute top-10 left-10 w-24 h-8 bg-white/40 rounded-full animate-pulse blur-sm" />
            <div className="absolute top-20 right-20 w-32 h-10 bg-white/30 rounded-full animate-bounce duration-[3000ms] blur-sm" />
            <div className="absolute top-40 left-1/3 w-20 h-6 bg-white/20 rounded-full blur-sm" />

            {/* Main Logo Container */}
            <div className="z-10 flex flex-col items-center gap-8 mb-20 animate-in fade-in zoom-in duration-500">

                {/* Pixel Art Logo Box */}
                <div className="w-32 h-32 bg-[#1A237E] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center">
                    {/* "M" Logo Construction */}
                    <div className="grid grid-cols-5 grid-rows-5 gap-1 w-20 h-20">
                        {/* Visualizing an 'M' with plus shape center */}
                        <div className="bg-blue-400 col-start-1 row-span-5"></div>
                        <div className="bg-blue-400 col-start-5 row-span-5"></div>
                        <div className="bg-blue-400 col-start-2 row-start-2"></div>
                        <div className="bg-blue-400 col-start-4 row-start-2"></div>
                        <div className="bg-blue-400 col-start-3 row-start-3"></div>

                        {/* Plus in center */}
                        <div className="bg-white col-start-3 row-start-3 z-10 scale-50"></div>
                    </div>
                    {/* Loading/Scanning line effect */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/50 animate-pulse"></div>
                </div>

                {/* Speech Bubble Title */}
                <div className="relative bg-[#FFF9C4] border-4 border-black px-8 py-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center w-80">
                    <h1 className="text-3xl font-black tracking-tighter text-stone-900 mb-2 uppercase">MedLinkAI</h1>
                    <p className="text-xs font-bold text-stone-600 tracking-widest uppercase">Start your health journey</p>

                    {/* Speech Bubble Tail */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-black"></div>
                    <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-[#FFF9C4]"></div>
                </div>

                {/* Loading Bar */}
                <div className="w-64 h-6 bg-stone-700/50 border-2 border-stone-800 rounded-full overflow-hidden relative mt-4">
                    <div className="h-full bg-blue-500 animate-[width_2s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
                </div>
                <div className="text-[10px] font-black tracking-[0.3em] opacity-60 uppercase mt-[-20px]">System Ready</div>
            </div>

            {/* Hill Background */}
            <div className="absolute bottom-[-100px] w-[150%] h-[50vh] bg-[#4CAF50] rounded-[100%] border-t-8 border-black shadow-2xl z-0"></div>

            {/* Trees */}
            <div className="absolute bottom-10 left-10 z-0">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-[#1B5E20]"></div>
                <div className="w-4 h-8 bg-[#3E2723] mx-auto mt-[-10px]"></div>
            </div>
            <div className="absolute bottom-20 left-1/3 z-0 scale-75">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-[#2E7D32]"></div>
                <div className="w-4 h-8 bg-[#3E2723] mx-auto mt-[-10px]"></div>
            </div>
            <div className="absolute bottom-16 right-20 z-0 scale-110">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[60px] border-b-[#1B5E20]"></div>
                <div className="w-4 h-8 bg-[#3E2723] mx-auto mt-[-10px]"></div>
            </div>

            {/* Action Buttons */}
            <div className="z-10 flex flex-col gap-4 w-80">
                <button
                    onClick={onLogin}
                    className="bg-[#4285F4] hover:bg-[#3367D6] text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-3 group"
                >
                    <LogIn size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-sm">Login to your Quest</span>
                </button>

                <button
                    onClick={onSignup}
                    className="bg-[#66BB6A] hover:bg-[#43A047] text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-3 group"
                >
                    <Play size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-sm">Start New Journey</span>
                </button>
            </div>

        </div>
    );
};

export default WelcomeScreen;
