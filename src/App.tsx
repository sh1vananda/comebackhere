import { useState, useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { Home } from './views/Home';
import { Plans } from './views/Plans';
import { PlanEditor } from './views/PlanEditor';
import { SessionView } from './views/SessionView';
import { History } from './views/History';
import { Nutrition } from './views/Nutrition';
import { Navigation } from './components/Navigation';
import { Auth } from './views/Auth';
import { supabase } from './lib/supabase';
import { DEFAULT_ROUTINES } from './lib/defaults';

export default function App() {
  const { state, dispatch } = useAppStore();
  const [currentView, setCurrentView] = useState('home');
  const [navPayload, setNavPayload] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const loadingUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        dispatch({ type: 'SET_USER', payload: session.user });
        loadSupabaseData(session.user.id);
      } else {
        dispatch({ type: 'LOGOUT' });
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dispatch({ type: 'SET_USER', payload: session.user });
        loadSupabaseData(session.user.id);
      } else {
        loadingUserIdRef.current = null;
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSupabaseData = async (userId: string, retryCount = 0) => {
    if (loadingUserIdRef.current === userId && retryCount === 0) return;
    loadingUserIdRef.current = userId;

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('app_state')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // Other database error (e.g. database restarting, offline, rate limited, connection issue)
        console.warn(`Supabase load failed (attempt ${retryCount + 1}):`, error.message);
        if (retryCount < 5) {
          setTimeout(() => {
            loadSupabaseData(userId, retryCount + 1);
          }, 3000);
        } else {
          // Fall back to offline mode so we load local storage but NEVER overwrite the DB!
          console.error("Supabase could not be reached after 5 attempts. Switching to offline mode.");
          const saved = localStorage.getItem('comebackhere_state');
          if (saved) {
            try {
              const { user, ...cleanLocalData } = JSON.parse(saved);
              dispatch({ type: 'LOAD_DATA_OFFLINE', payload: cleanLocalData });
            } catch(e) {
              dispatch({ type: 'LOAD_DATA_OFFLINE', payload: {} });
            }
          } else {
            dispatch({ type: 'LOAD_DATA_OFFLINE', payload: {} });
          }
        }
        return;
      }

      // No remote data exists yet - this is a brand new user!
      if (!data || !data.app_state || Object.keys(data.app_state).length === 0) {
        dispatch({ 
          type: 'LOAD_DATA', 
          payload: {
            routines: DEFAULT_ROUTINES,
            history: [],
            foodLogs: {},
            streak: 0,
            bestStreak: 0,
            lastWorkoutDate: null,
            proteinTarget: 150,
          } 
        });
        return;
      }

      const { user, ...cleanRemoteData } = data.app_state;
      dispatch({ type: 'LOAD_DATA', payload: cleanRemoteData });
    } catch (err) {
      console.error("Unexpected error in loadSupabaseData:", err);
      if (retryCount < 5) {
        setTimeout(() => {
          loadSupabaseData(userId, retryCount + 1);
        }, 3000);
      } else {
        const saved = localStorage.getItem('comebackhere_state');
        if (saved) {
          try {
            const { user, ...cleanLocalData } = JSON.parse(saved);
            dispatch({ type: 'LOAD_DATA_OFFLINE', payload: cleanLocalData });
          } catch(e) {
            dispatch({ type: 'LOAD_DATA_OFFLINE', payload: {} });
          }
        } else {
          dispatch({ type: 'LOAD_DATA_OFFLINE', payload: {} });
        }
      }
    }
  };

  const navigate = (view: string, payload?: any) => {
    if (!document.startViewTransition) {
      setCurrentView(view);
      setNavPayload(payload);
      window.scrollTo(0, 0);
      return;
    }

    document.startViewTransition(() => {
      setCurrentView(view);
      setNavPayload(payload);
      window.scrollTo(0, 0);
    });
  };

  let renderedView = currentView;
  if (state.activeSession && currentView !== 'session') {
     // Optional: force user into session, or let them navigate away but keep the banner.
  }

  if (authLoading) {
    return <div className="w-full h-[100dvh] bg-bg flex items-center justify-center text-dim font-mono text-sm">Loading app data...</div>;
  }

  if (!state.user) {
    return (
      <div className="w-full h-[100dvh] relative flex flex-col bg-bg overflow-hidden">
        <Auth />
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] relative flex flex-col bg-bg overflow-hidden">
      
      {/* App content area */}
      <div className="flex-1 w-full overflow-y-auto overscroll-y-contain pb-[env(safe-area-inset-bottom)]">
         <div className="px-6 pt-8 pb-32 min-h-full flex flex-col w-full max-w-6xl mx-auto">
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
