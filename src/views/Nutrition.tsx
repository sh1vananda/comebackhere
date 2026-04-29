import { useState } from 'react';
import { useAppStore } from '../store';
import { Plus, Trash2, Edit2, Beef } from 'lucide-react';

export function Nutrition() {
  const { state, dispatch } = useAppStore();
  const todayStr = new Date().toDateString();
  const foods = state.foodLogs[todayStr] || [];
  
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(state.proteinTarget.toString());

  const totalProtein = foods.reduce((acc, item) => acc + item.protein, 0);
  const target = state.proteinTarget;
  const progress = Math.min((totalProtein / target) * 100, 100);

  const handleAddFood = () => {
    if (!name.trim() || !protein) return;
    
    dispatch({
      type: 'ADD_FOOD',
      payload: {
        date: todayStr,
        item: {
          id: crypto.randomUUID(),
          name: name.trim(),
          protein: parseFloat(protein),
        }
      }
    });

    setName('');
    setProtein('');
  };

  const handleRemoveFood = (id: string) => {
    dispatch({
      type: 'REMOVE_FOOD',
      payload: { date: todayStr, id }
    });
  };

  const saveTarget = () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val > 0) {
      dispatch({ type: 'SET_PROTEIN_TARGET', payload: val });
    }
    setIsEditingTarget(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-panel">
        <h1 className="text-4xl font-serif italic tracking-tight">Nutrition</h1>
        {isEditingTarget ? (
           <div className="flex items-center gap-3">
              <input 
                 type="number" 
                 value={targetInput} 
                 onChange={e => setTargetInput(e.target.value)} 
                 className="w-20 bg-surface border border-panel-dark rounded-xl px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent transition-colors"
                 autoFocus
              />
              <button onClick={saveTarget} className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent hover:text-tx">Save</button>
           </div>
        ) : (
           <button onClick={() => setIsEditingTarget(true)} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.2em] text-muted hover:text-tx transition-colors">
              Target: {target}g <Edit2 size={10} className="mb-0.5" />
           </button>
        )}
      </div>

      {/* Progress Card */}
      <div className="bg-accent text-bg rounded-[32px] p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
           <div className="flex justify-between items-end mb-4">
              <div>
                 <p className="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-1 font-bold">Protein</p>
                 <div className="flex items-baseline gap-1">
                    <h2 className="text-5xl font-serif italic">{totalProtein.toFixed(1).replace(/\.0$/, '')}</h2>
                    <span className="text-sm opacity-80 font-mono">/ {target}g</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-serif italic">{Math.max(0, target - totalProtein).toFixed(1).replace(/\.0$/, '')}g</p>
                 <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Remaining</p>
              </div>
           </div>

           <div className="w-full bg-bg/20 h-2 rounded-full overflow-hidden mt-6">
              <div className="bg-bg h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
           </div>
        </div>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-surface/10 rounded-full blur-3xl" />
      </div>

      {/* Input */}
      <div className="bg-surface rounded-3xl p-2 pl-4 flex gap-2 border border-panel shadow-sm">
         <input 
            type="text" 
            placeholder="Food (e.g. Chicken 200g)" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-tx placeholder:text-muted min-w-0 font-medium"
         />
         <div className="w-[1px] my-2 bg-panel" />
         <div className="relative w-24">
            <input 
               type="number" 
               placeholder="Pro" 
               value={protein}
               onChange={e => setProtein(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleAddFood()}
               className="w-full bg-transparent border-none outline-none text-tx font-mono pl-3 py-3 pr-6"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-mono">g</span>
         </div>
         <button onClick={handleAddFood} className="bg-accent text-bg p-3 rounded-2xl shrink-0 active:scale-95 transition-transform">
            <Plus size={20} />
         </button>
      </div>

      {/* Food List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2 items-start">
         {foods.length === 0 ? (
            <div className="text-center p-8 border border-panel border-dashed rounded-[24px]">
               <Beef className="mx-auto text-panel mb-3" size={32} />
               <p className="text-sm text-muted">No food logged yet today.</p>
            </div>
         ) : (
            foods.slice().reverse().map(item => (
               <div key={item.id} className="group flex items-center justify-between p-4 bg-surface2 rounded-[20px] border border-transparent hover:border-panel-dark transition-all">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-accent/50" />
                     <p className="font-medium text-tx">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-mono text-sm font-semibold">{item.protein}g</span>
                     <button onClick={() => handleRemoveFood(item.id)} className="text-dim hover:text-danger p-1 rounded-md transition-colors active:scale-95 opacity-50 group-hover:opacity-100">
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            ))
         )}
      </div>

    </div>
  );
}
