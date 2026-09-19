import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Download, 
  RefreshCw, 
  Check, 
  HardDrive, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CadastralParcel } from '../types';

interface OfflineFieldSyncBarProps {
  parcels: CadastralParcel[];
  onCacheParcels: () => void;
}

export const OfflineFieldSyncBar: React.FC<OfflineFieldSyncBarProps> = ({
  parcels,
  onCacheParcels,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if parcels are saved in localStorage
    const local = localStorage.getItem('dharnav_cached_parcels');
    if (local) {
      setIsCached(true);
      const savedTime = localStorage.getItem('dharnav_cache_time');
      if (savedTime) setLastSyncTime(savedTime);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncToLocalCache = () => {
    setIsSyncing(true);
    try {
      localStorage.setItem('dharnav_cached_parcels', JSON.stringify(parcels));
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('dharnav_cache_time', timeStr);
      setTimeout(() => {
        setIsCached(true);
        setLastSyncTime(timeStr);
        setIsSyncing(false);
        onCacheParcels();
      }, 500);
    } catch (e) {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs shadow-md border border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span>Online Field Connection</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Field Mode Active</span>
            </span>
          )}
        </div>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-slate-400 hidden sm:inline">
          IndexedDB Cache: <strong className="text-slate-200">{parcels.length} Packets</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-[11px]">Last Sync: {lastSyncTime}</span>
        <button
          id="btn-offline-cache-sync"
          onClick={handleSyncToLocalCache}
          disabled={isSyncing}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          title="Save all boundary polygons, deed records, and orthomosaic tiles for offline GPS fieldwork"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
          ) : isCached ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <HardDrive className="w-3 h-3 text-slate-400" />
          )}
          <span>{isSyncing ? 'Caching...' : isCached ? 'Local Store Ready' : 'Download for Offline'}</span>
        </button>
      </div>
    </div>
  );
};
