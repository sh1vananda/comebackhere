import { useState } from 'react';
import { useAppStore } from './store';
import { Home } from './views/Home';
import { Plans } from './views/Plans';
import { PlanEditor } from './views/PlanEditor';
import { SessionView } from './views/SessionView';
import { History } from './views/History';
import { Nutrition } from './views/Nutrition';
import { Navigation } from './components/Navigation';

export default function App() {
  const { state } = useAppStore();
  const [currentView, setCurrentView] = useState('home');
  const [navPayload, setNavPayload] = useState<any>(null);

  const navigate = (view: string, payload?: any) => {
    setCurrentView(view);
    setNavPayload(payload);
    window.scrollTo(0, 0);
  };

  // Ensure active session goes to session view if open
  let renderedView = currentView;
  if (state.activeSession && currentView !== 'session') {
     // Optional: force user into session, or let them navigate away but keep the banner.
     // In this design, we allow navigating away, and the banner brings them back.
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto h-[100dvh] relative flex flex-col bg-bg overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] sm:border-x sm:border-panel">
      
      {/* App content area */}
      <div className="flex-1 w-full overflow-y-auto overscroll-y-contain pb-[env(safe-area-inset-bottom)]">
         <div className="px-6 pt-8 pb-32 min-h-full flex flex-col">
          {renderedView === 'home' && <Home onNavigate={navigate} />}
          {renderedView === 'plans' && <Plans onNavigate={navigate} />}
          {renderedView === 'plan_editor' && <PlanEditor routineId={navPayload?.routineId} onBack={() => navigate('plans')} />}
          {renderedView === 'nutrition' && <Nutrition />}
          {renderedView === 'history' && <History onNavigate={navigate} />}
          {renderedView === 'session' && <SessionView onEnd={() => navigate('home')} />}
         </div>
      </div>

      <Navigation currentView={currentView} onChangeView={navigate} />
    </div>
  );
}

