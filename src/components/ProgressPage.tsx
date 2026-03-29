import { useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import type { Workout, WeightliftingSet, CardioSet, RecoverySet } from '../types';

interface Props {
  workouts: Workout[];
  onBack: () => void;
}

interface ExerciseEntry {
  name: string;
  category: string;
  count: number;
}

interface ChartPoint {
  date: string;
  value: number;
  label: string;
}

interface ExerciseMeta {
  unit: string;
  color: string;
}

function getExerciseList(workouts: Workout[]): ExerciseEntry[] {
  const map = new Map<string, { category: string; count: number }>();
  for (const w of workouts) {
    for (const e of w.exercises) {
      const ex = map.get(e.name);
      if (ex) ex.count++;
      else map.set(e.name, { category: e.category, count: 1 });
    }
  }
  return Array.from(map.entries())
    .map(([name, { category, count }]) => ({ name, category, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function getProgressData(workouts: Workout[], exerciseName: string): { points: ChartPoint[]; meta: ExerciseMeta } {
  const sorted = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const points: ChartPoint[] = [];
  let unit = '';
  let color = 'var(--accent-lift)';

  for (const workout of sorted) {
    const exercise = workout.exercises.find(e => e.name === exerciseName);
    if (!exercise || exercise.sets.length === 0) continue;

    const d = new Date(workout.date);
    const date = `${d.getDate()}/${d.getMonth() + 1}`;
    let value = 0;
    let label = '';

    if (exercise.category === 'weightlifting') {
      color = 'var(--accent-lift)';
      const wSets = exercise.sets.filter(s => s.type === 'weightlifting') as WeightliftingSet[];
      const bwSets = wSets.filter(s => s.unit === 'bw');
      const weightSets = wSets.filter(s => s.unit !== 'bw' && s.weight > 0);

      if (weightSets.length > 0) {
        const maxW = Math.max(...weightSets.map(s => s.weight));
        unit = weightSets[0].unit;
        value = maxW;
        label = `${maxW} ${unit}`;
      } else if (bwSets.length > 0) {
        const maxR = Math.max(...bwSets.map(s => s.reps));
        unit = 'reps';
        value = maxR;
        label = `${maxR} reps`;
      }
    } else if (exercise.category === 'cardio') {
      color = 'var(--accent-cardio)';
      const cSets = exercise.sets.filter(s => s.type === 'cardio') as CardioSet[];
      const isTreadmill = cSets.some(s => s.cardioMode === 'treadmill');
      if (isTreadmill) {
        const speeds = cSets.map(s => s.speed ?? 0).filter(v => v > 0);
        if (speeds.length > 0) {
          unit = 'km/h';
          value = Math.max(...speeds);
          label = `${value} km/h`;
        }
      } else {
        const totalSecs = cSets.reduce((s, c) => s + c.duration, 0);
        if (totalSecs > 0) {
          unit = 'min';
          value = Math.round((totalSecs / 60) * 10) / 10;
          label = `${value} min`;
        }
      }
    } else {
      color = 'var(--accent-recovery)';
      const rSets = exercise.sets.filter(s => s.type === 'recovery') as RecoverySet[];
      const totalSecs = rSets.reduce((s, r) => s + r.duration, 0);
      if (totalSecs > 0) {
        unit = 'min';
        value = Math.round((totalSecs / 60) * 10) / 10;
        label = `${value} min`;
      }
    }

    if (value > 0) points.push({ date, value, label });
  }

  return { points, meta: { unit, color } };
}

function ProgressChart({ points, color }: { points: ChartPoint[]; color: string }) {
  const [tooltip, setTooltip] = useState<number | null>(null);

  if (points.length < 1) return null;

  const W = 320, H = 180;
  const pl = 42, pr = 12, pt = 24, pb = 28;
  const cW = W - pl - pr;
  const cH = H - pt - pb;

  const vals = points.map(p => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || maxV * 0.2 || 1;
  const padded = range * 0.15;
  const yMin = Math.max(0, minV - padded);
  const yMax = maxV + padded;
  const yRange = yMax - yMin;

  const px = (i: number) => pl + (points.length === 1 ? cW / 2 : (i / (points.length - 1)) * cW);
  const py = (v: number) => pt + cH - ((v - yMin) / yRange) * cH;

  const pts = points.map((p, i) => ({ ...p, cx: px(i), cy: py(p.value) }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
  const areaPath = points.length > 1
    ? `${linePath} L${pts[pts.length - 1].cx.toFixed(1)},${(pt + cH).toFixed(1)} L${pts[0].cx.toFixed(1)},${(pt + cH).toFixed(1)} Z`
    : '';

  const yTicks = [0, 0.5, 1].map(t => ({
    v: yMin + t * yRange,
    y: pt + cH - t * cH,
  }));

  const maxLabels = 7;
  const step = Math.ceil(points.length / maxLabels);

  const resolvedColor = color.startsWith('var(')
    ? color === 'var(--accent-lift)' ? '#6B7A52'
    : color === 'var(--accent-cardio)' ? '#8A9E72'
    : '#B5A882'
    : color;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pl} y1={t.y} x2={W - pr} y2={t.y} stroke="#C8BFA8" strokeWidth={1} strokeDasharray={i === 0 ? '' : '3 3'} />
          <text x={pl - 5} y={t.y + 3.5} fontSize={9} fill="#7A7062" textAnchor="end">
            {t.v % 1 === 0 ? t.v.toFixed(0) : t.v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Area */}
      {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}

      {/* Line */}
      {points.length > 1 && (
        <path d={linePath} fill="none" stroke={resolvedColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots + X labels + touch targets */}
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setTooltip(i)} onClick={() => setTooltip(i === tooltip ? null : i)}>
          <circle cx={p.cx} cy={p.cy} r={5} fill={resolvedColor} stroke="#FAF7F2" strokeWidth={1.5} />
          {i % step === 0 && (
            <text x={p.cx} y={H - 6} fontSize={9} fill="#7A7062" textAnchor="middle">{p.date}</text>
          )}
          {/* Invisible wider hit target */}
          <rect x={p.cx - 16} y={pt} width={32} height={cH} fill="transparent" />
          {/* Tooltip */}
          {tooltip === i && (
            <g>
              <rect
                x={Math.min(Math.max(p.cx - 28, pl), W - pr - 56)}
                y={p.cy - 30}
                width={56} height={22} rx={5}
                fill="#252320" opacity={0.85}
              />
              <text
                x={Math.min(Math.max(p.cx, pl + 28), W - pr - 28)}
                y={p.cy - 14}
                fontSize={10} fill="#FAF7F2" textAnchor="middle" fontWeight="600"
              >
                {p.label}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function ProgressPage({ workouts, onBack }: Props) {
  const exercises = getExerciseList(workouts);
  const [selected, setSelected] = useState(exercises[0]?.name ?? '');

  const { points, meta } = selected ? getProgressData(workouts, selected) : { points: [], meta: { unit: '', color: 'var(--accent-lift)' } };

  const best = points.length > 0 ? Math.max(...points.map(p => p.value)) : null;
  const sessions = points.length;

  const selectedEntry = exercises.find(e => e.name === selected);
  const catColor = selectedEntry?.category === 'cardio' ? 'var(--accent-cardio)'
    : selectedEntry?.category === 'recovery' ? 'var(--accent-recovery)'
    : 'var(--accent-lift)';

  return (
    <>
      <div className="header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <h1>Progress</h1>
      </div>

      <div className="page">
        {exercises.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={48} />
            <strong>No data yet</strong>
            <p>Log some workouts and come back to track your progress.</p>
          </div>
        ) : (
          <>
            {/* Exercise selector chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {exercises.map(e => (
                <button
                  key={e.name}
                  onClick={() => setSelected(e.name)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: `2px solid ${e.name === selected ? catColor : 'var(--border)'}`,
                    background: e.name === selected ? 'var(--surface2)' : 'var(--surface)',
                    color: e.name === selected ? 'var(--text)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {e.name}
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.6 }}>{e.count}×</span>
                </button>
              ))}
            </div>

            {/* Chart card */}
            <div className="card" style={{ padding: '16px 12px 8px' }}>
              {points.length < 2 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {points.length === 0
                    ? 'No logged sets for this exercise yet.'
                    : 'Log this exercise at least twice to see a trend.'}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    {meta.unit ? `${meta.unit} over time` : 'over time'}
                  </div>
                  <ProgressChart points={points} color={meta.color} />
                </>
              )}
            </div>

            {/* Stats row */}
            {points.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <StatCard label="Best" value={points.find(p => p.value === best)?.label ?? '—'} />
                <StatCard label="Latest" value={points[points.length - 1].label} />
                <StatCard label="Sessions" value={String(sessions)} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
