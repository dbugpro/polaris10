
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
  const clickCount = interactive?.clickCount || 0;

  // Derive dynamic intensities
  const glowOpacity = isCharging ? 'opacity-30' : (isHovered || voiceState !== 'idle') ? 'opacity-20' : 'opacity-10';
  const rotationSpeed = isCharging ? '[animation-duration:5s]' : isHovered ? '[animation-duration:15s]' : '[animation-duration:20s]';
  const coreScale = isCharging ? 'scale-105' : isPressed ? 'scale-95' : 'scale-100';

  // High-fidelity "Silky Blue" Material Model
  const getBaseColor = () => {
    // Advanced radial gradient with more stops for smoother transition
    if (clickCount === 3) {
      return 'radial-gradient(circle at 30% 30%, #a5f3fc 0%, #38bdf8 20%, #0ea5e9 45%, #0284c7 70%, #0c4a6e 100%)';
    }
    if (voiceState === 'speaking') {
      return 'radial-gradient(circle at 30% 30%, #e0f2fe 0%, #7dd3fc 15%, #0ea5e9 40%, #0369a1 75%, #082f49 100%)';
    }
    return 'radial-gradient(circle at 30% 30%, #7dd3fc 0%, #38bdf8 12%, #0ea5e9 35%, #0284c7 65%, #075985 85%, #082f49 100%)';
  };

  const clickAnimations = useMemo(() => {
    let anims = [];
    if (clickCount === 4) anims.push('animate-breath');
    if (clickCount === 5) anims.push('animate-glitch');
    return anims.join(' ');
  }, [clickCount]);

  return (
    <div className={`relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 md:w-[32rem] md:h-[32rem] transition-all duration-1000 ${clickCount === 6 ? 'opacity-50 blur-[2px]' : 'opacity-100'}`}>
      
      <div className={`relative w-full h-full flex items-center justify-center transition-transform duration-700 ${isDragging ? 'animate-none' : 'animate-float'} ${clickAnimations}`}>
        
        {/* Ambient Bloom */}
        <div className={`
          absolute inset-[-5%] rounded-full blur-[80px] transition-all duration-1000
          ${glowOpacity} bg-blue-500/20
          ${isCharging || voiceState !== 'idle' ? 'animate-subtle-pulse' : 'animate-[subtle-pulse_20s_ease-in-out_infinite]'}
        `}></div>

        {/* The Material Core */}
        <div 
          className={`
            relative w-[65%] h-[65%] rounded-full 
            transition-all duration-700 ease-out
            flex items-center justify-center
            overflow-hidden
            ${coreScale}
            shadow-[inset_-15px_-15px_40px_rgba(0,0,0,0.7),inset_10px_10px_30px_rgba(255,255,255,0.1),0_40px_80px_-20px_rgba(0,0,0,0.9)]
          `}
          style={{ background: getBaseColor() }}
        >
          {/* Surface Texture Layer: Micro-grain for physical realism */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
          </div>

          {/* Primary Specular Highlight - Main Light Source Hit */}
          <div className={`
            absolute top-[15%] left-[15%] w-[35%] h-[35%] bg-white/25 blur-[20px] rounded-full transition-all duration-500
            ${isHovered ? 'scale-105 opacity-40' : 'opacity-30'}
          `}></div>

          {/* Core Specular Dot - Sharp Pinpoint */}
          <div className={`
            absolute top-[24%] left-[24%] w-[5%] h-[5%] bg-white/60 blur-[3px] rounded-full transition-all duration-500
            ${isHovered ? 'opacity-100' : 'opacity-50'}
          `}></div>

          {/* Secondary Soft Reflection - Bottom Left lustre */}
          <div className="absolute bottom-[20%] left-[20%] w-[30%] h-[30%] bg-blue-300/5 blur-[25px] rounded-full"></div>
          
          {/* Rim Lighting (Fresnel) - Edge definition */}
          <div className="absolute inset-0 rounded-full border border-white/10 ring-[1.5px] ring-inset ring-white/5 pointer-events-none"></div>

          {/* Deep Core Shadow - Bottom Right grounding */}
          <div className="absolute bottom-[-5%] right-[-5%] w-[55%] h-[55%] bg-black/50 blur-[45px] rounded-full"></div>

          {/* Dynamic Energy Veins - Sub-surface activity */}
          <div className={`absolute inset-0 w-full h-full animate-spin-slow ${rotationSpeed} opacity-[0.08]`}>
            <div className="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px] border-blue-100/20 blur-[3px]"></div>
          </div>

          {/* Global Material Overlay - Ties the lighting together */}
          <div className={`
            absolute inset-0 bg-blue-400/5 mix-blend-soft-light transition-opacity duration-1000
            ${voiceState !== 'idle' || isCharging ? 'opacity-100' : 'opacity-20'}
          `}></div>
        </div>
      </div>
    </div>
  );
};
