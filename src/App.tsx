/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWorkouts } from './hooks/useWorkouts';
import { WorkoutList } from './components/WorkoutList';
import { WorkoutBuilder } from './components/WorkoutBuilder';
import { WorkoutPlayer } from './components/WorkoutPlayer';
import { Workout } from './types';
import { Bike } from 'lucide-react';

type View = 'list' | 'builder' | 'player';

export default function App() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout, duplicateWorkout, importWorkout } = useWorkouts();
  const [currentView, setCurrentView] = useState<View>('list');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  // Handle Android Back Button / Browser Back
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (currentView !== 'list') {
        const message = currentView === 'player' 
          ? 'End workout in progress? Your progress will be lost.' 
          : 'Discard unsaved changes?';
        
        if (window.confirm(message)) {
          setCurrentView('list');
          setActiveWorkoutId(null);
        } else {
          // If they cancel, we MUST push the state back so the NEXT back button still triggers this
          window.history.pushState({ view: currentView, time: Date.now() }, '');
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentView !== 'list') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (currentView !== 'list') {
      window.history.pushState({ view: currentView, time: Date.now() }, '');
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentView]);

  const activeWorkout = workouts.find(w => w.id === activeWorkoutId) || null;

  const handleCreateWorkout = () => {
    const id = addWorkout();
    setActiveWorkoutId(id);
    setCurrentView('builder');
  };

  const handleImportWorkout = (workoutData: Omit<Workout, 'id'>) => {
    const id = importWorkout(workoutData);
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
    <div className="h-screen flex flex-col bg-black text-zinc-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      {currentView === 'list' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="max-w-4xl w-full mx-auto px-4 py-8 flex items-center gap-3 shrink-0">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
              <Bike size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white leading-none">CADENCE</h1>
              <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">Interval Timer</p>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto">
            <WorkoutList
              workouts={workouts}
              onSelect={handleStartWorkout}
              onEdit={handleEditWorkout}
              onDelete={deleteWorkout}
              onDuplicate={duplicateWorkout}
              onAdd={handleCreateWorkout}
              onImport={handleImportWorkout}
            />
          </div>
        </div>
      )}

      {currentView === 'builder' && activeWorkout && (
        <div className="flex-1 overflow-y-auto">
          <WorkoutBuilder
            workout={activeWorkout}
            onSave={handleSaveWorkout}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {currentView === 'player' && activeWorkout && (
        <WorkoutPlayer
          workout={activeWorkout}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}

