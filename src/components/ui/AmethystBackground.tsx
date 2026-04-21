import React from 'react';

const LiquidGlassBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-zinc-950"
    >
      {/* Deep Zinc Base Overlay */}
      <div className="absolute inset-0 bg-[#18181b] opacity-95" />

      {/* Primary Liquid Blob - Top Right */}
      <div 
        className="absolute top-[-10%] right-[-5%] w-[1000px] h-[1000px] bg-cyan-neon/10 rounded blur-[150px] animate-float"
      />
      
      {/* Secondary Liquid Blob - Bottom Left */}
      <div 
        className="absolute bottom-[-15%] left-[-5%] w-[1200px] h-[1200px] bg-blue-neon/5 rounded blur-[180px] opacity-40 animate-pulse-slow"
      />

      {/* Static Atmospheric Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-neon/[0.02] blur-[200px]"
      />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 noise-overlay opacity-[0.15] mix-blend-overlay" />
    </div>
  );
};

export default LiquidGlassBackground;
