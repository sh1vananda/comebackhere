import { Routine } from '../types';

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'push',
    name: 'Push Day',
    schedule: [1, 4], // Mon, Thu
    exercises: [
      {
        id: 'bp',
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        targetKg: 80,
        history: [{ kg: 80, reps: 8, date: Date.now() - 86400000 * 3 }],
      },
      {
        id: 'ohp',
        name: 'Overhead Press',
        sets: 3,
        reps: 10,
        targetKg: 50,
        history: [],
      },
      {
        id: 'inc',
        name: 'Incline Dumbbell Press',
        sets: 3,
        reps: 12,
        targetKg: 24,
        history: [],
      },
      {
        id: 'tri',
        name: 'Tricep Pushdown',
        sets: 3,
        reps: 15,
        targetKg: 30,
        history: [],
      },
      {
        id: 'lat',
        name: 'Lateral Raises',
        sets: 4,
        reps: 15,
        targetKg: 10,
        history: [],
      },
    ],
  },
  {
    id: 'pull',
    name: 'Pull Day',
    schedule: [2, 5], // Tue, Fri
    exercises: [
      {
        id: 'dl',
        name: 'Deadlift',
        sets: 4,
        reps: 5,
        targetKg: 120,
        history: [],
      },
      {
        id: 'row',
        name: 'Barbell Row',
        sets: 3,
        reps: 8,
        targetKg: 70,
        history: [],
      },
      {
        id: 'pd',
        name: 'Lat Pulldown',
        sets: 3,
        reps: 10,
        targetKg: 65,
        history: [],
      },
      {
        id: 'cur',
        name: 'Barbell Curl',
        sets: 3,
        reps: 12,
        targetKg: 40,
        history: [],
      },
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    schedule: [3, 6], // Wed, Sat
    exercises: [
      {
        id: 'sq',
        name: 'Back Squat',
        sets: 4,
        reps: 6,
        targetKg: 100,
        history: [],
      },
      {
        id: 'rdl',
        name: 'Romanian Deadlift',
        sets: 3,
        reps: 10,
        targetKg: 80,
        history: [],
      },
      {
        id: 'lp',
        name: 'Leg Press',
        sets: 3,
        reps: 12,
        targetKg: 140,
        history: [],
      },
      {
        id: 'lc',
        name: 'Leg Curl',
        sets: 3,
        reps: 15,
        targetKg: 50,
        history: [],
      },
    ],
  },
];
