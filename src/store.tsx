import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { CompletedSession, Routine, Session, FoodItem } from "./types";
import { DEFAULT_ROUTINES } from "./lib/defaults";
import { supabase } from "./lib/supabase";

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
  user: any | null;
  isLoadingData: boolean;
};

type StoreContextType = {
  state: AppState;
  dispatch: (action: any) => void;
};

export const StoreContext = createContext<StoreContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "comebackhere_state";

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
  user: null,
  isLoadingData: false,
};

function getDayKey(timestamp: number) {
  return new Date(timestamp).toDateString();
}

function computeStreakFromHistory(history: CompletedSession[]) {
  if (history.length === 0) {
    return { streak: 0, bestStreak: 0, lastWorkoutDate: null as string | null };
  }

  const uniqueDays = Array.from(
    new Set(history.map((session) => getDayKey(session.endTime))),
  ).map((day) => new Date(day));

  uniqueDays.sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = uniqueDays[i - 1];
    const curr = uniqueDays[i];
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  let bestStreak = 1;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = uniqueDays[i - 1];
    const curr = uniqueDays[i];
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays === 1) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 1;
    }
  }

  return {
    streak,
    bestStreak,
    lastWorkoutDate: uniqueDays[0].toDateString(),
  };
}

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
    if (!state.isFirstLoad && state.user && !state.isLoadingData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const { user, isLoadingData, isFirstLoad, ...appStateToSave } = state;
      supabase.from("user_data").upsert({ 
        id: user.id, 
        app_state: appStateToSave,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("Failed to sync to Supabase:", error);
      });
    } else if (!state.isFirstLoad && !state.user && !state.isLoadingData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const dispatch = useCallback((action: any) => {
    setState((prev) => {
      switch (action.type) {
        case "SET_USER":
          return { ...prev, user: action.payload };
        case "LOAD_DATA":
          return { ...prev, ...action.payload, isLoadingData: false, isFirstLoad: false };
        case "LOGOUT":
          return { ...initialState, isFirstLoad: false };
        case "SET_ROUTINES":
          return { ...prev, routines: action.payload };
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
          if (
            !action.payload.exercises.some((exercise: any) =>
              exercise.loggedSets.some((setLog: any) => setLog !== null),
            )
          ) {
            return { ...prev, activeSession: null };
          }

          const newHistory = [action.payload, ...prev.history];
          const streakMetrics = computeStreakFromHistory(newHistory);

          // Update histories inside routines to reflect new weights/reps
          const newRoutines = prev.routines.map((r) => {
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
            history: newHistory,
            streak: streakMetrics.streak,
            bestStreak: Math.max(prev.bestStreak, streakMetrics.bestStreak),
            lastWorkoutDate: streakMetrics.lastWorkoutDate,
            routines: newRoutines,
          };
        case "DELETE_HISTORY_SESSION": {
          const payload = action.payload || {};
          const sessionToDelete = prev.history.find((session) => {
            if (payload.id && session.id === payload.id) return true;
            return (
              session.endTime === payload.endTime &&
              session.routineId === payload.routineId
            );
          });
          if (!sessionToDelete) return prev;

          const history = prev.history.filter(
            (session) => session !== sessionToDelete,
          );
          const streakMetrics = computeStreakFromHistory(history);

          const routines = prev.routines.map((routine) => {
            if (routine.id !== sessionToDelete.routineId) return routine;

            const exercises = routine.exercises.map((exercise) => {
              const deletedSessionExercise = sessionToDelete.exercises.find(
                (sessionExercise) => sessionExercise.id === exercise.id,
              );
              if (!deletedSessionExercise) return exercise;

              const hadLoggedSets = deletedSessionExercise.loggedSets.some(
                Boolean,
              );
              if (!hadLoggedSets) return exercise;

              const historyWithoutDeletedSession = (exercise.history || []).filter(
                (entry) => entry.date !== sessionToDelete.endTime,
              );
              const nextTarget =
                historyWithoutDeletedSession.length > 0
                  ? historyWithoutDeletedSession[
                      historyWithoutDeletedSession.length - 1
                    ].kg
                  : exercise.targetKg;

              return {
                ...exercise,
                history: historyWithoutDeletedSession,
                targetKg: nextTarget,
              };
            });

            return { ...routine, exercises };
          });

          return {
            ...prev,
            history,
            streak: streakMetrics.streak,
            bestStreak: streakMetrics.bestStreak,
            lastWorkoutDate: streakMetrics.lastWorkoutDate,
            routines,
          };
        }
        default:
          return prev;
      }
    });
  }, []);

  const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <StoreContext.Provider value={contextValue}>
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
