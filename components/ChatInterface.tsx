
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Calendar, Volume2, VolumeX, AlarmClockCheck, Bell, ShieldCheck, Info, Mic, MicOff, AlertCircle } from 'lucide-react';
import { ChatMessage, GameState, Reminder } from '../types';
import { chatWithSprout, generateSproutSpeech } from '../services/openaiService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

function decodeBase64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}



const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages, gameState, setGameState }) => {
  const [inputText, setInputText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [lastScheduledTask, setLastScheduledTask] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<NotificationPermission>(Notification.permission);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep track of permission state
  useEffect(() => {
    const interval = setInterval(() => {
      if (Notification.permission !== permStatus) {
        setPermStatus(Notification.permission);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [permStatus]);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermStatus(permission);
    if (permission === 'granted') {
      speakText("System alerts are now active! I'll nudge your OS when it's time for your tasks.");
    }
  };

  // Audio Playback helper
  const resumeAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log("AudioContext resumed successfully");
      } catch (e) {
        console.error("Audio resume failed", e);
      }
    }
  };

  const speakText = async (text: string) => {
    if (isMuted) return;
    try {
      console.log("Generating speech for:", text);
      const base64Audio = await generateSproutSpeech(text);
      if (!base64Audio) {
        console.error("No audio data received from OpenAI");
        return;
      }

      await resumeAudio();

      const ctx = audioContextRef.current!;
      const base64String = base64Audio.split(',')[1] || base64Audio;
      const uint8Audio = decodeBase64ToUint8Array(base64String);
      const audioBuffer = await ctx.decodeAudioData(uint8Audio.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      console.log("Audio playback started");
      // Add visual confirmation for user debugging
      // alert("Sprout is speaking! 🔊"); // Commented out to be less intrusive, but kept for debug if needed
    } catch (err) {
      console.error("Speech playback failed:", err);
      alert("Audio Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ... (existing code)

  const scheduleReminderGlobally = (task: string, timeStr: string) => {
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/;
    const timeMatch = timeStr.match(timeRegex);
    if (!timeMatch) return;

    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = (timeMatch[3] || '').toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (target < now) target.setDate(target.getDate() + 1);

    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      task: task,
      time: target.getTime(),
      triggered: false
    };

    setGameState(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));

    const displayTime = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    setLastScheduledTask(`${task} at ${displayTime}`);
    setTimeout(() => setLastScheduledTask(null), 6000);
    // Play prompt immediately
    speakText(`Got it! I've armed a system alarm for ${task} at ${displayTime}.`);
  };

  const handlePlanDay = async () => {
    await resumeAudio(); // Resume on user click
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: "I want to plan my day, Sprout!",
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const responseText = await chatWithSprout(messages, "I want to plan my day. Ask me for my schedule. Remind me to give you exact times (e.g. 9:40pm) for my alerts.");

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
    // Play speech immediately
    speakText(responseText);

    // Save to Supabase
    const { session } = await authService.getSession();
    if (session?.user) {
      await dataService.saveChatMessage(session.user.id, 'sprout', userMsg);
      await dataService.saveChatMessage(session.user.id, 'sprout', botMsg);
    }
  };

  const handleSend = async (forcedText?: string) => {
    await resumeAudio(); // Resume on user interaction
    const textToSubmit = (forcedText || inputText).trim();
    if (!textToSubmit || isLoading) return;

    // Resume audio context on user gesture
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Stop listening if send is clicked
    if (isListening) {
      recognitionRef.current?.stop();
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: textToSubmit, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setInterimText('');
    setIsLoading(true);

    // Fetch User Profile for Context
    const { session } = await authService.getSession();
    let userProfile;
    if (session?.user) {
      const { data } = await dataService.getProfile(session.user.id);
      userProfile = data;
    }

    const responseText = await chatWithSprout(messages, textToSubmit, userProfile || undefined);

    const timeRegex = /(\d{1,2}(?::\d{2})?\s*(am|pm|AM|PM))|(\d{1,2}:\d{2})/;
    const timeMatch = textToSubmit.match(timeRegex);
    if (timeMatch) {
      const timeStr = timeMatch[0];
      const taskName = textToSubmit.replace(timeStr, '').replace(/\bat\b/gi, '').replace(/[!.,]/g, '').trim() || "Planned Activity";
      scheduleReminderGlobally(taskName, timeStr);
    }

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
    // Play speech immediately
    if (!timeMatch) speakText(responseText);

    // Save to Supabase
    if (session?.user) {
      const { error: err1 } = await dataService.saveChatMessage(session.user.id, 'sprout', userMsg);
      if (err1) {
        console.error("Save chat error (user):", err1);
        alert(`Error saving chat: ${err1.message}`);
      }

      const { error: err2 } = await dataService.saveChatMessage(session.user.id, 'sprout', botMsg);
      if (err2) console.error("Save chat error (bot):", err2);
    }
  };

  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition not supported in this browser.");
      return;
    }

    // Re-create recognition instance each time to clear internal buffers and handle potential crashes
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let currentFinal = '';
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }
      if (currentFinal) {
        setInputText(prev => (prev + (prev ? ' ' : '') + currentFinal).trim());
        setInterimText('');
      } else {
        setInterimText(currentInterim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'network') {
        setSpeechError("Network error. Google's speech services might be blocked by your browser (common in Brave) or your connection is weak.");
      } else if (event.error === 'not-allowed') {
        setSpeechError("Microphone access denied. Please check your browser permissions.");
      } else {
        setSpeechError(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setSpeechError("Could not start microphone.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-800 border-4 border-stone-700 rounded-lg overflow-hidden pixel-corners shadow-lg">
      <div className="bg-stone-900 p-2 px-3 border-b-4 border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${permStatus === 'granted' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <h2 className="text-lg font-bold text-stone-300">Sprout AI</h2>
          <button onClick={() => setIsMuted(!isMuted)} className={`ml-2 p-1 transition-colors ${isMuted ? 'text-red-500' : 'text-stone-500 hover:text-stone-300'}`}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => speakText("Testing, testing! Can you hear me now?")}
            className="flex items-center gap-1.5 bg-pink-700 hover:bg-pink-600 text-pink-100 px-3 py-1.5 rounded border-b-2 border-pink-900 active:border-b-0 active:translate-y-0.5 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Volume2 size={14} />
            Test Voice
          </button>
          <button
            onClick={handlePlanDay}
            className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-indigo-100 px-3 py-1.5 rounded border-b-2 border-indigo-900 active:border-b-0 active:translate-y-0.5 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Calendar size={14} />
            Plan Day
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-stone-900/50 relative">

        {/* Explicit Permission Request Card (Visible only if NOT granted) */}
        {permStatus !== 'granted' && (
          <div className="bg-stone-800 border-2 border-stone-600 rounded-lg p-3 mb-2 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="bg-stone-900 p-2 rounded border border-stone-700">
                <Bell className={permStatus === 'denied' ? "text-red-500" : "text-yellow-500"} size={20} />
              </div>
              <div className="flex-1">
                <p className="text-stone-200 text-xs font-bold uppercase tracking-tight">System Alerts Required</p>
                <p className="text-stone-500 text-[10px] mt-1 leading-snug">
                  {permStatus === 'denied'
                    ? "Brave is blocking alerts. Click the Lock icon 🔒 in the address bar and set Notifications to 'Allow'."
                    : "Sprout needs your permission to send alerts to your OS even when the tab is closed."}
                </p>
                {permStatus === 'default' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="mt-2 w-full bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black uppercase py-2 rounded border-b-2 border-emerald-900 active:border-b-0 active:translate-y-0.5 transition-all"
                  >
                    Grant Alert Access
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded border-2 ${msg.sender === 'user' ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-stone-700 border-stone-500 text-emerald-400'}`}>
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-2 px-3 rounded text-lg border-2 shadow-sm ${msg.sender === 'user' ? 'bg-blue-900/80 border-blue-800 text-blue-100' : 'bg-stone-200 border-stone-400 text-stone-900'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-stone-500 text-sm animate-pulse ml-10">...</div>}
        <div ref={messagesEndRef} />

        {lastScheduledTask && (
          <div className="sticky bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full border-2 border-emerald-400 shadow-xl animate-bounce">
            <AlarmClockCheck size={16} />
            <span className="text-[10px] font-bold uppercase whitespace-nowrap tracking-tight">Armed: {lastScheduledTask}</span>
          </div>
        )}
      </div>

      {speechError && (
        <div className="bg-red-900/80 text-red-200 px-3 py-2 text-[10px] font-bold flex items-start gap-2 border-t-2 border-red-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="flex-1 leading-tight">{speechError}</p>
          <button onClick={() => setSpeechError(null)} className="opacity-60 hover:opacity-100"><MicOff size={14} /></button>
        </div>
      )}

      <div className="p-2 pb-safe bg-stone-800 border-t-4 border-stone-700 flex flex-col gap-2">
        {isListening && (
          <div className="flex items-center justify-center gap-2 py-1 animate-pulse">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Sprout is Listening...</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 px-3 rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all ${isListening ? 'bg-red-600 hover:bg-red-500 border-red-800 text-white' : 'bg-stone-700 hover:bg-stone-600 text-stone-300 border-stone-900'}`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Meds at 9:40 PM..."
              className="w-full bg-stone-950 border-2 border-stone-600 text-stone-200 px-3 py-2 focus:outline-none focus:border-emerald-600 rounded pixel-corners text-lg"
            />
            {isListening && interimText && (
              <div className="absolute left-3 top-2.5 text-stone-500 pointer-events-none italic overflow-hidden whitespace-nowrap text-lg">
                <span className="invisible">{inputText}</span>
                {inputText ? ' ' : ''}
                {interimText}
              </div>
            )}
          </div>
          <button onClick={() => handleSend()} disabled={isLoading} className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 p-2 px-3 rounded border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all">
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="bg-stone-900 px-3 py-1.5 border-t border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {permStatus === 'granted' ? <ShieldCheck size={10} className="text-emerald-500" /> : <Bell size={10} className="text-stone-600" />}
          <span className={`text-[9px] uppercase font-bold tracking-widest ${permStatus === 'granted' ? "text-emerald-500" : "text-stone-600"}`}>
            System Sync: {permStatus === 'granted' ? 'ACTIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-stone-600 font-bold uppercase italic">
          {gameState.reminders.filter(r => !r.triggered).length} Active Alerts
          <Info size={10} className="ml-1 opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
