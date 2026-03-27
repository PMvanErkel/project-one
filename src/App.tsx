import { useState } from 'react';
import { useGymStore } from './store';
import { WorkoutList } from './components/WorkoutList';
import { WorkoutDetail } from './components/WorkoutDetail';

export default function App() {
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const store = useGymStore();

  const currentWorkout = activeWorkoutId
    ? store.workouts.find(w => w.id === activeWorkoutId) ?? null
    : null;

  function handleCreateWorkout(name: string, date: string) {
    const w = store.createWorkout(name, date);
    setActiveWorkoutId(w.id);
  }

  if (currentWorkout) {
    return (
      <div className="app">
        <WorkoutDetail
          workout={currentWorkout}
          allWorkouts={store.workouts}
          onBack={() => setActiveWorkoutId(null)}
          onAddExercise={(name, category) => store.addExercise(currentWorkout.id, name, category)}
          onDeleteExercise={id => store.deleteExercise(currentWorkout.id, id)}
          onReorderExercises={exercises => store.reorderExercises(currentWorkout.id, exercises)}
          onAddSet={(exerciseId, set) => store.addSet(currentWorkout.id, exerciseId, set)}
          onUpdateSet={(exerciseId, setId, updates) => store.updateSet(currentWorkout.id, exerciseId, setId, updates)}
          onDeleteSet={(exerciseId, setId) => store.deleteSet(currentWorkout.id, exerciseId, setId)}
          onUpdateDate={date => store.updateWorkoutDate(currentWorkout.id, date)}
          generateId={store.generateSetId}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <WorkoutList
        workouts={store.workouts}
        onSelect={w => setActiveWorkoutId(w.id)}
        onCreate={handleCreateWorkout}
        onDelete={store.deleteWorkout}
        onImport={store.importWorkouts}
      />
    </div>
  );
}
