import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const AmbientBackground: React.FC = () => {
  // Configuración de elementos flotantes
  const elements = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      type: i % 3 === 0 ? 'card' : i % 3 === 1 ? 'list' : 'stat',
      size: Math.random() * 100 + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * -20,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* 1. MESH GRADIENT LAYER */}
      <div className="absolute inset-0">
        {/* Blob 1: Purple */}
        <motion.div
          animate={{
            x: ['0%', '20%', '-10%', '0%'],
            y: ['0%', '10%', '20%', '0%'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#8B5CF6]/30 rounded-full blur-[120px] will-change-transform"
        />
        
        {/* Blob 2: Magenta */}
        <motion.div
          animate={{
            x: ['0%', '-20%', '10%', '0%'],
            y: ['0%', '20%', '-10%', '0%'],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#D946EF]/20 rounded-full blur-[120px] will-change-transform"
        />

        {/* Blob 3: Subtle Indigo */}
        <motion.div
          animate={{
            x: ['0%', '15%', '-5%', '0%'],
            y: ['0%', '-15%', '10%', '0%'],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-[#4338ca]/15 rounded-full blur-[100px] will-change-transform"
        />
      </div>

      {/* Backdrop filter to fuse colors */}
      <div className="absolute inset-0 backdrop-blur-[100px]" />

      {/* 2. FLOATING UI ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {elements.map((el) => (
          <motion.div
            key={el.id}
            initial={{ x: `${el.x}%`, y: `${el.y}%` }}
            animate={{
              y: [`${el.y}%`, `${el.y + 5}%`, `${el.y - 5}%`, `${el.y}%`],
              x: [`${el.x}%`, `${el.x + 2}%`, `${el.x - 2}%`, `${el.x}%`],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: "easeInOut"
            }}
            style={{ willChange: 'transform' }}
            className="absolute"
          >
            {el.type === 'card' && (
              <div 
                className="bg-white/[0.03] border border-white/[0.08] rounded-[4px] shadow-sm backdrop-blur-[2px]"
                style={{ width: el.size, height: el.size * 0.7 }}
              >
                <div className="w-1/2 h-2 bg-white/[0.05] m-3 rounded-full" />
                <div className="w-3/4 h-1.5 bg-white/[0.03] mx-3 mb-2 rounded-full" />
                <div className="w-2/3 h-1.5 bg-white/[0.03] mx-3 rounded-full" />
              </div>
            )}
            {el.type === 'list' && (
              <div className="flex flex-col gap-2 p-2">
                <div className="w-32 h-2 bg-white/[0.06] rounded-full" />
                <div className="w-24 h-2 bg-white/[0.04] rounded-full" />
                <div className="w-28 h-2 bg-white/[0.04] rounded-full" />
              </div>
            )}
            {el.type === 'stat' && (
              <div className="relative">
                <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-[0.05]">
                   <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" fill="none" strokeDasharray="180 360" />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-1.5 bg-white/[0.08] rounded-full" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AmbientBackground;
