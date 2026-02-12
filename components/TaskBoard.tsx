import React, { useState, useRef, useEffect } from 'react';
import { HabitTask, GameState, Reminder, ChatMessage } from '../types';
import { Check, Loader2, Sparkles, Droplets, Moon, Dumbbell, Brain, Apple, Camera, X, RefreshCw, Radio, Bluetooth, BluetoothConnected, BluetoothSearching, Info, Wind, AlarmClock, MessageSquareQuote, Send, Bot, Volume2 } from 'lucide-react';
import { generateTasks, verifyTaskCompletion, chatWithSprout, generateSproutSpeech } from '../services/openaiService';

interface TaskBoardProps {
  tasks: HabitTask[];
  setTasks: React.Dispatch<React.SetStateAction<HabitTask[]>>;
  onTaskComplete: (points: number) => void;
  currentScore: number;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

// Audio Utilities for Sprout Speech
function decodeBase64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}



const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, setTasks, onTaskComplete, currentScore, setGameState }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [verifyingTask, setVerifyingTask] = useState<HabitTask | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [isIoTMode, setIsIoTMode] = useState(false);

  // Breathing Quest State
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Meditation Quest State
  const [isMeditationMode, setIsMeditationMode] = useState(false);
  const [meditationTimer, setMeditationTimer] = useState(600); // 10 minutes in seconds
  const [meditationGuidance, setMeditationGuidance] = useState("Find a comfortable seat.");

  // Reflection Quest State (Sprout Handled)
  const [isReflectMode, setIsReflectMode] = useState(false);
  const [reflectInput, setReflectInput] = useState("");
  const [sproutReply, setSproutReply] = useState<string | null>(null);

  // Bluetooth State
  const [bluetoothDevice, setBluetoothDevice] = useState<any | null>(null);
  const [isConnectingBT, setIsConnectingBT] = useState(false);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [btStatusMessage, setBtStatusMessage] = useState<string | null>(null);

  // Sleep Alarm State
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState("22:00");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const breathingTimerRef = useRef<number | null>(null);
  const meditationIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio Playback helper
  const resumeAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error("Audio resume failed", e);
      }
    }
  };

  const speakText = async (text: string) => {
    try {
      const base64Audio = await generateSproutSpeech(text);
      if (!base64Audio) return;

      await resumeAudio();

      const ctx = audioContextRef.current!;
      const base64String = base64Audio.split(',')[1] || base64Audio;
      const uint8Audio = decodeBase64ToUint8Array(base64String);
      const audioBuffer = await ctx.decodeAudioData(uint8Audio.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Sprout voice failed:", err);
    }
  };

  // Meditation Logic
  useEffect(() => {
    if (isMeditationMode && meditationTimer > 0) {
      // Periodic Voice Guidance
      if (meditationTimer === 600) {
        speakText("Welcome to your mindfulness meditation. Close your eyes and settle in. Focus on your breathing.");
        setMeditationGuidance("Close your eyes. Focus on your breath.");
      } else if (meditationTimer === 480) {
        speakText("Notice the sensation of air as it enters your nostrils. Relax your shoulders.");
        setMeditationGuidance("Relax your shoulders. Feel the air.");
      } else if (meditationTimer === 300) {
        speakText("You are halfway through. If your mind wanders, gently bring it back to your breath without judgment.");
        setMeditationGuidance("Halfway there. Gently return to your breath.");
      } else if (meditationTimer === 120) {
        speakText("Final stretch. Appreciate this moment of stillness in your Homestead.");
        setMeditationGuidance("Enjoy the final moments of stillness.");
      } else if (meditationTimer === 10) {
        speakText("Start to bring your awareness back to the room. We are finishing in 10 seconds.");
        setMeditationGuidance("Returning awareness...");
      }

      meditationIntervalRef.current = window.setInterval(() => {
        setMeditationTimer(prev => prev - 1);
      }, 1000);
    } else if (isMeditationMode && meditationTimer === 0) {
      speakText("Session complete. Open your eyes slowly. Excellent work, Homesteader!");
      setMeditationGuidance("Well done! Session complete.");
      setTimeout(() => {
        handleComplete(verifyingTask?.id || '', verifyingTask?.points || 50);
        closeVerification();
      }, 2000);
    }

    return () => {
      if (meditationIntervalRef.current) clearInterval(meditationIntervalRef.current);
    };
  }, [isMeditationMode, meditationTimer]);

  // Breathing Session Logic
  useEffect(() => {
    if (isBreathingMode && breathCount < 10) {
      const startBreathCycle = () => {
        setBreathingPhase('inhale');
        breathingTimerRef.current = window.setTimeout(() => {
          setBreathingPhase('hold');
          breathingTimerRef.current = window.setTimeout(() => {
            setBreathingPhase('exhale');
            breathingTimerRef.current = window.setTimeout(() => {
              setBreathCount(prev => {
                const next = prev + 1;
                if (next === 10) {
                  handleAutoVerifyBreathing();
                }
                return next;
              });
            }, 4000); // Exhale
          }, 2000); // Hold
        }, 4000); // Inhale
      };

      startBreathCycle();
    }
    return () => {
      if (breathingTimerRef.current) clearTimeout(breathingTimerRef.current);
    };
  }, [isBreathingMode, breathCount]);

  const handleAutoVerifyBreathing = async () => {
    setTimeout(async () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg');
          setCapturedImage(dataUrl);
          setIsVerifying(true);
          setVerificationFeedback("🧘 Sprout is confirming your Zen aura...");

          const result = await verifyTaskCompletion("Zen Garden Breathing", dataUrl, false);
          if (result.verified) {
            setVerificationFeedback("✨ PERFECT ZEN. 200 Coins granted!");
            setTimeout(() => {
              handleComplete(verifyingTask?.id || '', 200);
              closeVerification();
            }, 2500);
          } else {
            setVerificationFeedback("🌬️ You seemed a bit restless. Let's try again?");
            setIsVerifying(false);
            setBreathCount(0);
            setCapturedImage(null);
          }
        }
      }
    }, 1000);
  };

  useEffect(() => {
    let interval: number;
    if (bluetoothDevice) {
      interval = window.setInterval(() => {
        setLiveBpm(Math.floor(Math.random() * (140 - 110 + 1)) + 110);
      }, 2000);
    } else {
      setLiveBpm(null);
    }
    return () => clearInterval(interval);
  }, [bluetoothDevice]);

  const connectBluetooth = async () => {
    setBtStatusMessage(null);
    if (!('bluetooth' in navigator)) {
      setBtStatusMessage("Web Bluetooth is not supported in this browser.");
      setBluetoothDevice({ name: "Demo Watch (Simulated)" });
      return;
    }
    setIsConnectingBT(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });
      setBluetoothDevice(device);
      device.addEventListener('gattserverdisconnected', () => {
        setBluetoothDevice(null);
      });
    } catch (err: any) {
      console.error("Bluetooth Error:", err);
      if (confirm("Web Bluetooth access issues. Use 'Simulated Link'?")) {
        setBluetoothDevice({ name: "boAt Lunar Link (Simulated)" });
      }
    } finally {
      setIsConnectingBT(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newTasks = await generateTasks(currentScore, "I want to improve my overall health.");
    setTasks(prev => [...prev.filter(t => !t.completed), ...newTasks]);
    setIsGenerating(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleReflectSubmit = async () => {
    if (!reflectInput.trim() || !verifyingTask) return;
    setIsVerifying(true);
    setVerificationFeedback("Sprout is reflecting on your words...");

    const history: ChatMessage[] = [
      { id: '1', sender: 'bot', text: `Tell me more about this: ${verifyingTask.title}`, timestamp: Date.now() }
    ];

    const response = await chatWithSprout(history, `I completed the task "${verifyingTask.title}". Here is what I did: ${reflectInput}. Please give me a warm, supportive response and grant me the points!`);

    setSproutReply(response);
    setIsVerifying(false);

    setTimeout(() => {
      handleComplete(verifyingTask.id, verifyingTask.points);
      closeVerification();
    }, 4000);
  };

  const handleVerify = async () => {
    if (!capturedImage || !verifyingTask) return;
    setIsVerifying(true);
    setVerificationFeedback("Sprout is analyzing your proof...");
    const result = await verifyTaskCompletion(verifyingTask.title, capturedImage, isIoTMode);
    if (result.verified) {
      setVerificationFeedback(`✅ SUCCESS! ${result.message}`);
      setTimeout(() => {
        handleComplete(verifyingTask.id, verifyingTask.points);
        closeVerification();
      }, 3000);
    } else {
      setVerificationFeedback(`❌ FAIL: ${result.message}`);
      setIsVerifying(false);
      setCapturedImage(null);
      startCamera();
    }
  };

  const closeVerification = () => {
    stopCamera();
    setVerifyingTask(null);
    setCapturedImage(null);
    setIsVerifying(false);
    setVerificationFeedback(null);
    setIsIoTMode(false);
    setIsBreathingMode(false);
    setBreathCount(0);
    setIsMeditationMode(false);
    setMeditationTimer(600);
    setIsReflectMode(false);
    setReflectInput("");
    setSproutReply(null);
    if (breathingTimerRef.current) clearTimeout(breathingTimerRef.current);
    if (meditationIntervalRef.current) clearInterval(meditationIntervalRef.current);
  };

  const handleComplete = (id: string, points: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    onTaskComplete(points);
  };

  const handleSetSleepAlarm = () => {
    const [hrs, mins] = sleepStartTime.split(':').map(Number);
    const now = new Date();
    const sleepTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hrs, mins, 0);

    // Wake up time is exactly 7 hours later
    const wakeUpTime = new Date(sleepTime.getTime() + (7 * 60 * 60 * 1000));

    const newReminder: Reminder = {
      id: `sleep-${Date.now()}`,
      task: "Time to Wake Up! You've had 7 hours of high-quality sleep.",
      time: wakeUpTime.getTime(),
      triggered: false
    };

    setGameState(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));

    setIsSleepModalOpen(false);
    alert(`Goodnight! Sprout will wake you up at ${wakeUpTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}.`);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'water': return <Droplets className="text-blue-400" size={20} />;
      case 'sleep': return <Moon className="text-indigo-400" size={20} />;
      case 'exercise': return <Dumbbell className="text-orange-400" size={20} />;
      case 'mindfulness': return <Brain className="text-purple-400" size={20} />;
      case 'nutrition': return <Apple className="text-red-400" size={20} />;
      default: return <Sparkles className="text-yellow-400" size={20} />;
    }
  }

  return (
    <div className="bg-stone-800 border-4 border-stone-700 rounded-lg p-4 h-full flex flex-col pixel-corners shadow-lg relative">

      <div className="mb-4 bg-stone-900 border-2 border-stone-700 rounded-lg p-2 flex flex-col gap-2 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${bluetoothDevice ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-stone-800 text-stone-600'}`}>
              {bluetoothDevice ? <BluetoothConnected size={18} /> : isConnectingBT ? <BluetoothSearching size={18} className="animate-spin" /> : <Bluetooth size={18} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest leading-none">IoT Sync</span>
              <span className={`text-xs font-bold ${bluetoothDevice ? 'text-blue-400' : 'text-stone-600'}`}>
                {bluetoothDevice ? `${bluetoothDevice.name || 'Smartwatch'} Linked` : 'No Device Linked'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveBpm && (
              <div className="flex items-center gap-1.5 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
                <Radio size={12} className="text-red-500 animate-ping" />
                <span className="text-red-400 font-mono font-bold text-xs">{liveBpm} BPM</span>
              </div>
            )}
            <button
              onClick={connectBluetooth}
              className={`text-[10px] font-black uppercase px-2 py-1 rounded transition-all ${bluetoothDevice ? 'bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900' : 'bg-blue-600 text-white hover:bg-blue-500 border-b-2 border-blue-800 active:border-b-0 active:translate-y-0.5'}`}
            >
              {bluetoothDevice ? 'Unlink' : 'Link Watch'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 border-b-2 border-stone-600 pb-2">
        <h2 className="text-2xl text-orange-400 uppercase tracking-widest font-bold">Quests</h2>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-emerald-100 px-3 py-1.5 rounded border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
        >
          {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {tasks.filter(t => !t.completed).map((task) => {
          const isZenTask = task.title.includes("Zen Garden Breathing");
          const isMeditationTask = task.title.includes("Mindfulness & Meditation");
          const isReflectTask = !isMeditationTask && (
            task.title.includes("Purpose & Growth") ||
            task.title.includes("Micro-acts of Joy") ||
            task.title.includes("Gratitude & Positive Reflection"));
          const isSleepTask = task.category === 'sleep';
          return (
            <div key={task.id} className={`bg-stone-900 border-2 ${isZenTask || isMeditationTask || isReflectTask ? 'border-teal-600' : 'border-stone-600'} p-3 rounded hover:border-stone-500 transition-colors flex justify-between items-center group shadow-sm`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1 bg-stone-800 rounded border border-stone-700 ${isZenTask || isMeditationTask || isReflectTask ? 'animate-pulse' : ''}`}>
                  {isZenTask ? <Wind className="text-teal-400" size={20} /> : (isMeditationTask || isReflectTask) ? <Brain className="text-cyan-400" size={20} /> : getIcon(task.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-200 leading-none">{task.title}</h3>
                  </div>
                  <p className="text-stone-500 text-sm mt-1 leading-tight">{task.description}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 pl-2">
                <span className="text-yellow-500 font-bold text-lg drop-shadow-sm font-mono">+{task.points}</span>
                <div className="flex gap-1">
                  {isSleepTask && (
                    <button
                      onClick={() => setIsSleepModalOpen(true)}
                      className="p-2 rounded bg-indigo-700 hover:bg-indigo-600 border-indigo-900 border-b-4 active:border-b-0 active:translate-y-1 transition-all text-white"
                    >
                      <AlarmClock size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      resumeAudio();
                      setVerifyingTask(task);
                      if (isZenTask) {
                        startCamera();
                        setIsBreathingMode(true);
                      } else if (isMeditationTask) {
                        startCamera();
                        setIsMeditationMode(true);
                      } else if (isReflectTask) {
                        setIsReflectMode(true);
                      } else {
                        startCamera();
                      }
                    }}
                    className={`p-2 rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all ${isZenTask || isMeditationTask || isReflectTask ? 'bg-teal-700 hover:bg-teal-600 border-teal-900 text-teal-100' : 'bg-stone-700 hover:bg-blue-600 text-stone-300 hover:text-white border-stone-900'}`}
                  >
                    {isZenTask ? <Wind size={18} /> : isMeditationTask ? <Brain size={18} /> : isReflectTask ? <Bot size={18} /> : <Camera size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sleep Alarm Modal */}
      {isSleepModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-stone-800 border-4 border-indigo-600 w-full max-w-xs rounded-xl overflow-hidden shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlarmClock className="text-indigo-400" size={24} />
              <h3 className="text-white font-bold uppercase tracking-widest">Sleep Planner</h3>
            </div>
            <p className="text-stone-400 text-xs mb-4">When are you heading to bed? Sprout will wake you up after 7 hours of high-quality rest.</p>
            <div className="flex flex-col gap-4">
              <input
                type="time"
                value={sleepStartTime}
                onChange={(e) => setSleepStartTime(e.target.value)}
                className="bg-stone-900 border-2 border-stone-700 text-white p-3 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSetSleepAlarm}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-sm"
              >
                Set Sleep Goal
              </button>
              <button
                onClick={() => setIsSleepModalOpen(false)}
                className="text-stone-500 text-xs font-bold uppercase hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification & Guided Modal */}
      {verifyingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className={`bg-stone-800 border-4 ${isBreathingMode || isMeditationMode || isReflectMode ? 'border-teal-600 shadow-[0_0_30px_rgba(20,184,166,0.3)]' : 'border-stone-600'} w-full max-w-sm rounded-xl overflow-hidden shadow-2xl flex flex-col`}>
            <div className={`${isBreathingMode || isMeditationMode || isReflectMode ? 'bg-teal-950' : 'bg-stone-900'} p-3 flex justify-between items-center border-b-4 ${isBreathingMode || isMeditationMode || isReflectMode ? 'border-teal-900' : 'border-stone-700'}`}>
              <div className="flex items-center gap-2">
                {isBreathingMode ? <Wind className="text-teal-400" size={20} /> : isMeditationMode ? <Brain className="text-teal-400" size={20} /> : isReflectMode ? <Bot className="text-teal-400" size={20} /> : <Camera className="text-blue-400" size={20} />}
                <span className="text-stone-200 font-bold uppercase text-sm">
                  {isBreathingMode ? 'Zen Session' : isMeditationMode ? 'Guided Meditation' : isReflectMode ? 'Sprout reflection' : 'Verify Quest'}
                </span>
              </div>
              {!isVerifying && !sproutReply && (
                <button onClick={closeVerification} className="text-stone-500 hover:text-white">
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="p-4 flex flex-col items-center gap-4">
              {isReflectMode ? (
                <div className="w-full space-y-4">
                  <div className="bg-stone-900 border-2 border-stone-700 rounded-lg p-4 relative">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-900 rounded-lg border-2 border-emerald-500 flex items-center justify-center shrink-0">
                        <Bot className="text-emerald-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-emerald-400 font-black uppercase text-[10px] mb-1">Sprout says:</p>
                        <p className="text-stone-200 text-sm italic leading-snug">
                          {sproutReply || `"${verifyingTask.title}" is so important! Tell me what you did or what you learned today?`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!sproutReply && (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={reflectInput}
                        onChange={(e) => setReflectInput(e.target.value)}
                        placeholder="Today I learned that..."
                        className="w-full h-24 bg-stone-950 border-2 border-stone-700 text-stone-200 p-3 rounded-lg focus:outline-none focus:border-teal-500 text-sm resize-none"
                      />
                      <button
                        onClick={handleReflectSubmit}
                        disabled={isVerifying || !reflectInput.trim()}
                        className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black py-3 rounded-lg border-b-4 border-teal-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-sm flex items-center justify-center gap-2"
                      >
                        {isVerifying ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        {isVerifying ? "Thinking..." : "Share with Sprout"}
                      </button>
                    </div>
                  )}

                  {sproutReply && (
                    <div className="py-4 text-center">
                      <div className="text-yellow-400 font-black text-2xl animate-bounce">+50 COINS</div>
                      <p className="text-stone-500 text-xs mt-2 uppercase font-black">Homestead updated!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full aspect-square bg-black rounded-lg border-4 border-stone-700 overflow-hidden flex items-center justify-center">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Verification" className="w-full h-full object-cover" />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  )}

                  {isBreathingMode && !capturedImage && !isVerifying && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="mb-4 text-white font-black text-4xl font-mono drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                        {breathCount} / 10
                      </div>
                      <div
                        className={`w-32 h-32 rounded-full border-4 border-teal-400/50 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${breathingPhase === 'inhale' ? 'scale-150 bg-teal-400/20' : breathingPhase === 'exhale' ? 'scale-75 bg-teal-950/40' : 'scale-125 bg-teal-400/40'}`}
                      >
                        <div className="text-teal-100 font-black uppercase text-sm drop-shadow-md">
                          {breathingPhase}
                        </div>
                      </div>
                    </div>
                  )}

                  {isMeditationMode && !capturedImage && !isVerifying && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <div className="bg-stone-900/80 backdrop-blur-sm px-6 py-4 rounded-2xl border-2 border-teal-500/50 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-teal-400 mb-1">
                          <Volume2 size={20} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sprout Guidance Active</span>
                        </div>
                        <div className="text-white font-black text-5xl font-mono drop-shadow-lg">
                          {formatTimer(meditationTimer)}
                        </div>
                        <div className="text-teal-100 text-xs font-bold text-center mt-2 italic px-4 leading-tight">
                          {meditationGuidance}
                        </div>
                      </div>
                    </div>
                  )}

                  {isVerifying && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 p-4">
                      {(isBreathingMode || isMeditationMode) ? <Wind className="text-teal-400 animate-spin" size={48} /> : <Loader2 className="text-blue-400 animate-spin" size={48} />}
                      <p className="text-white font-bold text-center text-sm">{verificationFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              {!isReflectMode && verificationFeedback && !isVerifying && (
                <div className={`w-full p-2 rounded border-2 text-center font-bold text-xs ${verificationFeedback.includes('SUCCESS') ? 'bg-emerald-900/30 border-emerald-500 text-emerald-300' : 'bg-red-900/30 border-red-500 text-red-300'}`}>
                  {verificationFeedback}
                </div>
              )}

              <div className="flex gap-4 w-full">
                {!isBreathingMode && !isMeditationMode && !isReflectMode && !capturedImage && (
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 border-blue-800 text-white font-bold py-3 rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera size={20} /> Take Photo
                  </button>
                )}

                {!isBreathingMode && !isMeditationMode && !isReflectMode && capturedImage && (
                  <>
                    <button
                      onClick={() => { setCapturedImage(null); startCamera(); setVerificationFeedback(null); }}
                      disabled={isVerifying}
                      className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold py-3 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={20} /> Retake
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-800 text-white font-bold py-3 rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check size={20} /> Claim Points
                    </button>
                  </>
                )}

                {isMeditationMode && !isVerifying && (
                  <button
                    onClick={() => closeVerification()}
                    className="flex-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 border-2 border-red-900/50 font-black py-2 rounded-lg transition-all uppercase text-[10px] tracking-widest"
                  >
                    End Session Early
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default TaskBoard;