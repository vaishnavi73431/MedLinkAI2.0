
// Clean up corrupted imports and duplicate declarations
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, MessageCircle, ShoppingBag, BookOpen, ChevronLeft, LayoutGrid, Newspaper, Search, Bell, Home, Tent, Utensils, Hospital, Dumbbell, Flower2, Move, Camera, User, Save } from 'lucide-react';
import { ChatMessage, GameState, UserProfile } from '../types';
import ChatInterface from './ChatInterface';
import SocialFeed from './SocialFeed';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';

interface MobileInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  initialApp?: 'home' | 'chat' | 'location' | 'shopping' | 'newsletter';
  onVisitGym: () => void;
  onVisitRestaurant: () => void;
  onVisitHospital: () => void;
  onVisitSevaHub: () => void;
  onAddRestaurantXP: (amount: number) => void;
  userProfile?: UserProfile;
}

type AppId = 'home' | 'chat' | 'location' | 'shopping' | 'newsletter' | 'social' | 'profile';

const ProfileView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [profileLoading, setProfileLoading] = useState(true);
  const [profession, setProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('Sedentary');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const loadProfile = async () => {
      const { session } = await authService.getSession();
      if (session?.user) {
        const { data } = await dataService.getProfile(session.user.id);
        if (data) {
          setProfession(data.profession || '');
          setGoal(data.goal || '');
          setDob(data.dob || '');
          setWeight(data.weight?.toString() || '');
          setHeight(data.height?.toString() || '');
          setActivityLevel(data.activity_level || 'Sedentary');
        }
      }
      setProfileLoading(false);
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    const { session } = await authService.getSession();
    if (session?.user) {
      const { error } = await dataService.updateProfile(session.user.id, {
        profession,
        goal,
        dob,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        activity_level: activityLevel
      });
      if (!error) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b flex items-center gap-4 bg-stone-50">
        <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-stone-600" />
        </button>
        <h2 className="font-black text-lg uppercase tracking-tight text-stone-800">My Profile</h2>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            <User size={40} className="text-purple-400" />
          </div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Personalize Your Journey</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">My Profession</label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Software Engineer, Teacher..."
              className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-stone-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">DOB</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-stone-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-stone-700"
              >
                <option value="Sedentary">Sedentary</option>
                <option value="Active">Active</option>
                <option value="Athlete">Athlete</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 70"
                className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-stone-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 175"
                className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-stone-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">My Health Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Lose weight, reduce anxiety, build muscle..."
              className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-stone-700 h-32 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saveStatus === 'saving'}
          className={`mt-4 w-full py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2
                  ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-stone-800 text-white hover:bg-stone-700'}
              `}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Profile'}
          {saveStatus === 'saved' && <Save size={18} />}
        </button>
      </div>
    </div>
  );
};

