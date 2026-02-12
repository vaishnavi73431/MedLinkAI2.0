
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Dumbbell, Zap, Flame, Trophy } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithTrainer } from '../services/openaiService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface TrainerChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const TrainerChat: React.FC<TrainerChatProps> = ({ messages, setMessages }) => {
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

    const responseText = await chatWithTrainer(messages, currentInput);

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);

    // Save to Supabase
    const { session } = await authService.getSession();
    if (session?.user) {
      await dataService.saveChatMessage(session.user.id, 'trainer', userMsg);
      await dataService.saveChatMessage(session.user.id, 'trainer', botMsg);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1C] border-4 border-[#3E3E42] rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#880E4F] p-4 border-b-4 border-[#560027] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center border-2 border-white/20 shadow-inner">
            <Zap size={24} className="text-[#880E4F] fill-[#880E4F]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none italic">COACH FLEX</h2>
            <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-tighter">Your Gym Buddy 🔥</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-pink-900/40 px-3 py-1 rounded-full border border-pink-700/50 flex items-center gap-1.5">
            <Flame size={12} className="text-orange-400 animate-pulse" />
            <span className="text-[9px] font-black text-pink-100 uppercase tracking-widest">In Session</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/80 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border-2 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-900 border-indigo-700 text-indigo-200' : 'bg-[#AD1457] border-[#D81B60] text-white'}`}>
                {msg.sender === 'user' ? <User size={16} /> : <Dumbbell size={16} />}
              </div>
              <div className={`p-3 rounded-2xl border-2 shadow-md relative ${msg.sender === 'user' ? 'bg-indigo-900/80 border-indigo-800 text-indigo-50 rounded-tr-none' : 'bg-[#2C2C2E] border-[#3E3E42] text-stone-100 rounded-tl-none'}`}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
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
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#1A1A1C] border-t-4 border-[#3E3E42] flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ready for 30 minutes! 💪"
          className="flex-1 bg-[#2C2C2E] border-2 border-[#3E3E42] text-white px-4 py-3 focus:outline-none focus:border-pink-600 rounded-xl transition-all"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-[#880E4F] hover:bg-[#AD1457] text-white p-3 px-5 rounded-xl border-b-4 border-[#560027] active:border-b-0 active:translate-y-1 transition-all shadow-xl disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Status Bar */}
      <div className="bg-black/40 px-4 py-1.5 flex items-center justify-between border-t border-[#3E3E42]/30">
        <div className="flex items-center gap-2">
          <Trophy size={10} className="text-yellow-500" />
          <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest italic">Homestead Fitness Protocol v1.4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-pink-600 uppercase tracking-widest">Active</span>
        </div>
      </div>
    </div>
  );
};

export default TrainerChat;