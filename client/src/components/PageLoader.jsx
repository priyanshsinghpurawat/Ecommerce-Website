import React from 'react';

export const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-lux-bg text-lux-dark">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-lux-primary/25" />
        
        {/* Inner spinning loader */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-lux-muted border-t-lux-primary" />
      </div>
      <p className="mt-4 font-sans text-xs font-semibold uppercase tracking-wider text-lux-dark/60 animate-pulse">
        Loading MensVibe...
      </p>
    </div>
  );
};
