
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
  isCrazy: boolean;
  clickCount: number;
  crazyStage: 'blackhole' | 'stargate' | 'stars' | 'fade' | 'none' | 'supernova';
};

// --- Tuneful Generative Audio Engine ---
class PolarisAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  reverbBus: GainNode | null = null;
  driftOsc: OscillatorNode | null = null;
  driftGain: GainNode | null = null;
  
  scales = {
    A_MINOR_PENT: [110, 130.81, 146.83, 164.81, 196.0], 
    E_MINOR_PENT: [82.41, 98.0, 110, 123.47, 146.83],
  };
  currentScale = this.scales.A_MINOR_PENT;
  mood: 'ambient' | 'active' | 'silent' | 'glitch' | 'chaos' = 'ambient';

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);
    
    this.reverbBus = this.ctx.createGain();
    this.reverbBus.gain.value = 0.3;
    this.reverbBus.connect(this.master);

    // Continuous Drift Gain
    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0;
    this.driftGain.connect(this.master);

    this.startSentientEngine();
  }

  private createVoice(freq: number, type: OscillatorType = 'sine', volume = 0.05, duration = 4) {
    if (!this.ctx || !this.reverbBus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.reverbBus);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private startSentientEngine() {
    if (!this.ctx) return;
    const engineLoop = () => {
      if (!this.ctx || this.mood === 'chaos') return;
      this.currentScale = Math.random() > 0.5 ? this.scales.A_MINOR_PENT : this.scales.E_MINOR_PENT;
      const root = this.currentScale[0];
      this.createVoice(root, 'sine', 0.03, 8);
      this.createVoice(root * 1.5, 'sine', 0.02, 8);
      this.playMelodicPhrase();
      setTimeout(engineLoop, Math.random() * 5000 + 3000);
    };
    engineLoop();
  }

  private playMelodicPhrase() {
    if (!this.ctx || !this.reverbBus) return;
    const now = this.ctx.currentTime;
    const count = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < count; i++) {
      const note = this.currentScale[Math.floor(Math.random() * this.currentScale.length)] * 2;
      const startTime = now + i * 0.4;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, startTime);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(0.04, startTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
      osc.connect(g);
      g.connect(this.reverbBus);
      osc.start(startTime);
      osc.stop(startTime + 1);
    }
  }

  setDriftIntensity(intensity: number) {
    if (!this.ctx || !this.driftGain) return;
    // Smoothly transition volume of the return drift sound
    this.driftGain.gain.setTargetAtTime(intensity * 0.15, this.ctx.currentTime, 0.1);
    
    if (intensity > 0 && !this.driftOsc) {
      this.driftOsc = this.ctx.createOscillator();
      this.driftOsc.type = 'sine';
      this.driftOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.driftOsc.connect(this.driftGain);
      this.driftOsc.start();
    } else if (intensity === 0 && this.driftOsc) {
      const oldOsc = this.driftOsc;
      this.driftOsc = null;
      setTimeout(() => oldOsc.stop(), 500);
    }
    
    if (this.driftOsc) {
      this.driftOsc.frequency.setTargetAtTime(55 + (intensity * 110), this.ctx.currentTime, 0.2);
    }
  }

  playSfx(type: 'click' | 'hover' | 'charge' | 'burst' | 'connect' | 'glitch' | 'breath' | 'ghost' | 'emerald' | 'settle') {
    if (!this.ctx || !this.master) return;
    const g = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    g.connect(this.master);
    osc.connect(g);
    switch (type) {
      case 'settle':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1320, this.ctx.currentTime); // E6
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
        break;
      case 'click':
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        break;
      case 'emerald':
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        break;
      case 'breath':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 1.5);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 1.5);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 3);
        break;
      case 'glitch':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(Math.random() * 1000, this.ctx.currentTime);
        g.gain.setValueAtTime(0.05, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        break;
      case 'ghost':
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        g.gain.setValueAtTime(0.02, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
        break;
      case 'hover':
        osc.frequency.setValueAtTime(329.63, this.ctx.currentTime);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.1);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        break;
      case 'charge':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.5);
        break;
      case 'burst':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        break;
      case 'connect':
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        break;
    }
    osc.start();
    osc.stop(this.ctx.currentTime + 3);
  }

  playStargate(intensity: number) {
    if (!this.ctx || !this.master) return;
    this.mood = 'chaos';
    const now = this.ctx.currentTime;
    const duration = 6 + (intensity * 2);
    for (let i = 0; i < (20 + intensity * 5); i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = Math.random() > 0.8 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(220 + (i * 5), now);
      osc.frequency.exponentialRampToValueAtTime(55 + (i * 2) + Math.random() * 200, now + duration);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.05 + (intensity * 0.01), now + 1);
      g.gain.linearRampToValueAtTime(0, now + duration);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + duration);
    }
  }

  playMilkyWay() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      const note = 880 * Math.pow(1.059, [0, 2, 4, 7, 9][i % 5]);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now + i * 0.2);
      g.gain.setValueAtTime(0, now + i * 0.2);
      g.gain.linearRampToValueAtTime(0.05, now + i * 0.2 + 0.1);
      g.gain.linearRampToValueAtTime(0, now + i * 0.2 + 2);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 2);
    }
  }

  playSupernova() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 2);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 2.5);
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
    isCrazy: false,
    clickCount: 0,
    crazyStage: 'none',
  });

  const [journeyCount, setJourneyCount] = useState(0);
  const [tunnelStyle, setTunnelStyle] = useState<'slit-scan-neon' | 'slit-scan-hell' | 'slit-scan-void'>('slit-scan-neon');

  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const scaleRef = useRef(1);
  const scaleVelRef = useRef(0);
  const requestRef = useRef<number>();
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Homing tracker for audio logic
  const isHomingRef = useRef(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const animate = useCallback(() => {
    // 1. Organic Position Spring (Slower return with curved path)
    if (!state.isDragging) {
      // Significantly reduced strength for a weightier, more intentional glide
      const springStrength = 0.006; 
      const damping = 0.96; 
      
      // Add drift variance (sine wobble) for an organic path
      const time = Date.now() * 0.002;
      const driftX = Math.sin(time) * 0.08;
      const driftY = Math.cos(time * 0.7) * 0.08;

      velRef.current.vx += (0 - posRef.current.x) * springStrength + driftX;
      velRef.current.vy += (0 - posRef.current.y) * springStrength + driftY;

      posRef.current.x += velRef.current.vx;
      posRef.current.y += velRef.current.vy;

      velRef.current.vx *= damping;
      velRef.current.vy *= damping;

      const dist = Math.sqrt(posRef.current.x ** 2 + posRef.current.y ** 2);
      const velMag = Math.sqrt(velRef.current.vx ** 2 + velRef.current.vy ** 2);

      // Sound logic during return
      if (dist > 1 && !isHomingRef.current) {
        isHomingRef.current = true;
      }
      
      if (isHomingRef.current) {
        audio.setDriftIntensity(Math.min(velMag * 2, 1));
      }

      const posThreshold = 0.005;
      if (dist < posThreshold && velMag < posThreshold) {
        if (isHomingRef.current) {
          audio.playSfx('settle'); // Trigger settle sound on docking
          audio.setDriftIntensity(0);
          isHomingRef.current = false;
        }
        posRef.current.x = 0;
        posRef.current.y = 0;
        velRef.current.vx = 0;
        velRef.current.vy = 0;
      }
    } else {
      isHomingRef.current = false;
      audio.setDriftIntensity(0);
    }

    // 2. Scale Spring (Graceful return to scale 1)
    if (!state.isCharging && !state.isCrazy && !state.isPressed) {
      const scaleSpring = 0.008; 
      const scaleDamping = 0.92;
      
      scaleVelRef.current += (1 - scaleRef.current) * scaleSpring;
      scaleRef.current += scaleVelRef.current;
      scaleVelRef.current *= scaleDamping;

      const scaleThreshold = 0.001;
      if (Math.abs(1 - scaleRef.current) < scaleThreshold && Math.abs(scaleVelRef.current) < scaleThreshold) {
        scaleRef.current = 1;
        scaleVelRef.current = 0;
      }
    } else if (state.isCharging) {
      scaleRef.current = Math.min(scaleRef.current + 0.015, 1.4);
    } else if (state.isPressed) {
      scaleRef.current = Math.max(scaleRef.current - 0.01, 0.95);
    }

    // Sync State
    setState(prev => {
      const posChanged = Math.abs(prev.dragOffset.x - posRef.current.x) > 0.001 || Math.abs(prev.dragOffset.y - posRef.current.y) > 0.001;
      const scaleChanged = Math.abs(prev.scale - scaleRef.current) > 0.001;
      
      if (!posChanged && !scaleChanged) return prev;
      
      return { 
        ...prev, 
        dragOffset: { x: posRef.current.x, y: posRef.current.y },
        scale: scaleRef.current
      };
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [state.isDragging, state.isCharging, state.isCrazy, state.isPressed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  const triggerCrazyJourney = () => {
    const currentIntensity = journeyCount;
    const duration = 8000 + (currentIntensity * 2000);
    const styles: Array<'slit-scan-neon' | 'slit-scan-hell' | 'slit-scan-void'> = ['slit-scan-neon', 'slit-scan-hell', 'slit-scan-void'];
    
    setTunnelStyle(styles[Math.floor(Math.random() * styles.length)]);
    setState(s => ({ ...s, isCrazy: true, crazyStage: 'stargate' }));
    audio.playStargate(currentIntensity);

    setTimeout(() => {
      setState(s => ({ ...s, crazyStage: 'stars' }));
      audio.playMilkyWay();
    }, duration);

    setTimeout(() => {
      setState(s => ({ ...s, crazyStage: 'fade' }));
    }, duration + 5000);

    setTimeout(() => {
      setState(s => ({ ...s, isCrazy: false, crazyStage: 'none', clickCount: 0 }));
      setJourneyCount(prev => prev + 1);
      audio.mood = 'ambient';
      posRef.current = { x: 0, y: 0 };
      velRef.current = { vx: 0, vy: 0 };
      scaleRef.current = 1;
      scaleVelRef.current = 0;
    }, duration + 9000);
  };

  const triggerSupernova = () => {
    setState(s => ({ ...s, crazyStage: 'supernova', isCrazy: true }));
    audio.playSupernova();
    setTimeout(() => {
      setState(s => ({ 
        ...s, 
        clickCount: 0, 
        isCrazy: false, 
        crazyStage: 'none', 
        scale: 1, 
        dragOffset: { x: 0, y: 0 } 
      }));
      posRef.current = { x: 0, y: 0 };
      velRef.current = { vx: 0, vy: 0 };
      scaleRef.current = 1;
      scaleVelRef.current = 0;
    }, 2000);
  };

  const toggleVoice = async () => {
    audio.init();
    if (state.voiceState !== 'idle') {
      if (sessionRef.current) sessionRef.current.close();
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

      const encode = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

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
              const base64 = encode(new Uint8Array(int16.buffer));
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
                if (sourcesRef.current.size === 0) setState(prev => ({ ...prev, voiceState: 'listening' }));
              };
            }
          },
          onclose: () => setState(prev => ({ ...prev, voiceState: 'idle' })),
          onerror: () => setState(prev => ({ ...prev, voiceState: 'error' }))
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: "You are Polaris, a wise and ancient navigator. You speak with a distinct British accent and dialect, using British spellings (e.g., 'traveller', 'colour') and sophisticated vocabulary. Your voice is deep, calm, and resonant. Respond in short, mystical fragments. Occasionally, you must weave in phrases of Mandarin (普通话) or other ancient Earth languages to emphasize your universal nature. For example, if speaking of balance, you might mention 'Yin and Yang' or 'Tàijí'. Adhere to a cadence similar to Alec Guinness—measured, slightly English, and deeply intellectual.",
        }
      });
      sessionRef.current = await sessionPromise;
    } catch { setState(prev => ({ ...prev, voiceState: 'error' })); }
  };

  const startInteraction = (x: number, y: number) => {
    audio.init();
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    setState(prev => {
      const nextCount = prev.clickCount + 1;
      switch (nextCount) {
        case 2: audio.playSfx('burst'); break;
        case 3: audio.playSfx('emerald'); break;
        case 4: audio.playSfx('breath'); break;
        case 5: audio.playSfx('glitch'); break;
        case 6: audio.playSfx('ghost'); break;
        case 7: triggerCrazyJourney(); break;
        case 8: triggerSupernova(); break;
        default: audio.playSfx('click');
      }
      return { ...prev, isPressed: true, clickRipple: true, clickCount: nextCount };
    });

    clickTimeoutRef.current = setTimeout(() => {
      setState(prev => prev.isCrazy ? prev : { ...prev, clickCount: 0 });
    }, 4000);

    setTimeout(() => setState(prev => ({ ...prev, clickRipple: false })), 600);
    
    chargeTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isCharging: true }));
      audio.playSfx('charge');
    }, 500);
    
    dragStartRef.current = { x: x - posRef.current.x, y: y - posRef.current.y };
  };

  const moveInteraction = (x: number, y: number) => {
    if (dragStartRef.current) {
      const newX = x - dragStartRef.current.x;
      const newY = y - dragStartRef.current.y;
      velRef.current.vx = (newX - posRef.current.x) * 0.4;
      velRef.current.vy = (newY - posRef.current.y) * 0.4;
      posRef.current.x = newX;
      posRef.current.y = newY;
      setState(prev => ({ ...prev, isDragging: true, dragOffset: { x: newX, y: newY } }));
    }
  };

  const endInteraction = () => {
    if (!state.isDragging && !state.isCharging && state.isPressed && !state.isCrazy && state.clickCount === 1) {
      toggleVoice();
    }
    setState(prev => ({ ...prev, isPressed: false, isCharging: false, isDragging: false }));
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    dragStartRef.current = null;
  };

  return (
    <div 
      className={`relative h-screen w-screen transition-colors duration-1000 overflow-hidden touch-none select-none bg-black ${state.crazyStage === 'stargate' && journeyCount > 0 ? 'animate-stargate-shake' : ''}`}
      onMouseDown={e => startInteraction(e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2)}
      onMouseMove={e => moveInteraction(e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2)}
      onMouseUp={endInteraction}
      onMouseLeave={endInteraction}
      onTouchStart={e => {
        const t = e.touches[0];
        startInteraction(t.clientX - window.innerWidth / 2, t.clientY - window.innerHeight / 2);
      }}
      onTouchMove={e => {
        const t = e.touches[0];
        moveInteraction(t.clientX - window.innerWidth / 2, t.clientY - window.innerHeight / 2);
      }}
      onTouchEnd={endInteraction}
      onDoubleClick={() => {
        setState(prev => ({ ...prev, burstCount: prev.burstCount + 1 }));
        audio.playSfx('burst');
      }}
    >
      {state.crazyStage === 'supernova' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white animate-supernova pointer-events-none" />
      )}

      <div className={`absolute inset-0 transition-all duration-[3000ms] pointer-events-none ${state.isCrazy ? 'opacity-100' : 'opacity-0'}`}>
        {state.crazyStage === 'stargate' && (
          <div className="absolute inset-0 flex items-center justify-center stargate-tunnel">
            <div className="absolute w-full h-[160%] left-0 top-[-30%] flex justify-between px-[2vw]">
              <div className={`w-[48%] h-full slit-scan ${tunnelStyle} animate-stargate-scroll opacity-90`} style={{ transform: 'rotateY(70deg)', animationDuration: `${2 - Math.min(journeyCount * 0.2, 1.5)}s` }}></div>
              <div className={`w-[48%] h-full slit-scan ${tunnelStyle} animate-stargate-scroll opacity-90`} style={{ transform: 'rotateY(-70deg)', animationDuration: `${2.1 - Math.min(journeyCount * 0.2, 1.6)}s` }}></div>
            </div>
            {[...Array(5 + Math.min(journeyCount * 2, 10))].map((_, i) => (
              <div 
                key={i} 
                className="absolute inset-0 flex items-center justify-center animate-stargate-zoom"
                style={{ animationDelay: `${i * (1 - Math.min(journeyCount * 0.05, 0.7))}s` }}
              >
                <div className={`w-1/2 h-1/2 border-[15px] rounded-full blur-lg opacity-40 ${tunnelStyle === 'slit-scan-hell' ? 'border-orange-500' : tunnelStyle === 'slit-scan-void' ? 'border-cyan-200' : 'border-blue-400'}`}></div>
              </div>
            ))}
            <div className="absolute w-40 h-40 bg-black rounded-full shadow-[0_0_300px_rgba(255,255,255,0.6)] blur-[60px]"></div>
          </div>
        )}

        {(state.crazyStage === 'stars' || state.crazyStage === 'fade') && (
          <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${state.crazyStage === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#1a0b2e,transparent),radial-gradient(circle_at_70%_40%,#0c1a3b,transparent)] opacity-60" />
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(200 + journeyCount * 50)].map((_, i) => (
                <div 
                  key={i} 
                  className={`absolute rounded-full bg-white animate-star-flicker`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * (journeyCount > 2 ? 4 : 2)}px`,
                    height: `${Math.random() * (journeyCount > 2 ? 4 : 2)}px`,
                    animationDelay: `${Math.random() * 3}s`,
                    opacity: Math.random()
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={`pointer-events-auto transition-[opacity] duration-[1500ms] ease-out ${state.crazyStage === 'stargate' ? 'scale-0 blur-xl opacity-0' : 'opacity-100'}`}
          style={{ transform: `translate(${state.dragOffset.x}px, ${state.dragOffset.y}px) scale(${state.scale})` }}
        >
          <Orb 
            state={state.voiceState === 'speaking' ? 'speaking' : (state.voiceState === 'listening') ? 'thinking' : 'idle'} 
            interactive={state}
          />
        </div>
      </div>

      <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-2 pointer-events-none">
        <div className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-300 ${state.isCrazy ? 'text-blue-400 animate-pulse scale-150' : 'text-white/10 animate-pulse'}`}>
          {state.crazyStage === 'stargate' ? (journeyCount > 2 ? 'DIMENSIONAL TEAR' : 'BEYOND THE INFINITE') : 
           state.crazyStage === 'stars' ? 'REACHING THE CORE' : 
           state.clickCount === 3 ? 'AZURE RESONANCE' :
           state.clickCount === 4 ? 'GRAVITY FLUCTUATION' :
           state.clickCount === 5 ? 'DIMENSIONAL GLITCH' :
           state.clickCount === 6 ? 'ASTRAL PHASING' :
           state.voiceState === 'idle' ? 'Touch Polaris' : 
           state.voiceState === 'listening' ? 'Listening' : 'Polaris Speaking'}
        </div>
        {journeyCount > 0 && !state.isCrazy && (
           <div className="text-[8px] text-white/5 uppercase tracking-[1em] mt-2">Level {journeyCount} Navigator</div>
        )}
      </div>
    </div>
  );
}
