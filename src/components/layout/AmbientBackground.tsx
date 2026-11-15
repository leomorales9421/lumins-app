import React from 'react';

const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#F8FAFC] dark:bg-[#0c0d12]">
      {/* High-performance Lumins Ambient Gradient */}
      <div 
        className="absolute inset-0 opacity-60 dark:opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(18, 169, 168, 0.14) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(255, 204, 64, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 102, 94, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(18, 169, 168, 0.06) 0%, transparent 60%)
          `
        }}
      />
    </div>
  );
};

export default AmbientBackground;
