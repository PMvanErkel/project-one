export type ExerciseCategory = 'weightlifting' | 'cardio' | 'recovery';

export interface WeightliftingSet {
  id: string;
  type: 'weightlifting';
  weight: number;
  unit: 'kg' | 'lbs';
  reps: number;
  completed: boolean;
}

export interface CardioSet {
  id: string;
  type: 'cardio';
  duration: number; // seconds
  distance?: number;
  distanceUnit?: 'km' | 'mi';
  completed: boolean;
}

export interface RecoverySet {
  id: string;
  type: 'recovery';
  duration: number; // seconds
  notes?: string;
  completed: boolean;
}

export type ExerciseSet = WeightliftingSet | CardioSet | RecoverySet;

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  sets: ExerciseSet[];
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}
