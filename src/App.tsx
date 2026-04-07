/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkouts } from './hooks/useWorkouts';
import { WorkoutList } from './components/WorkoutList';
import { WorkoutBuilder } from './components/WorkoutBuilder';
import { WorkoutPlayer } from './components/WorkoutPlayer';
import { Workout } from './types';
import { Bike } from 'lucide-react';

type View = 'list' | 'builder' | 'player';

export default function App() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout, duplicateWorkout } = useWorkouts();
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  const activeWorkout = workouts.find(w => w.id === activeWorkoutId) || null;

  const handleCreateWorkout = () => {
    const id = addWorkout();
    setActiveWorkoutId(id);
    setCurrentView('builder');
  };

  const handleEditWorkout = (id: string) => {
    setActiveWorkoutId(id);
    setCurrentView('builder');
  };

  const handleStartWorkout = (id: string) => {
    setActiveWorkoutId(id);
    setCurrentView('player');
  };

  const handleSaveWorkout = (updatedWorkout: Workout) => {
    updateWorkout(updatedWorkout);
    setCurrentView('list');
    setActiveWorkoutId(null);
  };

  const handleCancelEdit = () => {
    setCurrentView('list');
    setActiveWorkoutId(null);
  };

  const handleClosePlayer = () => {
    setCurrentView('list');
    setActiveWorkoutId(null);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      {currentView === 'list' && (
        <div className="py-12">
          <header className="max-w-4xl mx-auto px-4 mb-12 flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
              <Bike size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white leading-none">CADENCE</h1>
              <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">Interval Timer</p>
            </div>
          </header>
          
          <WorkoutList
            workouts={workouts}
            onSelect={handleStartWorkout}
            onEdit={handleEditWorkout}
            onDelete={deleteWorkout}
            onDuplicate={duplicateWorkout}
            onAdd={handleCreateWorkout}
          />
        </div>
      )}

      {currentView === 'builder' && activeWorkout && (
        <WorkoutBuilder
          workout={activeWorkout}
          onSave={handleSaveWorkout}
          onCancel={handleCancelEdit}
        />
      )}

      {currentView === 'player' && activeWorkout && (
        <WorkoutPlayer
          workout={activeWorkout}
          onClose={handleClosePlayer}
        />
      )}

      <footer className="max-w-4xl mx-auto px-4 py-12 text-center border-t border-zinc-900 mt-12">
        <p className="text-zinc-600 text-sm">
          Cadence Interval Timer &copy; 2026 • Designed for performance.
        </p>
      </footer>
    </div>
  );
}

