
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Activity, Stethoscope, HeartPulse, ChevronLeft, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithDoctor } from '../services/openaiService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface DoctorChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onBack: () => void;
  userProfile?: import('../types').UserProfile;
}

const DoctorChat: React.FC<DoctorChatProps> = ({ messages, setMessages, onBack, userProfile }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    const responseText = await chatWithDoctor(messages, currentInput, userProfile);

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);

    // Save to Supabase
    const { session } = await authService.getSession();
    if (session?.user) {
      await dataService.saveChatMessage(session.user.id, 'doctor', userMsg);
      await dataService.saveChatMessage(session.user.id, 'doctor', botMsg);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F4F8] border-4 border-[#4A90E2] rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#4A90E2] p-4 border-b-4 border-[#357ABD] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-2 border-stone-200 shadow-inner">
            <Stethoscope size={24} className="text-[#4A90E2]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">DR. TRIAGE</h2>
            <span className="text-[10px] text-blue-100 font-bold uppercase tracking-tighter">Homestead Medical Guide 🩺</span>
          </div>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-[#357ABD] rounded-full text-white/70 transition-colors">
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Safety Banner */}
      <div className="bg-blue-100 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
        <ShieldCheck size={12} className="text-blue-600" />
        <p className="text-[9px] text-blue-800 font-medium italic">Triage mode active. Listening to guide you to the right specialist.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border-2 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-900 border-indigo-700 text-indigo-200' : 'bg-[#4A90E2] border-[#357ABD] text-white'}`}>
                {msg.sender === 'user' ? <User size={16} /> : <Activity size={16} />}
              </div>
              <div className={`p-3 rounded-2xl border-2 shadow-sm relative ${msg.sender === 'user' ? 'bg-indigo-900/80 border-indigo-800 text-indigo-50 rounded-tr-none' : 'bg-white border-stone-200 text-stone-800 rounded-tl-none'}`}>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className={`text-[9px] opacity-40 mt-1 block uppercase font-black ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t-4 border-[#4A90E2] flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="I have a slight headache..."
          className="flex-1 bg-stone-100 border-2 border-stone-200 text-stone-900 px-4 py-3 focus:outline-none focus:border-[#4A90E2] rounded-xl transition-all"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-[#4A90E2] hover:bg-[#357ABD] text-white p-3 px-5 rounded-xl border-b-4 border-[#2A6198] active:border-b-0 active:translate-y-1 transition-all shadow-xl disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Status Bar */}
      <div className="bg-stone-100 px-4 py-2 flex flex-col gap-1 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse size={10} className="text-red-500" />
            <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest italic leading-none">Homestead Triage Guide v1.0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorChat;
