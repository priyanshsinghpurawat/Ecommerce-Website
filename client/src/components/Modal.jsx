import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with transition-opacity and blur */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card with premium glassmorphism styling */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl p-5 text-left align-middle shadow-2xl glass-modal transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-surface-100/55 pb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-app-text">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-app-text/45 hover:bg-surface-100 hover:text-app-text transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Modal Form/Content Body */}
        <div className="mt-3 max-h-[80vh] overflow-y-auto app-scrollbar pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};
