
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, User, Utensils, Apple, Camera, X, Loader2, Info, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithNutritionBot } from '../services/openaiService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface NutritionChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onBack: () => void;
  userProfile?: import('../types').UserProfile;
}

const NutritionChat: React.FC<NutritionChatProps> = ({ messages, setMessages, onBack, userProfile }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      } else {
        // Fallback for immediate state update
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        }, 100);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("I need your camera to see your 'interesting' food choices.");
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
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleSend = async (img?: string) => {
    if ((!inputText.trim() && !img) || isLoading) return;

    const textToSend = img ? (inputText.trim() || "Analyze this meal for me.") : inputText;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev.slice(-19), userMsg, { id: `nutri-${Date.now()}`, sender: 'bot', senderName: 'Chef Nourish', avatarColor: '#F59E0B', text: '', isTyping: true, timestamp: Date.now() }]);

    const responseText = await chatWithNutritionBot(messages, textToSend, img || undefined, userProfile);

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: responseText, timestamp: Date.now() };

    setMessages(prev => {
      const updatedMessages = prev.filter(msg => !msg.isTyping); // Remove the typing indicator
      return [...updatedMessages, botMsg];
    });
    setIsLoading(false);

    // Save to Supabase
    const { session } = await authService.getSession();
    if (session?.user) {
      await dataService.saveChatMessage(session.user.id, 'nutrition', userMsg);
      await dataService.saveChatMessage(session.user.id, 'nutrition', botMsg);
    }
  };

  const renderCameraModal = () => {
    if (!isCameraActive) return null;

    return createPortal(
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm aspect-square border-4 border-emerald-500 rounded-2xl overflow-hidden bg-stone-900 shadow-[0_0_50px_rgba(16,185,129,0.5)]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Decorative scanner frame */}
          <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
            <div className="w-full h-full border-2 border-emerald-400/50 flex items-center justify-center">
              <Sparkles className="text-emerald-400/10" size={100} />
            </div>
          </div>

          {/* Floating Controls inside the square to ensure visibility */}
          <div className="absolute bottom-6 left-0 w-full flex justify-center items-center gap-10">
            <button
              onClick={stopCamera}
              className="bg-stone-800/90 text-white p-4 rounded-full border-2 border-white/20 hover:bg-stone-700 transition-colors shadow-lg active:scale-90"
            >
              <X size={32} />
            </button>
            <button
              onClick={capturePhoto}
              className="bg-emerald-500 text-white p-6 rounded-full border-4 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-75 transition-all transform hover:scale-105"
            >
              <Camera size={48} />
            </button>
          </div>

          <div className="absolute top-4 left-0 w-full text-center">
            <span className="bg-black/60 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-emerald-500/30">
              Awaiting Sustenance...
            </span>
          </div>
        </div>

        <p className="mt-8 text-stone-400 text-xs font-bold uppercase tracking-widest text-center px-8 leading-relaxed">
          Point at your meal and press the <span className="text-emerald-500">Green Button</span> to analyze
        </p>
      </div>,
      document.body
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1C] border-4 border-[#3E4D3E] rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#2E7D32] p-4 border-b-4 border-[#1B5E20] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center border-2 border-white/20 shadow-inner">
            <Apple size={24} className="text-[#1B5E20] fill-[#1B5E20]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none italic">BITE-SIZED</h2>
            <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-tighter">Consistency &gt; Perfection 🥗</span>
          </div>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-[#1B5E20] rounded-full text-white/70">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/80 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border-2 shadow-sm ${msg.sender === 'user' ? 'bg-emerald-900 border-emerald-700 text-emerald-200' : 'bg-[#2E7D32] border-[#1B5E20] text-white'}`}>
                {msg.sender === 'user' ? <User size={16} /> : <Utensils size={16} />}
              </div>
              <div className={`p-3 rounded-2xl border-2 shadow-md relative ${msg.sender === 'user' ? 'bg-emerald-900/80 border-emerald-800 text-emerald-50 rounded-tr-none' : 'bg-[#2C2C2E] border-[#3E4D3E] text-stone-100 rounded-tl-none'}`}>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[9px] opacity-40 mt-1 block uppercase font-black">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2C2C2E] p-3 rounded-2xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#1A1A1C] border-t-4 border-[#3E4D3E] flex flex-col gap-3">
        {capturedImage && (
          <div className="relative w-24 h-24 rounded-lg border-2 border-emerald-500 overflow-hidden group">
            <img src={capturedImage} className="w-full h-full object-cover" />
            <button onClick={() => setCapturedImage(null)} className="absolute top-0 right-0 p-1 bg-red-500 text-white"><X size={12} /></button>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            className="bg-stone-800 hover:bg-stone-700 text-emerald-400 p-3 rounded-xl border-b-4 border-stone-950 active:border-b-0 active:translate-y-1 transition-all"
            title="Capture your meal"
          >
            <Camera size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(capturedImage || undefined)}
            placeholder="Rate my lunch? 🍕"
            className="flex-1 bg-[#2C2C2E] border-2 border-[#3E4D3E] text-white px-4 py-3 focus:outline-none focus:border-emerald-600 rounded-xl transition-all"
          />
          <button
            onClick={() => handleSend(capturedImage || undefined)}
            disabled={isLoading}
            className="bg-[#2E7D32] hover:bg-[#388E3C] text-white p-3 px-5 rounded-xl border-b-4 border-[#1B5E20] active:border-b-0 active:translate-y-1 transition-all shadow-xl disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-black/40 px-4 py-2 flex flex-col gap-1 border-t border-[#3E4D3E]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={10} className="text-emerald-500" />
            <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest italic leading-none">Homestead Nutrition Protocol v0.9</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
        <p className="text-[8px] text-stone-500 italic leading-none">Always consult a real human dietician for medical advice. Click the Restaurant counter to find one!</p>
      </div>

      {/* Camera Modal Portal */}
      {renderCameraModal()}
    </div>
  );
};

export default NutritionChat;
