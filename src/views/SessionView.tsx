import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Check, Info, X, Play, Settings, Plus, Minus, ArrowLeft } from 'lucide-react';

export function SessionView({ onEnd }: { onEnd: () => void }) {
  const { state, dispatch } = useAppStore();
  const session = state.activeSession;

  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  
  const [restSeconds, setRestSeconds] = useState(0);
  const [restMax, setRestMax] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [prs, setPrs] = useState<string[]>([]);
  
  // Timer effect for rest
  useEffect(() => {
    let tick: any;
    if (isResting && restSeconds > 0) {
      tick = setInterval(() => setRestSeconds(prev => prev - 1), 1000);
    } else if (restSeconds <= 0 && isResting) {
      setIsResting(false);
      // Play a sound or vibrate if possible
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(tick);
  }, [isResting, restSeconds]);

  if (!session) return null;
  const sessionStarted = session.hasStarted ?? true;

  const activeEx = session.exercises[exIdx];
  const doneSets = session.exercises.reduce((a,e) => a + e.loggedSets.filter(Boolean).length, 0);
  const totalSets = session.exercises.reduce((a,e) => a + e.sets, 0);

  const startSessionTracking = () => {
    dispatch({
      type: 'UPDATE_SESSION',
      payload: {
        ...session,
        hasStarted: true,
        startTime: Date.now(),
      },
    });
  };

  const handleEndSessionEarly = () => {
    if (doneSets === 0) {
      dispatch({ type: 'END_SESSION' });
      onEnd();
      return;
    }

    if(confirm("End session right now? Unlogged sets will be ignored.")) {
      finishSession();
    }
  };

  const finishSession = () => {
     if (doneSets === 0) {
        dispatch({ type: 'END_SESSION' });
        onEnd();
        return;
     }

     const elapsed = Math.floor((Date.now() - session.startTime) / 60000);
     let vol = 0;
     session.exercises.forEach(ex => {
        ex.loggedSets.forEach(s => {
           if (s) vol += s.kg * s.reps;
        });
     });

     dispatch({ type: 'FINISH_SESSION', payload: {
        ...session,
        endTime: Date.now(),
        durationMin: elapsed,
        totalVolume: vol,
        prs: prs.length,
        feel: 0 // Prompt in a separate finish screen or default 0
     }});
     onEnd(); // go home or to history
  };

  const adjustWeight = (delta: number) => {
    const freshSession = { ...session };
    const ex = freshSession.exercises[exIdx];
    ex.targetKg = Math.max(0, ex.targetKg + delta);
    dispatch({ type: 'UPDATE_SESSION', payload: freshSession });
  };

  const logSet = () => {
    const freshSession = { ...session };
    const ex = freshSession.exercises[exIdx];
    
    // Log it
    ex.loggedSets[setIdx] = { kg: ex.targetKg, reps: ex.reps };

    // Check PR
    const maxPrev = ex.history?.length ? Math.max(...ex.history.map(h => h.kg)) : 0;
    if (ex.targetKg > maxPrev && !prs.includes(ex.id)) {
       setPrs([...prs, ex.id]);
    }

    dispatch({ type: 'UPDATE_SESSION', payload: freshSession });

    const nextSetIdx = ex.loggedSets.findIndex(s => s === null);
    if (nextSetIdx === -1) {
       // All sets done for this exercise
       const nextExIdx = exIdx + 1;
       if (nextExIdx >= session.exercises.length) {
         finishSession();
         return;
       }
       setExIdx(nextExIdx);
       setSetIdx(0);
       startRest(120); // 2 min between exercises
    } else {
       setSetIdx(nextSetIdx);
       startRest(90); // 90s between sets
    }
  };

  const startRest = (secs: number) => {
    setRestSeconds(secs);
    setRestMax(secs);
    setIsResting(true);
  };

  const fmtTimer = (s: number) => {
    const m = Math.floor(s/60);
    const sec = s%60;
    return `${m}:${sec < 10 ? '0':''}${sec}`;
  };

  const pct = totalSets ? doneSets / totalSets : 0;
  const isPR = activeEx?.history?.length > 0 && activeEx.targetKg > Math.max(...activeEx.history.map(h=>h.kg));

  if (!sessionStarted) {
    return (
      <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-2 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Preview</span>
            <h2 className="text-3xl font-serif italic">{session.routineName}</h2>
          </div>
          <button onClick={handleEndSessionEarly} className="text-[10px] text-danger border border-danger/30 bg-danger/10 px-3 py-1.5 rounded-lg uppercase tracking-widest font-bold">Close</button>
        </div>

        <div className="bg-surface border border-panel rounded-[28px] p-6 shadow-sm">
          <div className="text-xs text-muted font-mono mb-4">
            {session.exercises.length} exercises · {totalSets} total sets
          </div>
          <button
            onClick={startSessionTracking}
            className="w-full bg-accent text-bg font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(90,90,64,0.15)]"
          >
            Start Session
          </button>
        </div>

        <div className="flex flex-col bg-surface border border-panel rounded-3xl p-4 shadow-sm">
          {session.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-4 py-3 border-b border-panel last:border-none">
              <div className="w-6 h-6 rounded-[8px] border-[1.5px] border-panel text-transparent flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-tx">{ex.name}</div>
                <div className="text-[10px] font-mono text-muted mt-1">{ex.sets}×{ex.reps}{ex.isTime ? 's' : ''} · {ex.targetKg}kg</div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-dim">#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isResting) {
     const nextEx = session.exercises[exIdx];
     const r = 70;
     const circ = 2 * Math.PI * r;
     const offset = circ * (1 - (restSeconds / restMax));

     return (
       <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
         <div className="absolute top-6 left-6 text-sm text-dim">Rest Period</div>
         
         <div className="relative w-48 h-48 mb-8" onClick={() => {}}>
           <svg viewBox="0 0 180 180" className="-rotate-90 w-full h-full">
             <circle cx="90" cy="90" r={r} fill="none" stroke="currentColor" className="text-panel" strokeWidth="6" />
             <circle 
               cx="90" cy="90" r={r} fill="none" 
               stroke="currentColor" strokeWidth="6" strokeLinecap="round"
               className={`transition-all duration-1000 ease-linear ${restSeconds <= 10 ? 'text-danger' : 'text-accent'}`}
               strokeDasharray={circ}
               strokeDashoffset={offset}
             />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center">
             <span className={`text-5xl font-mono font-medium ${restSeconds <= 10 ? 'text-danger' : 'text-tx'}`}>
               {fmtTimer(restSeconds)}
             </span>
           </div>
         </div>

         <div className="text-dim text-sm uppercase tracking-wider font-semibold mb-1">Up Next</div>
         <div className="text-xl font-medium mb-1">{nextEx.name}</div>
         <div className="text-muted font-mono">{nextEx.sets}×{nextEx.reps}{nextEx.isTime ? 's' : ''} · {nextEx.targetKg}kg</div>

         <div className="flex justify-between gap-4 mt-8 w-full">
            <button onClick={() => setRestSeconds(s => s + 30)} className="flex-1 bg-surface2 border border-panel py-4 rounded-2xl text-tx font-medium text-lg active:scale-95 transition-transform">
               +30s
            </button>
            <button onClick={() => setIsResting(false)} className="flex-1 bg-accent text-bg py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform shadow-[0_0_20px_rgba(212,255,92,0.15)]">
               Skip
            </button>
         </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-2 flex-1">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">{session.routineName}</span>
            <div className="flex gap-2">
               <span className="bg-surface border border-panel px-2 py-1 rounded-md text-[10px] font-mono font-bold text-dim">{doneSets}/{totalSets} sets</span>
               <span className="bg-surface border border-panel px-2 py-1 rounded-md text-[10px] font-mono font-bold text-dim">{Math.floor((Date.now() - session.startTime) / 60000)}m elap.</span>
            </div>
         </div>
         <button onClick={handleEndSessionEarly} className="text-[10px] text-danger border border-danger/30 bg-danger/10 px-3 py-1.5 rounded-lg uppercase tracking-widest font-bold">End</button>
      </div>

      {/* Progress */}
      <div className="h-1 bg-surface2 rounded-full overflow-hidden mb-2">
         <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct * 100}%` }} />
      </div>

      {/* Active Exercise Card */}
      <div className="bg-surface border border-panel rounded-[32px] p-6 shadow-sm mt-3 relative overflow-hidden">
         {isPR && <div className="absolute top-0 right-0 bg-accent text-bg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl shadow-sm">PR Pace</div>}
         
         <h2 className="text-3xl font-serif italic mb-1 pr-16">{activeEx.name}</h2>
         <div className="text-muted font-mono text-xs">
            {activeEx.sets} sets × {activeEx.reps} {activeEx.isTime ? 'sec' : 'reps'}
            {activeEx.history?.length > 0 && <span className="ml-2 pl-2 border-l border-panel text-dim">last: ${activeEx.history[activeEx.history.length-1].kg}kg </span>}
         </div>

         <div className="flex items-center justify-center gap-6 mt-8 mb-6">
            <button onClick={() => adjustWeight(-2.5)} className="w-14 h-14 rounded-full bg-surface2 border border-panel flex items-center justify-center active:bg-panel transition-colors active:scale-95 touch-manipulation">
               <Minus size={24} className="text-dim" />
            </button>
            <div className="text-5xl font-mono tracking-tighter flex items-baseline w-24 justify-center">
               {activeEx.targetKg} <span className="text-lg text-muted ml-1 tracking-normal">kg</span>
            </div>
            <button onClick={() => adjustWeight(2.5)} className="w-14 h-14 rounded-full bg-surface2 border border-panel flex items-center justify-center active:bg-panel transition-colors active:scale-95 touch-manipulation">
               <Plus size={24} className="text-dim" />
            </button>
         </div>

         {/* Sets Row */}
         <div className="flex gap-2">
            {activeEx.loggedSets.map((s, i) => {
               const active = i === setIdx;
               const done = s !== null;
               
               let mainCls = "bg-surface2 border-panel text-dim";
               if (active) mainCls = "bg-panel border-panel-dark text-tx ring-1 ring-panel scale-[1.02] transform transition-transform shadow-sm";
               if (done) mainCls   = "bg-accent/10 border-accent/30 text-accent";

               return (
                  <button 
                     key={i} 
                     onClick={() => !done && setSetIdx(i)}
                     className={`flex-1 flex flex-col items-center py-3 rounded-2xl border ${mainCls} transition-all`}
                  >
                     <span className="font-mono text-xl font-bold leading-none mb-1">{done ? '✓' : (active ? activeEx.targetKg : '-')}</span>
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">set {i+1}</span>
                  </button>
               )
            })}
         </div>

         <button 
            onClick={logSet}
            className="w-full mt-8 bg-accent text-bg font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(90,90,64,0.15)]"
         >
            Log Set {setIdx + 1}
         </button>
      </div>

      {/* Up Next List */}
      <div className="mt-6">
         <h3 className="font-serif italic text-xl mb-4 px-2">Session Plan</h3>
         <div className="flex flex-col bg-surface border border-panel rounded-3xl p-4 shadow-sm">
            {session.exercises.map((ex, i) => {
               const allDone = ex.loggedSets.every(s => s !== null);
               const isActive = i === exIdx;
               
               return (
                  <div key={ex.id} className={`flex items-center gap-4 py-3 border-b border-panel last:border-none ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                     <div className={`w-6 h-6 rounded-[8px] border-[1.5px] flex items-center justify-center ${allDone ? 'bg-accent border-accent text-bg' : 'border-panel text-transparent'}`}>
                        <Check size={12} strokeWidth={3} />
                     </div>
                     <div className="flex-1">
                        <div className={`font-medium ${isActive ? 'text-tx' : 'text-dim'}`}>{ex.name}</div>
                        <div className="text-[10px] font-mono text-muted mt-1">{ex.sets}×{ex.reps}{ex.isTime ? 's' : ''} · {ex.targetKg}kg</div>
                     </div>
                     {isActive && <span className="bg-panel text-dim text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">Current</span>}
                  </div>
               )
            })}
         </div>
      </div>
      
    </div>
  );
}
