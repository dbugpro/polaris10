
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Compass, Brain, Zap, Bolt, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Message, LoadingState } from './types';
import { generateResponse, PolarisMode } from './services/geminiService';
import { MessageItem } from './components/MessageItem';
import { Orb } from './components/Orb';

const INITIAL_SUGGESTIONS = [
  "Solve this complex logic puzzle: If a farmer has 17 sheep and all but 9 die, how many are left?",
  "Analyze the long-term impact of quantum computing on modern cryptography.",
  "What's the quickest way to summarize a 50-page document?",
  "Explain the mathematical proof of the Pythagorean theorem."
];

// Tailwind class mappings to avoid dynamic string interpolation issues
const modeColors: Record<PolarisMode, string> = {
  standard: 'cyan',
  fast: 'amber',
  turbo: 'rose',
  deep: 'purple'
};

const bgColors: Record<PolarisMode, string> = {
  standard: 'bg-cyan-500',
  fast: 'bg-amber-500',
  turbo: 'bg-rose-500',
  deep: 'bg-purple-500'
};

const textColors: Record<PolarisMode, string> = {
  standard: 'text-cyan-500',
  fast: 'text-amber-500',
  turbo: 'text-rose-500',
  deep: 'text-purple-500'
};

const borderColors: Record<PolarisMode, string> = {
  standard: 'border-cyan-500/40',
  fast: 'border-amber-500/40',
  turbo: 'border-rose-500/40',
  deep: 'border-purple-500/40'
};

const focusBorderColors: Record<PolarisMode, string> = {
  standard: 'focus:border-cyan-400',
  fast: 'focus:border-amber-400',
  turbo: 'focus:border-rose-400',
  deep: 'focus:border-purple-400'
};

const focusRingColors: Record<PolarisMode, string> = {
  standard: 'focus:ring-cyan-500/50',
  fast: 'focus:ring-amber-500/50',
  turbo: 'focus:ring-rose-500/50',
  deep: 'focus:ring-purple-500/50'
};

const glowGradients: Record<PolarisMode, string> = {
  standard: 'bg-blue-900/10',
  fast: 'bg-amber-900/10',
  turbo: 'bg-rose-900/10',
  deep: 'bg-purple-900/10'
};

const buttonGradients: Record<PolarisMode, string> = {
  standard: 'from-blue-600 to-cyan-500',
  fast: 'from-amber-600 to-orange-500',
  turbo: 'from-rose-600 to-pink-500',
  deep: 'from-purple-600 to-indigo-600'
};

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<PolarisMode>('standard');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkApiKey = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
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
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
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

    if (!hasApiKey && !process.env.API_KEY) {
      await handleConnectKey();
    }

    const currentMode = mode;
    const currentInput = input;
    const currentImage = selectedImage;

    // Fix: Added missing timestamp to user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: currentInput,
      image: currentImage || undefined,
      isDeepThink: currentMode === 'deep' || currentMode === 'turbo',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setLoadingState(LoadingState.THINKING);

    try {
      const result = await generateResponse(currentInput, currentImage || undefined, currentMode);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        groundingSources: result.groundingSources,
        isDeepThink: currentMode === 'deep',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: error.message || "An unexpected error occurred.",
        isError: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30`}>
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-[120px] opacity-20 ${bgColors[mode]}`}></div>
        <div className={`absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-[120px] opacity-10 ${bgColors[mode]}`}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 py-3 md:px-8 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColors[mode]} shadow-lg`}>
            <Compass className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl tracking-tight">Polaris</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity size={10} className={textColors[mode]} />
              AI Navigator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={handleConnectKey}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${hasApiKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
          >
            {hasApiKey ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            <span className="hidden sm:inline">{hasApiKey ? 'Connected' : 'Connect API'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col overflow-hidden relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
            <Orb 
              state={loadingState === LoadingState.THINKING ? 'thinking' : 'idle'} 
              isDeepThink={mode === 'deep'}
              isFast={mode === 'fast'}
              isTurbo={mode === 'turbo'}
            />
            
            <div className="space-y-3">
              <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-300 to-slate-500">
                How can I guide you today?
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm md:text-base">
                Polaris is your advanced AI navigation system, capable of deep reasoning, fast responses, and visual analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {INITIAL_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="p-4 rounded-xl glass-panel border border-white/5 hover:border-white/20 text-left text-sm text-slate-300 transition-all hover:bg-white/5 group"
                >
                  <p className="group-hover:text-white transition-colors">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            {loadingState === LoadingState.THINKING && (
              <div className="flex items-start gap-4 mb-8 animate-in fade-in duration-500">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColors[mode]} animate-pulse`}>
                  <Compass className="text-white" size={20} />
                </div>
                <div className="flex flex-col gap-2">
                   <div className="flex gap-1.5 mt-4">
                      <div className={`w-2 h-2 rounded-full ${bgColors[mode]} animate-bounce [animation-delay:-0.3s]`}></div>
                      <div className={`w-2 h-2 rounded-full ${bgColors[mode]} animate-bounce [animation-delay:-0.15s]`}></div>
                      <div className={`w-2 h-2 rounded-full ${bgColors[mode]} animate-bounce`}></div>
                   </div>
                   <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Polaris is thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-8 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Mode Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {(['standard', 'fast', 'turbo', 'deep'] as PolarisMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${mode === m 
                    ? `${bgColors[m]} text-white shadow-lg shadow-${modeColors[m]}-500/20` 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }
                `}
              >
                {m === 'standard' && <Compass size={14} />}
                {m === 'fast' && <Zap size={14} />}
                {m === 'turbo' && <Bolt size={14} />}
                {m === 'deep' && <Brain size={14} />}
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>

          <form 
            onSubmit={handleSubmit}
            className={`
              relative glass-panel rounded-2xl md:rounded-3xl border ${borderColors[mode]}
              transition-all duration-300 shadow-2xl overflow-hidden
            `}
          >
            {selectedImage && (
              <div className="p-3 border-b border-white/5 flex items-center gap-3 bg-white/5">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 shadow-md">
                  <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 text-sm">Image Attached</p>
                  <p>Polaris will analyze this visual input.</p>
                </div>
              </div>
            )}

            <div className="flex items-center p-2 md:p-3 gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 md:p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors`}
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

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={`Ask Polaris anything (${mode})...`}
                className={`
                  flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500
                  resize-none py-2 md:py-3 max-h-32 text-sm md:text-base custom-scrollbar
                `}
                rows={1}
              />

              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE}
                className={`
                  p-2 md:p-3 rounded-xl bg-gradient-to-r ${buttonGradients[mode]} text-white
                  disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg
                `}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
          
          <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-bold">
            Powered by Gemini · Advanced AI Navigation
          </p>
        </div>
      </footer>
    </div>
  );
}
