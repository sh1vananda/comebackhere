import { useAppStore } from '../store';
import { Play, ChevronRight, Flame, LogOut } from 'lucide-react';

export function Home({ onNavigate }: { onNavigate: (view: string, payload?: any) => void }) {
  const { state, dispatch } = useAppStore();
  const routines = state.routines;
  
  const today = new Date().getDay(); // 0 is Sunday
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Workouts scheduled for today
  const todaysPlans = routines.filter((r) => r.schedule && r.schedule.includes(today));
  // Other plans
  const otherPlans = routines.filter((r) => !r.schedule || !r.schedule.includes(today));

  const startRoutine = (routine: any) => {
    // Scaffold new session
    const activeSession = {
      id: crypto.randomUUID(),
      routineId: routine.id,
      routineName: routine.name,
      startTime: Date.now(),
      hasStarted: false,
      exercises: routine.exercises.map((ex: any) => ({
        ...ex,
        loggedSets: Array(ex.sets).fill(null),
      })),
    };
    dispatch({ type: 'START_SESSION', payload: activeSession });
    onNavigate('session');
  };

  const activeDays = new Set(
     state.routines.map(r => r.schedule || []).flat()
  );

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold px-1 mb-1.5">Today</div>
          <h1 className="text-4xl font-serif italic tracking-tight mb-1">
            {new Date().toLocaleDateString('en', { weekday: 'long' })}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-serif italic text-warn flex items-center justify-end gap-1.5 mb-0.5">
             {state.streak} <Flame size={24} className="text-warn mb-1" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">Streak</div>
        </div>
      </div>

      {/* Week Dots */}
      <div className="bg-surface border border-panel rounded-2xl p-5 shadow-sm mt-2">
        <div className="flex justify-between">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 flex-1">
              <div className={`text-[10px] uppercase tracking-widest font-bold ${i === today ? 'text-accent' : 'text-dim'}`}>
                {d}
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  activeDays.has(i) ? 'bg-accent' : 'bg-panel-dark'
                } ${i === today ? 'ring-4 ring-accent/20 ring-offset-2 ring-offset-surface scale-125' : ''}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Active Session Alert */}
      {state.activeSession && (
          <div className="bg-[#798686]/10 border border-[#798686]/20 rounded-2xl p-5 flex justify-between items-center shadow-sm">
             <div>
               <div className="text-[10px] uppercase tracking-[0.2em] text-[#798686] font-bold mb-1.5">In Progress</div>
               <div className="text-lg font-serif italic text-tx">{state.activeSession.routineName}</div>
               <div className="text-xs text-muted mt-1">{state.activeSession.hasStarted === false ? 'Preview mode' : 'Session running'}</div>
             </div>
             <button 
                onClick={() => onNavigate('session')}
                className="bg-[#798686] text-bg px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
             >
                Resume <Play size={14} />
             </button>
          </div>
      )}

      {/* Today's Plans */}
      <div className="bg-surface rounded-[32px] p-6 shadow-sm border border-panel flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
           <h3 className="font-serif italic text-2xl">Today's Schedule</h3>
           <span className="text-[10px] text-muted uppercase tracking-widest font-bold">{todaysPlans.length} Plans</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todaysPlans.length === 0 ? (
             <div className="text-sm text-dim p-4 text-center">
              Rest day. You have no workouts scheduled.
            </div>
          ) : (
            todaysPlans.map((r) => (
              <button
                key={r.id}
                onClick={() => startRoutine(r)}
                className="group flex items-center p-4 bg-surface2 rounded-2xl border border-transparent hover:border-panel-dark transition-all text-left"
              >
                <div className="w-6 h-6 rounded-lg mr-4 flex items-center justify-center bg-accent text-bg shadow-sm">
                   <Play size={12} fill="currentColor" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted mt-0.5 font-mono">{r.exercises.length} exercises · {r.exercises.reduce((acc, ex) => acc + ex.sets, 0)} sets</p>
                </div>
                <div className="px-3 py-1 bg-panel rounded-full text-[10px] font-bold uppercase tracking-tighter text-dim opacity-70">Plan</div>
              </button>
            ))
          )}
        </div>
        
        {/* Input Entry Field */}
        <div className="mt-6 pt-6 border-t border-panel">
          <div className="flex gap-2 bg-surface2 p-2 rounded-2xl border border-panel-dark">
            <input type="text" placeholder="Enter custom plan..." className="bg-transparent flex-1 px-3 outline-none text-sm text-tx placeholder:text-muted" onKeyDown={(e) => {
               if(e.key === 'Enter') onNavigate('plan_editor'); // Quick redirect to plan builder
            }} />
            <button onClick={() => onNavigate('plan_editor')} className="w-10 h-10 bg-accent text-bg rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Other Plans */}
      <div>
        <div className="flex items-center justify-between mb-5 px-2">
           <h3 className="font-serif italic text-3xl tracking-tight">Other Plans</h3>
           <button onClick={() => onNavigate('plans')} className="text-[10px] uppercase tracking-[0.2em] text-[#8D8D86] font-bold hover:text-tx transition-colors">Manage</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
           {otherPlans.length === 0 && todaysPlans.length === 0 && (
             <button onClick={() => onNavigate('plan_editor')} className="text-sm border border-panel-dark rounded-2xl border-dashed p-6 text-center text-muted hover:text-tx hover:border-muted flex flex-col items-center gap-2 transition-colors">
               <span className="text-2xl">+</span>
               Create your first plan
             </button>
           )}
           {otherPlans.map((r) => (
             <button
                key={r.id}
                onClick={() => startRoutine(r)}
                className="group flex items-center p-4 bg-surface rounded-2xl border border-panel shadow-sm hover:border-panel-dark transition-all text-left"
              >
                <div className="flex-1">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {r.exercises.length} exercises
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>
           ))}
        </div>
      </div>

      {/* Last Session */}
      {state.history.length > 0 && (
        <div className="mb-8 bg-accent rounded-[32px] p-6 text-bg relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-4 font-bold">Insights</p>
            <h4 className="text-4xl font-serif italic mb-4">Last Session</h4>
            <div className="mb-2">
              <div className="font-medium text-lg">{state.history[0].routineName}</div>
              <div className="text-sm opacity-90 font-mono mt-1">
                {new Date(state.history[0].endTime).toLocaleDateString()} · {state.history[0].durationMin} min · {state.history[0].totalVolume.toLocaleString()} kg
              </div>
            </div>
            {state.history[0].prs > 0 && (
              <span className="inline-block mt-2 px-3 py-1 bg-surface/20 text-bg rounded-lg text-xs font-bold uppercase tracking-widest">
                {state.history[0].prs} PR{state.history[0].prs > 1 ? 's' : ''} Record
              </span>
            )}
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-surface/10 rounded-full blur-3xl"></div>
        </div>
      )}
      
      <div className="pt-6 pb-2 mt-4 border-t border-panel/50 flex justify-center">
        <button 
          onClick={() => {
            import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut());
          }}
          className="text-xs text-muted hover:text-tx transition-colors font-medium flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface2"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div className="h-4" />
    </div>
  );
}
