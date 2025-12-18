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

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<PolarisMode>('standard');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingState]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
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
    const currentInput = input;
    const currentImage = selectedImage;
    const currentMode = mode;
    
    setInput('');
    setSelectedImage(null);
    setLoadingState(LoadingState.THINKING);

    try {
      const response = await generateResponse(currentInput, currentImage || undefined, currentMode);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: response.text,
        groundingSources: response.groundingSources,
        timestamp: Date.now(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: err.message || "An error occurred.",
        isError: true,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 glass-panel border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <Compass className={textColors[mode]} size={28} />
          <h1 className="text-xl font-bold tracking-tight">POLARIS</h1>
        </div>
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10">
          <button onClick={() => setMode('fast')} className={`p-2 rounded-full transition-all ${mode === 'fast' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}><Bolt size={18} /></button>
          <button onClick={() => setMode('standard')} className={`p-2 rounded-full transition-all ${mode === 'standard' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}><Zap size={18} /></button>
          <button onClick={() => setMode('turbo')} className={`p-2 rounded-full transition-all ${mode === 'turbo' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}><Activity size={18} /></button>
          <button onClick={() => setMode('deep')} className={`p-2 rounded-full transition-all ${mode === 'deep' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}><Brain size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-0 animate-in fade-in duration-1000 fill-mode-forwards">
            <Orb state="idle" isDeepThink={mode === 'deep'} isFast={mode === 'fast'} isTurbo={mode === 'turbo'} />
            <h2 className="text-2xl font-light tracking-widest text-slate-400">WAITING FOR DIRECTION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {INITIAL_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)} className="p-4 text-left glass-panel rounded-xl hover:border-white/20 transition-all text-sm text-slate-400 hover:text-white">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(m => <MessageItem key={m.id} message={m} />)}
            {loadingState === LoadingState.THINKING && <div className={`flex items-center gap-3 animate-pulse ${textColors[mode]}`}><Activity className="animate-spin" /> <span>Polaris is navigating...</span></div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className={`relative flex items-center glass-panel rounded-2xl border ${borderColors[mode]} transition-colors duration-500`}>
            {selectedImage && (
              <div className="absolute bottom-full left-0 mb-4 p-2 glass-panel rounded-lg">
                <img src={selectedImage} className="h-20 w-auto rounded" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={12} /></button>
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="ml-4 text-slate-400 hover:text-white"><ImageIcon size={22} /></button>
            <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 p-4 text-white" 
              placeholder="Enter coordinates..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button className={`mr-4 p-2 rounded-lg ${bgColors[mode]} text-white`} type="submit"><Send size={20} /></button>
          </form>
        </div>
      </footer>
    </div>
  );
}
