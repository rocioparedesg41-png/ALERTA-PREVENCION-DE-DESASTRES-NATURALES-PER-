import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, FileText, LogOut, Radio, Send, Zap, Sun, Moon } from 'lucide-react';

interface HeaderNavProps {
  user: { email: string; name: string };
  onLogout: () => void;
  onOpenSos: () => void;
  onOpenPhones: () => void;
  onOpenTerms: () => void;
  onOpenLiveNews?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  onLogout,
  onOpenSos,
  onOpenPhones,
  onOpenTerms,
  onOpenLiveNews,
  theme = 'light',
  onToggleTheme,
}) => {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setFormattedDate(
        now.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base lg:text-lg leading-none tracking-tight text-slate-900 whitespace-nowrap">
                <span className="sm:hidden">ALERTA PERÚ</span>
                <span className="hidden sm:inline">ALERTA & PREVENCIÓN PERÚ</span>
              </span>
              <span className="hidden 2xl:inline-block px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold">
                SAT OFICIAL
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5 hidden xs:block truncate">
              Monitoreo Nacional de Desastres
            </span>
          </div>
        </div>

        {/* Operational System Indicator & Date (Only on wide screens to protect margins) */}
        <div className="hidden 2xl:flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            SISTEMA OPERATIVO
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800">{formattedDate || 'Lima, Perú'}</div>
            <div className="text-[10px] text-slate-400 font-medium">UTC-5 Lima, Perú</div>
          </div>
        </div>

        {/* Action Buttons & User Profile (Contained inside viewport margins) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live News Button */}
          {onOpenLiveNews && (
            <button
              type="button"
              onClick={onOpenLiveNews}
              className="px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Ver Noticias Oficiales en Vivo y Páginas Principales"
            >
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
              <span className="hidden md:inline">Noticias</span>
            </button>
          )}

          {/* Quick SOS Button */}
          <button
            type="button"
            onClick={onOpenSos}
            className="bg-red-600 hover:bg-red-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition-colors shrink-0"
            title="Enviar Alerta SOS de Emergencia"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse shrink-0" />
            <span>SOS</span>
          </button>

          {/* Emergency Phones Button */}
          <button
            type="button"
            onClick={onOpenPhones}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Líneas de Emergencia 105 / 116 / 106"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="hidden xl:inline font-semibold">105 / 116 / 106</span>
          </button>

          {/* Terms & Conditions */}
          <button
            type="button"
            onClick={onOpenTerms}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Términos y Condiciones / Autora"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Dark / Light Mode Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Alternar modo oscuro y claro"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              )}
            </button>
          )}

          {/* User Profile Badge & Logout (Strictly preserved within bounds) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 border-l border-slate-200 pl-2 sm:pl-3 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-[9px] text-slate-400 font-medium leading-none">Usuario</p>
              <p
                className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[90px] lg:max-w-[130px]"
                title={user.name || 'Brigadista Civil'}
              >
                {user.name || 'Brigadista Civil'}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
