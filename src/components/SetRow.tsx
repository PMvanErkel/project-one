import { Check, X } from 'lucide-react';
import type { ExerciseSet, ExerciseCategory } from '../types';

interface Props {
  set: ExerciseSet;
  index: number;
  category: ExerciseCategory;
  onUpdate: (updates: Partial<ExerciseSet>) => void;
  onDelete: () => void;
}

export function SetRow({ set, index, category, onUpdate, onDelete }: Props) {
  const labelClass = 'set-field-label';

  return (
    <div className={`set-row${set.completed ? ' completed-row' : ''}`}>
      <span className="set-number">{index + 1}</span>

      <div className="set-fields">
        {category === 'weightlifting' && set.type === 'weightlifting' && (
          <>
            {set.unit === 'bw' ? (
              <div className="set-field" style={{ maxWidth: 52 }}>
                <span className={labelClass}>Weight</span>
                <div style={{ padding: '6px 4px', fontSize: '0.85rem', textAlign: 'center', color: 'var(--accent-lift)', fontWeight: 700, background: 'var(--accent-lift-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>BW</div>
              </div>
            ) : (
              <div className="set-field">
                <span className={labelClass}>Weight</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={set.weight || ''}
                  onChange={e => onUpdate({ weight: parseFloat(e.target.value) || 0 } as Partial<ExerciseSet>)}
                />
              </div>
            )}
            <div className="set-field" style={{ maxWidth: 60 }}>
              <span className={labelClass}>Unit</span>
              <select value={set.unit} onChange={e => onUpdate({ unit: e.target.value as 'kg' | 'lbs' | 'bw' } as Partial<ExerciseSet>)}>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="bw">BW</option>
              </select>
            </div>
            <div className="set-field">
              <span className={labelClass}>Reps</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={set.reps || ''}
                onChange={e => onUpdate({ reps: parseInt(e.target.value) || 0 } as Partial<ExerciseSet>)}
              />
            </div>
          </>
        )}

        {category === 'cardio' && set.type === 'cardio' && (
          <>
            {set.cardioMode === 'treadmill' ? (
              <>
                <div className="set-field">
                  <span className={labelClass}>Incl %</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={30}
                    step={0.5}
                    value={set.incline ?? ''}
                    onChange={e => onUpdate({ incline: parseFloat(e.target.value) || undefined } as Partial<ExerciseSet>)}
                  />
                </div>
                <div className="set-field">
                  <span className={labelClass}>km/h</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.1}
                    value={set.speed ?? ''}
                    onChange={e => onUpdate({ speed: parseFloat(e.target.value) || undefined } as Partial<ExerciseSet>)}
                  />
                </div>
                <div className="set-field" style={{ maxWidth: 52 }}>
                  <span className={labelClass}>Min</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={Math.floor(set.duration / 60) || ''}
                    onChange={e => {
                      const mins = parseInt(e.target.value) || 0;
                      const secs = set.duration % 60;
                      onUpdate({ duration: mins * 60 + secs } as Partial<ExerciseSet>);
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="set-field">
                  <span className={labelClass}>Min</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={Math.floor(set.duration / 60) || ''}
                    onChange={e => {
                      const mins = parseInt(e.target.value) || 0;
                      const secs = set.duration % 60;
                      onUpdate({ duration: mins * 60 + secs } as Partial<ExerciseSet>);
                    }}
                  />
                </div>
                <div className="set-field">
                  <span className={labelClass}>Sec</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    value={set.duration % 60 || ''}
                    onChange={e => {
                      const secs = Math.min(59, parseInt(e.target.value) || 0);
                      const mins = Math.floor(set.duration / 60);
                      onUpdate({ duration: mins * 60 + secs } as Partial<ExerciseSet>);
                    }}
                  />
                </div>
                <div className="set-field">
                  <span className={labelClass}>Dist</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.1}
                    value={set.distance ?? ''}
                    onChange={e => onUpdate({ distance: parseFloat(e.target.value) || undefined } as Partial<ExerciseSet>)}
                  />
                </div>
                <div className="set-field" style={{ maxWidth: 52 }}>
                  <span className={labelClass}>Unit</span>
                  <select value={set.distanceUnit ?? 'km'} onChange={e => onUpdate({ distanceUnit: e.target.value as 'km' | 'mi' } as Partial<ExerciseSet>)}>
                    <option value="km">km</option>
                    <option value="mi">mi</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}

        {category === 'recovery' && set.type === 'recovery' && (
          <>
            <div className="set-field">
              <span className={labelClass}>Min</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={Math.floor(set.duration / 60) || ''}
                onChange={e => {
                  const mins = parseInt(e.target.value) || 0;
                  const secs = set.duration % 60;
                  onUpdate({ duration: mins * 60 + secs } as Partial<ExerciseSet>);
                }}
              />
            </div>
            <div className="set-field">
              <span className={labelClass}>Sec</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={set.duration % 60 || ''}
                onChange={e => {
                  const secs = Math.min(59, parseInt(e.target.value) || 0);
                  const mins = Math.floor(set.duration / 60);
                  onUpdate({ duration: mins * 60 + secs } as Partial<ExerciseSet>);
                }}
              />
            </div>
            <div className="set-field" style={{ flex: 2 }}>
              <span className={labelClass}>Notes</span>
              <input
                type="text"
                placeholder="e.g. stretch, foam roll…"
                value={set.notes ?? ''}
                onChange={e => onUpdate({ notes: e.target.value || undefined } as Partial<ExerciseSet>)}
                style={{ textAlign: 'left' }}
              />
            </div>
          </>
        )}
      </div>

      <button
        className={`set-check${set.completed ? ' done' : ''}`}
        onClick={() => onUpdate({ completed: !set.completed } as Partial<ExerciseSet>)}
        aria-label="Toggle complete"
      >
        {set.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <button className="set-del" onClick={onDelete} aria-label="Delete set">
        <X size={14} />
      </button>
    </div>
  );
}
