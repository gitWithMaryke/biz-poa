import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Scrim */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-up panel */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-5 pb-8 shadow-2xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-1" />
        
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-gray-900">{title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
