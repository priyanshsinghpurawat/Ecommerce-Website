
export const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-app-bg text-app-text">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-brand-primary/25" />
        
        {/* Inner spinning loader */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-app-muted border-t-brand-primary" />
      </div>
      <p className="mt-4 font-sans text-xs font-semibold uppercase tracking-wider text-app-text/60 animate-pulse">
        Loading MensVibe...
      </p>
    </div>
  );
};
