import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface HeaderProps {
  shopName: string;
  tillNumber: string;
  isOnline: boolean;
  pendingSyncCount: number;
  onToggleOnline: () => void;
  onSyncNow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shopName,
  tillNumber,
  isOnline,
  pendingSyncCount,
  onToggleOnline,
  onSyncNow,
}) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-md border-b border-[#DAE1DC] sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold font-display tracking-tight text-[#14201B] leading-tight">
          {shopName}
        </h1>
        <p className="text-xs text-[#5C6962] font-medium">
          Till {tillNumber} · <span className="font-mono">{time}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleOnline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}
          title="Click to toggle simulated offline mode"
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span>{pendingSyncCount > 0 ? `Syncing (${pendingSyncCount})` : 'Online'}</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline {pendingSyncCount > 0 && `(${pendingSyncCount})`}</span>
            </>
          )}
        </button>

        {isOnline && pendingSyncCount > 0 && (
          <button
            onClick={onSyncNow}
            className="p-1.5 text-[#0F7B5A] bg-[#DAEEE5] hover:bg-emerald-200 rounded-full transition-colors"
            title="Sync queued sales now"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          </button>
        )}
      </div>
    </header>
  );
};
