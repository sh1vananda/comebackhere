import React, { createContext, useContext, useEffect, useState } from "react";
import { CompletedSession, Routine, Session, FoodItem } from "./types";
import { DEFAULT_ROUTINES } from "./lib/defaults";

type AppState = {
  routines: Routine[];
  history: CompletedSession[];
  activeSession: Session | null;
  streak: number;
  bestStreak: number;
  lastWorkoutDate: string | null;
  isFirstLoad: boolean;
  foodLogs: Record<string, FoodItem[]>;
  proteinTarget: number;
};

type StoreContextType = {
  state: AppState;
  dispatch: (action: any) => void;
};

export const StoreContext = createContext<StoreContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "picklejuice_state";

const initialState: AppState = {
  routines: DEFAULT_ROUTINES,
  history: [],
  activeSession: null,
  streak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,
  isFirstLoad: true,
  foodLogs: {},
  proteinTarget: 150,
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved)
      return { ...initialState, ...JSON.parse(saved), isFirstLoad: false };
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return { ...initialState, isFirstLoad: false };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (!state.isFirstLoad) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const dispatch = (action: any) => {
    setState((prev) => {
      switch (action.type) {
        case "ADD_ROUTINE":
          return { ...prev, routines: [...prev.routines, action.payload] };
        case "UPDATE_ROUTINE":
          return {
            ...prev,
            routines: prev.routines.map((r) =>
              r.id === action.payload.id ? action.payload : r,
            ),
          };
        case "DELETE_ROUTINE":
          return {
            ...prev,
            routines: prev.routines.filter((r) => r.id !== action.payload),
          };
        case "ADD_FOOD": {
          const { date, item } = action.payload;
          return {
            ...prev,
            foodLogs: {
              ...prev.foodLogs,
              [date]: [...(prev.foodLogs[date] || []), item],
            },
          };
        }
        case "REMOVE_FOOD": {
          const { date, id } = action.payload;
          return {
            ...prev,
            foodLogs: {
              ...prev.foodLogs,
              [date]: prev.foodLogs[date].filter((f) => f.id !== id),
            },
          };
        }
        case "SET_PROTEIN_TARGET":
          return { ...prev, proteinTarget: action.payload };
        case "START_SESSION":
          return { ...prev, activeSession: action.payload };
        case "UPDATE_SESSION":
          return { ...prev, activeSession: action.payload };
        case "END_SESSION":
          return { ...prev, activeSession: null };
        case "FINISH_SESSION":
          // Update streak
          const now = new Date();
          const todayStr = now.toDateString();
          let newStreak = prev.streak;
          let newBest = prev.bestStreak;

          if (prev.lastWorkoutDate !== todayStr) {
            // Check if last workout was yesterday
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            if (prev.lastWorkoutDate === yesterday.toDateString()) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
            if (newStreak > newBest) newBest = newStreak;
          }

          // Update histories inside routines to reflect new weights/reps
          const newRoutines = prev.routines.map((r) => {
            // Assuming session exercises map well based on ID or Name. Since we edit plans directly, exercises have IDs.
            const updatedExercises = r.exercises.map((ex) => {
              const sessionEx = action.payload.exercises.find(
                (e: any) => e.id === ex.id,
              );
              if (
                sessionEx &&
                sessionEx.loggedSets.some((s: any) => s !== null)
              ) {
                // find the best set
                const validSets = sessionEx.loggedSets.filter(
                  (s: any) => s !== null,
                );
                const bestSet = validSets.reduce(
                  (max: any, s: any) => (s.kg > max.kg ? s : max),
                  validSets[0],
                );
                const newHistoryEntry = {
                  kg: bestSet.kg,
                  reps: bestSet.reps,
                  date: action.payload.endTime,
                };
                return {
                  ...ex,
                  targetKg: bestSet.kg, // Auto update target kg
                  history: [...(ex.history || []), newHistoryEntry].slice(-5), // keep last 5
                };
              }
              return ex;
            });
            return { ...r, exercises: updatedExercises };
          });

          return {
            ...prev,
            activeSession: null,
            history: [action.payload, ...prev.history],
            streak: newStreak,
            bestStreak: newBest,
            lastWorkoutDate: todayStr,
            routines: newRoutines,
          };
        default:
          return prev;
      }
    });
  };

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(StoreContext);
  if (!context)
    throw new Error("useAppStore must be used within a StoreProvider");
  return context;
}
