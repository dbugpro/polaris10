
import React, { useMemo } from 'react';
import { InteractionState } from '../App';

interface OrbProps {
  state: 'idle' | 'thinking' | 'speaking';
  size?: 'small' | 'large';
  interactive?: InteractionState;
}

export const Orb: React.FC<OrbProps> = ({ state, interactive }) => {
  const isHovered = interactive?.isHovered || false;
  const isPressed = interactive?.isPressed || false;
  const isCharging = interactive?.isCharging || false;
  const isDragging = interactive?.isDragging || false;
  const burstCount = interactive?.burstCount || 0;
  const hasRipple = interactive?.clickRipple || false;
  const voiceState = interactive?.voiceState || 'idle';

  // Derive dynamic intensities
  const glowOpacity = isCharging ? 'opacity-40' : (isHovered || voiceState !== 'idle') ? 'opacity-30' : 'opacity-10';
  const rotationSpeed = isCharging ? '[animation-duration:2s]' : isHovered ? '[animation-duration:8s]' : '[animation-duration:12s]';
  const coreScale = isCharging ? 'scale-150' : isPressed ? 'scale-90' : 'scale-100';

  // Voice Color Mapping
  const getBaseColor = () => {
    if (voiceState === 'speaking') return 'radial-gradient(circle at 35% 35%, #fff 0%, #22d3ee 30%, #0891b2 70%, #083344 100%)';
    if (voiceState === 'listening') return 'radial-gradient(circle at 35% 35%, #a5f3fc 0%, #06b6d4 40%, #155e75 80%, #083344 100%)';
    if (isCharging) return 'radial-gradient(circle at 35% 35%, #fff 0%, #38bdf8 20%, #0284c7 50%, #0c4a6e 100%)';
    return 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #0ea5e9 25%, #0284c7 50%, #0369a1 75%, #0c4a6e 100%)';
  };

  const burstAnimation = useMemo(() => {
    if (burstCount === 0) return '';
    return 'animate-[ping_0.8s_ease-out_1]';
  }, [burstCount]);

  return (
    <div className={`relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 md:w-[32rem] md:h-[32rem] transition-all duration-700 ${isDragging ? 'animate-none' : 'animate-float'}`}>
      
      {/* 1. Outer Ethereal Nebula Glow */}
      <div className={`
        absolute inset-0 rounded-full blur-[120px] transition-all duration-1000
        ${glowOpacity}
        ${voiceState === 'speaking' ? 'bg-cyan-400' : 'bg-blue-600'}
        ${isCharging || voiceState !== 'idle' ? 'animate-pulse' : 'animate-[pulse_12s_ease-in-out_infinite]'}
      `}></div>
      
      {/* 2. Secondary Pulse layer */}
      <div className={`
        absolute inset-10 rounded-full blur-[80px] transition-all duration-500
        ${voiceState === 'speaking' ? 'bg-cyan-300 opacity-40' : 'bg-sky-700'}
        ${isCharging ? 'opacity-40 scale-125' : isHovered ? 'opacity-25' : 'opacity-15'}
      `}></div>
      
      {/* 3. Voice/Interaction Ripples */}
      {(voiceState !== 'idle' || hasRipple) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute w-full h-full rounded-full border border-cyan-400/30 ${voiceState === 'speaking' ? 'animate-[ping_1s_linear_infinite]' : 'animate-[ping_2s_linear_infinite]'}`}></div>
          <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-400/10 animate-[ping_3s_linear_infinite]"></div>
        </div>
      )}

      {/* 4. Double Click Burst Effect */}
      {burstCount > 0 && (
        <div className={`absolute inset-[-20%] rounded-full border-4 border-cyan-400/50 blur-sm ${burstAnimation}`}></div>
      )}

      {/* 5. The Core Sphere */}
      <div 
        className={`
          relative w-[75%] h-[75%] rounded-full 
          transition-all duration-500 ease-out
          flex items-center justify-center
          overflow-hidden
          ${coreScale}
          ${voiceState === 'speaking' ? 'shadow-[0_0_120px_rgba(34,211,238,0.6)]' : ''}
          ${isCharging ? 'shadow-[0_0_150px_rgba(56,189,248,0.8)]' : isHovered ? 'shadow-[0_0_100px_rgba(14,165,233,0.4)]' : 'shadow-[0_0_60px_rgba(14,165,233,0.2)]'}
          ${state === 'idle' && !isPressed && voiceState === 'idle' ? 'animate-[pulse_10s_ease-in-out_infinite]' : ''}
        `}
        style={{ background: getBaseColor() }}
      >
        {/* Specular Highlight */}
        <div className={`
          absolute top-[22%] left-[22%] w-[18%] h-[18%] bg-white/40 blur-md rounded-full transition-all duration-300
          ${isHovered ? 'translate-x-1 translate-y-1' : ''}
        `}></div>
        
        {/* Rim Light */}
        <div className="absolute inset-0 rounded-full border border-white/10 ring-1 ring-inset ring-white/5"></div>

        {/* Dynamic Activity Rings */}
        <div className={`absolute inset-0 w-full h-full animate-spin-slow ${rotationSpeed}`}>
          <div className={`absolute top-1/2 left-1/2 w-[110%] h-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full border-t border-b border-white/10 blur-[2px] ${voiceState !== 'idle' ? 'border-cyan-200/20' : ''}`}></div>
        </div>

        {/* Internal Core Pulsation */}
        <div className={`
          absolute w-1/3 h-1/3 bg-white/10 blur-3xl rounded-full transition-all duration-700
          ${isCharging || voiceState === 'speaking' ? 'bg-white/40 opacity-100 scale-150' : 'opacity-100 scale-100'}
          ${voiceState !== 'idle' || isCharging ? 'animate-pulse' : 'animate-[pulse_15s_ease-in-out_infinite]'}
        `}></div>
      </div>
    </div>
  );
};
