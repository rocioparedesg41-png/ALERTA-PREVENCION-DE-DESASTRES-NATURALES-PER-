import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellOff, AlertOctagon, Volume2, ShieldAlert, Radio, VolumeX } from 'lucide-react';
import { alarmManager } from '../utils/audioAlarm';

interface AlarmBannerProps {
  currentThreat?: {
    type: string;
    intensity: string;
    message: string;
  };
  locationName: string;
  departmentName: string;
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({
  currentThreat,
  locationName,
  departmentName,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const unsub = alarmManager.subscribe((playing) => {
      setIsPlaying(playing);
      if (!playing) {
        setElapsedSeconds(0);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  const handleDeactivate = () => {
    alarmManager.stopAlarm();
  };

  const handleTriggerManualAlarm = async () => {
    await alarmManager.startAlarm();
  };

  return (
    <>
      {/* Persistent Audio Siren Alarm Notification when active */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="sticky top-0 z-50 w-full bg-red-600 text-white shadow-lg border-b-2 border-red-700 px-4 py-3 sm:py-4"
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center animate-ping absolute inset-0" />
                  <div className="w-10 h-10 rounded-lg bg-white text-red-600 flex items-center justify-center font-black relative z-10 shadow-sm">
                    <AlertOctagon className="w-6 h-6 animate-bounce" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white text-red-700 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                      ¡ALARMA DE EMERGENCIA ACTIVA!
                    </span>
                    <span className="text-[10px] font-mono bg-black/30 text-white px-2 py-0.5 rounded font-bold">
                      {elapsedSeconds}s transcurridos
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 mt-0.5">
                    <span>SASPE / IGP / INDECI:</span>
                    <span className="underline font-bold">
                      {locationName} ({departmentName})
                    </span>
                  </h2>
                  <p className="text-xs text-red-100 line-clamp-1">
                    {currentThreat?.message ||
                      '¡Alerta Sísmica Temprana! Desplácese de inmediato a zonas seguras internas.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  <BellOff className="w-4 h-4 text-red-400" />
                  DESACTIVAR ALARMA
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Alarm Activator Bar for drills/preparation */}
      {!isPlaying && (
        <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Red Sísmica SASPE:</span>
            <span className="text-slate-500 hidden sm:inline text-xs">
              Monitoreo continuo de acelerógrafos del IGP e INDECI a nivel nacional.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleTriggerManualAlarm}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs text-xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-white" />
              Probar Alarma Sísmica (Sonido)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
