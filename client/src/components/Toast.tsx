import React from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center pointer-events-none animate-bounce">
      <div className="bg-[#14201B] text-[#EEF1EE] text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 max-w-sm text-center">
        {message}
      </div>
    </div>
  );
};
