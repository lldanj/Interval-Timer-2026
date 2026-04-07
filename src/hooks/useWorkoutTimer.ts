import { useState, useEffect, useRef, useCallback } from 'react';
import { Workout, FlattenedInterval } from '../types';

export function useWorkoutTimer(workout: Workout | null) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [flattenedIntervals, setFlattenedIntervals] = useState<FlattenedInterval[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Flatten the workout structure for easier playback
  useEffect(() => {
    if (!workout) return;
    
    const flattened: FlattenedInterval[] = [];
    let totalIdx = 0;
    
    workout.blocks.forEach(block => {
      for (let r = 0; r < block.repeatCount; r++) {
        block.intervals.forEach((interval, iIdx) => {
          flattened.push({
            ...interval,
            blockId: block.id,
            blockRepeatIndex: r,
            intervalIndexInBlock: iIdx,
            totalIndex: totalIdx++,
          });
        });
      }
    });
    
    setFlattenedIntervals(flattened);
  }, [workout]);

  const playSound = useCallback((frequency: number, duration: number) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }, []);

  const startWorkout = () => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentIntervalIndex(0);
    setElapsedTime(0);
    setTotalElapsedTime(0);
    lastTickRef.current = performance.now();
  };

  const pauseWorkout = () => setIsPaused(true);
  const resumeWorkout = () => {
    setIsPaused(false);
    lastTickRef.current = performance.now();
  };
  const stopWorkout = () => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      const tick = (now: number) => {
        const deltaTime = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;

        setElapsedTime(prev => {
          const next = prev + deltaTime;
          const currentInterval = flattenedIntervals[currentIntervalIndex];
          
          if (currentInterval && next >= currentInterval.duration) {
            // Interval finished
            if (currentIntervalIndex < flattenedIntervals.length - 1) {
              setCurrentIntervalIndex(prevIdx => prevIdx + 1);
              playSound(880, 0.2); // High beep for transition
              return 0;
            } else {
              // Workout finished
              stopWorkout();
              playSound(440, 0.5); // Long beep for finish
              return currentInterval.duration;
            }
          }
          
          // Countdown beeps for last 3 seconds
          if (currentInterval) {
            const remaining = currentInterval.duration - next;
            const prevRemaining = currentInterval.duration - prev;
            if (Math.floor(remaining) < Math.floor(prevRemaining) && remaining <= 3 && remaining > 0) {
              playSound(440, 0.1); // Low beep for countdown
            }
          }

          return next;
        });

        setTotalElapsedTime(prev => prev + deltaTime);
        timerRef.current = requestAnimationFrame(tick);
      };

      timerRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isActive, isPaused, currentIntervalIndex, flattenedIntervals, playSound]);

  const currentInterval = flattenedIntervals[currentIntervalIndex];
  const nextInterval = flattenedIntervals[currentIntervalIndex + 1];
  const totalDuration = flattenedIntervals.reduce((acc, i) => acc + i.duration, 0);

  return {
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
  };
}
