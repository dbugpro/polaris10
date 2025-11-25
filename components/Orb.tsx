import React from 'react';

interface OrbProps {
  state: 'idle' | 'thinking' | 'speaking';
  size?: 'small' | 'large';
}

export const Orb: React.FC<OrbProps> = ({ state, size = 'large' }) => {
  // Determine container classes based on size
  // Adjusted sizes to ensure it fits better on mobile screens (w-48 for smallest, then up)
  const containerClasses = size === 'large' 
    ? "w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96" 
    : "w-12 h-12";

  // Determine inner orb animation based on state
  const pulseClass = state === 'thinking' 
    ? 'animate-ping opacity-75 duration-1000' 
    : 'animate-pulse-slow';
    
  const glowColor = state === 'thinking' 
    ? 'shadow-[0_0_60px_rgba(236,72,153,0.6)]' // Pinkish/Purple when thinking hard
    : 'shadow-[0_0_50px_rgba(56,189,248,0.5)]'; // Blue when idle

  const gradientClass = state === 'thinking'
    ? 'from-purple-500 via-blue-600 to-cyan-400'
    : 'from-blue-500 via-sky-600 to-cyan-400';

  return (
    <div className={`relative flex items-center justify-center ${containerClasses} transition-all duration-500`}>
      {/* Outer glow */}
      <div className={`absolute inset-0 rounded-full bg-blue-500 blur-3xl opacity-20 ${state === 'thinking' ? 'animate-pulse' : ''}`}></div>
      
      {/* Main Orb */}
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
        {/* Surface Texture / Shine */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.6),transparent_50%)]"></div>
        
        {/* Internal Activity (simulated) */}
        {state === 'thinking' && (
             <div className="absolute inset-0 w-full h-full animate-spin [animation-duration:3s]">
                <div className="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border-t-4 border-b-4 border-white/30 blur-sm"></div>
             </div>
        )}
      </div>
    </div>
  );
};