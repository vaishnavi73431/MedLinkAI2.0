import React, { useState, useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import AuthScreen from './components/AuthScreen';
import PixelGarden from './components/PixelGarden';
import ChatInterface from './components/ChatInterface';
import TaskBoard from './components/TaskBoard';
import Leaderboard from './components/Leaderboard';
import TrainBoard from './components/TrainBoard';
import CampingBoard from './components/CampingBoard';
import RestaurantBoard from './components/RestaurantBoard';
import GymBoard from './components/GymBoard';
import SevaHubBoard from './components/SevaHubBoard';
import YogaBoard from './components/YogaBoard';
import MedBay from './components/MedBay';
import MobileInterface from './components/MobileInterface';
import NavBar from './components/NavBar';
import ShopBoard from './components/ShopBoard';
import TrainerChat from './components/TrainerChat';
import NutritionChat from './components/NutritionChat';
import DoctorChat from './components/DoctorChat';
import GlobalChat from './components/GlobalChat';
import { GameState, HabitTask, ChatMessage, ViewState, FurnitureItem, ZoneType, Reminder } from './types';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabaseClient';
import {
  Trophy, Target, Calendar as CalendarIcon, MessageSquare, User, Settings as SettingsIcon,
  ChevronRight, Star, Zap, Clock, CheckCircle2, XCircle, Menu, X, Plus, ArrowRight,
  TrendingUp, Award, Dumbbell, Move, ChevronLeft, ExternalLink, Search, Globe,
  Utensils, Apple, Activity, HeartPulse
} from 'lucide-react';

interface GameNotification {
  id: string;
  text: string;
  type: 'coins' | 'level' | 'zone' | 'deduction';
}

const TRAINER_RESOURCES = [
  { name: 'Superprof - Sports Coaches', url: 'https://www.superprof.co.in/lessons/sports-coach/online/' },
  { name: 'UrbanPro - Fitness Trainers', url: 'https://www.urbanpro.com/fitness-trainers' },
  { name: 'Cult.fit - Online Training', url: 'https://www.cult.fit/cult/personal-training' },
  { name: 'Fitlo - Personal Coaches', url: 'https://fitlo.in/' },
  { name: 'MyFitCoach', url: 'https://www.myfitcoach.de/en' }
];

const DIETICIAN_RESOURCES = [
  { name: 'Apollo 24/7 - Dietetics', url: 'https://www.apollo247.com/specialties/dietetics' },
  { name: 'HealthifyMe - Nutrition Experts', url: 'https://www.healthifyme.com/' },
  { name: 'Cult.fit - Care Consultation', url: 'https://www.cult.fit/care/doctor-consultation' },
  { name: 'Practo - Online Dietitians', url: 'https://www.practo.com/consult/dietitian-nutritionist' },
  { name: 'Tata 1mg - Online Consult', url: 'https://www.1mg.com/online-doctor-consultation/dietitians' }
];

const GLOBAL_BOT_MESSAGES = [
  { name: "PixelPal", text: "Just hit Level 5! Homestead is looking green today. 🌿", color: "#F87171" },
  { name: "ZenGamer", text: "Has anyone tried the Yoga studio yet? The grounding helps so much.", color: "#60A5FA" },
  { name: "FitGal99", text: "30 mins daily streak! Power Pulse Gym is the best upgrade so far. 💪", color: "#F472B6" },
  { name: "NatureBoy", text: "Saved up enough coins to clear a tree. It's so satisfying! 🪓", color: "#34D399" },
  { name: "HomesteadHero", text: "Sprout's reminders actually helped me fix my sleep schedule. 💤", color: "#A78BFA" }
];

const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'welcome' | 'login' | 'signup' | 'authenticated'>('welcome');
  const [currentView, setCurrentView] = useState<ViewState>('garden');
  const [userProfile, setUserProfile] = useState<any>(null);

  // ... existing state declarations ...

  const [mobileEntrySource, setMobileEntrySource] = useState<'home' | 'chat'>('home');
  const [isTrainOpen, setIsTrainOpen] = useState(false);
  const [isCampingOpen, setIsCampingOpen] = useState(false);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false);
  const [isGymOpen, setIsGymOpen] = useState(false);
  const [isSevaHubOpen, setIsSevaHubOpen] = useState(false);
  const [isYogaOpen, setIsYogaOpen] = useState(false);
  const [isTrainerBoardOpen, setIsTrainerBoardOpen] = useState(false);
  const [isDieticianBoardOpen, setIsDieticianBoardOpen] = useState(false);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [gymOffset, setGymOffset] = useState({ x: 0, y: 0 });
  const [gymZoom, setGymZoom] = useState(1);
  const [isDraggingGym, setIsDraggingGym] = useState(false);
  const [gymPinchStartDist, setGymPinchStartDist] = useState<number | null>(null);
  const [gymPinchStartZoom, setGymPinchStartZoom] = useState(1);
  const gymDragStartRef = useRef({ x: 0, y: 0 });

  const [restaurantOffset, setRestaurantOffset] = useState({ x: 0, y: 0 });
  const [restaurantZoom, setRestaurantZoom] = useState(1);
  const [isDraggingRestaurant, setIsDraggingRestaurant] = useState(false);
  const [restaurantPinchStartDist, setRestaurantPinchStartDist] = useState<number | null>(null);
  const [restaurantPinchStartZoom, setRestaurantPinchStartZoom] = useState(1);
  const restaurantDragStartRef = useRef({ x: 0, y: 0 });

  const [hospitalOffset, setHospitalOffset] = useState({ x: 0, y: 0 });
  const [hospitalZoom, setHospitalZoom] = useState(1);
  const [isDraggingHospital, setIsDraggingHospital] = useState(false);
  const [hospitalPinchStartDist, setHospitalPinchStartDist] = useState<number | null>(null);
  const [hospitalPinchStartZoom, setHospitalPinchStartZoom] = useState(1);
  const hospitalDragStartRef = useRef({ x: 0, y: 0 });

  const remindersRef = useRef<Reminder[]>([]);

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('sprout_game_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      const state = {
        ...parsed,
        reminders: parsed.reminders || []
      };
      remindersRef.current = state.reminders;
      return state;
    }
    return {
      score: 0,
      level: 1,
      maxScoreForLevel: 100,
      inventory: [],
      unlockedZones: ['home', 'hospital'],
      removedTrees: [],
      reminders: []
    };
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "I'm Sprout! Every new habit you track helps our homestead grow. 🧘‍♂️",
      timestamp: Date.now()
    }
  ]);

  const [trainerMessages, setTrainerMessages] = useState<ChatMessage[]>([
    {
      id: 'trainer-welcome',
      sender: 'bot',
      text: "Hey champion! I'm Coach Flex. Ready to crush your 30-minute daily goal? Let's get moving! 💪🔥 Also, check out the front desk if you want to find a pro personal trainer online!",
      timestamp: Date.now()
    }
  ]);

  const [nutritionMessages, setNutritionMessages] = useState<ChatMessage[]>([
    {
      id: 'nutrition-welcome',
      sender: 'bot',
      text: "Hey! I'm Bite-Sized. Ready to analyze those questionable life choices you call 'meals'? I'm kidding... mostly. Consistency > Perfection. Show me what you're eating! 🍕🥗",
      timestamp: Date.now()
    }
  ]);

  const [doctorMessages, setDoctorMessages] = useState<ChatMessage[]>([
    {
      id: 'doctor-welcome',
      sender: 'bot',
      text: "Hello there. I'm Dr. Triage. I'm here to listen and help guide you to the right specialist. How are you feeling today? 🩺",
      timestamp: Date.now()
    }
  ]);

  const [globalChatMessages, setGlobalChatMessages] = useState<ChatMessage[]>([
    {
      id: 'global-1',
      sender: 'bot',
      senderName: 'Sprout',
      text: "Welcome to the Homestead Global Feed! Share your progress with others here. 🌍✨",
      timestamp: Date.now() - 3600000
    },
    {
      id: 'global-2',
      sender: 'other',
      senderName: 'PixelPal',
      avatarColor: '#F87171',
      text: "Is it just me or is the sunrise in Homestead particularly beautiful today?",
      timestamp: Date.now() - 1800000
    }
  ]);

  // Load User Data on Auth
  useEffect(() => {
    const loadUserData = async () => {
      if (authStatus === 'authenticated') {
        const { session } = await authService.getSession();
        if (session?.user) {
          const { data: profile } = await dataService.getProfile(session.user.id);

          if (profile) {
            setGameState(prev => ({
              ...prev,
              level: profile.level,
              score: profile.score,
              maxScoreForLevel: profile.max_score_for_level,
              inventory: profile.inventory || [],
              placedItems: profile.placed_items || [],
              unlockedZones: (profile.unlocked_zones as any[]) || ['home'],
              removedTrees: profile.removed_trees || []
            }));
            console.log("Loaded user profile:", profile);
            setUserProfile(profile);
          } else {
            // Self-healing: Create profile if missing (e.g. old user)
            console.log("Profile missing. Creating new profile for existing user...");
            const { data: newProfile, error: createError } = await dataService.createProfile(session.user.id, session.user.email || 'User');
            if (newProfile) {
              console.log("Created missing profile:", newProfile);
              setUserProfile(newProfile);
              // No need to setGameState here as it uses defaults, but future refreshes will work.
            } else {
              console.error("Failed to auto-create profile:", createError);
              alert("Account sync error. Please sign out and sign in again.");
            }
          }
        }
      }
    };
    loadUserData();
  }, [authStatus]);

  // Load Chat History
  useEffect(() => {
    const loadChatHistory = async () => {
      if (authStatus === 'authenticated') {
        const { session } = await authService.getSession();
        if (session?.user) {
          const userId = session.user.id;

          const { data: sproutChats } = await dataService.getChatHistory(userId, 'sprout');
          console.log(`[App] Sprout chats: ${sproutChats?.length}`);

          if (sproutChats && sproutChats.length > 0) {
            const formatted = sproutChats.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'bot' | 'other',
              text: msg.text,
              timestamp: Number(msg.timestamp),
              senderName: msg.sender === 'bot' ? 'Sprout' : undefined
            }));
            setMessages(formatted);
          } else {
            console.log("[App] No Sprout history found.");
          }

          const { data: trainerChats } = await dataService.getChatHistory(userId, 'trainer');
          if (trainerChats && trainerChats.length > 0) {
            const formatted = trainerChats.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'bot' | 'other',
              text: msg.text,
              timestamp: Number(msg.timestamp)
            }));
            setTrainerMessages(formatted);
          }

          const { data: nutritionChats } = await dataService.getChatHistory(userId, 'nutrition');
          if (nutritionChats && nutritionChats.length > 0) {
            const formatted = nutritionChats.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'bot' | 'other',
              text: msg.text,
              timestamp: Number(msg.timestamp)
            }));
            setNutritionMessages(formatted);
          }

          const { data: doctorChats } = await dataService.getChatHistory(userId, 'doctor');
          if (doctorChats && doctorChats.length > 0) {
            const formatted = doctorChats.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'bot' | 'other',
              text: msg.text,
              timestamp: Number(msg.timestamp)
            }));
            setDoctorMessages(formatted);
          }
        }
      }
    };
    loadChatHistory();
  }, [authStatus]);

  // Auto-Save Game State (Debounced)
  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    const saveState = setTimeout(async () => {
      const { session } = await authService.getSession();
      if (session?.user) {
        await dataService.syncGameState(session.user.id, {
          level: gameState.level,
          score: gameState.score,
          maxScoreForLevel: gameState.maxScoreForLevel,
          inventory: gameState.inventory,
          placedItems: gameState.placedItems,
          unlockedZones: gameState.unlockedZones,
          removedTrees: gameState.removedTrees,
        });
        console.log("Auto-saved game state");
      }
    }, 2000); // Debounce for 2 seconds

    return () => clearTimeout(saveState);
  }, [gameState, authStatus]);

  useEffect(() => {
    remindersRef.current = gameState.reminders;
    localStorage.setItem('sprout_game_state', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      setCurrentTime(now);
      const nowMs = now.getTime();

      let changed = false;
      const nextReminders = remindersRef.current.map(r => {
        if (!r.triggered && nowMs >= r.time) {
          changed = true;

          if (Notification.permission === 'granted') {
            try {
              const n = new Notification("Sprout: Wake up!", {
                body: `Reminder: ${r.task}`,
                icon: '/favicon.ico',
                tag: r.id,
                requireInteraction: true
              });
              n.onclick = () => { window.focus(); n.close(); };
            } catch (e) {
              console.error("Notification failed to show:", e);
            }
          }

          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
          } catch (e) { }

          return { ...r, triggered: true };
        }
        return r;
      });

      if (changed) {
        setGameState(prev => ({ ...prev, reminders: nextReminders }));
      }
    };

    const timer = setInterval(checkReminders, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        const botData = GLOBAL_BOT_MESSAGES[Math.floor(Math.random() * GLOBAL_BOT_MESSAGES.length)];
        const newMsg: ChatMessage = {
          id: `global-bot-${Date.now()}`,
          sender: 'other',
          senderName: botData.name,
          avatarColor: botData.color,
          text: botData.text,
          timestamp: Date.now()
        };
        setGlobalChatMessages(prev => [...prev.slice(-19), newMsg]);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const [tasks, setTasks] = useState<HabitTask[]>([
    { id: 'h-1', title: 'Regular Physical Activity', description: '30 mins of moderate exercise (walk/cycle/yoga).', points: 50, completed: false, category: 'exercise' },
    { id: 'h-2', title: 'Adequate High-Quality Sleep', description: 'Get 7-8 hours. Click the Alarm to set your schedule.', points: 50, completed: false, category: 'sleep' },
    { id: 'h-3', title: 'Healthy Balanced Nutrition', description: 'Eat fruits, veggies, and whole grains.', points: 50, completed: false, category: 'nutrition' },
    { id: 'h-4', title: 'Mindfulness & Meditation', description: '5-10 mins of deep breathing or silence.', points: 50, completed: false, category: 'mindfulness' },
    { id: 'h-5', title: 'Gratitude & Positive Reflection', description: 'Write down 3 things you appreciate today.', points: 50, completed: false, category: 'mindfulness' },
    { id: 'h-6', title: 'Purpose & Growth Mindset', description: 'Cultivate a personal goal or learn something new.', points: 50, completed: false, category: 'mindfulness' },
    { id: 'h-7', title: 'Micro-acts of Joy & Kindness', description: 'Perform one small act of kindness.', points: 50, completed: false, category: 'mindfulness' },
    { id: 'init-0', title: 'Zen Garden Breathing', description: 'Perform 10 deep breaths. Stay calm!', points: 200, completed: false, category: 'mindfulness' },
    { id: 'init-2', title: 'Hydration Hero', description: 'Drink a glass of water!', points: 250, completed: false, category: 'water' }
  ]);

  const addNotification = (text: string, type: 'coins' | 'level' | 'zone' | 'deduction') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 2500);
  };

  const handleTaskComplete = (points: number) => {
    // Calculate based on current state to avoid double side-effects in StrictMode
    const newScore = gameState.score + points;
    const newLevel = Math.floor(newScore / 100) + 1;
    const levelUpOccurred = newLevel > gameState.level;

    let updatedZones = [...gameState.unlockedZones];

    if (newScore >= 250) {
      if (!updatedZones.includes('camping')) {
        updatedZones.push('camping');
        addNotification('UNLOCKED: Camping Grounds!', 'zone');
      }
      if (!updatedZones.includes('salon')) {
        updatedZones.push('salon');
        addNotification('UNLOCKED: Local Restaurant!', 'zone');
      }
      if (!updatedZones.includes('yoga')) {
        updatedZones.push('yoga');
        addNotification('UNLOCKED: Yoga Studio!', 'zone');
      }
    }

    if (newLevel >= 4) {
      if (!updatedZones.includes('gym')) {
        updatedZones.push('gym');
        addNotification('UNLOCKED: Power Pulse Gym!', 'zone');
      }
    }

    if (newLevel >= 5) {
      if (!updatedZones.includes('sevahub')) {
        updatedZones.push('sevahub');
        addNotification('UNLOCKED: Seva Hub!', 'zone');
      }
    }

    if (points > 0) addNotification(`+${points} Coins!`, 'coins');
    if (levelUpOccurred) {
      addNotification(`LEVEL UP! LVL ${newLevel}`, 'level');
      // Trigger Achievement
      if (userProfile?.full_name) {
        dataService.createAchievement('level_up', `${userProfile.full_name} reached Level ${newLevel}!`);
      }
    }

    setGameState(prev => ({
      ...prev,
      score: newScore,
      level: newLevel,
      unlockedZones: updatedZones
    }));

    setMessages(prev => [...prev, { id: `cel-${Date.now()}`, sender: 'bot', text: `Verified! +${points} Coins earned! 🪙`, timestamp: Date.now() }]);
  };

  const handleRemoveTree = (treeIndex: number, cost: number) => {
    if (gameState.score >= cost) {
      setGameState(prev => ({ ...prev, score: prev.score - cost, removedTrees: [...prev.removedTrees, treeIndex] }));
      addNotification("50 coins deducted", 'deduction');
      return true;
    }
    return false;
  };

  const [isShopOpen, setIsShopOpen] = useState(false);

  const handleShopBuy = (item: FurnitureItem, cost: number) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score - cost,
      inventory: [...prev.inventory, item]
    }));
    addNotification(`Bought ${item}`, 'coins');
  };

  const handlePlaceItem = (item: FurnitureItem, x: number, y: number) => {
    setGameState(prev => {
      const newInventory = [...prev.inventory];
      const itemIndex = newInventory.indexOf(item);
      if (itemIndex > -1) {
        newInventory.splice(itemIndex, 1);
      }
      return {
        ...prev,
        inventory: newInventory,
        placedItems: [...(prev.placedItems || []), { id: `item-${Date.now()}`, item, x, y }]
      };
    });
  };

  const handleGymMouseDown = (e: React.MouseEvent) => {
    setIsDraggingGym(true);
    gymDragStartRef.current = { x: e.clientX - gymOffset.x, y: e.clientY - gymOffset.y };
  };
  const handleGymMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingGym) return;
    setGymOffset({
      x: e.clientX - gymDragStartRef.current.x,
      y: e.clientY - gymDragStartRef.current.y
    });
  };
  const handleGymMouseUp = () => {
    setIsDraggingGym(false);
    setGymPinchStartDist(null);
  };
  const handleGymTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setGymPinchStartDist(d);
      setGymPinchStartZoom(gymZoom);
      setIsDraggingGym(false);
    } else if (e.touches.length === 1) {
      setIsDraggingGym(true);
      gymDragStartRef.current = { x: e.touches[0].clientX - gymOffset.x, y: e.touches[0].clientY - gymOffset.y };
    }
  };
  const handleGymTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && gymPinchStartDist !== null) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = d / gymPinchStartDist;
      setGymZoom(Math.min(Math.max(gymPinchStartZoom * ratio, 0.5), 3));
    } else if (e.touches.length === 1 && isDraggingGym) {
      setGymOffset({
        x: e.touches[0].clientX - gymDragStartRef.current.x,
        y: e.touches[0].clientY - gymDragStartRef.current.y
      });
    }
  };
  const handleGymWheel = (e: React.WheelEvent) => {
    const step = 0.1;
    const delta = e.deltaY < 0 ? step : -step;
    setGymZoom(z => Math.min(Math.max(z + delta, 0.5), 3));
  };

  const handleRestaurantMouseDown = (e: React.MouseEvent) => {
    setIsDraggingRestaurant(true);
    restaurantDragStartRef.current = { x: e.clientX - restaurantOffset.x, y: e.clientY - restaurantOffset.y };
  };
  const handleRestaurantMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRestaurant) return;
    setRestaurantOffset({
      x: e.clientX - restaurantDragStartRef.current.x,
      y: e.clientY - restaurantDragStartRef.current.y
    });
  };
  const handleRestaurantMouseUp = () => {
    setIsDraggingRestaurant(false);
    setRestaurantPinchStartDist(null);
  };
  const handleRestaurantTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setRestaurantPinchStartDist(d);
      setRestaurantPinchStartZoom(restaurantZoom);
      setIsDraggingRestaurant(false);
    } else if (e.touches.length === 1) {
      setIsDraggingRestaurant(true);
      restaurantDragStartRef.current = { x: e.touches[0].clientX - restaurantOffset.x, y: e.touches[0].clientY - restaurantOffset.y };
    }
  };
  const handleRestaurantTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && restaurantPinchStartDist !== null) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = d / restaurantPinchStartDist;
      setRestaurantZoom(Math.min(Math.max(restaurantPinchStartZoom * ratio, 0.5), 3));
    } else if (e.touches.length === 1 && isDraggingRestaurant) {
      setRestaurantOffset({
        x: e.touches[0].clientX - restaurantDragStartRef.current.x,
        y: e.touches[0].clientY - restaurantDragStartRef.current.y
      });
    }
  };
  const handleRestaurantWheel = (e: React.WheelEvent) => {
    const step = 0.1;
    const delta = e.deltaY < 0 ? step : -step;
    setRestaurantZoom(z => Math.min(Math.max(z + delta, 0.5), 3));
  };

  const handleHospitalMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHospital(true);
    hospitalDragStartRef.current = { x: e.clientX - hospitalOffset.x, y: e.clientY - hospitalOffset.y };
  };
  const handleHospitalMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingHospital) return;
    setHospitalOffset({
      x: e.clientX - hospitalDragStartRef.current.x,
      y: e.clientY - hospitalDragStartRef.current.y
    });
  };
  const handleHospitalMouseUp = () => {
    setIsDraggingHospital(false);
    setHospitalPinchStartDist(null);
  };
  const handleHospitalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setHospitalPinchStartDist(d);
      setHospitalPinchStartZoom(hospitalZoom);
      setIsDraggingHospital(false);
    } else if (e.touches.length === 1) {
      setIsDraggingHospital(true);
      hospitalDragStartRef.current = { x: e.touches[0].clientX - hospitalOffset.x, y: e.touches[0].clientY - hospitalOffset.y };
    }
  };
  const handleHospitalTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && hospitalPinchStartDist !== null) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = d / hospitalPinchStartDist;
      setHospitalZoom(Math.min(Math.max(hospitalPinchStartZoom * ratio, 0.5), 3));
    } else if (e.touches.length === 1 && isDraggingHospital) {
      setHospitalOffset({
        x: e.touches[0].clientX - hospitalDragStartRef.current.x,
        y: e.touches[0].clientY - hospitalDragStartRef.current.y
      });
    }
  };
  const handleHospitalWheel = (e: React.WheelEvent) => {
    const step = 0.1;
    const delta = e.deltaY < 0 ? step : -step;
    setHospitalZoom(z => Math.min(Math.max(z + delta, 0.5), 3));
  };

  const handleSendGlobalMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `global-user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: Date.now()
    };
    setGlobalChatMessages(prev => [...prev.slice(-19), newMsg]);

    if (Math.random() > 0.7) {
      setTimeout(() => {
        const sproutMsg: ChatMessage = {
          id: `global-sprout-${Date.now()}`,
          sender: 'bot',
          senderName: 'Sprout',
          text: `Love the energy, Homesteader! Keeping our community vibrant. 🤖💚`,
          timestamp: Date.now()
        };
        setGlobalChatMessages(prev => [...prev.slice(-19), sproutMsg]);
      }, 1500);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'missions': return <TaskBoard tasks={tasks} setTasks={setTasks} onTaskComplete={handleTaskComplete} currentScore={gameState.score} setGameState={setGameState} />;
      case 'chat': return (
        <MobileInterface
          key={mobileEntrySource}
          messages={messages}
          setMessages={setMessages}
          gameState={gameState}
          setGameState={setGameState}
          initialApp={mobileEntrySource}
          onVisitGym={() => setCurrentView('gym-interior')}
          onVisitRestaurant={() => setCurrentView('restaurant-interior')}
          onVisitHospital={() => setCurrentView('hospital-interior')}
          onVisitSevaHub={() => setIsSevaHubOpen(true)}
        />
      );
      case 'leaderboard': return <Leaderboard gameState={gameState} />;
      case 'medbay': return (
        <MedBay
          onReturn={(rewardEarned) => {
            if (rewardEarned) {
              handleTaskComplete(50);
            }
            setCurrentView('garden');
          }}
        />
      );
      case 'global-chat': return (
        <div className="flex-1 flex flex-col h-full bg-[#0F172A]/80 backdrop-blur-xl">
          <GlobalChat
            messages={globalChatMessages}
            onSendMessage={handleSendGlobalMessage}
            onBack={() => {
              setCurrentView('gym-interior');
            }}
          />
        </div>
      );
      case 'trainer-chat': return (
        <div className="flex-1 flex flex-col h-full bg-stone-900/60 backdrop-blur-md">
          <button
            onClick={() => setCurrentView('gym-interior')}
            className="m-4 p-2 bg-white/80 rounded-full w-fit shadow-sm border border-stone-300 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} className="text-stone-600" />
            <span className="text-[10px] font-black uppercase tracking-widest pr-2">Back to Gym</span>
          </button>
          <TrainerChat messages={trainerMessages} setMessages={setTrainerMessages} />
        </div>
      );
      case 'nutrition-chat': return (
        <div className="flex-1 flex flex-col h-full bg-stone-900/60 backdrop-blur-md">
          <button
            onClick={() => setCurrentView('restaurant-interior')}
            className="m-4 p-2 bg-white/80 rounded-full w-fit shadow-sm border border-stone-300 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} className="text-stone-600" />
            <span className="text-[10px] font-black uppercase tracking-widest pr-2">Back to Diner</span>
          </button>
          <NutritionChat messages={nutritionMessages} setMessages={setNutritionMessages} onBack={() => setCurrentView('restaurant-interior')} />
        </div>
      );
      case 'doctor-chat': return (
        <div className="flex-1 flex flex-col h-full bg-[#E3F2FD]/60 backdrop-blur-md">
          <button
            onClick={() => setCurrentView('hospital-interior')}
            className="m-4 p-2 bg-white/80 rounded-full w-fit shadow-sm border border-stone-300 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} className="text-stone-600" />
            <span className="text-[10px] font-black uppercase tracking-widest pr-2">Back to Med Wing</span>
          </button>
          <DoctorChat messages={doctorMessages} setMessages={setDoctorMessages} onBack={() => setCurrentView('hospital-interior')} />
        </div>
      );
      case 'hospital-interior': return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F0F2F5]">
          <style>{`
            .tile-floor {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='32' height='32' fill='%23ffffff'/%3E%3Crect width='32' height='32' x='32' fill='%23f9f9f9'/%3E%3Crect width='32' height='32' y='32' fill='%23f5f5f5'/%3E%3Crect width='32' height='32' x='32' y='32' fill='%23ffffff'/%3E%3Crect width='64' height='64' fill='none' stroke='%23d8d8d8' stroke-width='1'/%3E%3C/svg%3E");
              background-size: 64px 64px;
            }
            .hospital-wall {
               background-color: #E6E9EE;
               border-bottom: 20px solid #4A90E2;
            }
            .reception-area:hover .desk-hint { opacity: 1; transform: translate(-50%, 0); }
            .desk-hint { opacity: 0; transform: translate(-50%, 10px); transition: all 0.3s ease; }
            .animate-blink { animation: blink 4s infinite; }
            @keyframes blink { 0%, 90%, 100% { opacity: 1; } 95% { opacity: 0; } }
            .doctor-hover-hint { opacity: 0; transform: translate(-50%, 10px); transition: all 0.3s ease; }
            .doctor-container:hover .doctor-hover-hint { opacity: 1; transform: translate(-50%, 0); }
            .monitor-hover-hint { opacity: 0; transform: translate(-50%, -10px); transition: all 0.3s ease; }
            .monitor-container:hover .monitor-hover-hint { opacity: 1; transform: translate(-50%, 0); }
          `}</style>
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <button
              onClick={() => { setMobileEntrySource('home'); setCurrentView('chat'); }}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-stone-200 pointer-events-auto active:scale-95 transition-transform flex items-center gap-2"
            >
              <ChevronLeft size={20} className="text-stone-600" />
              <span className="text-[10px] font-black uppercase tracking-widest pr-2">Back to Map</span>
            </button>
          </div>
          <div
            className="flex-1 relative overflow-hidden bg-stone-100 flex flex-col cursor-grab active:cursor-grabbing"
            onMouseDown={handleHospitalMouseDown}
            onMouseMove={handleHospitalMouseMove}
            onMouseUp={handleHospitalMouseUp}
            onMouseLeave={handleHospitalMouseUp}
            onTouchStart={handleHospitalTouchStart}
            onTouchMove={handleHospitalTouchMove}
            onTouchEnd={handleHospitalMouseUp}
            onWheel={handleHospitalWheel}
          >
            <div
              className="absolute w-[4000px] h-[4000px] top-1/2 left-1/2 tile-floor"
              style={{
                transform: `translate3d(calc(-50% + ${hospitalOffset.x}px), calc(-50% + ${hospitalOffset.y}px), 0) scale(${hospitalZoom})`,
                willChange: 'transform'
              }}
            >
              {/* RECEPTION AREA SCENE */}
              <div className="absolute top-[1250px] left-[1400px] w-[1200px] h-[600px] flex flex-col items-center justify-end">

                {/* Back Wall */}
                <div className="absolute inset-x-0 bottom-[100px] top-[-200px] hospital-wall border-x-4 border-t-4 border-stone-400 z-0">
                  {/* Elevator (Left) */}
                  <div className="absolute bottom-10 left-[80px] w-[160px] h-[260px] bg-stone-300 border-4 border-stone-800 rounded-sm">
                    <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 bg-stone-800 text-white font-mono text-xs px-3 py-1 rounded-t-lg">1 F</div>
                    <div className="absolute inset-1 flex gap-1">
                      <div className="flex-1 bg-stone-400 border-r-2 border-stone-500 shadow-inner" />
                      <div className="flex-1 bg-stone-400 border-l-2 border-stone-500 shadow-inner" />
                    </div>
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                      <div className="w-6 h-12 bg-stone-200 border-2 border-stone-400 rounded-lg flex flex-col items-center justify-center gap-1">
                        <div className="w-2 h-2 bg-stone-400 rounded-full" />
                        <div className="w-2 h-2 bg-stone-400 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Poster Sign (Center Left) */}
                  <div className="absolute top-10 left-[350px] w-[110px] h-[150px] bg-white border-2 border-stone-300 shadow-sm p-2 flex flex-col gap-2">
                    <div className="h-4 bg-[#4A90E2]" />
                    <div className="flex-1 flex flex-col gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-1 bg-stone-200 w-full rounded-full" />)}
                    </div>
                  </div>

                  {/* Wall Clock (Center Right) */}
                  <div className="absolute top-10 right-[350px] w-32 h-32 rounded-full bg-white border-[10px] border-red-500 shadow-inner flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-10 bg-black rounded-full origin-bottom" style={{ transform: 'rotate(45deg) translateY(-50%)' }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-black rounded-full origin-bottom" style={{ transform: 'rotate(180deg) translateY(-50%)' }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  </div>

                  {/* Double Doors (Right) */}
                  <div className="absolute bottom-10 right-[80px] w-[280px] h-[280px] bg-[#E67E22] border-4 border-stone-800 flex gap-1 p-1">
                    <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-16 h-6 bg-stone-200 border-2 border-stone-400" />
                    <div className="flex-1 bg-[#D35400] border-r-2 border-stone-800 shadow-inner relative">
                      <div className="absolute top-[40px] right-2 w-1.5 h-16 bg-stone-300 rounded-full border border-stone-800" />
                    </div>
                    <div className="flex-1 bg-[#D35400] border-l-2 border-stone-800 shadow-inner relative overflow-hidden">
                      <div className="absolute top-[30px] left-4 right-4 h-24 bg-[#B3E5FC] border-2 border-stone-800/40 rounded shadow-inner" />
                      <div className="absolute top-[40px] left-2 w-1.5 h-16 bg-stone-300 rounded-full border border-stone-800" />
                    </div>
                  </div>
                </div>

                {/* Main Reception Desk */}
                <div
                  onClick={(e) => { e.stopPropagation(); setCurrentView('medbay'); }}
                  className="reception-area relative w-[600px] h-[220px] cursor-pointer group z-10"
                >
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[18px] font-black py-2 px-6 rounded-xl border-4 border-red-800 shadow-2xl desk-hint whitespace-nowrap z-50 uppercase tracking-widest">
                    CONSULT DOCTOR 🩺
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 border-r-4 border-b-4 border-red-800 rotate-45" />
                  </div>

                  <div className="absolute -top-40 left-0 w-full flex justify-around px-20">
                    <div className="flex flex-col items-center">
                      <div className="w-28 h-20 bg-stone-800 border-4 border-stone-900 rounded p-1 shadow-lg">
                        <div className="w-full h-full bg-[#1A1A1A] rounded-sm relative overflow-hidden">
                          <div className="absolute inset-0 bg-blue-500/10" />
                          <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/5 rounded-full" />
                        </div>
                      </div>
                      <div className="w-2 h-8 bg-stone-700" />
                      <div className="w-16 h-1.5 bg-stone-700 rounded-full" />
                    </div>
                    <div className="flex flex-col items-center translate-y-4 scale-95">
                      <div className="w-28 h-20 bg-stone-800 border-4 border-stone-900 rounded p-1 shadow-lg">
                        <div className="w-full h-full bg-[#1A1A1A] rounded-sm relative overflow-hidden">
                          <div className="absolute bottom-4 left-4 w-4 h-4 bg-red-500/20 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="w-2 h-8 bg-stone-700" />
                      <div className="w-16 h-1.5 bg-stone-700 rounded-full" />
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-t-[40px] border-x-4 border-t-4 border-stone-800 overflow-hidden shadow-2xl flex flex-col">
                    <div className="h-6 bg-stone-200 border-b-2 border-stone-800" />
                    <div className="flex-1 bg-[#EE4D5D] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                    </div>
                    <div className="h-[60px] bg-[#4A90E2] border-y-4 border-stone-800/20 relative">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    </div>
                    <div className="flex-1 bg-[#EE4D5D] shadow-inner" />
                    <div className="h-4 bg-stone-800/10" />
                  </div>
                </div>
              </div>

              {/* PIXEL DOCTOR CHARACTER - Clickable to open chat */}
              <div
                onClick={(e) => { e.stopPropagation(); setCurrentView('doctor-chat'); }}
                className="absolute top-[1750px] left-[1550px] flex flex-col items-center cursor-pointer z-20 group doctor-container"
              >
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[12px] font-black py-2 px-4 rounded-xl border-2 border-blue-800 shadow-xl doctor-hover-hint whitespace-nowrap z-50">
                  TALK TO DR. TRIAGE 🩺
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 border-r-2 border-b-2 border-blue-800 rotate-45" />
                </div>

                {/* Hair */}
                <div className="w-16 h-8 bg-[#5D4037] rounded-t-xl border-4 border-stone-900 relative z-30" />
                {/* Face */}
                <div className="w-16 h-14 bg-[#F5D5C5] rounded-b-lg border-x-4 border-b-4 border-stone-900 relative z-20 -mt-2">
                  <div className="absolute top-4 left-0 w-full flex justify-around px-3">
                    <div className="w-2 h-2 bg-stone-900 rounded-full animate-blink" />
                    <div className="w-2 h-2 bg-stone-900 rounded-full animate-blink" />
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-400 rounded-full opacity-60" />
                </div>
                {/* Body (White Lab Coat over Blue Shirt) */}
                <div className="w-24 h-24 relative flex justify-center -mt-2">
                  {/* Inner Blue Shirt */}
                  <div className="absolute top-0 w-8 h-24 bg-[#4A90E2] border-x-4 border-stone-900 z-0" />
                  {/* Left side coat */}
                  <div className="absolute left-0 w-10 h-24 bg-white border-l-4 border-t-4 border-stone-900 rounded-tl-xl shadow-sm z-10" />
                  {/* Right side coat */}
                  <div className="absolute right-0 w-10 h-24 bg-white border-r-4 border-t-4 border-stone-900 rounded-tr-xl shadow-sm z-10" />
                  {/* Stethoscope */}
                  <div className="absolute top-2 w-14 h-16 border-b-[6px] border-x-[6px] border-stone-700 rounded-b-3xl z-[15] opacity-80" />
                  <div className="absolute top-16 left-[20px] w-4 h-4 bg-stone-600 border-2 border-stone-800 rounded-full z-[16]" />
                </div>
                {/* Pants */}
                <div className="flex gap-1 -mt-2 relative z-0">
                  <div className="w-10 h-20 bg-[#1E3A8A] border-4 border-stone-900 rounded-b-sm" />
                  <div className="w-10 h-20 bg-[#1E3A8A] border-4 border-stone-900 rounded-b-sm" />
                </div>
                {/* Shoes */}
                <div className="flex gap-2 -mt-1">
                  <div className="w-12 h-6 bg-[#3E2723] border-4 border-stone-900 rounded-sm" />
                  <div className="w-12 h-6 bg-[#3E2723] border-4 border-stone-900 rounded-sm" />
                </div>
              </div>

              {/* GLOBAL CHAT MONITOR (CLICKABLE) */}
              <div
                onClick={(e) => { e.stopPropagation(); setCurrentView('global-chat'); }}
                className="absolute top-[1750px] left-[1850px] w-[200px] h-[350px] cursor-pointer hover:scale-110 active:scale-95 transition-all group monitor-container scale-75 origin-top-left z-[55]"
              >
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-[#0F172A] text-cyan-400 text-[12px] font-black py-2 px-4 rounded-xl border-2 border-cyan-800 shadow-[0_0_20px_rgba(34,211,238,0.3)] monitor-hover-hint whitespace-nowrap z-50">
                  JOIN THE FEED 🌍
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F172A] border-r-2 border-b-2 border-cyan-800 rotate-45" />
                </div>

                {/* Bottom Plate */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160px] h-[20px] bg-stone-700 border-4 border-stone-900 rounded-full" />
                {/* Stand Pillar */}
                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[80px] h-[180px] bg-orange-600 border-4 border-stone-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-700 opacity-50" />
                  <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[40px] h-[40px] bg-stone-300 border-4 border-stone-900 rounded-full flex items-center justify-center">
                    <div className="w-[15px] h-[15px] bg-white rounded-full opacity-60" />
                  </div>
                </div>
                {/* Monitor Housing */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[180px] bg-yellow-400 border-4 border-stone-900 rounded-3xl p-4 flex items-center justify-center shadow-xl group-hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-shadow">
                  {/* Red Frame */}
                  <div className="w-full h-full bg-red-600 border-4 border-stone-900 rounded-2xl p-2 flex items-center justify-center">
                    {/* Blue Screen */}
                    <div className="w-full h-full bg-[#1E88E5] border-4 border-stone-900 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-blue-400 opacity-20 translate-x-4 -translate-y-4 rotate-45 pointer-events-none" />
                      <div className="flex flex-col items-center gap-1">
                        <Globe size={32} className="text-white animate-spin-slow opacity-80" />
                        <span className="text-stone-900 font-black text-center leading-none uppercase text-[14px] px-2 select-none tracking-tighter">GLOBAL CHAT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER LOGO */}
              <div className="absolute top-[1800px] left-[1900px] opacity-10 pointer-events-none">
                <Activity size={400} className="text-stone-900" />
              </div>
            </div>
          </div>
        </div>
      );
      case 'restaurant-interior': return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          <style>{`
            .dietician-desk-container:hover .dietician-desk-hover-hint {
              opacity: 1;
              transform: translate(-50%, 0);
            }
            .dietician-desk-hover-hint {
              opacity: 0;
              transform: translate(-50%, 10px);
              transition: all 0.3s ease;
            }
            .monitor-hover-hint {
               opacity: 0;
               transform: translate(-50%, -10px);
               transition: all 0.3s ease;
            }
            .monitor-container:hover .monitor-hover-hint {
               opacity: 1;
               transform: translate(-50%, 0);
            }
          `}</style>
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <button
              onClick={() => {
                setMobileEntrySource('home');
                setCurrentView('chat');
              }}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-stone-200 pointer-events-auto active:scale-95 transition-transform flex items-center gap-2"
            >
              <ChevronLeft size={20} className="text-stone-600" />
              <span className="text-[10px] font-black uppercase tracking-widest pr-2">Back to Map</span>
            </button>
          </div>
          <div
            className="flex-1 relative overflow-hidden bg-[#2D1B15] flex flex-col cursor-grab active:cursor-grabbing"
            onMouseDown={handleRestaurantMouseDown}
            onMouseMove={handleRestaurantMouseMove}
            onMouseUp={handleRestaurantMouseUp}
            onMouseLeave={handleRestaurantMouseUp}
            onTouchStart={handleRestaurantTouchStart}
            onTouchMove={handleRestaurantTouchMove}
            /* Fixed: handleMapMouseUp was a typo for handleRestaurantMouseUp */
            onTouchEnd={handleRestaurantMouseUp}
            onWheel={handleRestaurantWheel}
          >
            <div
              className="absolute w-[4000px] h-[4000px] top-1/2 left-1/2"
              style={{
                transform: `translate3d(calc(-50% + ${restaurantOffset.x}px), calc(-50% + ${restaurantOffset.y}px), 0) scale(${restaurantZoom})`,
                willChange: 'transform',
                backgroundImage: `
                  linear-gradient(45deg, #000 25%, transparent 25%),
                  linear-gradient(-45deg, #000 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #000 75%),
                  linear-gradient(-45deg, transparent 75%, #000 75%)
                `,
                backgroundSize: '160px 160px',
                backgroundPosition: '0 0, 0 80px, 80px -80px, -80px 0px',
                backgroundColor: '#fff'
              }}
            >
              <div
                onClick={(e) => { e.stopPropagation(); setCurrentView('global-chat'); }}
                className="absolute top-[2350px] left-[2250px] w-[200px] h-[350px] cursor-pointer hover:scale-110 active:scale-95 transition-all group monitor-container scale-75 origin-top-left z-[55]"
              >
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-[#0F172A] text-cyan-400 text-[12px] font-black py-2 px-4 rounded-xl border-2 border-cyan-800 shadow-[0_0_20px_rgba(34,211,238,0.3)] monitor-hover-hint whitespace-nowrap z-50">
                  JOIN THE FEED 🌍
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F172A] border-r-2 border-b-2 border-cyan-800 rotate-45" />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160px] h-[20px] bg-stone-700 border-4 border-stone-900 rounded-full" />
                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[80px] h-[180px] bg-orange-600 border-4 border-stone-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-700 opacity-50" />
                  <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[40px] h-[40px] bg-stone-300 border-4 border-stone-900 rounded-full flex items-center justify-center">
                    <div className="w-[15px] h-[15px] bg-white rounded-full opacity-60" />
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[180px] bg-yellow-400 border-4 border-stone-900 rounded-3xl p-4 flex items-center justify-center shadow-xl group-hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-shadow">
                  <div className="w-full h-full bg-red-600 border-4 border-stone-900 rounded-2xl p-2 flex items-center justify-center">
                    <div className="w-full h-full bg-[#1E88E5] border-4 border-stone-900 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-blue-400 opacity-20 translate-x-4 -translate-y-4 rotate-45 pointer-events-none" />
                      <div className="flex flex-col items-center gap-1">
                        <Globe size={32} className="text-white animate-spin-slow opacity-80" />
                        <span className="text-stone-900 font-black text-center leading-none uppercase text-[14px] px-2 select-none tracking-tighter">GLOBAL CHAT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={(e) => { e.stopPropagation(); setCurrentView('nutrition-chat'); }}
                className="absolute top-[2350px] left-[1950px] flex flex-col items-center animate-bounce duration-[2000ms] cursor-pointer group hover:scale-110 transition-transform"
              >
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-stone-600">
                  Talk to Bite-Sized 🥗
                </div>
                <div className="w-16 h-16 bg-[#5D4037] rounded-full border-4 border-black -mb-8 relative z-0" />
                <div className="w-32 h-32 bg-[#F5D5C5] rounded-3xl border-4 border-black relative z-20 flex flex-col items-center">
                  <div className="absolute top-0 left-0 w-full h-8 bg-[#5D4037] rounded-t-2xl border-b-2 border-black" />
                  <div className="absolute top-0 left-0 w-16 h-16 bg-[#5D4037] rounded-br-full" />
                  <div className="flex justify-around w-full mt-12 px-6">
                    <div className="w-2.5 h-2.5 bg-black rounded-full" />
                    <div className="w-2.5 h-2.5 bg-black rounded-full" />
                  </div>
                  <div className="w-12 h-6 bg-red-500 rounded-b-full border-2 border-black mt-4 overflow-hidden">
                    <div className="w-full h-2 bg-white" />
                  </div>
                </div>
                <div className="w-40 h-32 bg-red-500 rounded-t-[40px] border-4 border-black -mt-4 relative z-10 flex flex-col items-center">
                  <div className="flex gap-1 -mt-1">
                    <div className="w-12 h-8 bg-white border-x-4 border-b-4 border-black rounded-b-lg" style={{ transform: 'skewX(-20deg)' }} />
                    <div className="w-12 h-8 bg-white border-x-4 border-b-4 border-black rounded-b-lg" style={{ transform: 'skewX(20deg)' }} />
                  </div>
                  <div className="absolute -left-12 top-4 w-12 h-32 bg-[#F5D5C5] rounded-full border-4 border-black" style={{ transform: 'rotate(25deg)' }}>
                    <div className="absolute -bottom-4 left-0 w-16 h-16 bg-[#4CAF50] rounded-full border-4 border-black flex items-center justify-center">
                      <div className="w-1.5 h-6 bg-amber-900 border border-black absolute -top-4" />
                    </div>
                  </div>
                  <div className="absolute -right-12 top-4 w-12 h-32 bg-[#F5D5C5] rounded-full border-4 border-black" style={{ transform: 'rotate(-25deg)' }} />
                </div>
                <div className="flex gap-2 -mt-4">
                  <div className="w-16 h-40 bg-[#006064] border-4 border-black rounded-b-lg" />
                  <div className="w-16 h-40 bg-[#006064] border-4 border-black rounded-b-lg" />
                </div>
                <div className="flex gap-4 -mt-2">
                  <div className="w-18 h-8 bg-[#F5D5C5] rounded-full border-4 border-black" />
                  <div className="w-18 h-8 bg-[#F5D5C5] rounded-full border-4 border-black" />
                </div>
              </div>

              <div className="absolute top-[1200px] left-[1500px] w-[1000px] h-[600px] flex flex-col items-center">
                <div className="absolute inset-0 bg-[#2D3436] rounded-xl border-4 border-[#000] overflow-hidden"
                  style={{ backgroundImage: 'linear-gradient(to right, #000 2px, transparent 2px), linear-gradient(to bottom, #000 2px, transparent 2px)', backgroundSize: '40px 20px' }}>
                  <div className="absolute top-10 left-10 w-48 space-y-12">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-4 bg-[#D1A377] border-2 border-black rounded-sm shadow-lg relative">
                        <div className="absolute -top-8 left-4 flex gap-2">
                          <div className="w-8 h-8 bg-white border-2 border-black rounded-full" />
                          <div className="w-8 h-8 bg-[#E74C3C] border-2 border-black rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-[#34495E] border-4 border-black relative">
                    <div className="absolute bottom-0 w-full h-8 bg-[#D1A377] border-t-2 border-black" />
                    <div className="absolute -top-12 left-0 w-full h-16 flex">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={`flex-1 h-full border-x border-b-4 border-black ${i % 2 === 0 ? 'bg-[#F39C12]' : 'bg-[#D35400]'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-10 right-10 w-48 flex flex-col gap-6 items-center">
                    <div className="w-40 h-56 bg-[#1C1C1C] border-4 border-[#333] p-4 shadow-xl">
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-1 bg-[#F1C40F] rounded-full w-2/3" />
                        ))}
                      </div>
                    </div>
                    <div className="w-32 h-32 bg-[#95A5A6] border-4 border-black relative">
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#E74C3C] rounded-full border-2 border-black" />
                      <div className="absolute bottom-4 left-4 right-4 h-12 bg-[#2C3E50] border-2 border-black" />
                    </div>
                  </div>
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); setIsDieticianBoardOpen(true); }}
                  className="absolute bottom-40 w-[1100px] h-[160px] bg-[#8D6E63] border-4 border-black shadow-2xl flex flex-col cursor-pointer group dietician-desk-container"
                >
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[24px] font-black py-4 px-8 rounded-2xl border-4 border-stone-700 shadow-2xl dietician-desk-hover-hint whitespace-nowrap z-50">
                    CONSULT A DIETICIAN 🥗
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-800 border-r-4 border-b-4 border-stone-700 rotate-45" />
                  </div>
                  <div className="h-4 bg-[#D1A377] border-b-2 border-black" />
                  <div className="flex-1 flex" style={{ backgroundImage: 'linear-gradient(to right, #5D4037 4px, transparent 4px)', backgroundSize: '60px 100%' }}>
                  </div>
                </div>
                <div className="absolute bottom-10 w-full flex justify-around px-20">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-24 h-12 bg-[#C0392B] rounded-full border-4 border-black shadow-lg relative">
                        <div className="absolute top-1 left-2 right-2 h-4 bg-white/20 rounded-full" />
                      </div>
                      <div className="w-4 h-32 bg-[#2D3436] border-2 border-black" />
                      <div className="w-20 h-6 bg-[#2D3436] border-2 border-black rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {isDieticianBoardOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
              <div className="bg-[#1A1A1C] border-4 border-[#2E7D32] w-full max-w-sm rounded-xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-[#2E7D32] p-4 flex justify-between items-center border-b-4 border-[#1B5E20]">
                  <div className="flex items-center gap-3 text-white">
                    <Search size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">Online Dietician Consult</span>
                  </div>
                  <button onClick={() => setIsDieticianBoardOpen(false)} className="text-white/60 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4 space-y-3 bg-stone-900">
                  <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest mb-4">Professional nutrition help in India:</p>
                  {DIETICIAN_RESOURCES.map((resource, i) => (
                    <button
                      key={i}
                      onClick={() => window.open(resource.url, '_blank')}
                      className="w-full bg-[#2C2C2E] border-2 border-[#3E3E42] p-4 rounded-xl flex items-center justify-between group hover:border-[#2E7D32] transition-all hover:bg-[#2E7D32]/10 active:scale-95"
                    >
                      <span className="text-white font-bold text-sm">{resource.name}</span>
                      <ExternalLink size={16} className="text-stone-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
                <div className="bg-[#2E7D32]/10 p-4 border-t-2 border-[#2E7D32]/20">
                  <p className="text-[9px] text-stone-500 italic text-center">Consulting a professional is recommended for custom health plans.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
      case 'gym-interior': return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          <style>{`
             @keyframes blink {
               0%, 90%, 100% { transform: scaleY(1); }
               95% { transform: scaleY(0.1); }
             }
             .animate-blink {
               animation: blink 4s infinite;
               transform-origin: center;
             }
             .trainer-hover-hint {
               opacity: 0;
               transform: translateY(10px);
               transition: all 0.3s ease;
             }
             .trainer-container:hover .trainer-hover-hint {
               opacity: 1;
               transform: translateY(0);
             }
             .desk-hover-hint {
               opacity: 0;
               transform: translate(-50%, 10px);
               transition: all 0.3s ease;
             }
             .desk-container:hover .desk-hover-hint {
               opacity: 1;
               transform: translate(-50%, 0);
             }
             .monitor-hover-hint {
               opacity: 0;
               transform: translate(-50%, -10px);
               transition: all 0.3s ease;
             }
             .monitor-container:hover .monitor-hover-hint {
               opacity: 1;
               transform: translate(-50%, 0);
             }
           `}</style>
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <button
              onClick={() => {
                setMobileEntrySource('home');
                setCurrentView('chat');
              }}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-stone-200 pointer-events-auto active:scale-95 transition-transform flex items-center gap-2"
            >
              <ChevronLeft size={20} className="text-stone-600" />
              <span className="text-[10px] font-black uppercase tracking-widest pr-2">Back to Map</span>
            </button>
          </div>
          <div
            className="flex-1 cursor-grab active:cursor-grabbing relative bg-white"
            onMouseDown={handleGymMouseDown}
            onMouseMove={handleGymMouseMove}
            onMouseUp={handleGymMouseUp}
            onMouseLeave={handleGymMouseUp}
            onTouchStart={handleGymTouchStart}
            onTouchMove={handleGymTouchMove}
            onTouchEnd={handleGymMouseUp}
            onWheel={handleGymWheel}
          >
            <div
              className="absolute w-[3000px] h-[3000px] top-1/2 left-1/2"
              style={{
                transform: `translate3d(calc(-50% + ${gymOffset.x}px), calc(-50% + ${gymOffset.y}px), 0) scale(${gymZoom})`,
                willChange: 'transform',
                backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(255, 140, 0, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 70% 60%, rgba(255, 100, 0, 0.12) 0%, transparent 35%),
                    radial-gradient(circle at 45% 45%, rgba(255, 160, 0, 0.1) 0%, transparent 45%),
                    radial-gradient(circle at 15% 85%, rgba(255, 120, 0, 0.1) 0%, transparent 30%),
                    linear-gradient(to right, #000000 4px, transparent 4px),
                    linear-gradient(to bottom, #000000 4px, transparent 4px)
                  `,
                backgroundSize: '3000px 3000px, 3000px 3000px, 3000px 3000px, 3000px 3000px, 120px 120px, 120px 120px',
                backgroundColor: '#1c1c1e'
              }}
            >
              <div className="absolute top-[400px] left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-20">
                <Dumbbell size={400} className="text-stone-300 mb-12 mx-auto" strokeWidth={1} />
                <h1 className="text-[12rem] font-black uppercase text-stone-200 tracking-tighter">TRAINING ROOM</h1>
              </div>

              <div className="absolute top-[1450px] left-[1150px] w-[350px] h-[450px] origin-top-left scale-[0.65]">
                <div className="absolute bottom-[20px] left-[40px] w-[180px] h-[10px] bg-stone-200 border-2 border-stone-800 rotate-[30deg] transform-origin-left" />
                <div className="absolute bottom-[60px] left-[100px] w-[180px] h-[10px] bg-stone-200 border-2 border-stone-800 rotate-[30deg] transform-origin-left" />
                <div className="absolute bottom-[20px] left-[40px] w-[15px] h-[350px] bg-stone-300 border-2 border-stone-800" />
                <div className="absolute bottom-[105px] left-[195px] w-[15px] h-[350px] bg-stone-300 border-2 border-stone-800" />
                <div className="absolute bottom-[60px] left-[100px] w-[15px] h-[350px] bg-stone-300 border-2 border-stone-800" />
                <div className="absolute bottom-[145px] left-[255px] w-[15px] h-[350px] bg-stone-300 border-2 border-stone-800" />
                <div className="absolute top-[80px] left-[40px] w-[180px] h-[15px] bg-stone-200 border-2 border-stone-800 rotate-[30deg] transform-origin-left" />
                <div className="absolute top-[120px] left-[100px] w-[180px] h-[15px] bg-stone-200 border-2 border-stone-800 rotate-[30deg] transform-origin-left" />
                <div className="absolute top-[80px] left-[40px] w-[70px] h-[15px] bg-stone-200 border-2 border-stone-800 rotate-[-30deg] transform-origin-left" />
                <div className="absolute top-[165px] left-[195px] w-[70px] h-[15px] bg-stone-200 border-2 border-stone-800 rotate-[-30deg] transform-origin-left" />
                <div className="absolute top-[110px] left-[70px] w-[190px] h-[6px] bg-stone-900 rotate-[30deg]" />
                <div className="absolute bottom-[160px] left-[98px] w-[20px] h-[12px] bg-yellow-400 border-2 border-stone-800" />
                <div className="absolute bottom-[245px] left-[253px] w-[20px] h-[12px] bg-yellow-400 border-2 border-stone-800" />
                <div className="absolute bottom-[160px] left-[40px] w-[300px] h-[10px] bg-stone-800 border-t border-stone-600 rotate-[30deg] transform-origin-left" />
                <div className="absolute bottom-[170px] left-[65px] flex flex-col gap-0 rotate-[30deg] origin-center">
                  <div className="w-[30px] h-[40px] bg-blue-600 border-2 border-stone-800 rounded-lg shadow-md" />
                  <div className="w-[30px] h-[40px] bg-red-600 border-2 border-stone-800 rounded-lg shadow-md -mt-2 ml-4" />
                  <div className="w-[30px] h-[40px] bg-yellow-500 border-2 border-stone-800 rounded-lg shadow-md -mt-2 ml-8" />
                </div>
                <div className="absolute bottom-[255px] left-[235px] flex flex-col gap-0 rotate-[30deg] origin-center">
                  <div className="w-[30px] h-[40px] bg-blue-600 border-2 border-stone-800 rounded-lg shadow-md" />
                  <div className="w-[30px] h-[40px] bg-red-600 border-2 border-stone-800 rounded-lg shadow-md -mt-2 ml-4" />
                  <div className="w-[30px] h-[40px] bg-yellow-500 border-2 border-stone-800 rounded-lg shadow-md -mt-2 ml-8" />
                </div>
              </div>

              <div className="absolute top-[1250px] left-[1750px] w-[500px] h-[600px] pointer-events-none scale-50 origin-top-left">
                <div className="absolute top-0 left-0 w-full h-[30px] bg-[#D1D5DB] border-4 border-stone-800 rounded-sm flex overflow-hidden">
                  <div className="w-[30%] h-full bg-[#9CA3AF] border-r-4 border-stone-800" />
                  <div className="w-[10%] h-full bg-[#D1A377] border-r-4 border-stone-800" />
                  <div className="w-[40%] h-full bg-[#D1D5DB]" />
                  <div className="w-[20%] h-full bg-[#9CA3AF] border-l-4 border-stone-800" />
                </div>
                <div className="absolute top-[30px] left-[25px] w-1 h-[400px] bg-stone-800" />
                <div className="absolute top-[430px] left-[15px] w-6 h-6 border-4 border-stone-800 rounded-full" />
                <div className="absolute top-[30px] left-[100px] flex flex-col items-center">
                  <div className="w-2 h-[60px] bg-stone-700" />
                  <div className="w-16 h-12 bg-orange-400 border-4 border-stone-800 rounded-t-full" />
                  <div className="flex gap-1 -mt-1">
                    <div className="w-1.5 h-[320px] bg-[#8D6E63] border-x border-stone-800" />
                    <div className="w-1.5 h-[320px] bg-[#8D6E63] border-x border-stone-800" />
                  </div>
                  <div className="flex gap-4 -mt-2">
                    <div className="w-8 h-8 border-4 border-stone-800 rotate-45 flex items-center justify-center">
                      <div className="w-full h-1 bg-stone-800 rotate-45" />
                    </div>
                    <div className="w-8 h-8 border-4 border-stone-800 rotate-45 flex items-center justify-center">
                      <div className="w-full h-1 bg-stone-800 rotate-45" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-[30px] left-[250px] -translate-x-1/2 flex flex-col items-center">
                  <div className="w-2 h-[40px] bg-stone-500" />
                  <div className="w-[180px] h-[50px] bg-[#D1D5DB] border-4 border-stone-800 rounded-b-xl flex flex-col items-center pt-2">
                    <div className="w-[140px] h-6 bg-stone-700 border-2 border-stone-900 rounded-sm grid grid-cols-6 gap-1 p-1">
                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-stone-500/30" />)}
                    </div>
                  </div>
                </div>
                <div className="absolute top-[30px] right-[140px] flex flex-col items-center">
                  <div className="w-12 h-[80px] bg-[#9CA3AF] border-x-4 border-stone-800" />
                  <div className="w-[110px] h-[220px] bg-[#E5E7EB] border-4 border-stone-800 rounded-xl p-3 flex flex-col gap-4">
                    <div className="w-full h-[60px] bg-[#D1D5DB] border-2 border-stone-800 rounded flex flex-wrap gap-1 p-1">
                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-3 h-3 bg-stone-800/20" />)}
                    </div>
                    <div className="flex-1 border-2 border-stone-400 rounded-sm p-1 grid grid-cols-2 gap-2">
                      <div className="bg-orange-400 border border-stone-800" />
                      <div className="bg-orange-500 border border-stone-800" />
                      <div className="col-span-2 flex flex-col gap-1">
                        {[1, 2, 3].map(i => <div key={i} className="h-2 bg-stone-800/10 rounded-full" />)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-[30px] right-[40px] flex flex-col items-center">
                  <div className="flex gap-8">
                    <div className="w-1.5 h-[60px] bg-stone-700" />
                    <div className="w-1.5 h-[60px] bg-stone-700" />
                  </div>
                  <div className="w-[120px] h-[100px] bg-[#D1D5DB] border-4 border-stone-800 rounded-lg p-2 flex flex-col gap-2">
                    <div className="flex-1 bg-[#E5E7EB] border-2 border-stone-400 rounded-sm flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full p-2 relative">
                        <div className="absolute bottom-2 left-2 right-2 h-[1px] bg-stone-800" />
                        <div className="absolute bottom-2 left-4 w-4 h-8 bg-orange-400/50 border border-stone-800" />
                        <div className="absolute bottom-2 left-10 w-4 h-12 bg-orange-400 border border-stone-800" />
                        <div className="absolute top-2 right-2 w-8 h-8 bg-[#FDE68A] border border-stone-800" />
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-800/20 rounded-full w-2/3" />
                  </div>
                </div>
                <div className="absolute top-[350px] left-[200px] flex items-center">
                  <div className="w-[20px] h-[35px] bg-[#4B5563] border-4 border-stone-900 rounded-md" />
                  <div className="w-[40px] h-3 bg-stone-800" />
                  <div className="w-[20px] h-[35px] bg-[#4B5563] border-4 border-stone-900 rounded-md" />
                </div>
                <div className="absolute bottom-0 right-0 w-[420px] h-[380px]">
                  <div className="absolute top-0 right-0 w-[200px] h-[100px] bg-[#4B5563] border-4 border-stone-800 rounded-xl flex items-center justify-center overflow-hidden" style={{ transform: 'skewX(-20deg)' }}>
                    <div className="w-[140px] h-[60px] bg-[#1F2937] border-2 border-stone-900 rounded flex items-center justify-center">
                      <div className="w-[100px] h-[40px] bg-cyan-900/50 border border-cyan-400/30" />
                    </div>
                  </div>
                  <div className="absolute top-[80px] right-[40px] flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-6 h-4 bg-orange-400 border-2 border-stone-800" />)}
                  </div>
                  <div className="absolute top-[90px] right-[160px] w-4 h-[250px] bg-[#D1D5DB] border-2 border-stone-800 rounded-full" style={{ transform: 'rotate(15deg)' }} />
                  <div className="absolute top-[90px] right-[10px] w-4 h-[250px] bg-[#D1D5DB] border-2 border-stone-800 rounded-full" style={{ transform: 'rotate(15deg)' }} />
                  <div className="absolute bottom-[20px] left-0 w-[380px] h-[140px] bg-[#D1D5DB] border-4 border-stone-800 rounded-2xl flex flex-col justify-end p-2" style={{ transform: 'skewX(-30deg)' }}>
                    <div className="w-full h-[80%] bg-[#1F2937] border-2 border-stone-900 rounded-xl relative overflow-hidden">
                      <div className="absolute top-2 left-0 right-0 h-[2px] bg-stone-700" />
                      <div className="absolute top-6 left-0 right-0 h-[2px] bg-stone-700" />
                      <div className="absolute top-10 left-0 right-0 h-[2px] bg-stone-700" />
                    </div>
                  </div>
                  <div className="absolute bottom-[40px] right-[40px] w-[140px] h-[40px] bg-[#4B5563] border-4 border-stone-800 rounded-full flex items-center px-4">
                    <div className="w-8 h-3 bg-orange-400 rounded-full border border-stone-800" />
                  </div>
                  <div className="absolute bottom-[10px] right-[10px] w-[100px] h-[50px] bg-[#1F2937] border-4 border-stone-800 rounded-2xl" />
                </div>
              </div>

              <div className="absolute top-[1900px] left-[1800px] w-[350px] h-[300px] pointer-events-none scale-[0.85] origin-top-left">
                <div className="absolute bottom-[20px] left-[40px] w-[220px] h-[12px] bg-[#E5E7EB] border-4 border-stone-800 rotate-[30deg] transform-origin-left" />
                <div className="absolute bottom-[80px] left-[80px] w-[15px] h-[60px] bg-[#E5E7EB] border-4 border-stone-800" />
                <div className="absolute bottom-[65px] left-[160px] w-[15px] h-[60px] bg-[#E5E7EB] border-4 border-stone-800" />
                <div className="absolute bottom-[90px] left-[20px] w-[240px] h-[40px] bg-[#E53935] border-4 border-stone-800 rounded-xl shadow-lg" style={{ transform: 'skewX(-25deg)' }}>
                  <div className="absolute inset-0 bg-[#FF5252] rounded-lg opacity-20 translate-y-1" />
                </div>
                <div className="absolute bottom-[30px] left-[180px] w-[14px] h-[190px] bg-stone-700 border-4 border-stone-800" />
                <div className="absolute bottom-[80px] left-[270px] w-[14px] h-[190px] bg-stone-700 border-4 border-stone-800" />
                <div className="absolute top-[15px] left-[175px] w-6 h-6 bg-stone-300 border-4 border-stone-800 rounded-full" />
                <div className="absolute top-[65px] left-[265px] w-6 h-6 bg-stone-300 border-4 border-stone-800 rounded-full" />
                <div className="absolute top-[20px] left-[110px] w-[260px] h-[10px] bg-stone-400 border-2 border-stone-800 rotate-[25deg] transform-origin-left z-10" />
                <div className="absolute top-[10px] left-[110px] rotate-[25deg] transform-origin-center z-20">
                  <div className="w-[55px] h-[55px] bg-[#E53935] border-4 border-stone-800 rounded-full flex items-center justify-center">
                    <div className="w-[45px] h-[45px] border-2 border-stone-800/30 rounded-full" />
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-50 -translate-x-1 -translate-y-1" />
                  </div>
                </div>
                <div className="absolute top-[125px] left-[320px] rotate-[25deg] transform-origin-center z-20">
                  <div className="w-[55px] h-[55px] bg-[#E53935] border-4 border-stone-800 rounded-full flex items-center justify-center">
                    <div className="w-[45px] h-[45px] border-2 border-stone-800/30 rounded-full" />
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-50 -translate-x-1 -translate-y-1" />
                  </div>
                </div>
                <div className="absolute bottom-[10px] left-[15px] w-[45px] h-[18px] bg-stone-800 border-4 border-stone-900 rounded-full" />
              </div>

              <div className="absolute top-[2100px] left-[1100px] w-[300px] h-[150px] pointer-events-none scale-[0.8] origin-top-left">
                <div className="absolute bottom-[20px] left-[40px] w-[20px] h-[60px] bg-[#E5E7EB] border-4 border-stone-800" />
                <div className="absolute bottom-[20px] left-[240px] w-[20px] h-[60px] bg-[#E5E7EB] border-4 border-stone-800" />
                <div className="absolute bottom-[10px] left-[30px] w-[40px] h-[20px] bg-[#4B5563] border-4 border-stone-800 rounded-sm" />
                <div className="absolute bottom-[10px] left-[230px] w-[40px] h-[20px] bg-[#4B5563] border-4 border-stone-800 rounded-sm" />
                <div className="absolute bottom-[60px] left-[40px] w-[220px] h-[10px] bg-[#D1D5DB] border-4 border-stone-800" />
                <div className="absolute bottom-[70px] left-[10px] w-[280px] h-[50px]">
                  <div className="absolute inset-0 bg-[#00ACC1] border-4 border-stone-800 rounded-lg" style={{ transform: 'skewX(-20deg)' }} />
                  <div className="absolute -top-[10px] left-0 w-full h-full flex gap-1" style={{ transform: 'skewX(-20deg)' }}>
                    <div className="flex-1 bg-[#D4E157] border-4 border-stone-800 rounded-t-lg" />
                    <div className="flex-1 bg-[#D4E157] border-4 border-stone-800 rounded-t-lg" />
                    <div className="flex-1 bg-[#D4E157] border-4 border-stone-800 rounded-t-lg" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('global-chat')}
                className="absolute top-[950px] left-[1850px] w-[200px] h-[350px] cursor-pointer hover:scale-110 active:scale-95 transition-all group monitor-container scale-75 origin-top-left z-[55]"
              >
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-[#0F172A] text-cyan-400 text-[12px] font-black py-2 px-4 rounded-xl border-2 border-cyan-800 shadow-[0_0_20px_rgba(34,211,238,0.3)] monitor-hover-hint whitespace-nowrap z-50">
                  JOIN THE FEED 🌍
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F172A] border-r-2 border-b-2 border-cyan-800 rotate-45" />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160px] h-[20px] bg-stone-700 border-4 border-stone-900 rounded-full" />
                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[80px] h-[180px] bg-orange-600 border-4 border-stone-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-700 opacity-50" />
                  <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[40px] h-[40px] bg-stone-300 border-4 border-stone-900 rounded-full flex items-center justify-center">
                    <div className="w-[15px] h-[15px] bg-white rounded-full opacity-60" />
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[180px] bg-yellow-400 border-4 border-stone-900 rounded-3xl p-4 flex items-center justify-center shadow-xl group-hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-shadow">
                  <div className="w-full h-full bg-red-600 border-4 border-stone-900 rounded-2xl p-2 flex items-center justify-center">
                    <div className="w-full h-full bg-[#1E88E5] border-4 border-stone-900 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-blue-400 opacity-20 translate-x-4 -translate-y-4 rotate-45 pointer-events-none" />
                      <div className="flex flex-col items-center gap-1">
                        <Globe size={32} className="text-white animate-spin-slow opacity-80" />
                        <span className="text-stone-900 font-black text-center leading-none uppercase text-[14px] px-2 select-none tracking-tighter">GLOBAL CHAT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('trainer-chat')}
                className="absolute top-[1480px] left-[1500px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-105 active:scale-95 transition-all group trainer-container z-[60]"
              >
                <div className="absolute -top-32 bg-stone-800 text-white text-[12px] font-black py-2 px-4 rounded-xl border-2 border-stone-700 shadow-xl trainer-hover-hint whitespace-nowrap">
                  TALK TO COACH FLEX 💪
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-800 border-r-2 border-b-2 border-stone-700 rotate-45" />
                </div>
                <div className="absolute bottom-[-10px] w-32 h-6 bg-stone-900/20 rounded-full blur-sm" />
                <div className="relative flex flex-col items-center">
                  <div className="w-32 h-16 bg-[#5D4037] rounded-t-3xl border-4 border-stone-900 relative z-30">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-[#5D4037] rounded-full" />
                  </div>
                  <div className="w-32 h-24 bg-[#F5D5C5] rounded-b-2xl border-x-4 border-b-4 border-stone-900 relative z-20 -mt-2">
                    <div className="absolute top-8 left-0 w-full flex justify-around px-4">
                      <div className="w-3 h-3 bg-stone-900 rounded-full animate-blink" />
                      <div className="w-3 h-3 bg-stone-900 rounded-full animate-blink" />
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-3 border-b-4 border-stone-900 rounded-full opacity-60" />
                  </div>
                  <div className="w-48 h-28 bg-stone-900 rounded-t-[44px] border-4 border-stone-800 relative z-10 -mt-4 flex flex-col items-center">
                    <div className="w-32 h-12 border-b-2 border-stone-700/50 mt-4 rounded-full" />
                    <div className="absolute -left-12 top-4 w-24 h-32 border-l-[16px] border-t-[16px] border-stone-900 rounded-tl-3xl rotate-[25deg] transform origin-top-right" />
                    <div className="absolute -right-12 top-4 w-24 h-32 border-r-[16px] border-t-[16px] border-stone-900 rounded-tr-3xl -rotate-[25deg] transform origin-top-left" />
                    <div className="absolute top-0 -left-4 w-12 h-16 bg-[#F5D5C5] rounded-full border-2 border-stone-900" />
                    <div className="absolute top-0 -right-4 w-12 h-16 bg-[#F5D5C5] rounded-full border-2 border-stone-900" />
                  </div>
                  <div className="flex gap-4 -mt-4">
                    <div className="w-16 h-24 bg-[#14b8a6] rounded-full border-4 border-stone-900 relative">
                      <div className="absolute bottom-0 w-full h-12 bg-stone-900 border-t-2 border-stone-700 rounded-b-full" />
                    </div>
                    <div className="w-16 h-24 bg-[#14b8a6] rounded-full border-4 border-stone-900 relative">
                      <div className="absolute bottom-0 w-full h-12 bg-stone-900 border-t-2 border-stone-700 rounded-b-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-[750px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] flex items-end justify-center">
                <div className="absolute -top-[150px] left-0 w-full flex justify-around px-20">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-1 h-[100px] bg-stone-800" />
                      <div className="w-12 h-14 bg-yellow-400 rounded-b-xl border-x-4 border-b-4 border-stone-800 relative shadow-[0_10px_30px_rgba(250,204,21,0.3)]">
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full opacity-60" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute -top-[100px] left-20 w-32 h-32 bg-white rounded-full border-8 border-stone-800 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
                      <div key={deg} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className="ml-auto w-2 h-1 bg-stone-300" />
                      </div>
                    ))}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-10 bg-stone-800 rounded-full origin-bottom" style={{ transform: 'rotate(120deg) translateY(-50%)' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-stone-800 rounded-full origin-bottom" style={{ transform: 'rotate(0deg) translateY(-50%)' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-stone-800 rounded-full" />
                  </div>
                </div>
                <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[240px] h-[340px] bg-[#C19A6B] border-8 border-stone-800 grid grid-cols-5 grid-rows-8 p-1 gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="bg-stone-900/10 border-2 border-stone-800/20" />
                  ))}
                  <div className="absolute -top-[40px] left-4 flex gap-2">
                    <div className="w-8 h-10 bg-purple-600 border-2 border-stone-800" />
                    <div className="w-8 h-10 bg-blue-600 border-2 border-stone-800" />
                  </div>
                  <div className="absolute -top-[40px] right-4 flex gap-2">
                    <div className="w-6 h-8 bg-emerald-500 rounded-t-lg border-2 border-stone-800" />
                    <div className="w-6 h-8 bg-emerald-600 rounded-t-lg border-2 border-stone-800" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 flex flex-col items-center">
                  <div className="w-20 h-32 bg-blue-200 rounded-t-3xl border-4 border-stone-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-300 translate-y-12 opacity-50" />
                    <div className="absolute top-4 left-4 w-4 h-12 bg-white/40 rounded-full" />
                  </div>
                  <div className="w-24 h-48 bg-white border-4 border-stone-800 flex flex-col items-center pt-8">
                    <div className="flex gap-4">
                      <div className="w-4 h-8 bg-red-400 rounded-full border-2 border-stone-800" />
                      <div className="w-4 h-8 bg-blue-400 rounded-full border-2 border-stone-800" />
                    </div>
                    <div className="mt-8 w-12 h-16 border-2 border-stone-200" />
                  </div>
                </div>
                <div
                  onClick={() => setIsTrainerBoardOpen(true)}
                  className="relative w-[500px] h-[160px] flex flex-col shadow-2xl cursor-pointer group desk-container"
                >
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[12px] font-black py-2 px-4 rounded-xl border-2 border-stone-700 shadow-xl desk-hover-hint whitespace-nowrap z-50">
                    FIND PRO TRAINERS ONLINE 🔍
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-800 border-r-2 border-b-2 border-stone-700 rotate-45" />
                  </div>
                  <div className="w-full h-8 bg-stone-800" />
                  <div className="absolute -top-[40px] left-10 w-24 h-40 bg-stone-300 border-4 border-stone-800 rounded-t-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-stone-400 rounded-full" />
                  </div>
                  <div className="absolute -top-[40px] right-10 w-24 h-40 bg-stone-300 border-4 border-stone-800 rounded-t-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-stone-400 rounded-full" />
                  </div>
                  <div className="flex-1 bg-stone-800 flex flex-col p-1 gap-1">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                        <div key={i} className="flex-1 bg-[#D1A377]" />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="w-[240px] h-[90px] bg-[#6B1F44] border-4 border-stone-800 flex items-center gap-3 px-4 shadow-inner">
                        <div className="w-12 h-12 bg-yellow-400 flex items-center justify-center">
                          <Zap size={32} className="text-[#6B1F44] fill-[#6B1F44]" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-white font-black text-2xl tracking-tighter uppercase italic">FITNESS</span>
                          <span className="text-yellow-400 font-black text-3xl tracking-widest uppercase italic -mt-1">CLUB</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                        <div key={i} className="flex-1 bg-[#D1A377]" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 flex flex-col items-center">
                  <div className="w-24 h-24 bg-stone-800 rounded-b-lg border-4 border-stone-900 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-stone-900 translate-y-4" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {isTrainerBoardOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
              <div className="bg-[#1A1A1C] border-4 border-[#6B1F44] w-full max-w-sm rounded-xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-[#6B1F44] p-4 flex justify-between items-center border-b-4 border-[#3E1128]">
                  <div className="flex items-center gap-3 text-white">
                    <Search size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">Professional Online Coaches</span>
                  </div>
                  <button onClick={() => setIsTrainerBoardOpen(false)} className="text-white/60 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4 space-y-3 bg-stone-900">
                  <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest mb-4">Click to hire a verified trainer:</p>
                  {TRAINER_RESOURCES.map((resource, i) => (
                    <button
                      key={i}
                      onClick={() => window.open(resource.url, '_blank')}
                      className="w-full bg-[#2C2C2E] border-2 border-[#3E3E42] p-4 rounded-xl flex items-center justify-between group hover:border-[#6B1F44] transition-all hover:bg-[#6B1F44]/10 active:scale-95"
                    >
                      <span className="text-white font-bold text-sm">{resource.name}</span>
                      <ExternalLink size={16} className="text-stone-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
                <div className="bg-[#6B1F44]/10 p-4 border-t-2 border-[#6B1F44]/20">
                  <p className="text-[9px] text-stone-500 italic text-center">Redirecting you to official external platforms. Always verify credentials.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  const isGardenVisible = currentView === 'garden' || (currentView === 'chat' && mobileEntrySource === 'home');

  return (
    <div className="h-screen w-full bg-stone-900 flex justify-center items-center overflow-hidden">
      <div className="relative w-full h-full max-w-md bg-[#8CBF82] flex flex-col shadow-2xl overflow-hidden border-x-4 border-[#556B2F]">

        {/* AUTHENTICATION FLOW */}
        {authStatus === 'welcome' && (
          <WelcomeScreen onLogin={() => setAuthStatus('login')} onSignup={() => setAuthStatus('signup')} />
        )}

        {(authStatus === 'login' || authStatus === 'signup') && (
          <AuthScreen
            mode={authStatus}
            onBack={() => setAuthStatus('welcome')}
            onSuccess={() => setAuthStatus('authenticated')}
          />
        )}

        {/* MAIN GAME APPLICATION */}
        {authStatus === 'authenticated' && (
          <>
            <div className="absolute top-4 left-4 z-50 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm border-2 border-[#556B2F] px-3 py-1 rounded-xl shadow-lg">
                <span className="text-[#33691E] font-bold text-lg font-mono">
                  {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
            <div className="flex-1 relative flex flex-col min-h-0 bg-[#E8F5E9]">
              <div className={`${isGardenVisible ? 'flex' : 'hidden'} absolute inset-0 z-0`}>
                <PixelGarden
                  gameState={gameState}
                  currentTime={currentTime}
                  onRemoveTree={handleRemoveTree}
                  onTrainClick={() => setIsTrainOpen(true)}
                  onCampingClick={() => setIsCampingOpen(true)}
                  onRestaurantClick={() => setIsRestaurantOpen(true)}
                  onGymClick={() => setIsGymOpen(true)}
                  onSevaHubClick={() => setIsSevaHubOpen(true)}
                  onYogaClick={() => setIsYogaOpen(true)}
                  onHospitalClick={() => setCurrentView('medbay')}
                  onSproutClick={() => {
                    setMobileEntrySource('chat');
                    setCurrentView('chat');
                  }}
                  notifications={notifications}
                  isVisible={isGardenVisible}
                  onShopOpen={() => setIsShopOpen(true)}
                  onPlaceItem={handlePlaceItem}
                />
              </div>
              {currentView !== 'garden' && (
                <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative z-10 
                          ${currentView === 'chat' || currentView === 'trainer-chat' || currentView === 'global-chat' || currentView === 'nutrition-chat' || currentView === 'doctor-chat' ? 'p-4 pb-28 bg-stone-900/40 backdrop-blur-[2px]' :
                    currentView === 'gym-interior' || currentView === 'restaurant-interior' || currentView === 'hospital-interior' ? 'p-0 pb-0 bg-white' :
                      'p-4 pb-28 bg-[#E8F5E9]'}`}>
                  {renderContent()}
                </div>
              )}
            </div>
            <TrainBoard isOpen={isTrainOpen} onClose={(reward) => { if (reward) handleTaskComplete(50); setIsTrainOpen(false); }} />
            <CampingBoard isOpen={isCampingOpen} onClose={(reward) => { if (reward) handleTaskComplete(40); setIsCampingOpen(false); }} />
            <RestaurantBoard isOpen={isRestaurantOpen} onClose={(reward) => { if (reward) handleTaskComplete(60); setIsRestaurantOpen(false); }} />
            <GymBoard isOpen={isGymOpen} onClose={(reward) => { if (reward) handleTaskComplete(50); setIsGymOpen(false); }} />
            <SevaHubBoard isOpen={isSevaHubOpen} onClose={(reward) => { if (reward) handleTaskComplete(100); setIsSevaHubOpen(false); }} />
            <YogaBoard isOpen={isYogaOpen} onClose={(reward) => { if (reward) handleTaskComplete(50); setIsYogaOpen(false); }} />
            <div className="absolute bottom-0 left-0 w-full z-50">
              <NavBar currentView={currentView} setView={(v) => {
                if (v === 'chat') setMobileEntrySource('home');
                setCurrentView(v);
              }} />
            </div>
            {isShopOpen && (
              <ShopBoard
                currentCoins={gameState.score}
                onBuy={handleShopBuy}
                onClose={() => setIsShopOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;