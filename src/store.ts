import { useState, useEffect } from 'react';
import type { Workout, Exercise, ExerciseSet, ExerciseCategory } from './types';

const STORAGE_KEY = 'gym-tracker-workouts';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWorkouts(workouts: Workout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function useGymStore() {
  const [workouts, setWorkouts] = useState<Workout[]>(loadWorkouts);

  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  function createWorkout(name: string, date?: string): Workout {
    const workout: Workout = {
      id: generateId(),
      name,
      date: date ?? new Date().toISOString(),
      exercises: [],
    };
    setWorkouts(prev => [workout, ...prev]);
    return workout;
  }

  function updateWorkoutDate(id: string, date: string) {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, date } : w));
  }

  function deleteWorkout(id: string) {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }

  function addExercise(workoutId: string, name: string, category: ExerciseCategory, initialSets: ExerciseSet[] = []) {
    setWorkouts(prev =>
      prev.map(w => {
        if (w.id !== workoutId) return w;
        const exercise: Exercise = {
          id: generateId(),
          name,
          category,
          sets: initialSets,
          order: w.exercises.length,
        };
        return { ...w, exercises: [...w.exercises, exercise] };
      })
    );
  }

  function deleteExercise(workoutId: string, exerciseId: string) {
    setWorkouts(prev =>
      prev.map(w => {
        if (w.id !== workoutId) return w;
        return { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) };
      })
    );
  }

  function reorderExercises(workoutId: string, exercises: Exercise[]) {
    setWorkouts(prev =>
      prev.map(w => {
        if (w.id !== workoutId) return w;
        return { ...w, exercises };
      })
    );
  }

  function addSet(workoutId: string, exerciseId: string, set: ExerciseSet) {
    setWorkouts(prev =>
      prev.map(w => {
        if (w.id !== workoutId) return w;
        return {
          ...w,
          exercises: w.exercises.map(e => {
            if (e.id !== exerciseId) return e;
            return { ...e, sets: [...e.sets, set] };
          }),
        };
      })
    );
  }

  function updateSet(workoutId: string, exerciseId: string, setId: string, updates: Partial<ExerciseSet>) {
    setWorkouts(prev =>
      prev.map(w => {
        if (w.id !== workoutId) return w;
        return {
          ...w,
          exercises: w.exercises.map(e => {
            if (e.id !== exerciseId) return e;
            return {
              ...e,
              sets: e.sets.map(s => (s.id === setId ? ({ ...s, ...updates } as ExerciseSet) : s)),
            };
          }),
        };
      })
    );
  }

  function deleteSet(workoutId: string, exerciseId: string, setId: string) {
    setWorkouts(prev =>
      prev.map(w => {
        if (w.id !== workoutId) return w;
        return {
          ...w,
          exercises: w.exercises.map(e => {
            if (e.id !== exerciseId) return e;
            return { ...e, sets: e.sets.filter(s => s.id !== setId) };
          }),
        };
      })
    );
  }

  function generateSetId() {
    return generateId();
  }

  function importWorkouts(incoming: Workout[]) {
    setWorkouts(prev => {
      const existingIds = new Set(prev.map(w => w.id));
      const newOnes = incoming.filter(w => !existingIds.has(w.id));
      return [...newOnes, ...prev];
    });
  }

  return {
    workouts,
    createWorkout,
    updateWorkoutDate,
    deleteWorkout,
    addExercise,
    deleteExercise,
    reorderExercises,
    addSet,
    updateSet,
    deleteSet,
    generateSetId,
    importWorkouts,
  };
}
