import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X } from 'lucide-react';
import { ManualUso } from './ManualUso';
import { AppTab } from '../App';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AppTab) => void;
  onOpenDownloadModal: () => void;
  onOpenSos: () => void;
  onOpenPhones: () => void;
  onOpenLiveNews: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenDownloadModal,
  onOpenSos,
  onOpenPhones,
  onOpenLiveNews,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-5xl w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 my-6 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Manual de Uso Oficial • SAPDENP</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    Guía de Operaciones
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Instrucciones paso a paso de todas las herramientas y protocolos de prevención
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar Manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
            <ManualUso
              onNavigateTab={(tab) => {
                onClose();
                onNavigateTab(tab);
              }}
              onOpenDownloadModal={onOpenDownloadModal}
              onOpenSos={() => {
                onClose();
                onOpenSos();
              }}
              onOpenPhones={() => {
                onClose();
                onOpenPhones();
              }}
              onOpenLiveNews={() => {
                onClose();
                onOpenLiveNews();
              }}
            />
          </div>

          {/* Footer */}
          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400">
            <span>Sistema de Alerta y Prevención de Desastres Naturales del Perú</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
