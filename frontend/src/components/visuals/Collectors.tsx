import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * Why collectors differ: the same workload drawn as application time
 * versus pause time. The point is pause SHAPE, not throughput numbers.
 * ------------------------------------------------------------------ */

const VB = { w: 680, h: 236 }
const ROW_H = 40
const TRACK = { x: 118, w: 540, y: 34 }

interface Pause {
  at: number // 0..1 along the track
  w: number // width as a fraction
  kind: 'young' | 'full' | 'concurrent'
}

interface Collector {
  id: string
  name: string
  tag: string
  pauses: Pause[]
  note: string
}

const COLLECTORS: Collector[] = [
  {
    id: 'serial',
    name: 'Serial',
    tag: '-XX:+UseSerialGC',
    pauses: [
      { at: 0.08, w: 0.05, kind: 'young' },
      { at: 0.3, w: 0.05, kind: 'young' },
      { at: 0.52, w: 0.26, kind: 'full' },
      { at: 0.88, w: 0.05, kind: 'young' },
    ],
    note: 'One thread does everything, and the world stops for all of it. Fine for a small heap or a container with one CPU, where coordination would cost more than it saves.',
  },
  {
    id: 'parallel',
    name: 'Parallel',
    tag: '-XX:+UseParallelGC',
    pauses: [
      { at: 0.08, w: 0.03, kind: 'young' },
      { at: 0.3, w: 0.03, kind: 'young' },
      { at: 0.52, w: 0.14, kind: 'full' },
      { at: 0.88, w: 0.03, kind: 'young' },
    ],
    note: 'The same algorithm on many threads. Best raw throughput of the lot — but the full GC is still a single long stop. Good for batch work, bad for anything with a latency SLO.',
  },
  {
    id: 'g1',
    name: 'G1',
    tag: 'default since Java 9',
    pauses: [
      { at: 0.08, w: 0.025, kind: 'young' },
      { at: 0.22, w: 0.025, kind: 'young' },
      { at: 0.34, w: 0.02, kind: 'concurrent' },
      { at: 0.38, w: 0.16, kind: 'concurrent' },
      { at: 0.55, w: 0.03, kind: 'young' },
      { at: 0.7, w: 0.035, kind: 'young' },
      { at: 0.88, w: 0.025, kind: 'young' },
    ],
    note: 'The heap is split into equal regions, and G1 collects the ones with most garbage first — "garbage first". Marking runs concurrently with your threads; you set a pause target with -XX:MaxGCPauseMillis and it collects as many regions as fit in it.',
  },
  {
    id: 'zgc',
    name: 'ZGC / Shenandoah',
    tag: '-XX:+UseZGC',
    pauses: [
      { at: 0.06, w: 0.006, kind: 'young' },
      { at: 0.2, w: 0.3, kind: 'concurrent' },
      { at: 0.52, w: 0.006, kind: 'young' },
      { at: 0.58, w: 0.3, kind: 'concurrent' },
      { at: 0.92, w: 0.006, kind: 'young' },
    ],
    note: 'Marking AND relocation happen while your threads run, using load barriers and coloured pointers. Pauses stay sub-millisecond and do not grow with the heap — a 16 GB heap pauses about as long as a 2 GB one. You pay in throughput and a little extra CPU.',
  },
]

interface Frame {
  phase: string
  narration: string
  show: number // how many collectors are revealed
  focus?: string
  stw?: boolean
}

function build(): Frame[] {
  return [
    {
      phase: 'The trade-off',
      narration:
        'Every collector trades three things against each other: throughput, pause time, and footprint. You cannot have all three, and "which GC should I use" is really "which of these can I afford to lose".',
      show: 0,
    },
    {
      phase: 'Serial',
      narration: COLLECTORS[0].note,
      show: 1,
      focus: 'serial',
      stw: true,
    },
    {
      phase: 'Parallel',
      narration: COLLECTORS[1].note,
      show: 2,
      focus: 'parallel',
      stw: true,
    },
    {
      phase: 'G1 — the default',
      narration: COLLECTORS[2].note,
      show: 3,
      focus: 'g1',
    },
    {
      phase: 'ZGC and Shenandoah',
      narration: COLLECTORS[3].note,
      show: 4,
      focus: 'zgc',
    },
    {
      phase: 'Read the shape, not the total',
      narration:
        'Notice the totals are not that different — it is the SHAPE that changes. Serial and Parallel take their cost in a few long stops; G1 spreads it; ZGC almost eliminates the stop and pays in background CPU. For a betting or trading feed, one 400 ms stop is worse than 40 ms spread across a hundred pauses, even though the second is more total time.',
      show: 4,
    },
    {
      phase: 'How to answer this in an interview',
      narration:
        'Do not recite collectors. Ask what the service does: a nightly batch job wants Parallel; a request-serving API with a p99 target wants G1 and a pause goal; a large-heap, latency-critical service wants ZGC. Then say how you would verify it — GC logs with -Xlog:gc*, pause distribution, allocation rate — because the collector choice is a hypothesis, not an answer.',
      show: 4,
    },
  ]
}

const COLOR: Record<Pause['kind'], string> = {
  young: 'var(--boss)',
  full: 'var(--boss)',
  concurrent: 'var(--accent)',
}

export function Collectors() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 3400)
  const f = frames[frame]

  return (
    <Stage
      phase={f.phase}
      stw={f.stw}
      narration={f.narration}
      controls={controls}
      index={index}
      total={total}
      legend={
        <>
          <span className="inline-flex items-center gap-1.5">
            <svg width="16" height="9" aria-hidden="true">
              <rect width="16" height="9" rx="1.5" fill="var(--boss)" />
            </svg>
            <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              threads stopped
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="16" height="9" aria-hidden="true">
              <rect width="16" height="9" rx="1.5" fill="var(--accent)" opacity="0.45" />
            </svg>
            <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              collector working concurrently
            </span>
          </span>
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            thin line = your application running
          </span>
        </>
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="Garbage collector comparison">
        <text x={TRACK.x} y={20} fill="var(--ink-3)" style={{ font: '9.5px var(--font-sans)' }}>
          same workload, time →
        </text>

        {COLLECTORS.map((c, i) => {
          const y = TRACK.y + i * ROW_H
          const visible = i < f.show
          const dim = f.focus ? f.focus !== c.id : false
          return (
            <g key={c.id} style={{ opacity: visible ? (dim ? 0.32 : 1) : 0.08, transition: 'opacity .5s' }}>
              <text x={16} y={y + 14} fill="var(--ink)" style={{ font: '600 11.5px var(--font-sans)' }}>
                {c.name}
              </text>
              <text x={16} y={y + 26} fill="var(--ink-3)" style={{ font: '9px var(--font-mono)' }}>
                {c.tag}
              </text>

              {/* application timeline */}
              <rect x={TRACK.x} y={y + 8} width={TRACK.w} height={3} rx={1.5} fill="var(--line-2)" />

              {c.pauses.map((p, j) => (
                <rect
                  key={j}
                  x={TRACK.x + p.at * TRACK.w}
                  y={p.kind === 'concurrent' ? y + 6 : y}
                  width={Math.max(2, p.w * TRACK.w)}
                  height={p.kind === 'concurrent' ? 7 : 19}
                  rx={1.5}
                  fill={COLOR[p.kind]}
                  opacity={p.kind === 'concurrent' ? 0.45 : 1}
                  style={{ transition: 'opacity .4s' }}
                />
              ))}
            </g>
          )
        })}
      </svg>
    </Stage>
  )
}
