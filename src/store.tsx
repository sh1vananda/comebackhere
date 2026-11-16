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
  hasLoadedFromSupabase: boolean;
};

type StoreContextType = {
  state: AppState;
  dispatch: (action: any) => void;
};

export const StoreContext = createContext<StoreContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "comebackhere_state";

export function normalizeRoutine(r: any, idx = 0): Routine {
  const stableId = (r.id && String(r.id).trim().length > 0) 
    ? String(r.id) 
    : (r.name ? `routine_${r.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}` : `routine_${Date.now()}_${idx}`);

  return {
    ...r,
    id: stableId,
    name: r.name || 'Untitled Plan',
    schedule: Array.isArray(r.schedule) ? r.schedule : [],
    isRestDay: !!r.isRestDay,
    exercises: Array.isArray(r.exercises) ? r.exercises.map((ex: any, exIdx: number) => ({
      ...ex,
      id: ex.id ? String(ex.id) : `ex_${stableId}_${exIdx}`,
      name: ex.name || '',
      sets: typeof ex.sets === 'number' ? ex.sets : 3,
      reps: typeof ex.reps === 'number' ? ex.reps : 10,
      targetKg: typeof ex.targetKg === 'number' ? ex.targetKg : 20,
      isTime: !!ex.isTime,
      tempo: ex.tempo || '',
      notes: ex.notes || '',
      restTime: typeof ex.restTime === 'number' ? ex.restTime : 90,
      history: Array.isArray(ex.history) ? ex.history : []
    })) : []
  };
}

const initialState: AppState = {
  routines: DEFAULT_ROUTINES.map((r, i) => normalizeRoutine(r, i)),
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
  hasLoadedFromSupabase: false,
};

function getDayKey(timestamp: number) {
  return new Date(timestamp).toDateString();
}

function computeStreakFromHistory(history: CompletedSession[], routines: Routine[]) {
  if (history.length === 0) {
    return { streak: 0, bestStreak: 0, lastWorkoutDate: null as string | null };
  }

  const explicitRestDays = new Set(
    routines.filter(r => r.isRestDay).flatMap(r => r.schedule || [])
  );

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
      let allRestDays = true;
      for (let d = 1; d < diffDays; d++) {
         const missingDate = new Date(curr.getTime() + d * 24 * 60 * 60 * 1000);
         if (!explicitRestDays.has(missingDate.getDay())) {
            allRestDays = false;
            break;
         }
      }
      if (allRestDays) {
         streak += diffDays;
      } else {
         break;
      }
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
      let allRestDays = true;
      for (let d = 1; d < diffDays; d++) {
         const missingDate = new Date(curr.getTime() + d * 24 * 60 * 60 * 1000);
         if (!explicitRestDays.has(missingDate.getDay())) {
            allRestDays = false;
            break;
         }
      }
      if (allRestDays) {
         run += diffDays;
         bestStreak = Math.max(bestStreak, run);
      } else {
         run = 1;
      }
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
    if (saved) {
      const parsed = JSON.parse(saved);
      const { user, ...cleanSaved } = parsed || {};
      const routines = cleanSaved.routines 
        ? cleanSaved.routines.map((r: any, i: number) => normalizeRoutine(r, i)) 
        : DEFAULT_ROUTINES.map((r, i) => normalizeRoutine(r, i));
      return { 
        ...initialState, 
        ...cleanSaved, 
        routines,
        user: null, 
        isLoadingData: true, 
        hasLoadedFromSupabase: false, 
        isFirstLoad: false 
      };
    }
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
      const { user, isLoadingData, isFirstLoad, hasLoadedFromSupabase, ...appStateToSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appStateToSave));

      if (state.hasLoadedFromSupabase) {
        supabase.from("user_data").upsert({ 
          id: user.id, 
          app_state: appStateToSave,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error("Failed to sync to Supabase:", error);
        });
      }
    }
  }, [state]);

  const dispatch = useCallback((action: any) => {
    setState((prev) => {
      switch (action.type) {
        case "SET_USER":
          return { ...prev, user: action.payload, isLoadingData: true, hasLoadedFromSupabase: false };
        case "LOAD_DATA": {
          const { user, isLoadingData, hasLoadedFromSupabase, isFirstLoad, ...restData } = action.payload || {};
          const routines = restData.routines 
            ? restData.routines.map((r: any, i: number) => normalizeRoutine(r, i)) 
            : prev.routines;
          return { ...prev, ...restData, routines, isLoadingData: false, hasLoadedFromSupabase: true, isFirstLoad: false };
        }
        case "LOAD_DATA_OFFLINE": {
          const { user, isLoadingData, hasLoadedFromSupabase, isFirstLoad, ...restData } = action.payload || {};
          const routines = restData.routines 
            ? restData.routines.map((r: any, i: number) => normalizeRoutine(r, i)) 
            : prev.routines;
          return { ...prev, ...restData, routines, isLoadingData: false, hasLoadedFromSupabase: false, isFirstLoad: false };
        }
        case "LOGOUT":
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {}
          return { ...initialState, isFirstLoad: false, isLoadingData: false, hasLoadedFromSupabase: false };
        case "SET_ROUTINES":
          return { ...prev, routines: action.payload.map((r: any, i: number) => normalizeRoutine(r, i)) };
        case "ADD_ROUTINE":
          return { ...prev, routines: [...prev.routines, normalizeRoutine(action.payload, prev.routines.length)] };
        case "UPDATE_ROUTINE": {
          const targetPayload = action.payload;
          const targetIndex = action.index;
          const targetId = action.targetId || targetPayload?.id;
          const originalName = action.originalName;
          let hasUpdated = false;
          const updatedRoutines = prev.routines.map((r, idx) => {
            const isMatch = (targetIndex !== undefined && idx === targetIndex) ||
                            (targetId && (r.id === targetId || String(r.id) === String(targetId))) ||
                            (originalName && r.name === originalName);
            if (isMatch && !hasUpdated) {
              hasUpdated = true;
              const stableId = r.id || targetId || targetPayload.id || `routine_${idx}`;
              return normalizeRoutine({
                ...targetPayload,
                id: stableId,
              }, idx);
            }
            return r;
          });

          if (hasUpdated) {
            return {
              ...prev,
              routines: updatedRoutines,
            };
          }

          return {
            ...prev,
            routines: [...prev.routines, normalizeRoutine(targetPayload, prev.routines.length)],
          };
        }
        case "DELETE_ROUTINE": {
          const targetId = action.targetId || (typeof action.payload === 'string' ? action.payload : action.payload?.id);
          const targetIndex = action.index;
          const targetName = action.name || action.originalName;
          let hasDeleted = false;
          return {
            ...prev,
            routines: prev.routines.filter((r, idx) => {
              if (hasDeleted) return true;
              const isMatch = (targetIndex !== undefined && idx === targetIndex) ||
                              (targetId && (r.id === targetId || String(r.id) === String(targetId))) ||
                              (targetName && r.name === targetName);
              if (isMatch) {
                hasDeleted = true;
                return false;
              }
              return true;
            }),
          };
        }
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
          const streakMetrics = computeStreakFromHistory(newHistory, prev.routines);

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
          const streakMetrics = computeStreakFromHistory(history, prev.routines);

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
