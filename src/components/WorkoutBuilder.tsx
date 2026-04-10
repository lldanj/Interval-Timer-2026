import React, { useState } from 'react';
import { Workout, Block, Interval } from '../types';
import { generateId, formatTime, parseTime } from '../lib/utils';
import { ZONES, CADENCE_OPTIONS } from '../constants';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Save, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { motion, Reorder, useDragControls } from 'motion/react';

interface WorkoutBuilderProps {
  workout: Workout;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}

interface BlockItemProps {
  key: string;
  block: Block;
  bIdx: number;
  isExpanded: boolean;
  blockDuration: number;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  updateBlock: (updates: Partial<Block>) => void;
  updateInterval: (intervalId: string, updates: Partial<Interval>) => void;
  deleteInterval: (intervalId: string) => void;
  duplicateInterval: (intervalId: string) => void;
  addInterval: () => void;
}

function BlockItem({ 
  block, bIdx, isExpanded, blockDuration, onToggle, onDuplicate, onDelete, 
  updateBlock, updateInterval, deleteInterval, duplicateInterval, addInterval 
}: BlockItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={block} 
      dragListener={false} 
      dragControls={controls}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)" }}
    >
      {/* Block Header */}
      <div 
        onClick={onToggle}
        className={`p-4 flex items-center justify-between cursor-pointer transition-colors border-l-4 border-white/30 ${
          isExpanded ? 'bg-zinc-800 border-b border-zinc-700' : 'bg-zinc-800/50 hover:bg-zinc-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div 
            className="p-1 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical size={20} />
          </div>
          <div className="flex items-center gap-1">
            {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
            <span className="text-white font-bold">BLOCK {bIdx + 1}</span>
          </div>
          
          {!isExpanded && (
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="bg-zinc-700 px-2 py-0.5 rounded text-zinc-200">×{block.repeatCount}</span>
              <span>{block.intervals.length} intervals</span>
              <span className="font-mono">{formatTime(blockDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDuplicate}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
            title="Duplicate Block"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Delete Block"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Block Settings (Repeat Count) */}
          <div className="mb-6 flex items-center gap-3 bg-zinc-800/30 p-3 rounded-xl border border-zinc-800/50">
            <span className="text-zinc-400 text-sm font-medium">Repeat this block</span>
            <input
              type="number"
              min="1"
              value={block.repeatCount}
              onChange={(e) => updateBlock({ repeatCount: parseInt(e.target.value) || 1 })}
              className="bg-zinc-800 text-white w-16 px-2 py-1 rounded border border-zinc-700 focus:border-blue-500 focus:outline-none text-center font-bold"
            />
            <span className="text-zinc-400 text-sm font-medium">times</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2 w-[30%]">Name</th>
                  <th className="pb-3 w-[15%]">Duration</th>
                  <th className="pb-3 w-[25%]">Zone</th>
                  <th className="pb-3 w-[15%]">Cadence</th>
                  <th className="pb-3 w-[15%] text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {block.intervals.map((interval) => {
                  const zoneColor = ZONES.find(z => z.id === interval.zone)?.color || '#52525b';
                  return (
                    <tr key={interval.id} className="group hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 pl-2 border-l-4" style={{ borderLeftColor: zoneColor }}>
                        <input
                          type="text"
                          value={interval.name}
                          onChange={(e) => updateInterval(interval.id, { name: e.target.value })}
                          className="bg-transparent text-white focus:outline-none border-b border-transparent focus:border-blue-500 w-full text-lg"
                          placeholder="Interval Name"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="text"
                          defaultValue={formatTime(interval.duration)}
                          onBlur={(e) => updateInterval(interval.id, { duration: parseTime(e.target.value) })}
                          className="bg-transparent text-white focus:outline-none border-b border-transparent focus:border-blue-500 w-full font-mono text-lg"
                        />
                      </td>
                      <td className="py-3">
                        <select
                          value={interval.zone}
                          onChange={(e) => updateInterval(interval.id, { zone: e.target.value })}
                          className="bg-zinc-800 text-white rounded px-2 py-1 border border-zinc-700 focus:border-blue-500 focus:outline-none w-full text-sm"
                        >
                          {ZONES.map(z => (
                            <option key={z.id} value={z.id} style={{ color: z.color }}>
                              ■ {z.label}: {z.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <select
                          value={interval.cadence}
                          onChange={(e) => updateInterval(interval.id, { cadence: e.target.value })}
                          className="bg-zinc-800 text-white rounded px-2 py-1 border border-zinc-700 focus:border-blue-500 focus:outline-none w-full text-sm"
                        >
                          {CADENCE_OPTIONS.map(c => (
                            <option key={c} value={c}>{c === 'Any' ? 'Any' : `${c} RPM`}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateInterval(interval.id)}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => deleteInterval(interval.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {block.intervals.map((interval, iIdx) => {
              const zoneColor = ZONES.find(z => z.id === interval.zone)?.color || '#52525b';
              return (
                <div key={interval.id} className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800 relative group border-l-4" style={{ borderLeftColor: zoneColor }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-zinc-600 font-mono text-xs">#{iIdx + 1}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => duplicateInterval(interval.id)}
                        className="p-2 text-zinc-500 hover:text-white bg-zinc-800 rounded-lg"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => deleteInterval(interval.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-800 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Name</label>
                      <input
                        type="text"
                        value={interval.name}
                        onChange={(e) => updateInterval(interval.id, { name: e.target.value })}
                        className="bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none w-full text-base"
                        placeholder="Interval Name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Duration</label>
                        <input
                          type="text"
                          defaultValue={formatTime(interval.duration)}
                          onBlur={(e) => updateInterval(interval.id, { duration: parseTime(e.target.value) })}
                          className="bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none w-full font-mono text-base"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Cadence</label>
                        <select
                          value={interval.cadence}
                          onChange={(e) => updateInterval(interval.id, { cadence: e.target.value })}
                          className="bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none w-full text-sm h-[42px]"
                        >
                          {CADENCE_OPTIONS.map(c => (
                            <option key={c} value={c}>{c === 'Any' ? 'Any' : `${c} RPM`}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Zone</label>
                      <select
                        value={interval.zone}
                        onChange={(e) => updateInterval(interval.id, { zone: e.target.value })}
                        className="bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none w-full text-sm h-[42px]"
                      >
                        {ZONES.map(z => (
                          <option key={z.id} value={z.id} style={{ color: z.color }}>
                            ■ {z.label}: {z.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={addInterval}
            className="mt-4 w-full py-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            <span>Add Interval</span>
          </button>
        </div>
      )}
    </Reorder.Item>
  );
}

export function WorkoutBuilder({ workout: initialWorkout, onSave, onCancel }: WorkoutBuilderProps) {
  const [workout, setWorkout] = useState<Workout>(JSON.parse(JSON.stringify(initialWorkout)));
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const updateWorkoutName = (name: string) => {
    setWorkout({ ...workout, name });
  };

  const addBlock = () => {
    const newBlock: Block = {
      id: generateId(),
      repeatCount: 1,
      intervals: [
        { id: generateId(), name: 'New Interval', duration: 60, zone: '2', cadence: '90' },
      ],
    };
    setWorkout({ ...workout, blocks: [...workout.blocks, newBlock] });
    setExpandedBlockId(newBlock.id);
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setWorkout({
      ...workout,
      blocks: workout.blocks.map(b => (b.id === blockId ? { ...b, ...updates } : b)),
    });
  };

  const deleteBlock = (blockId: string) => {
    setWorkout({
      ...workout,
      blocks: workout.blocks.filter(b => b.id !== blockId),
    });
  };

  const duplicateBlock = (blockId: string) => {
    const block = workout.blocks.find(b => b.id === blockId);
    if (!block) return;
    const copy: Block = {
      ...JSON.parse(JSON.stringify(block)),
      id: generateId(),
    };
    copy.intervals.forEach(i => i.id = generateId());
    const idx = workout.blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...workout.blocks];
    newBlocks.splice(idx + 1, 0, copy);
    setWorkout({ ...workout, blocks: newBlocks });
    setExpandedBlockId(copy.id);
  };

  const addInterval = (blockId: string) => {
    const block = workout.blocks.find(b => b.id === blockId);
    if (!block) return;
    const lastInterval = block.intervals[block.intervals.length - 1];
    const newInterval: Interval = {
      id: generateId(),
      name: lastInterval?.name || 'New Interval',
      duration: lastInterval?.duration || 60,
      zone: lastInterval?.zone || '2',
      cadence: lastInterval?.cadence || '90',
    };
    updateBlock(blockId, { intervals: [...block.intervals, newInterval] });
  };

  const updateInterval = (blockId: string, intervalId: string, updates: Partial<Interval>) => {
    const block = workout.blocks.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, {
      intervals: block.intervals.map(i => (i.id === intervalId ? { ...i, ...updates } : i)),
    });
  };

  const deleteInterval = (blockId: string, intervalId: string) => {
    const block = workout.blocks.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, {
      intervals: block.intervals.filter(i => i.id !== intervalId),
    });
  };

  const duplicateInterval = (blockId: string, intervalId: string) => {
    const block = workout.blocks.find(b => b.id === blockId);
    if (!block) return;
    const interval = block.intervals.find(i => i.id === intervalId);
    if (!interval) return;
    const copy: Interval = { ...interval, id: generateId() };
    const idx = block.intervals.findIndex(i => i.id === intervalId);
    const newIntervals = [...block.intervals];
    newIntervals.splice(idx + 1, 0, copy);
    updateBlock(blockId, { intervals: newIntervals });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <input
          type="text"
          value={workout.name}
          onChange={(e) => updateWorkoutName(e.target.value)}
          className="bg-transparent text-3xl font-bold text-white focus:outline-none border-b border-transparent focus:border-blue-500 transition-all w-full"
          placeholder="Workout Name"
        />
        <button
          onClick={() => onSave(workout)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-colors font-semibold shadow-lg shadow-blue-900/20"
        >
          <Save size={20} />
          <span>Save</span>
        </button>
      </header>

      <Reorder.Group 
        axis="y" 
        values={workout.blocks} 
        onReorder={(newBlocks) => setWorkout({ ...workout, blocks: newBlocks })}
        className="space-y-8"
      >
        {workout.blocks.map((block, bIdx) => {
          const isExpanded = expandedBlockId === block.id;
          const blockDuration = block.intervals.reduce((acc, i) => acc + i.duration, 0) * block.repeatCount;
          
          return (
            <BlockItem 
              key={block.id}
              block={block}
              bIdx={bIdx}
              isExpanded={isExpanded}
              blockDuration={blockDuration}
              onToggle={() => setExpandedBlockId(isExpanded ? null : block.id)}
              onDuplicate={() => duplicateBlock(block.id)}
              onDelete={() => deleteBlock(block.id)}
              updateBlock={(updates) => updateBlock(block.id, updates)}
              updateInterval={(intervalId, updates) => updateInterval(block.id, intervalId, updates)}
              deleteInterval={(intervalId) => deleteInterval(block.id, intervalId)}
              duplicateInterval={(intervalId) => duplicateInterval(block.id, intervalId)}
              addInterval={() => addInterval(block.id)}
            />
          );
        })}
      </Reorder.Group>

      <button
        onClick={addBlock}
        className="mt-8 w-full py-6 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-2"
      >
        <Plus size={32} />
        <span className="text-lg font-semibold">Add New Block</span>
      </button>
    </div>
  );
}
