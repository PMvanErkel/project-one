import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
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
import type { Workout, Exercise, ExerciseSet, ExerciseCategory, WeightliftingSet } from '../types';
import { ExerciseCard } from './ExerciseCard';

interface ExerciseSuggestion {
  name: string;
  category: ExerciseCategory;
  lastSet: ExerciseSet | null;
}

function getExerciseSuggestions(query: string, allWorkouts: Workout[], currentWorkoutId: string): ExerciseSuggestion[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const seen = new Map<string, ExerciseSuggestion>();
  const sorted = [...allWorkouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const workout of sorted) {
    if (workout.id === currentWorkoutId) continue;
    for (const exercise of workout.exercises) {
      if (!seen.has(exercise.name.toLowerCase())) {
        seen.set(exercise.name.toLowerCase(), {
          name: exercise.name,
          category: exercise.category,
          lastSet: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : null,
        });
      }
    }
  }
  return Array.from(seen.values())
    .filter(s => s.name.toLowerCase().includes(q))
    .slice(0, 6);
}

function getLastSessionSets(name: string, allWorkouts: Workout[], currentWorkoutId: string, generateId: () => string): ExerciseSet[] {
  const sorted = [...allWorkouts]
    .filter(w => w.id !== currentWorkoutId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const w of sorted) {
    const ex = w.exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (ex && ex.sets.length > 0) {
      return ex.sets.map(s => ({ ...s, id: generateId(), completed: false }));
    }
  }
  return [];
}

function formatLastSet(set: ExerciseSet | null): string {
  if (!set) return '';
  if (set.type === 'weightlifting') {
    const w = set as WeightliftingSet;
    return `${w.weight}${w.unit} × ${w.reps} reps`;
  }
  const mins = Math.floor(set.duration / 60);
  const secs = set.duration % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface Props {
  workout: Workout;
  allWorkouts: Workout[];
  onBack: () => void;
  onAddExercise: (name: string, category: ExerciseCategory, initialSets?: ExerciseSet[]) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onReorderExercises: (exercises: Exercise[]) => void;
  onAddSet: (exerciseId: string, set: ExerciseSet) => void;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onUpdateDate: (date: string) => void;
  generateId: () => string;
}

type FilterCategory = 'all' | ExerciseCategory;

const CATEGORIES: { value: ExerciseCategory; label: string; chip: string }[] = [
  { value: 'weightlifting', label: 'Weightlifting', chip: 'chip-lift' },
  { value: 'cardio', label: 'Cardio', chip: 'chip-cardio' },
  { value: 'recovery', label: 'Recovery', chip: 'chip-recovery' },
];

function toDateInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromDateInput(val: string): string {
  const [y, m, day] = val.split('-').map(Number);
  return new Date(y, m - 1, day, 12, 0, 0).toISOString();
}

export function WorkoutDetail({
  workout,
  allWorkouts,
  onBack,
  onAddExercise,
  onDeleteExercise,
  onReorderExercises,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onUpdateDate,
  generateId,
}: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('weightlifting');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = getExerciseSuggestions(newName, allWorkouts, workout.id);

  useEffect(() => {
    if (!showModal) setShowSuggestions(false);
  }, [showModal]);

  function handleSuggestionClick(s: ExerciseSuggestion) {
    setNewName(s.name);
    setNewCategory(s.category);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

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
    const lastSets = getLastSessionSets(trimmed, allWorkouts, workout.id, generateId);
    onAddExercise(trimmed, newCategory, lastSets);
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
          <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {editingDate ? (
              <input
                type="date"
                value={toDateInput(workout.date)}
                onChange={e => { if (e.target.value) { onUpdateDate(fromDateInput(e.target.value)); setEditingDate(false); } }}
                onBlur={() => setEditingDate(false)}
                autoFocus
                style={{ fontSize: '0.75rem', padding: '2px 4px', width: 'auto', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)' }}
              />
            ) : (
              <>
                {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                <button onClick={() => setEditingDate(true)} style={{ color: 'var(--text-muted)', padding: 0, display: 'flex' }} aria-label="Edit date">
                  <Calendar size={11} />
                </button>
              </>
            )}
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

            <div className="form-row" style={{ position: 'relative' }}>
              <label className="form-label">Exercise name</label>
              <input
                ref={inputRef}
                autoFocus
                placeholder="e.g. Bench Press, 5km Run…"
                value={newName}
                onChange={e => { setNewName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="exercise-suggestions" ref={suggestionsRef}>
                  {suggestions.map(s => (
                    <button
                      key={s.name}
                      className="suggestion-item"
                      onMouseDown={e => { e.preventDefault(); handleSuggestionClick(s); }}
                    >
                      <span className={`suggestion-badge ${s.category === 'weightlifting' ? 'badge-lift' : s.category === 'cardio' ? 'badge-cardio' : 'badge-recovery'}`}>
                        {s.category === 'weightlifting' ? 'Lift' : s.category === 'cardio' ? 'Cardio' : 'Recovery'}
                      </span>
                      <span className="suggestion-name">{s.name}</span>
                      {s.lastSet && (
                        <span className="suggestion-last">{formatLastSet(s.lastSet)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
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
