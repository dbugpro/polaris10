import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Compass } from 'lucide-react';
import { Message, LoadingState } from './types';
import { generateResponse } from './services/geminiService';
import { MessageItem } from './components/MessageItem';
import { Orb } from './components/Orb';

const INITIAL_SUGGESTIONS = [
  "What are the latest developments in fusion energy?",
  "Show me a picture of the Andromeda galaxy and explain it.",
  "Compare the specifications of the iPhone 16 vs Pixel 9.",
  "What is the current location of the ISS?"
];

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setLoadingState(LoadingState.THINKING);

    try {
      const response = await generateResponse(userMessage.text, userMessage.image);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        groundingSources: response.groundingSources,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: error instanceof Error ? error.message : "An unknown error occurred.",
        isError: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 glass-panel z-10 shadow-2xl relative shrink-0">
        <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-500 blur-md opacity-40 rounded-full"></div>
                {/* Rotated compass to point upright (North) and colored white */}
                <Compass className="relative text-white -rotate-45" size={28} />
            </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Polaris v1
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
           <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/50 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Gemini 2.5 Flash
           </span>
           <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/50 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Google Search
           </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth z-0 w-full">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center py-6">
              <div className="animate-float mb-8 mt-4">
                <Orb state={loadingState === LoadingState.THINKING ? 'thinking' : 'idle'} />
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                {INITIAL_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 md:p-4 text-left rounded-xl glass-panel hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all duration-300 text-xs md:text-sm text-slate-300 active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto pb-4 w-full">
              {messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} />
              ))}
              
              {loadingState === LoadingState.THINKING && (
                <div className="flex items-center gap-3 mb-8 animate-pulse">
                   <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                   </div>
                   <span className="text-cyan-500 text-sm font-medium">Polaris is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 z-10 max-w-4xl mx-auto w-full shrink-0">
          <form onSubmit={handleSubmit} className="relative group">
            {/* Image Preview */}
            {selectedImage && (
              <div className="absolute bottom-full mb-4 left-0 p-2 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="h-24 w-auto rounded object-cover" 
                />
                <button 
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              {/* File Input Trigger */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-3 p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-800"
                title="Upload image"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Polaris anything..."
                className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-100 rounded-2xl py-3 md:py-4 pl-12 md:pl-14 pr-12 md:pr-14 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-lg placeholder:text-slate-500 text-sm md:text-base"
                disabled={loadingState !== LoadingState.IDLE}
              />

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={(!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE}
                className={`
                  absolute right-3 p-2 rounded-xl transition-all duration-300
                  ${(!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95'}
                `}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <p className="text-center text-slate-600 text-[10px] mt-3">
            Polaris can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
}