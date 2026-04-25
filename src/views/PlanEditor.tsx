import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { ArrowLeft, Trash2, Plus, GripVertical } from 'lucide-react';
import { Routine, ExerciseDefinition } from '../types';

export function PlanEditor({ routineId, onBack }: { routineId?: string, onBack: () => void }) {
  const { state, dispatch } = useAppStore();
  
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<number[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (routineId) {
      const routine = state.routines.find((r) => r.id === routineId);
      if (routine) {
        setName(routine.name);
        setSchedule(routine.schedule || []);
        setExercises(routine.exercises);
      }
    }
  }, [routineId, state.routines]);

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const updateExercise = (id: string, field: keyof ExerciseDefinition, value: any) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const addExercise = () => {
    const newEx: ExerciseDefinition = {
      id: crypto.randomUUID(),
      name: '',
      sets: 3,
      reps: 10,
      targetKg: 20,
      isTime: false,
      history: []
    };
    setExercises([...exercises, newEx]);
  };

  const handleSave = () => {
    if (!name.trim()) return alert("Plan needs a name");
    if (exercises.some(e => !e.name.trim())) return alert("All exercises need a name");

    const payload: Routine = {
       id: routineId || crypto.randomUUID(),
       name: name.trim(),
       schedule,
       exercises
    };

    if (routineId) {
       dispatch({ type: 'UPDATE_ROUTINE', payload });
    } else {
       dispatch({ type: 'ADD_ROUTINE', payload });
    }
    onBack();
  };

  const handleDelete = () => {
     if(confirm("Delete this plan?")) {
        dispatch({ type: 'DELETE_ROUTINE', payload: routineId });
        onBack();
     }
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300 pb-16">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panel pb-4">
        <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-tx">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-serif italic tracking-tight">{routineId ? 'Edit Plan' : 'New Plan'}</h1>
        <button onClick={handleSave} className="text-accent font-bold text-sm uppercase tracking-widest disabled:opacity-50" disabled={!name.trim()}>
          Save
        </button>
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
         <div>
            <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-1 block">Plan Name</label>
            <input 
               autoFocus={!routineId}
               type="text" 
               placeholder="e.g. Upper Body Power"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-surface border border-panel rounded-2xl px-5 py-4 text-tx focus:outline-none focus:border-panel-dark transition-colors font-medium text-lg placeholder:text-dim"
            />
         </div>

         <div>
            <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-2 block">Weekly Schedule</label>
            <div className="flex gap-1 justify-between bg-surface border border-panel rounded-2xl p-2 px-3">
               {days.map((d, i) => {
                  const active = schedule.includes(i);
                  return (
                     <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-colors ${active ? 'bg-accent text-bg' : 'text-muted hover:bg-surface2'}`}
                     >
                        <span className={`text-[10px] font-mono leading-none ${active ? 'font-bold' : ''}`}>{d}</span>
                     </button>
                  );
               })}
            </div>
         </div>
      </div>

      <hr className="border-panel" />

      {/* Exercises */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif italic text-xl">Exercises</h2>
            <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{exercises.length} total</div>
         </div>

         <div className="flex flex-col gap-3">
            {exercises.map((ex, i) => (
               <div key={ex.id} className="bg-surface border border-panel rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2 w-full">
                     <span className="text-muted font-mono text-xs w-4">{i+1}.</span>
                     <input 
                        type="text"
                        placeholder="Exercise name"
                        value={ex.name}
                        onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                        className="flex-1 bg-transparent border-b border-panel text-tx font-medium placeholder:text-dim py-2 focus:outline-none focus:border-info min-w-0"
                     />
                     <button onClick={() => updateExercise(ex.id, 'isTime', !ex.isTime)} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-lg transition-colors whitespace-nowrap ${ex.isTime ? 'bg-accent/20 text-accent' : 'bg-surface2 text-dim hover:text-tx'}`}>
                        Time
                     </button>
                     <button onClick={() => removeExercise(ex.id)} className="p-2 -mr-2 text-dim hover:text-danger rounded transition-colors active:scale-95 touch-manipulation">
                       <Trash2 size={20} />
                     </button>
                  </div>
                  
                  <div className="flex items-center pl-6 gap-4">
                     <div className="flex-1 flex flex-col">
                        <label className="text-[10px] text-muted mb-1 font-mono uppercase">Sets</label>
                        <input 
                           type="number" min="1" max="20"
                           value={ex.sets}
                           onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value))}
                           className="w-full bg-surface2 border border-panel rounded-lg py-2 text-center font-mono focus:outline-none focus:border-info"
                        />
                     </div>
                     <span className="text-dim font-mono mt-4">×</span>
                     <div className="flex-1 flex flex-col">
                        <label className="text-[10px] text-muted mb-1 font-mono uppercase">{ex.isTime ? 'Secs' : 'Reps'}</label>
                        <input 
                           type="number" min="1" max="500"
                           value={ex.reps}
                           onChange={(e) => updateExercise(ex.id, 'reps', parseInt(e.target.value))}
                           className="w-full bg-surface2 border border-panel rounded-lg py-2 text-center font-mono focus:outline-none focus:border-info"
                        />
                     </div>
                     <div className="w-[1px] h-8 bg-panel mt-4" />
                     <div className="flex-1 flex flex-col">
                        <label className="text-[10px] text-muted mb-1 font-mono uppercase">Init Kg</label>
                        <input 
                           type="number" min="0" step="2.5"
                           value={ex.targetKg}
                           onChange={(e) => updateExercise(ex.id, 'targetKg', parseFloat(e.target.value))}
                           className="w-full bg-surface2 border border-panel rounded-lg py-2 text-center font-mono text-accent focus:outline-none focus:border-info"
                        />
                     </div>
                  </div>
               </div>
            ))}
         </div>

         <button 
           onClick={addExercise}
           className="w-full mt-3 border border-dashed border-panel py-4 rounded-xl flex items-center justify-center gap-2 text-base font-medium text-muted hover:text-tx hover:border-muted transition-colors active:scale-[0.98] touch-manipulation"
         >
           <Plus size={20} /> Add Exercise
         </button>
      </div>

      {routineId && (
         <div className="pt-8">
            <button onClick={handleDelete} className="w-full bg-danger/10 text-danger border border-danger/20 py-3 rounded-xl font-medium text-sm active:scale-[0.98] transition-transform">
               Delete Plan
            </button>
         </div>
      )}

    </div>
  );
}
