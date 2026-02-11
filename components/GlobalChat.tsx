
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Users, Globe, ChevronLeft, Shield } from 'lucide-react';
import { ChatMessage } from '../types';

interface GlobalChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ messages, onSendMessage, onBack }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A] border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#1E293B] p-4 border-b-4 border-slate-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-cyan-400 animate-pulse" />
              <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">Global Feed</h2>
            </div>
            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-tighter mt-1">Homestead Public Channel • 42 Online</span>
          </div>
        </div>
        <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Public</span>
        </div>
      </div>

      {/* Warning/Info Banner */}
      <div className="bg-cyan-950/30 border-b border-cyan-800/30 px-4 py-2 flex items-center gap-2">
        <Shield size={12} className="text-cyan-500" />
        <p className="text-[10px] text-cyan-400 font-medium italic">Be kind to fellow Homesteaders. Sprout is watching! 🤖</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSprout = msg.sender === 'bot';
          
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div 
                  className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border-2 shadow-inner overflow-hidden transition-transform hover:scale-110`}
                  style={{ 
                    backgroundColor: isSprout ? '#388E3C' : (msg.avatarColor || '#475569'),
                    borderColor: isSprout ? '#1B5E20' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  {isSprout ? (
                    <img src="https://img.icons8.com/pixel-blue/512/bot.png" className="w-6 h-6 invert opacity-80" alt="Bot" />
                  ) : (
                    <User size={18} className="text-white opacity-80" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {!isUser && (
                    <span className={`text-[10px] font-black uppercase tracking-wider ml-1 ${isSprout ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {msg.senderName || 'Homesteader'}
                      {isSprout && <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-900/50 text-[8px] rounded border border-emerald-500/30 text-emerald-400">ADMIN</span>}
                    </span>
                  )}
                  <div className={`p-3 rounded-2xl border shadow-lg relative ${
                    isUser 
                    ? 'bg-cyan-600 border-cyan-500 text-white rounded-tr-none' 
                    : isSprout 
                    ? 'bg-slate-800 border-emerald-500/30 text-emerald-100 rounded-tl-none' 
                    : 'bg-slate-800 border-slate-700 text-slate-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    <span className={`text-[9px] mt-1 block uppercase font-black opacity-40 ${isUser ? 'text-white text-right' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#1E293B] border-t-4 border-slate-800 flex gap-3">
        <input 
          type="text" 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
          placeholder="Say hi to the community..." 
          className="flex-1 bg-slate-900 border-2 border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-cyan-500 rounded-xl transition-all shadow-inner" 
        />
        <button 
          onClick={handleSend} 
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 px-6 rounded-xl border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1 transition-all shadow-xl"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default GlobalChat;
