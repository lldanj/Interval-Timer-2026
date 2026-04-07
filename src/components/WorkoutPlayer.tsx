import React from 'react';
import { Workout, FlattenedInterval } from '../types';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { formatTime } from '../lib/utils';
import { ZONES } from '../constants';
import { Play, Pause, Square, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkoutPlayerProps {
  workout: Workout;
  onClose: () => void;
}

export function WorkoutPlayer({ workout, onClose }: WorkoutPlayerProps) {
  const {
    isActive,
    isPaused,
    currentInterval,
    nextInterval,
    currentIntervalIndex,
    elapsedTime,
    totalElapsedTime,
    totalDuration,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    flattenedIntervals,
  } = useWorkoutTimer(workout);

  const remainingInInterval = currentInterval ? Math.ceil(currentInterval.duration - elapsedTime) : 0;
  const intervalProgress = currentInterval ? (elapsedTime / currentInterval.duration) * 100 : 0;
  const totalProgress = (totalElapsedTime / totalDuration) * 100;
  const totalRemaining = Math.ceil(totalDuration - totalElapsedTime);

  const getZoneInfo = (zoneId: string) => {
    return ZONES.find(z => z.id === zoneId) || { label: 'Unknown', value: '' };
  };

  if (!isActive && !isPaused && totalElapsedTime === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors">
          <X size={32} />
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <h2 className="text-4xl font-bold text-white mb-2">{workout.name}</h2>
          <p className="text-zinc-400 text-xl mb-12">{formatTime(totalDuration)} total duration</p>
          <button
            onClick={startWorkout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-3xl text-3xl font-bold transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-4"
          >
            <Play size={40} fill="currentColor" />
            <span>START</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const currentZone = currentInterval ? getZoneInfo(currentInterval.zone) : null;
  const nextZone = nextInterval ? getZoneInfo(nextInterval.zone) : null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-zinc-900/50 border-b border-zinc-800">
        <div>
          <h2 className="text-zinc-400 font-medium uppercase tracking-widest text-sm mb-1">{workout.name}</h2>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">Interval {currentIntervalIndex + 1}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500 font-medium">{flattenedIntervals.length}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
          <X size={28} />
        </button>
      </header>

      {/* Main Timer Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInterval?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-2xl flex flex-col items-center"
          >
            <div className="mb-1 sm:mb-2">
              <span className="text-blue-500 font-black text-3xl sm:text-5xl uppercase tracking-tight">{currentInterval?.name}</span>
            </div>
            {nextInterval && (
              <div className="mb-2 sm:mb-4">
                <span className="text-zinc-500 font-bold text-sm sm:text-xl uppercase tracking-tighter">Next: {nextInterval.name}</span>
              </div>
            )}
            <div className="text-[7rem] sm:text-[12rem] md:text-[16rem] font-black text-white leading-none tracking-tighter tabular-nums mb-4 sm:mb-8">
              {formatTime(remainingInInterval)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 w-full">
              <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-zinc-800 flex flex-col items-center sm:items-start">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm block mb-1 sm:mb-2">Zone</span>
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-white text-2xl sm:text-4xl font-black">{currentZone?.label}</span>
                  <span className="text-zinc-400 text-sm sm:text-lg font-medium">{currentZone?.value}</span>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-zinc-800 flex flex-col items-center sm:items-start">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm block mb-1 sm:mb-2">Cadence</span>
                <span className="text-white text-3xl sm:text-5xl font-black">
                  {currentInterval?.cadence}
                  {currentInterval?.cadence !== 'Any' && <span className="text-xl sm:text-2xl text-zinc-600"> RPM</span>}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Interval Progress Bar */}
        <div className="absolute bottom-2 sm:bottom-4 left-0 w-full h-1.5 sm:h-2 px-4 sm:px-6">
          <div className="w-full h-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              initial={false}
              animate={{ width: `${intervalProgress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </div>
      </main>

      {/* Total Progress Bar */}
      <div className="w-full h-1 bg-zinc-900">
        <motion.div
          className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          initial={false}
          animate={{ width: `${totalProgress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Footer / Controls */}
      <footer className="p-4 sm:p-8 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800">
        <div className="grid grid-cols-3 items-center gap-2 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] sm:text-xs mb-0.5 sm:mb-1">Total Remaining</span>
            <span className="text-white text-lg sm:text-3xl font-black tabular-nums">{formatTime(totalRemaining)}</span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={stopWorkout}
              className="p-3 sm:p-6 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
            >
              <Square size={16} sm:size={32} className="w-4 h-4 sm:w-8 sm:h-8" fill="currentColor" />
            </button>
            {isPaused ? (
              <button
                onClick={resumeWorkout}
                className="p-4 sm:p-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-xl shadow-blue-900/20"
              >
                <Play size={24} sm:size={48} className="w-6 h-6 sm:w-12 sm:h-12" fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={pauseWorkout}
                className="p-4 sm:p-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
              >
                <Pause size={24} sm:size={48} className="w-6 h-6 sm:w-12 sm:h-12" fill="currentColor" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] sm:text-xs mb-0.5 sm:mb-1">Next Up</span>
            {nextInterval ? (
              <div className="flex flex-col items-end">
                <span className="text-white text-xs sm:text-xl font-bold truncate max-w-[80px] sm:max-w-none">{nextInterval.name}</span>
                <div className="hidden sm:flex items-center gap-2 text-zinc-400 text-sm">
                  <span>{nextZone?.label}</span>
                  <span>•</span>
                  <span>{nextInterval.cadence}{nextInterval.cadence !== 'Any' && ' RPM'}</span>
                </div>
              </div>
            ) : (
              <span className="text-zinc-700 font-bold text-[10px] sm:text-xl uppercase italic">Finish</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
