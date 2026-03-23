import { useState } from 'react';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Exercise, ExerciseSet, ExerciseCategory } from '../types';
import { SetRow } from './SetRow';

interface Props {
  exercise: Exercise;
  workoutId: string;
  onAddSet: (set: ExerciseSet) => void;
  onUpdateSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: string) => void;
  onDeleteExercise: () => void;
  generateId: () => string;
}

function categoryLabel(cat: ExerciseCategory) {
  return cat === 'weightlifting' ? 'Lift' : cat === 'cardio' ? 'Cardio' : 'Recovery';
}

function badgeClass(cat: ExerciseCategory) {
  return cat === 'weightlifting' ? 'badge-lift' : cat === 'cardio' ? 'badge-cardio' : 'badge-recovery';
}

function addSetColor(cat: ExerciseCategory) {
  return cat === 'cardio' ? 'cardio-color' : cat === 'recovery' ? 'recovery-color' : '';
}

function barClass(cat: ExerciseCategory) {
  return cat === 'weightlifting' ? 'bar-lift' : cat === 'cardio' ? 'bar-cardio' : 'bar-recovery';
}

function newSet(cat: ExerciseCategory, id: string): ExerciseSet {
  if (cat === 'weightlifting') return { id, type: 'weightlifting', weight: 0, unit: 'kg', reps: 0, completed: false };
  if (cat === 'cardio') return { id, type: 'cardio', duration: 0, completed: false };
  return { id, type: 'recovery', duration: 0, completed: false };
}

export function ExerciseCard({ exercise, onAddSet, onUpdateSet, onDeleteSet, onDeleteExercise, generateId }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const totalSets = exercise.sets.length;
  const doneSets = exercise.sets.filter(s => s.completed).length;
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  return (
    <div ref={setNodeRef} style={style} className="exercise-card">
      <div className="exercise-header">
        <div className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={18} />
        </div>
        <span className={`exercise-category-badge ${badgeClass(exercise.category)}`}>
          {categoryLabel(exercise.category)}
        </span>
        <span className="exercise-name">{exercise.name}</span>
        {totalSets > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {doneSets}/{totalSets}
          </span>
        )}
        <button className="icon-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        {confirmDelete ? (
          <>
            <button className="icon-btn" style={{ color: 'var(--red)' }} onClick={onDeleteExercise}>
              <Trash2 size={16} />
            </button>
            <button className="icon-btn" onClick={() => setConfirmDelete(false)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ✕
            </button>
          </>
        ) : (
          <button className="icon-btn" onClick={() => setConfirmDelete(true)} aria-label="Delete exercise">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          {totalSets > 0 && (
            <div className="progress-wrap">
              <div className={`progress-bar ${barClass(exercise.category)}`} style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="sets-list">
            {exercise.sets.map((set, i) => (
              <SetRow
                key={set.id}
                set={set}
                index={i}
                category={exercise.category}
                onUpdate={updates => onUpdateSet(set.id, updates)}
                onDelete={() => onDeleteSet(set.id)}
              />
            ))}
          </div>

          <button
            className={`add-set-btn ${addSetColor(exercise.category)}`}
            onClick={() => onAddSet(newSet(exercise.category, generateId()))}
          >
            <Plus size={15} />
            Add set
          </button>
        </>
      )}
    </div>
  );
}
