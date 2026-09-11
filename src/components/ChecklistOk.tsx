import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckSquare, Square, Backpack, Award, RotateCcw, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { DisasterType } from '../types/disasters';
import { DISASTER_PROTOCOLS } from '../data/peruData';

interface ChecklistOkProps {
  activeDisaster: DisasterType;
  districtName: string;
}

export const ChecklistOk: React.FC<ChecklistOkProps> = ({ activeDisaster, districtName }) => {
  const currentItems = DISASTER_PROTOCOLS[activeDisaster]?.backpackItems || DISASTER_PROTOCOLS.sismo.backpackItems;

  // Track checked items by id
  const storageKey = `checklist_peru_${activeDisaster}`;
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {}
    // default: some sample essentials prechecked
    return new Set<string>();
  });

  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendientes' | 'completados'>('todos');

  // Sync state when disaster changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`checklist_peru_${activeDisaster}`);
      if (saved) {
        setCheckedIds(new Set(JSON.parse(saved)));
      } else {
        setCheckedIds(new Set());
      }
      setHasCelebrated(false);
    } catch (e) {}
  }, [activeDisaster]);

  const toggleItem = (id: string) => {
    const updated = new Set(checkedIds);
    if (updated.has(id)) {
      updated.delete(id);
      setHasCelebrated(false);
    } else {
      updated.add(id);
    }
    setCheckedIds(updated);

    try {
      localStorage.setItem(`checklist_peru_${activeDisaster}`, JSON.stringify(Array.from(updated)));
    } catch (e) {}

    // Check if now 100% completed
    if (updated.size === currentItems.length && !hasCelebrated) {
      triggerCelebration();
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setHasCelebrated(true);

    // Launch confetti bursts
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f59e0b', '#10b981', '#ffffff'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);
  };

  const resetChecklist = () => {
    setCheckedIds(new Set());
    setHasCelebrated(false);
    try {
      localStorage.removeItem(`checklist_peru_${activeDisaster}`);
    } catch (e) {}
  };

  const markAll = () => {
    const all = new Set(currentItems.map((item) => item.id));
    setCheckedIds(all);
    try {
      localStorage.setItem(`checklist_peru_${activeDisaster}`, JSON.stringify(Array.from(all)));
    } catch (e) {}
    triggerCelebration();
  };

  const completedCount = currentItems.filter((i) => checkedIds.has(i.id)).length;
  const progressPercent = Math.round((completedCount / currentItems.length) * 100);

  const filteredItems = currentItems.filter((item) => {
    const isChecked = checkedIds.has(item.id);
    if (activeFilter === 'pendientes') return !isChecked;
    if (activeFilter === 'completados') return isChecked;
    return true;
  });

  return (
    <div className="w-full bg-white border border-slate-200 border-t-4 border-t-slate-800 rounded-xl p-4 sm:p-6 shadow-sm relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
            <Backpack className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Mochila de Emergencia Peruana
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                Norma INDECI 72h
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Artículos obligatorios y adaptados para <strong className="text-slate-800 font-bold">{districtName}</strong>.
            </p>
          </div>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetChecklist}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reiniciar
          </button>
          <button
            type="button"
            onClick={markAll}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            Completar Todo
          </button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-orange-500" />
            Progreso de Preparación Familiar:
          </span>
          <span className="font-mono font-bold text-slate-900">
            {completedCount} de {currentItems.length} artículos ({progressPercent}%)
          </span>
        </div>

        {/* Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <motion.div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100
                ? 'bg-green-600'
                : 'bg-slate-900'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          {(['todos', 'pendientes', 'completados'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-md capitalize font-semibold transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Haga clic en la casilla para marcar o desmarcar
        </span>
      </div>

      {/* Checklist items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isChecked = checkedIds.has(item.id);
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.005 }}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 select-none ${
                isChecked
                  ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-green-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-bold ${
                      isChecked ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    item.required 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {item.required ? 'Obligatorio' : 'Recomendado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 capitalize font-medium">
                  Categoría: {item.category}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* "¡CHECKLIST OK!" Spectacular Zoom Animation Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.2, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.3, rotate: 10, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-2xl overflow-hidden"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mb-4 shadow-sm">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>

              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="inline-block px-4 py-1.5 rounded-lg bg-green-600 text-white font-extrabold text-xl sm:text-2xl tracking-tight shadow-sm mb-4 uppercase"
              >
                ¡CHECKLIST OK!
              </motion.div>

              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Mochila de Emergencia Completa
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Ha verificado todos los insumos vitales para la supervivencia de su familia durante las primeras 72 horas ante desastres naturales en <strong className="text-slate-900 font-bold">{districtName}</strong>.
              </p>

              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
              >
                Entendido, Guardar Verificación
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
