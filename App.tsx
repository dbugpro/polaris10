
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Compass, Brain, Zap, Link as LinkIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Message, LoadingState } from './types';
import { generateResponse } from './services/geminiService';
import { MessageItem } from './components/MessageItem';
import { Orb } from './components/Orb';

// Define the AIStudio interface to match the environment's bridge
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Making this optional to match the environment's declaration and avoid "identical modifiers" error
    aistudio?: AIStudio;
  }
}

const INITIAL_SUGGESTIONS = [
  "Solve this complex logic puzzle: If a farmer has 17 sheep and all but 9 die, how many are left?",
  "Analyze the long-term impact of quantum computing on modern cryptography.",
  "Write a detailed comparative essay on the architectural styles of Brunelleschi and Gaudí.",
  "Explain the mathematical proof of the Pythagorean theorem using different methods."
];

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeepThinkEnabled, setIsDeepThinkEnabled] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkApiKey = async () => {
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey || !!process.env.API_KEY);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    } catch (e) {
      setHasApiKey(!!process.env.API_KEY);
    }
  };

  useEffect(() => {
    checkApiKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success as per guidelines to avoid race conditions
      setHasApiKey(true);
    }
  };

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

    // Check key again before sending
    if (!hasApiKey && !process.env.API_KEY) {
      await handleConnectKey();
    }

    const currentMode = isDeepThinkEnabled;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      isDeepThink: currentMode,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setLoadingState(LoadingState.THINKING);

    try {
      const response = await generateResponse(userMessage.text, userMessage.image, currentMode);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        groundingSources: response.groundingSources,
        isDeepThink: currentMode,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      // If requested entity not found, it might be a key issue
      if (error.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }

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
    setIsDeepThinkEnabled(true);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 glass-panel z-20 shadow-2xl relative shrink-0">
        <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center">
                <div className={`absolute inset-0 ${isDeepThinkEnabled ? 'bg-purple-500' : 'bg-cyan-500'} blur-md opacity-40 rounded-full transition-colors duration-500`}></div>
                <Compass className="relative text-white -rotate-45" size={24} />
            </div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white">
            Polaris <span className="text-cyan-500 text-sm md:text-base align-top ml-1">1.0</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
           {/* API Key Status */}
           <div className="flex items-center">
              {hasApiKey ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} />
                  Secure
                </div>
              ) : (
                <button 
                  onClick={handleConnectKey}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all animate-pulse"
                >
                  <ShieldAlert size={12} />
                  Connect API
                </button>
              )}
           </div>

           <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/50 border ${isDeepThinkEnabled ? 'border-purple-500/30 text-purple-400' : 'border-slate-800'} transition-all duration-300`}>
                 <span className={`w-2 h-2 rounded-full ${loadingState === LoadingState.THINKING ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></span>
                 {isDeepThinkEnabled ? '3 Pro' : '3 Flash'}
              </span>
           </div>
           
           <button 
              onClick={() => setIsDeepThinkEnabled(!isDeepThinkEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 border ${isDeepThinkEnabled ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}
              title="Toggle Deep Thinking Mode"
           >
              {isDeepThinkEnabled ? <Brain size={16} className="animate-pulse" /> : <Zap size={16} />}
              <span className="text-[10px] font-bold uppercase tracking-widest hidden xs:inline">{isDeepThinkEnabled ? 'Deep Think' : 'Standard'}</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full">
        
        {/* Background Ambient Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] transition-colors duration-1000 blur-[120px] -z-10 rounded-full pointer-events-none ${isDeepThinkEnabled ? 'bg-purple-900/10' : 'bg-blue-900/10'}`}></div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8 scroll-smooth z-0 w-full">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center py-6">
              <div className="animate-float mb-6 md:mb-8 mt-4">
                <Orb 
                  state={loadingState === LoadingState.THINKING ? 'thinking' : 'idle'} 
                  isDeepThink={isDeepThinkEnabled}
                />
              </div>
              
              <div className="text-center mb-8 max-w-md px-4">
                <h2 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {isDeepThinkEnabled ? 'Ready for complex reasoning' : 'The North Star of Intelligence'}
                </h2>
                <p className="text-sm text-slate-500">
                  {isDeepThinkEnabled 
                    ? "Polaris 3 Pro is optimized for logic, math, and deep research tasks." 
                    : "Ask Polaris anything for fast, accurate navigation through information."}
                </p>
                {!hasApiKey && (
                   <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl inline-flex flex-col items-center gap-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Billing Required for Pro</p>
                      <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        <LinkIcon size={12} /> View Billing Docs
                      </a>
                   </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                {INITIAL_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 md:p-4 text-left rounded-xl glass-panel hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all duration-300 text-xs md:text-sm text-slate-300 active:scale-95 flex items-center gap-3 group"
                  >
                    <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-cyan-900/30 transition-colors">
                      <Brain size={14} className="text-cyan-500" />
                    </div>
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
                <div className="flex items-center gap-3 mb-8 animate-pulse px-2">
                   <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${isDeepThinkEnabled ? 'bg-purple-600/20 border-purple-500/30' : 'bg-cyan-600/20 border-cyan-500/30'} border flex items-center justify-center`}>
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 ${isDeepThinkEnabled ? 'bg-purple-400' : 'bg-cyan-400'} rounded-full animate-ping`}></div>
                   </div>
                   <span className={`${isDeepThinkEnabled ? 'text-purple-400' : 'text-cyan-500'} text-xs md:text-sm font-medium`}>
                     Polaris is {isDeepThinkEnabled ? 'conducting deep research...' : 'thinking...'}
                   </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-6 z-10 max-w-4xl mx-auto w-full shrink-0">
          {!hasApiKey && messages.length > 0 && (
             <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                <span className="text-xs text-red-200">API Key required to continue.</span>
                <button onClick={handleConnectKey} className="text-xs font-bold text-red-400 uppercase tracking-widest hover:text-red-300">Connect Now</button>
             </div>
          )}
          <form onSubmit={handleSubmit} className="relative group">
            {/* Image Preview */}
            {selectedImage && (
              <div className="absolute bottom-full mb-4 left-0 p-2 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="h-16 md:h-24 w-auto rounded object-cover" 
                />
                <button 
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              {/* File Input Trigger */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 md:left-3 p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-800"
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
                placeholder={isDeepThinkEnabled ? "Ask a complex question for deep analysis..." : "Ask Polaris anything..."}
                className={`w-full bg-slate-900/80 backdrop-blur-md border ${isDeepThinkEnabled ? 'border-purple-500/40 focus:border-purple-400 focus:ring-purple-500/50' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/50'} text-slate-100 rounded-2xl py-3 pl-11 md:pl-14 pr-11 md:pr-14 focus:outline-none focus:ring-1 transition-all shadow-lg placeholder:text-slate-500 text-sm md:text-base`}
                disabled={loadingState !== LoadingState.IDLE}
              />

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={(!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE}
                className={`
                  absolute right-2 md:right-3 p-2 rounded-xl transition-all duration-300
                  ${(!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : isDeepThinkEnabled 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95'}
                `}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <p className="text-center text-slate-600 text-[10px] mt-2 md:mt-3 flex items-center justify-center gap-1">
            <Zap size={10} /> Powered by Gemini 3 series • {isDeepThinkEnabled ? 'Deep Thinking Active' : 'Standard Navigation'}
          </p>
        </div>
      </main>
    </div>
  );
}
