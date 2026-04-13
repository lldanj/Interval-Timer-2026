import React, { useRef, useState } from 'react';
import { Workout } from '../types';
import { Play, Edit2, Trash2, Copy, Plus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseZWO } from '../lib/zwoParser';

interface WorkoutListProps {
  workouts: Workout[];
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAdd: () => void;
  onImport: (workout: Omit<Workout, 'id'>) => void;
}

export function WorkoutList({ 
  workouts, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onAdd,
  onImport
}: WorkoutListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedWorkout = parseZWO(text);
      onImport(parsedWorkout);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to parse ZWO file:', error);
      alert('Failed to parse ZWO file. Please make sure it is a valid Zwift workout file.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Workouts</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".zwo"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors font-medium border border-zinc-700"
          >
            <Upload size={20} />
            <span>Import ZWO</span>
          </button>
          <button
            onClick={onAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
          >
            <Plus size={20} />
            <span>New Workout</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {workouts.map((workout) => {
          const totalDuration = workout.blocks.reduce((acc, block) => {
            const blockDuration = block.intervals.reduce((iAcc, i) => iAcc + i.duration, 0);
            return acc + (blockDuration * block.repeatCount);
          }, 0);
          const totalMins = Math.floor(totalDuration / 60);

          return (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{workout.name}</h3>
                  <p className="text-zinc-400 text-sm">{totalMins} minutes • {workout.blocks.length} blocks</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(workout.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(workout.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorkoutToDelete(workout.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => onSelect(workout.id)}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg transition-colors font-semibold"
              >
                <Play size={20} fill="currentColor" />
                <span>Start Workout</span>
              </button>
            </motion.div>
          );
        })}
      </div>
      
      {workouts.length === 0 && (
        <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 mb-4">No workouts yet. Create your first one!</p>
          <button
            onClick={onAdd}
            className="text-blue-500 hover:text-blue-400 font-medium"
          >
            + Create Workout
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {workoutToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Delete Workout?</h3>
              <p className="text-zinc-400 mb-8">
                Are you sure you want to delete "{workouts.find(w => w.id === workoutToDelete)?.name}"? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onDelete(workoutToDelete);
                    setWorkoutToDelete(null);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setWorkoutToDelete(null)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
