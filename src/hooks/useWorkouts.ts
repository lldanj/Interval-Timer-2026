import { useState, useEffect } from 'react';
import { Workout, Block, Interval } from '../types';
import { generateId } from '../lib/utils';

const STORAGE_KEY = 'cadence_workouts';

const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: generateId(),
    name: 'Intro to Intervals',
    blocks: [
      {
        id: generateId(),
        repeatCount: 1,
        intervals: [
          { id: generateId(), name: 'Warm Up', duration: 300, zone: '1', cadence: '90' },
        ],
      },
      {
        id: generateId(),
        repeatCount: 5,
        intervals: [
          { id: generateId(), name: 'Sprint', duration: 60, zone: '6', cadence: '100' },
          { id: generateId(), name: 'Recovery', duration: 120, zone: '1', cadence: '85' },
        ],
      },
      {
        id: generateId(),
        repeatCount: 1,
        intervals: [
          { id: generateId(), name: 'Cool Down', duration: 300, zone: '1', cadence: '90' },
        ],
      },
    ],
  },
];

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  const addWorkout = (name: string = 'New Workout') => {
    const newWorkout: Workout = {
      id: generateId(),
      name,
      blocks: [
        {
          id: generateId(),
          repeatCount: 1,
          intervals: [
            { id: generateId(), name: 'Interval 1', duration: 60, zone: '2', cadence: '90' },
          ],
        },
      ],
    };
    setWorkouts([...workouts, newWorkout]);
    return newWorkout.id;
  };

  const updateWorkout = (updatedWorkout: Workout) => {
    setWorkouts(workouts.map(w => (w.id === updatedWorkout.id ? updatedWorkout : w)));
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const duplicateWorkout = (id: string) => {
    const original = workouts.find(w => w.id === id);
    if (!original) return;
    
    const copy: Workout = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      name: `${original.name} (Copy)`,
    };
    // Regenerate IDs for blocks and intervals
    copy.blocks.forEach(b => {
      b.id = generateId();
      b.intervals.forEach(i => i.id = generateId());
    });
    
    setWorkouts([...workouts, copy]);
  };

  return {
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
  };
}
