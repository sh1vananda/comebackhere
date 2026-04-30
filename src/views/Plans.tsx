import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Plus, Settings2, Calendar, Download, Upload, Code, LayoutTemplate } from 'lucide-react';

export function Plans({ onNavigate }: { onNavigate: (view: string, payload?: any) => void }) {
  const { state, dispatch } = useAppStore();
  const routines = state.routines;

  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonString, setJsonString] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleMode = () => {
     if (!isJsonMode) {
        const cleanRoutines = routines.map(r => ({
           ...r,
           exercises: r.exercises.map(ex => ({ ...ex, history: [] }))
        }));
        setJsonString(JSON.stringify(cleanRoutines, null, 2));
        setIsJsonMode(true);
     } else {
        try {
           const parsed = JSON.parse(jsonString);
           if (!Array.isArray(parsed)) throw new Error("Must be an array");
           
           // Restore histories
           const restoredRoutines = parsed.map((parsedR: any) => {
              const origR = routines.find(r => r.id === parsedR.id);
              return {
                 ...parsedR,
                 exercises: (parsedR.exercises || []).map((parsedEx: any) => {
                    const origEx = origR?.exercises.find(e => e.id === parsedEx.id);
                    return {
                       ...parsedEx,
                       history: origEx ? origEx.history : []
                    };
                 })
              };
           });

           dispatch({ type: 'SET_ROUTINES', payload: restoredRoutines });
           setIsJsonMode(false);
        } catch (e) {
           alert("Invalid JSON format. Please fix errors before switching to GUI.");
        }
     }
  };

  const handleExportAll = () => {
     let exportData = '';
     if (isJsonMode) {
        try {
           const parsed = JSON.parse(jsonString);
           if(Array.isArray(parsed)) {
              const clean = parsed.map(r => ({
                 ...r,
                 exercises: (r.exercises || []).map((ex:any) => ({ ...ex, history: [] }))
              }));
              exportData = JSON.stringify(clean, null, 2);
           } else {
              exportData = jsonString;
           }
        } catch(e) {
           exportData = jsonString;
        }
     } else {
        const cleanRoutines = routines.map(r => ({
           ...r,
           exercises: r.exercises.map(ex => ({ ...ex, history: [] }))
        }));
        exportData = JSON.stringify(cleanRoutines, null, 2);
     }

     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData);
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href", dataStr);
     downloadAnchorNode.setAttribute("download", "all_plans.json");
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
  };

  const handleImportArray = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (evt) => {
        try {
           const parsed = JSON.parse(evt.target?.result as string);
           if (!Array.isArray(parsed)) throw new Error("Expected an array of plans");
           
           const newRoutines = parsed.map((r: any) => ({
              ...r,
              id: crypto.randomUUID(), // Prevent ID collision
              exercises: (r.exercises || []).map((ex: any) => ({
                 ...ex,
                 id: crypto.randomUUID(),
                 history: []
              }))
           }));

           if (isJsonMode) {
              try {
                const currentArray = JSON.parse(jsonString);
                if (Array.isArray(currentArray)) {
                   setJsonString(JSON.stringify([...currentArray, ...newRoutines], null, 2));
                } else {
                   setJsonString(JSON.stringify(newRoutines, null, 2));
                }
              } catch(e) {
                setJsonString(JSON.stringify(newRoutines, null, 2));
              }
              alert(`Loaded ${parsed.length} plans into editor.`);
           } else {
              dispatch({ type: 'SET_ROUTINES', payload: [...routines, ...newRoutines] });
              alert(`Imported ${parsed.length} plans successfully!`);
           }
        } catch(err) {
           alert("Failed to import. Please ensure the file contains a JSON array of plans.");
        }
     };
     reader.readAsText(file);
     if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
     if (isJsonMode) {
        try {
           const parsed = JSON.parse(jsonString);
           if (!Array.isArray(parsed)) throw new Error("Must be an array");
           
           const restoredRoutines = parsed.map((parsedR: any) => {
              const origR = routines.find(r => r.id === parsedR.id);
              return {
                 ...parsedR,
                 exercises: (parsedR.exercises || []).map((parsedEx: any) => {
                    const origEx = origR?.exercises.find(e => e.id === parsedEx.id);
                    return {
                       ...parsedEx,
                       history: origEx ? origEx.history : []
                    };
                 })
              };
           });

           dispatch({ type: 'SET_ROUTINES', payload: restoredRoutines });
           alert("Saved successfully!");
        } catch (e) {
           alert("Invalid JSON format. Cannot save.");
        }
     }
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300 h-full pb-16">
      <div className="flex items-center justify-between pb-4 border-b border-panel">
        <h1 className="text-3xl sm:text-4xl font-serif italic tracking-tight">My Plans</h1>
        <div className="flex items-center gap-1.5 sm:gap-2">
           <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportArray} />
           <button onClick={() => fileInputRef.current?.click()} className="p-1.5 sm:p-2 text-muted hover:text-tx rounded-lg bg-surface2 border border-panel" title="Import Plans">
              <Upload size={16} />
           </button>
           <button onClick={handleExportAll} className="p-1.5 sm:p-2 text-muted hover:text-tx rounded-lg bg-surface2 border border-panel" title="Export All Plans">
              <Download size={16} />
           </button>
           <button onClick={toggleMode} className="p-1.5 sm:p-2 text-muted hover:text-tx rounded-lg bg-surface2 border border-panel sm:ml-2 sm:mr-2" title={isJsonMode ? "Switch to GUI" : "Switch to JSON"}>
              {isJsonMode ? <LayoutTemplate size={16} /> : <Code size={16} />}
           </button>
           
           {isJsonMode ? (
              <button onClick={handleSave} className="bg-accent text-bg px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform ml-1 sm:ml-0">
                Save
              </button>
           ) : (
              <button onClick={() => onNavigate('plan_editor')} className="bg-accent text-bg px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform ml-1 sm:ml-0">
                <Plus size={16} /> <span className="hidden sm:inline">New</span>
              </button>
           )}
        </div>
      </div>

      {isJsonMode ? (
         <div className="flex-1 flex flex-col min-h-[400px]">
            <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-2 block">Raw Routines Config (JSON Array)</label>
            <textarea
               value={jsonString}
               onChange={(e) => setJsonString(e.target.value)}
               className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[60vh]"
               spellCheck="false"
            />
            <p className="text-[10px] text-muted mt-2">Edit your global plans array directly. Add, remove, or modify objects.</p>
         </div>
      ) : (
      <div className="columns-1 md:columns-2 lg:columns-3 gap-3">
        {routines.map((r) => (
          <div key={r.id} className="bg-surface border border-panel rounded-2xl p-5 shadow-sm break-inside-avoid mb-3">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h2 className="font-serif italic text-2xl">{r.name}</h2>
                   <div className="text-xs text-muted font-mono mt-1">
                      {r.exercises.length} exercises · {r.exercises.reduce((a,e)=>a+e.sets,0)} total sets
                   </div>
                </div>
                <button 
                  onClick={() => onNavigate('plan_editor', { routineId: r.id })}
                  className="p-1.5 text-muted hover:text-tx hover:bg-panel rounded-md transition-colors"
                >
                   <Settings2 size={18} />
                </button>
             </div>
             
             {/* Schedule row */}
             <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} className="text-dim" />
                <div className="flex gap-1">
                   {days.map((d, i) => {
                      const isActive = r.schedule?.includes(i);
                      return (
                         <span key={i} className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-accent/10 text-accent' : 'bg-surface2 text-dim'}`}>
                            {d}
                         </span>
                      );
                   })}
                </div>
             </div>

             <div className="space-y-3 pt-3 border-t border-panel">
                 {r.exercises.map((ex, idx) => (
                    <div key={ex.id} className="flex flex-col px-1">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-tx flex items-center gap-2">
                            <span className="text-xs text-dim font-mono">{idx + 1}.</span> {ex.name}
                          </span>
                          <span className="text-xs text-muted font-mono border border-panel px-1.5 py-0.5 rounded-md bg-surface2">
                             {ex.sets}×{ex.reps}{ex.isTime ? 's' : ''}
                          </span>
                       </div>
                       {(ex.tempo || ex.notes || ex.restTime) && (
                          <div className="pl-6 mt-1 flex flex-col gap-0.5">
                             {ex.tempo && <span className="text-[10px] text-accent font-mono">Tempo: {ex.tempo}</span>}
                             {ex.restTime && <span className="text-[10px] text-info font-mono text-dim">Rest: {ex.restTime}s</span>}
                             {ex.notes && <span className="text-xs text-dim italic">{ex.notes}</span>}
                          </div>
                       )}
                    </div>
                 ))}
             </div>
          </div>
        ))}

        {routines.length === 0 && (
           <div className="text-center p-8 border border-panel border-dashed rounded-xl mt-4">
              <div className="text-muted mb-2">No plans defined</div>
              <button onClick={() => onNavigate('plan_editor')} className="text-accent underline text-sm">Create your first custom plan</button>
           </div>
        )}
      </div>
      )}

      <div className="h-6" />
    </div>
  );
}
