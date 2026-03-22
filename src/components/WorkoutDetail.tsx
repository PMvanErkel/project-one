import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Workout, Exercise, ExerciseSet, ExerciseCategory } from '../types';
import { ExerciseCard } from './ExerciseCard';

interface Props {
  workout: Workout;
  onBack: () => void;
  onAddExercise: (name: string, category: ExerciseCategory) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onReorderExercises: (exercises: Exercise[]) => void;
  onAddSet: (exerciseId: string, set: ExerciseSet) => void;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  generateId: () => string;
}

type FilterCategory = 'all' | ExerciseCategory;

const CATEGORIES: { value: ExerciseCategory; label: string; chip: string }[] = [
  { value: 'weightlifting', label: 'Weightlifting', chip: 'chip-lift' },
  { value: 'cardio', label: 'Cardio', chip: 'chip-cardio' },
  { value: 'recovery', label: 'Recovery', chip: 'chip-recovery' },
];

export function WorkoutDetail({
  workout,
  onBack,
  onAddExercise,
  onDeleteExercise,
  onReorderExercises,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  generateId,
}: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('weightlifting');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const visibleExercises = filter === 'all'
    ? workout.exercises
    : workout.exercises.filter(e => e.category === filter);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = workout.exercises.findIndex(e => e.id === active.id);
    const newIndex = workout.exercises.findIndex(e => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(workout.exercises, oldIndex, newIndex).map((e, i) => ({ ...e, order: i }));
    onReorderExercises(reordered);
  }

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddExercise(trimmed, newCategory);
    setNewName('');
    setShowModal(false);
  }

  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = workout.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0);
  const liftCount = workout.exercises.filter(e => e.category === 'weightlifting').length;
  const cardioCount = workout.exercises.filter(e => e.category === 'cardio').length;
  const recoveryCount = workout.exercises.filter(e => e.category === 'recovery').length;

  return (
    <>
      <div className="header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workout.name}</h1>
          <div className="subtitle">
            {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {workout.exercises.length > 0 && (
        <div className="workout-stats">
          <div className="stat"><strong>{workout.exercises.length}</strong> exercises</div>
          {totalSets > 0 && <div className="stat"><strong>{doneSets}/{totalSets}</strong> sets done</div>}
          {liftCount > 0 && <div className="stat" style={{ color: 'var(--accent-lift)' }}><strong>{liftCount}</strong> lift</div>}
          {cardioCount > 0 && <div className="stat" style={{ color: 'var(--accent-cardio)' }}><strong>{cardioCount}</strong> cardio</div>}
          {recoveryCount > 0 && <div className="stat" style={{ color: 'var(--accent-recovery)' }}><strong>{recoveryCount}</strong> recovery</div>}
        </div>
      )}

      {workout.exercises.length > 0 && (
        <div className="category-filter">
          <button
            className={`filter-chip chip-all${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            workout.exercises.some(e => e.category === c.value) && (
              <button
                key={c.value}
                className={`filter-chip ${c.chip}${filter === c.value ? ' active' : ''}`}
                onClick={() => setFilter(f => f === c.value ? 'all' : c.value)}
              >
                {c.label}
              </button>
            )
          ))}
        </div>
      )}

      <div className="page">
        {visibleExercises.length === 0 ? (
          <div className="empty-state">
            <Plus size={48} />
            <strong>No exercises yet</strong>
            <p>Add your first exercise to get started</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={visibleExercises.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleExercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  workoutId={workout.id}
                  onAddSet={set => onAddSet(exercise.id, set)}
                  onUpdateSet={(setId, updates) => onUpdateSet(exercise.id, setId, updates)}
                  onDeleteSet={setId => onDeleteSet(exercise.id, setId)}
                  onDeleteExercise={() => onDeleteExercise(exercise.id)}
                  generateId={generateId}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <button className="fab" onClick={() => setShowModal(true)}>
        <Plus size={20} /> Add Exercise
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Exercise</h2>

            <div className="form-row">
              <label className="form-label">Exercise name</label>
              <input
                autoFocus
                placeholder="e.g. Bench Press, 5km Run…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Category</label>
              <div className="category-tabs">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    className={`category-tab${newCategory === c.value ? ` active-${c.value === 'weightlifting' ? 'lift' : c.value}` : ''}`}
                    onClick={() => setNewCategory(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newName.trim()}>Add</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
