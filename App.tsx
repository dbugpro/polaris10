
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Orb } from './components/Orb';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

export type InteractionState = {
  isHovered: boolean;
  isPressed: boolean;
  isCharging: boolean;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  scale: number;
  burstCount: number;
  clickRipple: boolean;
  voiceState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
};

// --- Audio Engine ---
class PolarisAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  ambient: OscillatorNode | null = null;
  ambientGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.startAmbient();
  }

  private startAmbient() {
    if (!this.ctx || !this.master) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.05;
    this.ambientGain.connect(this.master);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55; // Low drone
    osc.connect(this.ambientGain);
    osc.start();
    this.ambient = osc;

    // Soft modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
  }

  playSfx(type: 'click' | 'hover' | 'charge' | 'burst' | 'connect') {
    if (!this.ctx || !this.master) return;
    const g = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    g.connect(this.master);
    osc.connect(g);

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        break;
      case 'hover':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.2);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        break;
      case 'charge':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.5);
        break;
      case 'burst':
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        break;
      case 'connect':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        break;
    }
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }
}

const audio = new PolarisAudio();

export default function App() {
  const [state, setState] = useState<InteractionState>({
    isHovered: false,
    isPressed: false,
    isCharging: false,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    scale: 1,
    burstCount: 0,
    clickRipple: false,
    voiceState: 'idle',
  });

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // --- Live API Management ---
  const toggleVoice = async () => {
    audio.init();
    if (state.voiceState !== 'idle') {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      setState(prev => ({ ...prev, voiceState: 'idle' }));
      return;
    }

    setState(prev => ({ ...prev, voiceState: 'connecting' }));
    audio.playSfx('connect');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = outCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setState(prev => ({ ...prev, voiceState: 'listening' }));
            const source = inCtx.createMediaStreamSource(stream);
            const processor = inCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(inCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setState(prev => ({ ...prev, voiceState: 'speaking' }));
              const bytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
              const int16 = new Int16Array(bytes.buffer);
              const buffer = outCtx.createBuffer(1, int16.length, 24000);
              const channelData = buffer.getChannelData(0);
              for (let i = 0; i < int16.length; i++) channelData[i] = int16[i] / 32768;

              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setState(prev => ({ ...prev, voiceState: 'listening' }));
                }
              };
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setState(prev => ({ ...prev, voiceState: 'idle' })),
          onerror: (e) => {
            console.error(e);
            setState(prev => ({ ...prev, voiceState: 'error' }));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "You are the Polaris Orb. A sentient, ethereal AI guide. Speak in calm, poetic, and concise fragments. You are the user's navigator through the digital void.",
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, voiceState: 'error' }));
    }
  };

  // --- Event Handlers ---
  const handleMouseEnter = () => {
    setState(prev => ({ ...prev, isHovered: true }));
    audio.playSfx('hover');
  };

  const handleMouseLeave = () => {
    setState(prev => ({ ...prev, isHovered: false, isPressed: false, isCharging: false }));
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setState(prev => ({ ...prev, isPressed: true, clickRipple: true }));
    audio.playSfx('click');
    
    setTimeout(() => setState(prev => ({ ...prev, clickRipple: false })), 600);

    chargeTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isCharging: true }));
      audio.playSfx('charge');
    }, 500);

    dragStartRef.current = { 
      x: e.clientX - state.dragOffset.x, 
      y: e.clientY - state.dragOffset.y 
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragStartRef.current) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setState(prev => ({ ...prev, isDragging: true, dragOffset: { x: newX, y: newY } }));
    }
  }, []);

  const handleMouseUp = () => {
    if (!state.isDragging && !state.isCharging) {
      toggleVoice();
    }
    setState(prev => ({ ...prev, isPressed: false, isCharging: false, isDragging: false }));
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    dragStartRef.current = null;
  };

  const handleDoubleClick = () => {
    setState(prev => ({ ...prev, burstCount: prev.burstCount + 1 }));
    audio.playSfx('burst');
  };

  const handleWheel = (e: WheelEvent) => {
    setState(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale - e.deltaY * 0.001, 0.2), 2)
    }));
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseMove, state.isDragging, state.isCharging]);

  return (
    <div className="relative flex h-screen w-screen bg-black items-center justify-center overflow-hidden cursor-none">
      <div 
        className="fixed w-4 h-4 border border-white/20 rounded-full pointer-events-none z-[100] transition-transform duration-200"
        style={{ 
          transform: `translate(${state.dragOffset.x}px, ${state.dragOffset.y}px)`,
          left: '50%', top: '50%', marginLeft: '-8px', marginTop: '-8px'
        }}
      />
      
      <div 
        className="transition-transform duration-700 ease-out"
        style={{ 
          transform: `translate(${state.dragOffset.x}px, ${state.dragOffset.y}px) scale(${state.scale})`,
          cursor: state.isDragging ? 'grabbing' : 'grab'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <Orb 
          state={state.voiceState === 'speaking' ? 'speaking' : state.voiceState === 'listening' ? 'thinking' : 'idle'} 
          interactive={state}
        />
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em] pointer-events-none select-none animate-pulse">
          {state.voiceState === 'idle' ? 'Click Orb to Talk' : state.voiceState === 'listening' ? 'Listening...' : state.voiceState === 'speaking' ? 'Polaris Speaking' : 'Connecting...'}
        </div>
        {state.voiceState === 'error' && (
          <div className="text-[9px] text-red-500/50 uppercase tracking-widest">Connection Failed</div>
        )}
      </div>
    </div>
  );
}
