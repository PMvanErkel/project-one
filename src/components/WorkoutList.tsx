import { useState, useRef } from 'react';
import { Plus, Dumbbell, ChevronRight, Trash2, Share2, TrendingUp } from 'lucide-react';
import type { Workout } from '../types';

interface Props {
  workouts: Workout[];
  onSelect: (workout: Workout) => void;
  onCreate: (name: string, date: string) => void;
  onDelete: (id: string) => void;
  onImport: (workouts: Workout[]) => void;
  onNavigateProgress: () => void;
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

function todayValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateInputToISO(val: string): string {
  const [y, m, day] = val.split('-').map(Number);
  return new Date(y, m - 1, day, 12, 0, 0).toISOString();
}

export function WorkoutList({ workouts, onSelect, onCreate, onDelete, onImport, onNavigateProgress }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importDone, setImportDone] = useState(false);
  const [name, setName] = useState('');
  const [dateVal, setDateVal] = useState(todayValue);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [weeksAgo, setWeeksAgo] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = JSON.stringify(workouts, null, 2);
    if (navigator.share) {
      navigator.share({ title: 'Gym Tracker Data', text: json }).catch(() => {});
    } else {
      navigator.clipboard.writeText(json).then(() => alert('Copied to clipboard!')).catch(() => {});
    }
  }

  function handleImport() {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      const arr = Array.isArray(parsed) ? parsed : null;
      if (!arr) throw new Error('Expected a JSON array');
      onImport(arr);
      setImportDone(true);
      setImportText('');
    } catch (e) {
      setImportError('Invalid data — paste the full JSON from Export.');
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportText(ev.target?.result as string ?? '');
    reader.readAsText(file);
    e.target.value = '';
  }

  const filtered = filterByWeek(workouts, weeksAgo);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, dateInputToISO(dateVal));
    setName('');
    setDateVal(todayValue());
    setShowModal(false);
  }

  return (
    <>
      <div className="header">
        <Dumbbell size={22} color="var(--accent-lift)" />
        <h1>Gym Tracker</h1>
        <button
          onClick={onNavigateProgress}
          style={{ color: 'var(--text-muted)', padding: 4, display: 'flex', flexShrink: 0 }}
          aria-label="Progress charts"
        >
          <TrendingUp size={18} />
        </button>
        <button
          onClick={() => { setShowDataModal(true); setImportDone(false); setImportError(''); }}
          style={{ color: 'var(--text-muted)', padding: 4, display: 'flex', flexShrink: 0 }}
          aria-label="Export / Import data"
        >
          <Share2 size={18} />
        </button>
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

      {showDataModal && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Export / Import</h2>

            <div className="form-row">
              <label className="form-label">Export your data</label>
              <button className="btn btn-secondary" onClick={handleExport} style={{ textAlign: 'center' }}>
                {'share' in navigator ? 'Share / Export JSON' : 'Copy JSON to clipboard'}
              </button>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Tap Export in Safari, then open the home screen app and paste it below.
              </p>
            </div>

            <div className="form-row">
              <label className="form-label">Import — paste JSON</label>
              <textarea
                rows={5}
                placeholder='Paste exported JSON here…'
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportError(''); setImportDone(false); }}
                style={{ font: 'inherit', fontSize: '0.8rem', resize: 'vertical', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 8, color: 'var(--text)', width: '100%' }}
              />
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileImport} style={{ display: 'none' }} />
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ textAlign: 'center', marginTop: 4 }}>
                Or pick a .json file
              </button>
              {importError && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginTop: 4 }}>{importError}</p>}
              {importDone && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginTop: 4 }}>Imported successfully!</p>}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDataModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={!importText.trim()}>Import</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="form-row">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={dateVal}
                onChange={e => setDateVal(e.target.value)}
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
