import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Compass, Brain, Zap, Bolt, Activity, Key, CheckCircle2, Info, Volume2, VolumeX } from 'lucide-react';
import { Message, LoadingState } from './types';
import { generateResponse, generateSpeech, PolarisMode, decodeBase64, decodeAudioData } from './services/geminiService';
import { MessageItem } from './components/MessageItem';
import { Orb } from './components/Orb';

const INITIAL_SUGGESTIONS = [
  "Solve this complex logic puzzle: If a farmer has 17 sheep and all but 9 die, how many are left?",
  "Analyze the long-term impact of quantum computing on modern cryptography.",
  "What's the quickest way to summarize a 50-page document?",
  "Explain the mathematical proof of the Pythagorean theorem."
];

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
  const [isAiStudioEnv, setIsAiStudioEnv] = useState(false);
  const [showQuotaTip, setShowQuotaTip] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        setIsAiStudioEnv(true);
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopCurrentSpeech = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop();
      currentAudioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playSpeech = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      stopCurrentSpeech();
      setIsSpeaking(true);

      const audioBuffer = await decodeAudioData(
        decodeBase64(base64Audio),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      
      currentAudioSourceRef.current = source;
      source.start();
    } catch (error) {
      console.error("Playback error:", error);
      setIsSpeaking(false);
    }
  };

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingState, isSpeaking]);

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

    stopCurrentSpeech();

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

      if (isVoiceEnabled) {
        const audioData = await generateSpeech(response.text);
        if (audioData) {
          await playSpeech(audioData);
        }
      }
    } catch (err: any) {
      const isQuotaError = err.message.includes('capacity') || err.message.includes('Limit');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: err.message || "An error occurred.",
        isError: true,
        timestamp: Date.now(),
      }]);
      if (isQuotaError) setShowQuotaTip(true);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden selection:bg-cyan-500/30">
      <header className="flex items-center justify-between px-6 py-3 glass-panel border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${bgColors[mode]} transition-colors duration-500 shadow-lg shadow-black/40`}>
             <Compass className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tighter text-white">POLARIS 1.0</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              if (isSpeaking) stopCurrentSpeech();
            }}
            className={`p-2 rounded-full border transition-all ${isVoiceEnabled ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
            title={isVoiceEnabled ? "Voice Enabled" : "Voice Disabled"}
          >
            {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

           <div className="hidden sm:flex items-center gap-1 bg-black/30 p-1 rounded-full border border-white/10">
            <button onClick={() => setMode('fast')} title="Fast Mode" className={`p-1.5 rounded-full transition-all ${mode === 'fast' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}><Bolt size={16} /></button>
            <button onClick={() => setMode('standard')} title="Standard Mode" className={`p-1.5 rounded-full transition-all ${mode === 'standard' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}><Zap size={16} /></button>
            <button onClick={() => setMode('turbo')} title="Turbo Mode" className={`p-1.5 rounded-full transition-all ${mode === 'turbo' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}><Activity size={16} /></button>
            <button onClick={() => setMode('deep')} title="Deep Mode" className={`p-1.5 rounded-full transition-all ${mode === 'deep' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}><Brain size={16} /></button>
          </div>

          {isAiStudioEnv && (
            <button 
              onClick={handleConnectKey} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${hasApiKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
            >
              {hasApiKey ? <CheckCircle2 size={12} /> : <Key size={12} />}
              <span>{hasApiKey ? 'Ready' : 'API Key'}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-0 animate-in fade-in duration-1000 fill-mode-forwards">
            <Orb state={loadingState === LoadingState.THINKING ? 'thinking' : isSpeaking ? 'speaking' : 'idle'} isDeepThink={mode === 'deep'} isFast={mode === 'fast'} isTurbo={mode === 'turbo'} />
            <div className="text-center space-y-2">
               <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] text-slate-300 uppercase">System Active</h2>
               <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                 Multimodal Navigation
               </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {INITIAL_SUGGESTIONS.map(s => (
                <button 
                  key={s} 
                  onClick={() => setInput(s)} 
                  className="p-4 text-left glass-panel rounded-xl hover:bg-white/5 hover:border-white/20 transition-all text-xs md:text-sm text-slate-400 hover:text-white group"
                >
                  <span className="group-hover:translate-x-1 transition-transform inline-block">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(m => <MessageItem key={m.id} message={m} />)}
            {loadingState === LoadingState.THINKING && (
              <div className={`flex items-center gap-3 animate-pulse px-4 ${textColors[mode]}`}>
                <div className="relative">
                   <Activity className="animate-spin" size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Navigating Knowledge...</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-3 px-4 text-cyan-400">
                <div className="flex gap-1 items-end h-3">
                  <div className="w-1 bg-current animate-[bounce_1s_infinite_0ms]"></div>
                  <div className="w-1 bg-current animate-[bounce_1s_infinite_200ms]"></div>
                  <div className="w-1 bg-current animate-[bounce_1s_infinite_400ms]"></div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Synthesizing Vocal Protocol...</span>
              </div>
            )}
            {showQuotaTip && (
              <div className="mx-auto max-w-lg p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start animate-in slide-in-from-top-4 duration-500">
                <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-amber-200/80 leading-relaxed">
                  <p className="font-bold text-amber-500 uppercase mb-1">Free Tier Advisory</p>
                  Polaris operates on Google's free API tier. If you see rate limit errors frequently, try switching to <strong>Fast Mode</strong> or wait 1 minute for your quota to reset.
                  <button onClick={() => setShowQuotaTip(false)} className="block mt-2 font-bold hover:underline">Dismiss</button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="p-4 md:p-6 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex sm:hidden justify-center gap-4 mb-4">
             <button onClick={() => setMode('fast')} className={`p-2 rounded-lg ${mode === 'fast' ? 'bg-amber-500' : 'bg-white/5'}`}><Bolt size={18} /></button>
             <button onClick={() => setMode('standard')} className={`p-2 rounded-lg ${mode === 'standard' ? 'bg-cyan-500' : 'bg-white/5'}`}><Zap size={18} /></button>
             <button onClick={() => setMode('turbo')} className={`p-2 rounded-lg ${mode === 'turbo' ? 'bg-rose-500' : 'bg-white/5'}`}><Activity size={18} /></button>
             <button onClick={() => setMode('deep')} className={`p-2 rounded-lg ${mode === 'deep' ? 'bg-purple-500' : 'bg-white/5'}`}><Brain size={18} /></button>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className={`
              relative flex items-center glass-panel rounded-2xl border ${borderColors[mode]} 
              transition-all duration-500 shadow-2xl focus-within:ring-2 focus-within:ring-white/10
            `}
          >
            {selectedImage && (
              <div className="absolute bottom-full left-0 mb-4 p-2 glass-panel rounded-xl animate-in slide-in-from-bottom-2">
                <div className="relative">
                  <img src={selectedImage} className="h-24 w-auto rounded-lg shadow-lg border border-white/10" />
                  <button 
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="ml-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Add Image"
            >
              <ImageIcon size={20} />
            </button>
            
            <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
            
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-sm md:text-base text-white placeholder:text-slate-600" 
              placeholder={`Ask Polaris (${mode})...`}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            
            <button 
              className={`mr-3 p-2 rounded-xl ${bgColors[mode]} text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale`} 
              type="submit"
              disabled={(!input.trim() && !selectedImage) || loadingState !== LoadingState.IDLE}
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-3 text-center">
             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">Powered by Gemini Flash</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