const ShopView: React.FC<{ onBack: () => void; onReward: (amount: number) => void; onAddRestaurantXP: (amount: number) => void }> = ({ onBack, onReward, onAddRestaurantXP }) => {
  const [waitingForReward, setWaitingForReward] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && waitingForReward) {
        onReward(50);
        onAddRestaurantXP(15);
        setWaitingForReward(false);
        alert("Welcome back! You earned 50 coins and 15 Diner XP for exploring healthy options! 🪙🍳");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [waitingForReward, onReward, onAddRestaurantXP]);

  const handleProductClick = (url: string) => {
    setWaitingForReward(true);
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b flex items-center justify-between bg-stone-50">
        <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-stone-600" />
        </button>
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-stone-600" />
          <span className="text-sm font-black uppercase tracking-tight text-stone-800">Health Shop</span>
        </div>
      </div>

      <div className="flex-1 p-4 grid grid-cols-1 gap-4 overflow-y-auto bg-stone-100">
        {/* Product Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col gap-3">
          <div className="aspect-video bg-stone-200 rounded-xl overflow-hidden relative">
            <img
              src="https://m.media-amazon.com/images/I/81+3y+7+3JL._SX679_.jpg"
              alt="Yogabar"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-yellow-400 text-stone-900 text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wide">
              Best Seller
            </div>
          </div>

          <div>
            <h3 className="font-bold text-stone-800 leading-tight">Yogabar Breakfast Bars Variety Pack</h3>
            <p className="text-xs text-stone-500 mt-1 line-clamp-2">Daily Protein Snack | High Energy & Nutrition Bars | 8g Protein & 7g Fibre</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-stone-400 font-bold line-through">₹600</span>
              <span className="text-lg font-black text-emerald-600">₹450</span>
            </div>
            <button
              onClick={() => handleProductClick("https://www.amazon.in/Yogabar-Breakfast-Protein-Blueberry-Cinnamon/dp/B07CN1K1Z6/ref=sr_1_5?dib=eyJ2IjoiMSJ9.Abh_QmxP6Gn5uzmCjEWs3N38pz3IQNY8G1N3TlDmBvlyrxecces4HB9KUEAT5NvyRsJhGdvle7cQ78XhAKeCfItJJpAWVNLkdHbGvmA1k8a--o98JASCM0Kka8s9HdyMM21obWwlAgmu88gMHM1CzDBLp1eoxoz5m4_eoW1RJ1c_lgtCYKBdCitdx8obk_2uNDsKUe6TQM-xOMHtDMUCFXDwfiafjB_EIs-zFvav5mdk0A9l0yTXmbFtTy6xruGjaIp3h07CEHmO9r3xfMMZk7ET6cBuW7Bs59m3j5fGaDI.oenGGzrUj7e8zKcBZkMBPt9-_9Yi0aVtIAEdF3VT52k&dib_tag=se&keywords=protein%2Bbar&qid=1770916780&sr=8-5&th=1")}
              className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
            >
              Buy Now
            </button>
          </div>
          <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold p-2 rounded-lg text-center border border-emerald-100">
            ✨ Earn 50 Coins on View!
          </div>
        </div>
      </div>
    </div>
  );
};
const NewsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col bg-[#F4F1EA] text-stone-900 font-serif">
      {/* Header */}
      <div className="p-4 border-b-4 border-stone-800 flex items-center justify-between bg-[#EFEBE0]">
        <button onClick={onBack} className="p-2 hover:bg-stone-300 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-stone-800" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-black text-3xl uppercase tracking-tighter text-stone-900" style={{ fontFamily: '"Playfair Display", serif' }}>Times of HOMESTEAD</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 border-t border-b border-stone-400 py-0.5 w-full text-center mt-1">Daily Edition • Vol. 1</p>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6">

          {/* Headline Story */}
          <article className="border-b-2 border-stone-300 pb-6">
            <h2 className="text-2xl font-bold leading-tight mb-2 font-serif">Sprout AI: The New Pocket Companion for Every Homesteader</h2>
            <div className="flex items-center gap-2 mb-4 text-stone-500 text-xs font-bold uppercase tracking-wider">
              <span>By Tech Editor</span> • <span>Just Now</span>
            </div>

            <div className="float-right ml-4 mb-2 w-1/2">
              <div className="bg-stone-200 p-2 border border-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1">
                <img
                  src="/sprout_ai_cartoon.png"
                  alt="Sprout AI Pocket Robot"
                  className="w-full h-auto grayscale-[20%] contrast-125 block"
                />
                <p className="text-[9px] font-bold text-center mt-1 uppercase text-stone-600">Fig 1. Prototype Model</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-justify mb-4 text-stone-800 font-medium">
              <span className="font-bold text-3xl float-left mr-1 mt-[-6px]">W</span>e are thinking of launching a Sprout AI mini pocket robot that will stay with homesteaders! This revolutionary little companion is designed to be the perfect sidekick for your daily journey.
            </p>
            <p className="text-sm leading-relaxed text-justify mb-4 text-stone-800 font-medium">
              Unlike standard digital assistants, the Sprout Mini is built to understand the unique challenges of building habits in a busy world. It fits right in your pocket, ready to offer health tips, daily motivation, and even a friendly beep when you achieve your goals.
            </p>
            <p className="text-sm leading-relaxed text-justify text-stone-800 font-medium">
              "It's not just a robot; it's a friend," says the lead developer. Stay tuned for more updates on this exciting addition to the Homestead family!
            </p>
          </article>

          {/* Minor Stories */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-stone-300 pr-4">
              <h3 className="font-bold text-sm uppercase mb-1">Local Weather</h3>
              <p className="text-xs text-stone-600">Sunny skies ahead for the pixel village. perfect for planting new habits.</p>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase mb-1">Market Watch</h3>
              <p className="text-xs text-stone-600">Gym token values are up 15% as more residents hit their fitness goals.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const MobileInterface: React.FC<MobileInterfaceProps> = ({
  messages,
  setMessages,
  gameState,
  setGameState,
  initialApp = 'home',
  onVisitGym,
  onVisitRestaurant,
  onVisitHospital,
  onVisitSevaHub,
  onAddRestaurantXP,
  userProfile
}) => {
  const [activeApp, setActiveApp] = useState<AppId>(initialApp);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  // Correctly initialize mapDragStartRef with useRef
  const mapDragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const AppIcon = ({ icon: Icon, color, label, onClick, badge }: { icon: any, color: string, label: string, onClick: () => void, badge?: boolean }) => (
    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onClick}>
      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 border-4 border-white/20`} style={{ backgroundColor: color }}>
        <Icon size={32} className="text-white" strokeWidth={2.5} />
        {badge && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-md" />
        )}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-stone-600/60 transition-colors group-hover:text-stone-800">{label}</span>
    </div>
  );

  const handleMapMouseDown = (e: React.MouseEvent) => {
    setIsDraggingMap(true);
    mapDragStartRef.current = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMap) return;
    setMapOffset({
      x: e.clientX - mapDragStartRef.current.x,
      y: e.clientY - mapDragStartRef.current.y
    });
  };

  const handleMapMouseUp = () => {
    setIsDraggingMap(false);
  };

  const handleMapTouchStart = (e: React.TouchEvent) => {
    setIsDraggingMap(true);
    mapDragStartRef.current = { x: e.touches[0].clientX - mapOffset.x, y: e.touches[0].clientY - mapOffset.y };
  };

  const handleMapTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingMap) return;
    setMapOffset({
      x: e.touches[0].clientX - mapDragStartRef.current.x,
      y: e.touches[0].clientY - mapOffset.y
    });
  };

  const mapBuildings = [
    { id: 'house', label: 'Home', x: 500, y: 500, offset: 35 },
    { id: 'hospital', label: 'Hospital', x: 720, y: 400, offset: 45 },
    { id: 'salon', label: 'Restaurant', x: 500, y: 320, offset: 35 },
    { id: 'camping', label: 'Camping Ground', x: 350, y: 350, offset: 30 },
    { id: 'gym', label: 'Power Pulse Gym', x: 350, y: 650, offset: 30 },
    { id: 'yoga', label: 'Zen Yoga Studio', x: 600, y: 330, offset: 30 },
    { id: 'sevahub', label: 'Seva Hub', x: 750, y: 650, offset: 30 },
  ];

  const drawMapContent = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(0, 0, width, height);

    // Distant background land area
    ctx.fillStyle = '#C8E6C9';
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.bezierCurveTo(200, 80, 800, 80, 1000, 220);
    ctx.lineTo(1000, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#E8F5E9';
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.bezierCurveTo(800, 0, 950, 300, 900, 800);
    ctx.bezierCurveTo(800, 950, 300, 900, 50, 700);
    ctx.bezierCurveTo(-50, 400, 50, 150, 100, 50);
    ctx.fill();

    // Mountains at the top
    const drawMountain = (mx: number, my: number, mw: number, mh: number) => {
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.moveTo(mx, my - mh);
      ctx.lineTo(mx - mw / 2, my);
      ctx.lineTo(mx + mw / 2, my);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Snow cap
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(mx, my - mh);
      ctx.lineTo(mx - mw / 6, my - mh * 0.66);
      ctx.lineTo(mx + mw / 6, my - mh * 0.66);
      ctx.closePath();
      ctx.fill();
    };

    drawMountain(250, 120, 150, 80);
    drawMountain(400, 140, 200, 100);
    drawMountain(600, 130, 180, 90);
    drawMountain(750, 150, 160, 85);

    // Railway Track
    const trackY = 180;
    ctx.strokeStyle = '#5D4037'; // Sleepers
    ctx.lineWidth = 4;
    for (let tx = 200; tx < 800; tx += 20) {
      ctx.beginPath();
      ctx.moveTo(tx, trackY - 10);
      ctx.lineTo(tx, trackY + 10);
      ctx.stroke();
    }
    ctx.strokeStyle = '#78909C'; // Rails
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, trackY - 6); ctx.lineTo(850, trackY - 6);
    ctx.moveTo(150, trackY + 6); ctx.lineTo(850, trackY + 6);
    ctx.stroke();

    // Static Train
    const trainX = 550;
    const trainY = trackY - 5;
    const carW = 60;
    const carH = 25;
    const drawTrainCar = (cx: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(cx, trainY - carH, carW, carH);
      ctx.strokeRect(cx, trainY - carH, carW, carH);
      // Wheels
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(cx + 15, trainY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 45, trainY, 5, 0, Math.PI * 2); ctx.fill();
    };
    drawTrainCar(trainX, '#D32F2F'); // Engine
    drawTrainCar(trainX - carW - 5, '#1976D2'); // Carriage
    drawTrainCar(trainX - (carW + 5) * 2, '#388E3C'); // Carriage

    // Railway Station Board
    const boardX = 640;
    const boardY = 180;
    ctx.fillStyle = '#3E2723'; // Post
    ctx.fillRect(boardX, boardY - 60, 4, 60);
    ctx.fillStyle = '#FFFFFF'; // Board
    ctx.fillRect(boardX - 40, boardY - 60, 84, 25);
    ctx.strokeRect(boardX - 40, boardY - 60, 84, 25);
    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 8px VT323, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("RAILWAY STATION", boardX + 2, boardY - 45);

    ctx.strokeStyle = '#CFD8DC';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(500, 200); ctx.lineTo(500, 800);
    ctx.moveTo(300, 400); ctx.lineTo(700, 400);
    ctx.moveTo(350, 650); ctx.lineTo(650, 650);
    ctx.stroke();

    const drawBush = (x: number, y: number) => {
      ctx.fillStyle = '#43A047';
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    };
    [[420, 350], [580, 450], [450, 700], [250, 450]].forEach(([bx, by]) => drawBush(bx, by));

    ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;

    // 1. Home (Detailed)
    const hx = 500, hy = 500;
    const hW = 60, hH = 30;
    const hL = hx - hW / 2, hT = hy - hH / 2;
    // Walls
    ctx.fillStyle = '#F5F5E6'; ctx.fillRect(hL, hT, hW, hH); ctx.strokeRect(hL, hT, hW, hH);
    // Entrance bump
    const eW = 18;
    ctx.fillStyle = '#E5E5D6'; ctx.fillRect(hx - eW / 2, hT, eW, hH); ctx.strokeRect(hx - eW / 2, hT, eW, hH);
    // Windows
    const wW = 16, wH = 14;
    const drawWinMap = (wx: number) => {
      ctx.fillStyle = '#4A6B8C'; ctx.fillRect(wx, hT + 4, wW, wH); ctx.strokeRect(wx, hT + 4, wW, wH);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wx + wW / 2, hT + 4); ctx.lineTo(wx + wW / 2, hT + 4 + wH);
      ctx.moveTo(wx, hT + 4 + wH / 2); ctx.lineTo(wx + wW, hT + 4 + wH / 2); ctx.stroke();
    };
    drawWinMap(hL + 4); drawWinMap(hL + hW - 4 - wW);
    // Door
    const dW = 7, dH = 11;
    ctx.fillStyle = '#3E2723'; ctx.fillRect(hx - dW / 2, hy + hH / 2 - dH - 1, dW, dH); ctx.strokeRect(hx - dW / 2, hy + hH / 2 - dH - 1, dW, dH);
    ctx.fillStyle = '#FFD54F'; ctx.beginPath(); ctx.arc(hx + 2, hy + hH / 2 - dH / 2, 1, 0, Math.PI * 2); ctx.fill();
    // Roof
    ctx.lineWidth = 2;
    ctx.fillStyle = '#2C2C3E'; ctx.beginPath();
    ctx.moveTo(hL - 4, hT); ctx.lineTo(hx, hT - 15); ctx.lineTo(hL + hW + 4, hT); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Entrance mini-roof
    ctx.beginPath(); ctx.moveTo(hx - eW / 2 - 2, hT); ctx.lineTo(hx, hT - 5); ctx.lineTo(hx + eW / 2 + 2, hT); ctx.closePath(); ctx.fill(); ctx.stroke();

    // 2. Hospital
    const hosX = 720, hosY = 400;
    ctx.fillStyle = '#CFD8DC'; ctx.fillRect(hosX - 30, hosY - 20, 60, 40); ctx.strokeRect(hosX - 30, hosY - 20, 60, 40);
    ctx.fillStyle = '#E53935'; ctx.fillRect(hosX - 15, hosY - 10, 30, 8); ctx.fillRect(hosX - 4, hosY - 20, 8, 30);

    // 3. Restaurant (Detailed)
    const resX = 500, resY = 320;
    const rW = 60, rH = 32;
    const rL = resX - rW / 2, rT = resY - rH / 2;
    // Walls
    ctx.fillStyle = '#FEF9E7'; ctx.fillRect(rL, rT, rW, rH); ctx.strokeRect(rL, rT, rW, rH);
    // Peaked roof
    ctx.fillStyle = '#E67E22';
    ctx.beginPath(); ctx.moveTo(rL + 6, rT); ctx.lineTo(resX, rT - 10); ctx.lineTo(rL + rW - 6, rT); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Chimneys
    ctx.fillStyle = '#E74C3C'; ctx.fillRect(rL + 10, rT - 8, 6, 8); ctx.strokeRect(rL + 10, rT - 8, 6, 8);
    // Awning
    const nS = 6;
    const sW = rW / nS;
    for (let i = 0; i < nS; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#E74C3C' : '#FFFFFF';
      ctx.fillRect(rL + i * sW, rT + 12, sW, 8);
      ctx.strokeRect(rL + i * sW, rT + 12, sW, 8);
      ctx.beginPath(); ctx.arc(rL + i * sW + sW / 2, rT + 20, sW / 2, 0, Math.PI); ctx.fill(); ctx.stroke();
    }
    // Blue door
    ctx.fillStyle = '#2980B9'; ctx.fillRect(rL + rW - 18, resY + rH / 2 - 14, 12, 14); ctx.strokeRect(rL + rW - 18, resY + rH / 2 - 14, 12, 14);
    // Counter area
    ctx.fillStyle = '#E74C3C'; ctx.fillRect(rL + 4, resY + rH / 2 - 6, 30, 4); ctx.strokeRect(rL + 4, resY + rH / 2 - 6, 30, 4);

    // 4. Gym - Detailed version matching homescreen
    const gyX = 350, gyY = 650;
    const gW = 56, gH = 40;
    // Bottom base (40%)
    ctx.fillStyle = '#2C2C2E';
    ctx.fillRect(gyX - gW / 2, gyY - gH / 2 + gH * 0.6, gW, gH * 0.4);
    ctx.strokeRect(gyX - gW / 2, gyY - gH / 2 + gH * 0.6, gW, gH * 0.4);

    // Top main building (60%)
    ctx.fillStyle = '#880E4F';
    ctx.fillRect(gyX - gW / 2, gyY - gH / 2, gW, gH * 0.6);
    ctx.strokeRect(gyX - gW / 2, gyY - gH / 2, gW, gH * 0.6);
    // Central Sign area
    const sW_gym = 18;
    ctx.fillStyle = '#AD1457';
    ctx.fillRect(gyX - sW_gym / 2, gyY - gH / 2, sW_gym, gH);
    ctx.strokeRect(gyX - sW_gym / 2, gyY - gH / 2, sW_gym, gH);
    // "GYM" Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px VT323, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("GYM", gyX, gyY - gH / 2 + 14);
    // Barbell Decoration on top
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gyX - 14, gyY - gH / 2 - 4);
    ctx.lineTo(gyX + 14, gyY - gH / 2 - 4);
    ctx.stroke();
    ctx.fillStyle = '#212121';
    ctx.fillRect(gyX - 18, gyY - gH / 2 - 8, 5, 8);
    ctx.fillRect(gyX + 13, gyY - gH / 2 - 8, 5, 8);

    // 5. Camping Ground (Tent)
    const camX = 350, camY = 350;
    ctx.fillStyle = '#D32F2F'; // Red
    ctx.beginPath();
    ctx.moveTo(camX, camY - 20);
    ctx.lineTo(camX - 20, camY + 15);
    ctx.lineTo(camX + 20, camY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // White flap
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(camX, camY - 10);
    ctx.lineTo(camX - 7, camY + 15);
    ctx.lineTo(camX + 7, camY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Yoga Studio (New)
    const yoX = 600, yoY = 330;
    const yW = 50, yH = 30;
    // Walls
    ctx.fillStyle = '#B2DFDB';
    ctx.fillRect(yoX - yW / 2, yoY - yH / 2, yW, yH);
    ctx.strokeRect(yoX - yW / 2, yoY - yH / 2, yW, yH);
    // Roof
    ctx.fillStyle = '#E5989B';
    ctx.fillRect(yoX - yW / 2 - 4, yoY - yH / 2 - 6, yW + 8, 6);
    ctx.strokeRect(yoX - yW / 2 - 4, yoY - yH / 2 - 6, yW + 8, 6);
    // Large Window
    ctx.fillStyle = 'rgba(232, 245, 248, 0.7)';
    ctx.fillRect(yoX - yW / 2 + 15, yoY - yH / 2 + 5, 25, yH - 10);
    ctx.strokeRect(yoX - yW / 2 + 15, yoY - yH / 2 + 5, 25, yH - 10);
    // Small Door
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(yoX - yW / 2 + 4, yoY - yH / 2 + 10, 8, yH - 10);
    ctx.strokeRect(yoX - yW / 2 + 4, yoY - yH / 2 + 10, 8, yH - 10);

    // 7. Seva Hub (New)
    const shX = 750, shY = 650;
    const shW = 50, shH = 28;
    // Walls
    ctx.fillStyle = '#F5CBA7';
    ctx.fillRect(shX - shW / 2, shY - shH / 2, shW, shH);
    ctx.strokeRect(shX - shW / 2, shY - shH / 2, shW, shH);
    // Arched Door
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.roundRect(shX - 6, shY + shH / 2 - 14, 12, 14, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();
    // Red Peak Roof
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.moveTo(shX - shW / 2 - 6, shY - hH / 2);
    ctx.lineTo(shX, shY - shH / 2 - 12);
    ctx.lineTo(shX + shW / 2 + 6, shY - shH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Level Badge
    if (gameState.restaurantLevel && gameState.restaurantLevel > 0) {
      const badgeX = resX + rW / 2 + 10;
      const badgeY = resY - rH / 2 - 10;

      // Star shape background
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.strokeStyle = '#F57F17';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = 12;
      const innerRadius = 6;
      let rot = Math.PI / 2 * 3;
      let x = badgeX;
      let y = badgeY;
      const step = Math.PI / spikes;

      ctx.moveTo(badgeX, badgeY - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = badgeX + Math.cos(rot) * outerRadius;
        y = badgeY + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = badgeX + Math.cos(rot) * innerRadius;
        y = badgeY + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(badgeX, badgeY - outerRadius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gameState.restaurantLevel.toString(), badgeX, badgeY + 1);
    }

  }, [gameState.restaurantLevel]);

  useEffect(() => {
    if (activeApp === 'location' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) drawMapContent(ctx, 1000, 1000);
    }
  }, [activeApp, drawMapContent]);

  const renderApp = () => {
    switch (activeApp) {
      case 'social':
        return <SocialFeed onBack={() => setActiveApp('home')} />;
      case 'chat':
        return (
          <div className="h-full flex flex-col">
            <button
              onClick={() => setActiveApp('home')}
              className="m-2 p-2 bg-stone-100 hover:bg-stone-200 rounded-full w-fit shadow-sm border border-stone-300 transition-colors"
            >
              <ChevronLeft size={20} className="text-stone-600" />
            </button>
            <div className="flex-1 overflow-hidden">
              <ChatInterface messages={messages} setMessages={setMessages} gameState={gameState} setGameState={setGameState} userProfile={userProfile} />
            </div>
          </div>
        );
      case 'newsletter':
        return <NewsView onBack={() => setActiveApp('home')} />;
      case 'shopping':
        return <ShopView onBack={() => setActiveApp('home')} onReward={(amount) => setGameState(prev => ({ ...prev, score: prev.score + amount }))} onAddRestaurantXP={onAddRestaurantXP} />;
      case 'profile':
        return <ProfileView onBack={() => setActiveApp('home')} />;
      case 'location':
        return (
          <div className="h-full flex flex-col relative overflow-hidden bg-[#81D4FA]">
            <div className="absolute top-0 left-0 w-full z-20 p-4 flex items-center justify-between pointer-events-none">
              <button onClick={() => setActiveApp('home')} className="p-4 -ml-2 hover:bg-stone-200 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-stone-600" />
              </button>
            </div>
            <div
              className="flex-1 cursor-grab active:cursor-grabbing relative"
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onMouseLeave={handleMapMouseUp}
              onTouchStart={handleMapTouchStart}
              onTouchMove={handleMapTouchMove}
              onTouchEnd={handleMapMouseUp}
            >
              <div
                className="absolute left-1/2 top-1/2 transition-transform duration-75 ease-out"
                style={{ transform: `translate(calc(-50% + ${mapOffset.x}px), calc(-50% + ${mapOffset.y}px))` }}
              >
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={1000}
                  className="bg-transparent rounded-[60px] shadow-2xl border-[8px] border-white/30"
                />

                {/* Building Labels and Visit Buttons Overlay */}
                {mapBuildings.map(building => {
                  const isUnlocked = building.id === 'house' || gameState.unlockedZones.includes(building.id);

                  return (
                    <div
                      key={building.id}
                      className="absolute pointer-events-none flex flex-col items-center"
                      style={{ left: `${building.x}px`, top: `${building.y}px`, transform: 'translate(-50%, -50%)' }}
                    >
                      {/* Building Name on Top */}
                      <div className="absolute bottom-[48px] whitespace-nowrap bg-stone-800/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded border border-white/30 uppercase tracking-[0.15em] shadow-lg">
                        {building.label}
                      </div>

                      {/* Visit Button Below */}
                      <div className="absolute top-[48px] pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isUnlocked) {
                              setLockedMessage("Complete Tasks to unlock!");
                              setTimeout(() => setLockedMessage(null), 2000);
                              return;
                            }

                            if (building.id === 'gym' && onVisitGym) {
                              onVisitGym();
                            } else if (building.id === 'salon' && onVisitRestaurant) {
                              onVisitRestaurant();
                            } else if (building.id === 'hospital' && onVisitHospital) {
                              onVisitHospital();
                            } else if (building.id === 'sevahub' && onVisitSevaHub) {
                              onVisitSevaHub();
                            } else {
                              setActiveApp('home');
                            }
                          }}
                          className={`${isUnlocked ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800' : 'bg-stone-500 cursor-not-allowed border-stone-700'} text-white text-[9px] font-black px-3 py-1.5 rounded-full border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-xl uppercase tracking-widest`}
                        >
                          Visit
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Locked Message Toast */}
                {lockedMessage && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-xl font-bold text-xs uppercase tracking-widest animate-bounce z-50 whitespace-nowrap border-2 border-red-700">
                    {lockedMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative h-full flex flex-col">
            <div className="px-8 pt-6 pb-2 flex justify-between items-center text-stone-500 font-bold">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
              </div>
              <div className="text-sm font-black opacity-40">SYSTEM v2.0</div>
              <Bell size={14} className="opacity-40" />
            </div>
            <div className="flex-1 flex flex-col justify-start pt-12 px-8 gap-12">
              <div className="grid grid-cols-3 gap-y-12">
                <AppIcon
                  icon={MapPin}
                  color="#A2D2DF"
                  label="Map"
                  onClick={() => setActiveApp('location')}
                />
                <AppIcon
                  icon={LayoutGrid}
                  color="#EF9C92"
                  label="Chat"
                  onClick={() => setActiveApp('chat')}
                />
                <AppIcon
                  icon={ShoppingBag}
                  color="#635C7D"
                  label="Shop"
                  onClick={() => setActiveApp('shopping')}
                />
                <AppIcon
                  icon={BookOpen}
                  color="#F9B17A"
                  label="News"
                  onClick={() => setActiveApp('newsletter')}
                />
                <AppIcon
                  icon={Camera}
                  color="#EDB7ED"
                  label="Social"
                  onClick={() => setActiveApp('social')}
                />
                <AppIcon
                  icon={User}
                  color="#A78BFA"
                  label="Profile"
                  onClick={() => setActiveApp('profile')}
                />
              </div>
            </div>
            <div className="p-8 flex justify-center">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-2">
      <div className="relative w-full max-w-[320px] aspect-[9/19] bg-[#C599D1] rounded-[60px] border-[6px] border-stone-800 shadow-2xl p-4 flex flex-col overflow-hidden">
        <div className="flex-1 bg-[#F9F5E3] rounded-[44px] overflow-hidden shadow-inner border-2 border-stone-900/10">
          {renderApp()}
        </div>
      </div>
    </div>
  );
};

export default MobileInterface;
