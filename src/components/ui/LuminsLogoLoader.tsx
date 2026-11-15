import React from 'react';
import { motion } from 'framer-motion';

interface LuminsLogoLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  xs: 26,
  sm: 44,
  md: 64,
  lg: 84,
};

/**
 * LuminsLogoLoader — Animación pura del isotipo oficial de 3 barras Lumins,
 * sin texto ni letras, para transiciones SPA y estados de carga.
 */
export const LuminsLogoLoader: React.FC<LuminsLogoLoaderProps> = ({
  size = 'md',
  className = '',
}) => {
  const height = SIZES[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      role="status"
      aria-label="Cargando"
    >
      {/* Halo ambiental sutil */}
      <motion.div
        animate={{
          scale: [0.92, 1.08, 0.92],
          opacity: [0.22, 0.42, 0.22],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 -m-4 rounded-full blur-2xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(18,169,168,0.28) 0%, rgba(255,204,64,0.16) 50%, rgba(255,102,94,0.16) 100%)',
        }}
      />

      {/* Isotipo oficial 3 barras animadas en oleada */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 630 452"
        fill="none"
        style={{ height, width: 'auto' }}
        className="relative z-10 overflow-visible"
        aria-hidden="true"
      >
        {/* Barra 1: Coral (#FF665E) */}
        <motion.path
          d="M 68 281 H 159 C 172.25 281 183 291.75 183 305 V 392 C 183 422.38 158.38 447 128 447 H 28 C 15.85 447 6 437.15 6 425 V 343 C 6 308.76 33.76 281 68 281 Z"
          fill="#FF665E"
          style={{ transformOrigin: '94px 447px' }}
          animate={{
            scaleY: [1, 1.24, 0.92, 1],
            y: [0, -14, 4, 0],
            opacity: [0.88, 1, 0.85, 0.88],
          }}
          transition={{
            duration: 1.35,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
            delay: 0,
          }}
        />

        {/* Barra 2: Turquesa (#12A9A8) */}
        <motion.path
          d="M 258 144 H 370 C 383.81 144 395 155.19 395 169 V 393 C 395 422.82 370.82 447 341 447 H 231 C 219.4 447 210 437.6 210 426 V 192 C 210 165.49 231.49 144 258 144 Z"
          fill="#12A9A8"
          style={{ transformOrigin: '302px 447px' }}
          animate={{
            scaleY: [1, 1.15, 0.88, 1],
            y: [0, -18, 4, 0],
            opacity: [0.92, 1, 0.88, 0.92],
          }}
          transition={{
            duration: 1.35,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
            delay: 0.18,
          }}
        />

        {/* Barra 3: Amarillo (#FFCC40) */}
        <motion.path
          d="M 470 4 H 566 C 597.48 4 623 29.52 623 61 V 382 C 623 417.9 593.9 447 558 447 H 445 C 432.85 447 423 437.15 423 425 V 51 C 423 25.04 444.04 4 470 4 Z"
          fill="#FFCC40"
          style={{ transformOrigin: '523px 447px' }}
          animate={{
            scaleY: [1, 1.09, 0.86, 1],
            y: [0, -16, 4, 0],
            opacity: [0.92, 1, 0.88, 0.92],
          }}
          transition={{
            duration: 1.35,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
            delay: 0.36,
          }}
        />
      </svg>
    </div>
  );
};

export default LuminsLogoLoader;
