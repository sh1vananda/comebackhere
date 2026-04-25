import { useAppStore } from '../store';
import { Dumbbell, Calendar, Trash2 } from 'lucide-react';

export function History({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { state, dispatch } = useAppStore();
  const history = state.history;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-panel">
        <h1 className="text-4xl font-serif italic tracking-tight">History</h1>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        {history.length === 0 ? (
           <div className="text-center p-8 border border-panel border-dashed rounded-2xl">
              <Dumbbell className="mx-auto text-panel mb-2" size={32} />
              <div className="text-muted text-sm">No recorded workouts yet.</div>
           </div>
        ) : (
           history.map((s, i) => (
             <div key={s.id || i} className="bg-surface border border-panel rounded-[24px] p-5 shadow-sm">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-serif italic text-2xl mb-1">{s.routineName}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted font-mono">
                         <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(s.endTime).toLocaleDateString()}</span>
                         <span>·</span>
                         <span>{s.durationMin} min</span>
                      </div>
                   </div>
                   {s.prs > 0 && <span className="text-[10px] uppercase font-bold tracking-widest bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-full">+{s.prs} PR</span>}
                </div>

                <div className="mt-4 pt-4 border-t border-panel flex items-end justify-between gap-4">
                  <div className="flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-dim uppercase tracking-wider font-semibold">Volume</span>
                      <span className="font-mono text-tx">{s.totalVolume.toLocaleString()} <span className="text-xs text-muted">kg</span></span>
                   </div>
                   <div className="flex flex-col border-l border-panel pl-4">
                      <span className="text-[10px] text-dim uppercase tracking-wider font-semibold">Sets</span>
                      <span className="font-mono text-tx">{s.exercises.reduce((a,e)=>a+e.loggedSets.filter(Boolean).length,0)} <span className="text-xs text-muted">done</span></span>
                   </div>
                  </div>

                <button
                  type="button"
                  aria-label="Delete history entry"
                  onClick={() =>
                    dispatch({
                      type: 'DELETE_HISTORY_SESSION',
                      payload: { id: s.id, endTime: s.endTime, routineId: s.routineId },
                    })
                  }
                  className="h-8 w-8 rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}
