import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { ArrowLeft, Trash2, Plus, Download, Upload, Code, LayoutTemplate } from 'lucide-react';
import { Routine, ExerciseDefinition } from '../types';

export function PlanEditor({ routineId, onBack }: { routineId?: string, onBack: () => void }) {
  const { state, dispatch } = useAppStore();
  
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<number[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonString, setJsonString] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      tempo: '',
      notes: '',
      restTime: 90,
      history: []
    };
    setExercises([...exercises, newEx]);
  };

  const toggleMode = () => {
    if (!isJsonMode) {
      // Strip personal history when viewing JSON to keep it clean for config editing
      const cleanExercises = exercises.map(ex => ({ ...ex, history: [] }));
      setJsonString(JSON.stringify({ name, schedule, exercises: cleanExercises }, null, 2));
      setIsJsonMode(true);
    } else {
      try {
        const parsed = JSON.parse(jsonString);
        setName(parsed.name || 'Untitled Plan');
        setSchedule(parsed.schedule || []);
        
        // Merge history back so we don't wipe it out when switching back to GUI
        const mergedExercises = (parsed.exercises || []).map((parsedEx: any) => {
           const originalEx = exercises.find(e => e.id === parsedEx.id);
           return {
              ...parsedEx,
              history: originalEx ? originalEx.history : []
           };
        });
        setExercises(mergedExercises);
        setIsJsonMode(false);
      } catch (e) {
        alert("Invalid JSON format. Please fix errors before switching to GUI.");
      }
    }
  };

  const handleExport = () => {
    let cleanExercises = exercises;
    if (isJsonMode) {
       try {
          const parsed = JSON.parse(jsonString);
          cleanExercises = parsed.exercises || [];
       } catch (e) {}
    }
    // Scrub personal lifting history from the exported template
    cleanExercises = cleanExercises.map(ex => ({ ...ex, history: [] }));
    const exportData = JSON.stringify({ name, schedule, exercises: cleanExercises }, null, 2);
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${(name || 'plan').replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rawJson = evt.target?.result as string;
        const parsed = JSON.parse(rawJson);
        const importedExercises = (parsed.exercises || []).map((ex: any) => ({
           ...ex,
           id: crypto.randomUUID()
        }));
        
        setName(parsed.name || 'Imported Plan');
        setSchedule(parsed.schedule || []);
        setExercises(importedExercises);
        
        if (isJsonMode) {
           setJsonString(JSON.stringify({ name: parsed.name, schedule: parsed.schedule, exercises: importedExercises }, null, 2));
        }
      } catch (err) {
        alert("Failed to parse the imported file.");
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    let finalName = name;
    let finalSchedule = schedule;
    let finalExercises = exercises;

    if (isJsonMode) {
       try {
         const parsed = JSON.parse(jsonString);
         finalName = parsed.name || '';
         finalSchedule = parsed.schedule || [];
         
         // Preserve DB history when saving from JSON editor
         finalExercises = (parsed.exercises || []).map((parsedEx: any) => {
            const originalEx = exercises.find(e => e.id === parsedEx.id);
            return {
               ...parsedEx,
               history: originalEx ? originalEx.history : []
            };
         });
       } catch (e) {
         return alert("Invalid JSON format. Cannot save.");
       }
    }

    if (!finalName.trim()) return alert("Plan needs a name");
    if (finalExercises.some(e => !e.name.trim())) return alert("All exercises need a name");

    const payload: Routine = {
       id: routineId || crypto.randomUUID(),
       name: finalName.trim(),
       schedule: finalSchedule,
       exercises: finalExercises
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
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300 pb-16 h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panel pb-4">
        <div className="flex items-center gap-2">
           <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-tx">
             <ArrowLeft size={20} />
           </button>
           <h1 className="text-2xl font-serif italic tracking-tight">{routineId ? 'Edit Plan' : 'New Plan'}</h1>
        </div>
        <div className="flex items-center gap-2">
           <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
           <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted hover:text-tx rounded-lg bg-surface2 border border-panel" title="Import Plan">
              <Upload size={16} />
           </button>
           <button onClick={handleExport} className="p-2 text-muted hover:text-tx rounded-lg bg-surface2 border border-panel" title="Export Plan">
              <Download size={16} />
           </button>
           <button onClick={toggleMode} className="p-2 text-muted hover:text-tx rounded-lg bg-surface2 border border-panel ml-2" title={isJsonMode ? "Switch to GUI" : "Switch to JSON"}>
              {isJsonMode ? <LayoutTemplate size={16} /> : <Code size={16} />}
           </button>
           <button onClick={handleSave} className="text-accent font-bold text-sm uppercase tracking-widest disabled:opacity-50 ml-2" disabled={!isJsonMode && !name.trim()}>
             Save
           </button>
        </div>
      </div>

      {isJsonMode ? (
         <div className="flex-1 flex flex-col min-h-[400px]">
            <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-2 block">Raw Config (JSON)</label>
            <textarea
               value={jsonString}
               onChange={(e) => setJsonString(e.target.value)}
               className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent resize-none"
               spellCheck="false"
            />
            <p className="text-[10px] text-muted mt-2">Edit the JSON configuration directly. Changes apply when you save or toggle back to GUI.</p>
         </div>
      ) : (
         <>
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
                     <div className="pl-6 flex flex-col sm:flex-row gap-4 mt-2">
                        <div className="flex-[0.4] flex flex-col">
                           <label className="text-[10px] text-muted mb-1 font-mono uppercase">Rest (s)</label>
                           <input 
                              type="number" min="0" step="15"
                              value={ex.restTime || ''}
                              onChange={(e) => updateExercise(ex.id, 'restTime', parseInt(e.target.value) || 0)}
                              className="w-full bg-surface2 border border-panel rounded-lg py-2 px-3 text-sm font-mono focus:outline-none focus:border-info"
                           />
                        </div>
                        <div className="flex-[0.4] flex flex-col">
                           <label className="text-[10px] text-muted mb-1 font-mono uppercase">Tempo</label>
                           <input 
                              type="text"
                              placeholder="e.g. 1-1-2"
                              value={ex.tempo || ''}
                              onChange={(e) => updateExercise(ex.id, 'tempo', e.target.value)}
                              className="w-full bg-surface2 border border-panel rounded-lg py-2 px-3 text-sm font-mono focus:outline-none focus:border-info"
                           />
                        </div>
                        <div className="flex-1 flex flex-col">
                           <label className="text-[10px] text-muted mb-1 font-mono uppercase">Notes</label>
                           <input 
                              type="text"
                              placeholder="e.g. Rotate wide/narrow grips"
                              value={ex.notes || ''}
                              onChange={(e) => updateExercise(ex.id, 'notes', e.target.value)}
                              className="w-full bg-surface2 border border-panel rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-info"
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
         </>
      )}

      {routineId && !isJsonMode && (
         <div className="pt-8">
            <button onClick={handleDelete} className="w-full bg-danger/10 text-danger border border-danger/20 py-3 rounded-xl font-medium text-sm active:scale-[0.98] transition-transform">
               Delete Plan
            </button>
         </div>
      )}

    </div>
  );
}
