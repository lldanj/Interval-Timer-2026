import React, { useState, useEffect, useRef } from 'react';
import { Workout, FlattenedInterval } from '../types';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { formatTime } from '../lib/utils';
import { ZONES } from '../constants';
import { Play, Pause, Square, ChevronRight, Bell, BellOff } from 'lucide-react';
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

  const [toast, setToast] = useState<string | null>(null);
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const lastZoneRef = useRef<string | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // Zone change notification
  useEffect(() => {
    if (notificationsEnabled && currentInterval && Notification.permission === 'granted') {
      if (lastZoneRef.current !== null && lastZoneRef.current !== currentInterval.zone) {
        const zoneInfo = ZONES.find(z => z.id === currentInterval.zone);
        new Notification('Zone Change', {
          body: `Now in ${zoneInfo?.label || 'Zone ' + currentInterval.zone}: ${zoneInfo?.value || ''}`,
          icon: '/favicon.ico', // or any app icon
          silent: true, // as requested "No vibration necessary"
        });
      }
      lastZoneRef.current = currentInterval.zone;
    }
  }, [currentInterval, notificationsEnabled]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        } catch (err) {
          // Fail silently
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {
          // Fail silently
        }
      }
    };

    if (isActive && !isPaused) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (isActive && !isPaused && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, isPaused]);

  useEffect(() => {
    const progress = (totalElapsedTime / totalDuration) * 100;
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (progress >= milestone && !shownMilestones.has(milestone)) {
        let message = "";
        if (milestone === 25) message = "25% completed! Keep going!";
        else if (milestone === 50) message = "Halfway there!";
        else if (milestone === 75) message = "75% done! Almost there!";
        else if (milestone === 100) message = "Workout complete! Great job! 🏆";
        
        setToast(message);
        setShownMilestones(prev => new Set(prev).add(milestone));
        
        setTimeout(() => {
          setToast(null);
        }, 2500);
      }
    }
  }, [totalElapsedTime, totalDuration, shownMilestones]);

  const remainingInInterval = currentInterval ? Math.ceil(currentInterval.duration - elapsedTime) : 0;
  const intervalProgress = currentInterval ? (elapsedTime / currentInterval.duration) * 100 : 0;
  const totalProgress = (totalElapsedTime / totalDuration) * 100;
  const totalRemaining = Math.ceil(totalDuration - totalElapsedTime);

  const getZoneInfo = (zoneId: string) => {
    return ZONES.find(z => z.id === zoneId) || { label: 'Unknown', value: '', color: '#808080' };
  };

  if (!isActive && !isPaused && totalElapsedTime === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
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
  const currentBlock = workout.blocks.find(b => b.id === currentInterval?.blockId);
  const currentBlockIndex = workout.blocks.findIndex(b => b.id === currentInterval?.blockId);
  const totalBlocks = workout.blocks.length;
  const currentRepIndex = currentInterval?.blockRepeatIndex ?? 0;
  const totalReps = currentBlock?.repeatCount ?? 1;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 50 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-xl">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Compact for S25 */}
      <header className="p-4 flex flex-col items-center justify-center bg-zinc-900/50 border-b border-zinc-800 text-center">
        <h2 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1">{workout.name}</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs sm:text-sm font-bold text-zinc-300">
          <span>Block {currentBlockIndex + 1} of {totalBlocks}</span>
          <span className="text-zinc-700">•</span>
          <span>Rep {currentRepIndex + 1} of {totalReps}</span>
          <span className="text-zinc-700">•</span>
          <span>Interval {currentIntervalIndex + 1} of {flattenedIntervals.length}</span>
        </div>
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
            {/* Current Zone Display */}
            <div className="mb-2 sm:mb-4">
              <span 
                className="font-black text-2xl sm:text-4xl uppercase tracking-tight"
                style={{ color: currentZone?.color }}
              >
                Z{currentZone?.label.split(' ')[0]} ({currentZone?.label.split('(')[1]?.replace(')', '')}) {currentZone?.value} {formatTime(currentInterval?.duration || 0)}
              </span>
            </div>
            
            {/* Timer */}
            <div className="text-[7rem] sm:text-[10rem] md:text-[14rem] font-black text-white leading-none tracking-tighter tabular-nums mb-4 sm:mb-6">
              {formatTime(remainingInInterval)}
            </div>

            {/* Next Interval */}
            <div className="mb-6 sm:mb-8">
              {nextInterval ? (
                <span className="text-zinc-500 font-bold text-lg sm:text-2xl uppercase tracking-widest">
                  Next: Z{nextInterval.zone} ({getZoneInfo(nextInterval.zone).label.split('(')[1]?.replace(')', '')}) {getZoneInfo(nextInterval.zone).value} {formatTime(nextInterval.duration)}
                </span>
              ) : (
                <span className="text-zinc-700 font-bold text-lg sm:text-2xl uppercase italic">Next: FINISH</span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Workout Zone Profile Graph */}
        <div className="w-full max-w-4xl px-4 sm:px-6 mb-6 flex gap-2">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between py-2 text-[10px] font-bold text-zinc-600 pointer-events-none shrink-0">
            <span>Z7</span>
            <span>Z6</span>
            <span>Z5</span>
            <span>Z4</span>
            <span>Z3</span>
            <span>Z2</span>
            <span>Z1</span>
          </div>

          <div className="relative flex-1 h-[120px] sm:h-[150px] bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden flex items-end">

            {/* Bars - No Gaps */}
            <div className="flex-1 h-full flex items-end">
              {flattenedIntervals.map((interval, idx) => {
                const zoneNum = parseInt(interval.zone);
                const zoneColor = getZoneInfo(interval.zone).color;
                const widthPercent = (Number(interval.duration) / totalDuration) * 100;
                return (
                  <div 
                    key={idx}
                    style={{ 
                      width: `${widthPercent}%`, 
                      height: `${(zoneNum / 7) * 100}%`,
                      backgroundColor: zoneColor,
                      opacity: idx < currentIntervalIndex ? 0.4 : 1
                    }}
                    className="transition-opacity duration-500"
                  />
                );
              })}
            </div>

            {/* Cursor */}
            <motion.div 
              className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              initial={false}
              animate={{ left: `${totalProgress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </div>

        {/* Interval Progress Bar */}
        <div className="w-full max-w-4xl px-4 sm:px-6 mb-2">
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
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
      <div className="w-full px-4 sm:px-8 mb-4">
        <div className="flex justify-between items-end mb-1">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Progress</span>
          <span className="text-green-500 text-[10px] font-bold">{Math.round(totalProgress)}% complete</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            initial={false}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>

      {/* Footer / Controls */}
      <footer className="p-4 sm:p-6 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex flex-col">
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] sm:text-xs mb-0.5">Remaining</span>
            <span className="text-white text-xl sm:text-3xl font-black tabular-nums">{formatTime(totalRemaining)}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`p-3 rounded-full transition-all ${notificationsEnabled ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}
              title={notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
            >
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            <button
              onClick={() => {
                pauseWorkout();
                setShowStopConfirm(true);
              }}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
            >
              <Square size={20} fill="currentColor" />
            </button>
            {isPaused ? (
              <button
                onClick={resumeWorkout}
                className="p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-xl shadow-blue-900/20"
              >
                <Play size={28} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={pauseWorkout}
                className="p-5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
              >
                <Pause size={28} fill="currentColor" />
              </button>
            )}
          </div>
          
          <div className="w-20 sm:w-32" /> {/* Spacer to balance layout */}
        </div>
      </footer>

      {/* Stop Confirmation Modal */}
      <AnimatePresence>
        {showStopConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">End Workout?</h3>
              <p className="text-zinc-400 mb-8">Are you sure you want to end the current workout?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    stopWorkout();
                    onClose();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                >
                  Yes, End Workout
                </button>
                <button
                  onClick={() => {
                    setShowStopConfirm(false);
                    resumeWorkout();
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                >
                  No, Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
