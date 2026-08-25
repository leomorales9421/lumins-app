import React from 'react';

const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#F8FAFC] dark:bg-[#0c0d12]">
      {/* High-performance CSS Mesh Gradient without heavy backdrop-filter recalculations */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(139, 92, 246, 0.22) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(217, 70, 239, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 75% 20%, rgba(67, 56, 202, 0.14) 0%, transparent 40%)
          `
        }}
      />
    </div>
  );
};

export default AmbientBackground;
