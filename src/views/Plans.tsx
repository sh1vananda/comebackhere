import { useAppStore } from '../store';
import { Plus, GripVertical, Settings2, Calendar } from 'lucide-react';

export function Plans({ onNavigate }: { onNavigate: (view: string, payload?: any) => void }) {
  const { state } = useAppStore();
  const routines = state.routines;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-panel">
        <h1 className="text-4xl font-serif italic tracking-tight">My Plans</h1>
        <button
          onClick={() => onNavigate('plan_editor')}
          className="bg-accent text-bg px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {routines.map((r) => (
          <div key={r.id} className="bg-surface border border-panel rounded-2xl p-5 shadow-sm">
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

             <div className="space-y-2 pt-3 border-t border-panel">
                 {r.exercises.map((ex, idx) => (
                    <div key={ex.id} className="flex justify-between items-center px-1">
                       <span className="text-sm font-medium text-tx flex items-center gap-2">
                         <span className="text-xs text-dim font-mono">{idx + 1}.</span> {ex.name}
                       </span>
                       <span className="text-xs text-muted font-mono border border-panel px-1.5 py-0.5 rounded-md bg-surface2">
                          {ex.sets}×{ex.reps}{ex.isTime ? 's' : ''}
                       </span>
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

      <div className="h-6" />
    </div>
  );
}
