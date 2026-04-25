import React from 'react';
import { CheckSquare, CalendarDays, History as HistoryIcon, Utensils } from 'lucide-react';

type NavItemProps = {
  view: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (view: string) => void;
};

function NavItem({ view, label, icon, active, onClick }: NavItemProps) {
  return (
    <button 
      onClick={() => onClick(view)}
      className={`flex flex-col items-center justify-center flex-1 h-full transition-colors outline-none focus:outline-none ${active ? 'text-accent' : 'text-muted hover:text-tx'}`}
    >
       <div className={`flex flex-col items-center justify-center transition-all duration-300 ${active ? '-translate-y-0.5' : ''}`}>
          {icon}
          <span className={`text-[9px] uppercase tracking-[0.2em] font-bold mt-1.5 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
       </div>
    </button>
  );
}

export function Navigation({ currentView, onChangeView }: { currentView: string, onChangeView: (v: string) => void }) {
  if (currentView === 'session' || currentView === 'plan_editor') return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#F5F5F0]/95 backdrop-blur-md border-t border-panel z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[72px] items-stretch px-2">
        <NavItem 
          view="home" 
          label="Today" 
          icon={<CheckSquare size={20} />} 
          active={currentView === 'home'} 
          onClick={onChangeView} 
        />
        <NavItem 
          view="plans" 
          label="Plans" 
          icon={<CalendarDays size={20} />} 
          active={currentView === 'plans'} 
          onClick={onChangeView} 
        />
        <NavItem 
          view="nutrition" 
          label="Food" 
          icon={<Utensils size={20} />} 
          active={currentView === 'nutrition'} 
          onClick={onChangeView} 
        />
        <NavItem 
          view="history" 
          label="History" 
          icon={<HistoryIcon size={20} />} 
          active={currentView === 'history'} 
          onClick={onChangeView} 
        />
      </div>
    </div>
  );
}
