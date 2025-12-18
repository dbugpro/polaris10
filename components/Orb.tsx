import React from 'react';

interface OrbProps {
  state: 'idle' | 'thinking' | 'speaking';
  size?: 'small' | 'large';
  isDeepThink?: boolean;
  isFast?: boolean;
  isTurbo?: boolean;
}

export const Orb: React.FC<OrbProps> = ({ state, size = 'large', isDeepThink = false, isFast = false, isTurbo = false }) => {
  const containerClasses = size === 'large' 
    ? "w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80" 
    : "w-10 h-10 md:w-12 md:h-12";

  const glowColor = isDeepThink
    ? 'shadow-[0_0_70px_rgba(168,85,247,0.7)]' // Vivid Purple
    : isTurbo
    ? 'shadow-[0_0_70px_rgba(244,63,94,0.7)]' // Rose
    : isFast
    ? 'shadow-[0_0_70px_rgba(245,158,11,0.7)]' // Amber
    : state === 'thinking' 
      ? 'shadow-[0_0_60px_rgba(56,189,248,0.6)]' 
      : 'shadow-[0_0_50px_rgba(56,189,248,0.5)]';

  const gradientClass = isDeepThink
    ? 'from-purple-600 via-indigo-700 to-blue-500'
    : isTurbo
    ? 'from-rose-500 via-fuchsia-600 to-indigo-500'
    : isFast
    ? 'from-amber-400 via-orange-500 to-red-500'
    : state === 'thinking'
      ? 'from-blue-500 via-sky-600 to-cyan-400'
      : 'from-blue-500 via-sky-600 to-cyan-400';

  return (
    <div className={`relative flex items-center justify-center ${containerClasses} transition-all duration-700`}>
      <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${isDeepThink ? 'bg-purple-500' : isTurbo ? 'bg-rose-500' : isFast ? 'bg-amber-500' : 'bg-blue-500'} ${state === 'thinking' ? 'animate-pulse' : ''}`}></div>
      
      <div 
        className={`
          relative w-full h-full rounded-full 
          bg-gradient-to-br ${gradientClass}
          ${glowColor}
          transition-all duration-1000
          flex items-center justify-center
          overflow-hidden
        `}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.6),transparent_50%)]"></div>
        
        {(state === 'thinking' || isDeepThink || isFast || isTurbo) && (
             <div className={`absolute inset-0 w-full h-full animate-spin ${isDeepThink ? '[animation-duration:8s]' : isTurbo ? '[animation-duration:2s]' : isFast ? '[animation-duration:1s]' : '[animation-duration:3s]'}`}>
                <div className={`absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border-t-2 border-b-2 ${isDeepThink ? 'border-purple-300/40' : isTurbo ? 'border-rose-200/50' : isFast ? 'border-amber-200/50' : 'border-white/30'} blur-sm`}></div>
             </div>
        )}

        {(isDeepThink || isFast || isTurbo) && (
          <div className={`absolute w-1/4 h-1/4 ${isDeepThink ? 'bg-white/30' : isTurbo ? 'bg-rose-100/40' : 'bg-amber-100/40'} blur-xl rounded-full animate-pulse`}></div>
        )}
      </div>
    </div>
  );
};