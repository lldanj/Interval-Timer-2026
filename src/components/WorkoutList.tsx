import React from 'react';
import { Workout } from '../types';
import { Play, Edit2, Trash2, Copy, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface WorkoutListProps {
  workouts: Workout[];
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAdd: () => void;
}

export function WorkoutList({ 
  workouts, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onAdd 
}: WorkoutListProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Workouts</h1>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          <span>New Workout</span>
        </button>
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
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDuplicate(workout.id)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(workout.id)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(workout.id)}
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
    </div>
  );
}
