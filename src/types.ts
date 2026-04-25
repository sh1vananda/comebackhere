export type ExerciseHistory = {
  kg: number;
  reps: number;
  date: number; // timestamp
};

export type ExerciseDefinition = {
  id: string; // unique
  name: string;
  sets: number;
  reps: number;
  targetKg: number;
  isTime?: boolean;
  history: ExerciseHistory[];
};

export type Routine = {
  id: string;
  name: string;
  exercises: ExerciseDefinition[];
  schedule: number[]; // 0=Sun, 1=Mon, etc.
};

export type SetLog = {
  kg: number;
  reps: number;
};

export type SessionExercise = ExerciseDefinition & {
  loggedSets: (SetLog | null)[];
};

export type Session = {
  id: string;
  routineId: string;
  routineName: string;
  startTime: number;
  exercises: SessionExercise[];
};

export type FoodItem = {
  id: string;
  name: string;
  protein: number;
};

export type CompletedSession = {
  id: string;
  routineId: string;
  routineName: string;
  startTime: number;
  endTime: number;
  durationMin: number;
  totalVolume: number;
  prs: number;
  feel: number;
  exercises: SessionExercise[];
};
