import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  const totalDuration = useMemo(() => 
    flattenedIntervals.reduce((acc, i) => acc + Number(i.duration), 0),
    [flattenedIntervals]
  );

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
  const stopWorkout = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive || isPaused || flattenedIntervals.length === 0) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      const deltaTime = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setTotalElapsedTime(prevTotal => {
        const nextTotal = Math.min(prevTotal + deltaTime, totalDuration);
        
        // Find current interval based on nextTotal
        let accumulatedTime = 0;
        let foundIndex = -1;
        
        for (let i = 0; i < flattenedIntervals.length; i++) {
          const duration = Number(flattenedIntervals[i].duration);
          if (nextTotal < accumulatedTime + duration) {
            foundIndex = i;
            break;
          }
          accumulatedTime += duration;
        }

        // If we've reached the end
        if (foundIndex === -1 || nextTotal >= totalDuration) {
          stopWorkout();
          playSound(440, 0.5); // Long beep for finish
          setCurrentIntervalIndex(flattenedIntervals.length - 1);
          setElapsedTime(Number(flattenedIntervals[flattenedIntervals.length - 1].duration));
          return totalDuration;
        }

        // Update current interval index if it changed
        if (foundIndex !== currentIntervalIndex) {
          setCurrentIntervalIndex(foundIndex);
          playSound(880, 0.2); // High beep for transition
        }

        const currentInt = flattenedIntervals[foundIndex];
        const currentElapsed = nextTotal - accumulatedTime;
        
        // Countdown beeps for last 3 seconds of current interval
        const remaining = Number(currentInt.duration) - currentElapsed;
        const prevRemaining = Number(currentInt.duration) - (prevTotal - accumulatedTime);
        if (Math.floor(remaining) < Math.floor(prevRemaining) && remaining <= 3 && remaining > 0) {
          playSound(440, 0.1); // Low beep for countdown
        }

        setElapsedTime(currentElapsed);
        return nextTotal;
      });

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isPaused, flattenedIntervals, playSound, totalDuration, stopWorkout, currentIntervalIndex]);

  const currentInterval = flattenedIntervals[currentIntervalIndex];
  const nextInterval = flattenedIntervals[currentIntervalIndex + 1];

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

