import { useState } from 'react';
import { Plus, Dumbbell, ChevronRight, Trash2 } from 'lucide-react';
import type { Workout } from '../types';

interface Props {
  workouts: Workout[];
  onSelect: (workout: Workout) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWeekStart(weeksAgo: number): Date {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function filterByWeek(workouts: Workout[], weeksAgo: number): Workout[] {
  if (weeksAgo === -1) return workouts;
  const start = getWeekStart(weeksAgo);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return workouts.filter(w => {
    const d = new Date(w.date);
    return d >= start && d < end;
  });
}

function WorkoutCategories({ workout }: { workout: Workout }) {
  const cats = new Set(workout.exercises.map(e => e.category));
  return (
    <div className="workout-card-icons">
      {cats.has('weightlifting') && <div className="category-dot cat-lift" title="Weightlifting" />}
      {cats.has('cardio') && <div className="category-dot cat-cardio" title="Cardio" />}
      {cats.has('recovery') && <div className="category-dot cat-recovery" title="Recovery" />}
    </div>
  );
}

export function WorkoutList({ workouts, onSelect, onCreate, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [weeksAgo, setWeeksAgo] = useState(0);

  const filtered = filterByWeek(workouts, weeksAgo);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName('');
    setShowModal(false);
  }

  return (
    <>
      <div className="header">
        <Dumbbell size={22} color="var(--accent-lift)" />
        <h1>Gym Tracker</h1>
        <select
          className="week-select"
          value={weeksAgo}
          onChange={e => setWeeksAgo(Number(e.target.value))}
        >
          <option value={0}>This week</option>
          <option value={1}>Last week</option>
          <option value={2}>2 weeks ago</option>
          <option value={3}>3 weeks ago</option>
          <option value={-1}>All time</option>
        </select>
      </div>

      <div className="page">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Dumbbell size={52} />
            <strong>{workouts.length === 0 ? 'No workouts yet' : 'No workouts this period'}</strong>
            <p>{workouts.length === 0 ? 'Tap the button below to start your first workout session' : 'Try selecting a different week or create a new workout'}</p>
          </div>
        ) : (
          filtered.map(w => {
            const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
            const doneSets = w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0);
            return (
              <div key={w.id} className="card">
                <button className="workout-card" onClick={() => onSelect(w)}>
                  <div className="workout-card-info">
                    <div className="workout-card-name">{w.name}</div>
                    <div className="workout-card-meta">
                      {formatDate(w.date)} · {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                      {totalSets > 0 && ` · ${doneSets}/${totalSets} sets`}
                    </div>
                  </div>
                  <WorkoutCategories workout={w} />
                  <ChevronRight size={18} color="var(--text-muted)" />
                </button>
                {confirmDelete === w.id ? (
                  <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onDelete(w.id); setConfirmDelete(null); }}>Delete</button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)', width: '100%' }}
                    onClick={() => setConfirmDelete(w.id)}
                  >
                    <Trash2 size={13} /> Delete workout
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => setShowModal(true)}>
        <Plus size={20} /> New Workout
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Workout</h2>
            <div className="form-row">
              <label className="form-label">Workout name</label>
              <input
                autoFocus
                placeholder="e.g. Push Day, Monday Run…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
