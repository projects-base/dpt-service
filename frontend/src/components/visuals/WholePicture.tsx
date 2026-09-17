import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * The map. One diagram holding every other animation in its place, so
 * the explainers read as one system rather than a list of topics. Each
 * zone opens the animation that expands it.
 * ------------------------------------------------------------------ */

const VB = { w: 680, h: 356 }

interface Zone {
  id: string
  /** Which animation this zone expands into. */
  to?: string
  x: number
  y: number
  w: number
  h: number
  title: string
  sub?: string
  /** Visual weight — a container is drawn quieter than a leaf. */
  container?: boolean
}

const ZONES: Zone[] = [
  // build time
  { id: 'build', x: 14, y: 40, w: 128, h: 74, title: 'Build', sub: '.java → .class', to: 'how-java-works' },

  // the JVM process
  { id: 'jvm', x: 158, y: 26, w: 508, h: 316, title: '', container: true },
  { id: 'loader', x: 172, y: 52, w: 110, h: 54, title: 'Class loader', sub: 'load · link · init', to: 'jvm-areas' },
  { id: 'engine', x: 172, y: 116, w: 110, h: 54, title: 'Execution', sub: 'interpret → JIT', to: 'jvm-areas' },
  { id: 'meta', x: 172, y: 180, w: 110, h: 44, title: 'Metaspace', sub: 'native memory', to: 'jvm-areas' },

  // heap
  { id: 'heap', x: 296, y: 52, w: 210, h: 172, title: 'Heap', sub: 'shared by every thread', container: true, to: 'gc-lifecycle' },
  { id: 'young', x: 308, y: 92, w: 186, h: 42, title: 'Young gen', sub: 'Eden · S0 · S1', to: 'gc-lifecycle' },
  { id: 'old', x: 308, y: 142, w: 186, h: 42, title: 'Old gen', sub: 'tenured', to: 'gc-lifecycle' },
  { id: 'gc', x: 308, y: 192, w: 186, h: 24, title: 'Collector', sub: '', to: 'collectors' },

  // threads
  { id: 'threads', x: 520, y: 52, w: 132, h: 172, title: 'Threads', sub: 'stack · PC each', container: true, to: 'threads' },
  { id: 'th1', x: 532, y: 92, w: 108, h: 30, title: 'Thread 1', to: 'threads' },
  { id: 'th2', x: 532, y: 128, w: 108, h: 30, title: 'Thread 2', to: 'threads' },
  { id: 'locks', x: 532, y: 170, w: 108, h: 46, title: 'Locks', sub: 'volatile · CAS', to: 'threads' },

  // what you actually write
  { id: 'code', x: 172, y: 244, w: 480, h: 84, title: '', container: true },
  { id: 'coll', x: 186, y: 272, w: 104, h: 44, title: 'Collections', sub: 'buckets & trees', to: 'hashmap' },
  { id: 'cc', x: 298, y: 272, w: 104, h: 44, title: 'Concurrent', sub: 'lock granularity', to: 'concurrent-collections' },
  { id: 'streams', x: 418, y: 272, w: 220, h: 44, title: 'Streams', sub: 'lazy pipelines · fork/join', to: 'streams' },
]

interface Frame {
  phase: string
  narration: string
  hot: string[]
}

function build(): Frame[] {
  return [
    {
      phase: 'One system, nine animations',
      narration:
        'Everything the other explainers cover lives somewhere on this diagram. Click any zone to open the animation that expands it. The point of seeing it whole: most interview answers are really about which box you are standing in.',
      hot: [],
    },
    {
      phase: 'Build time is tiny',
      narration:
        'javac does one job: text in, bytecode out, with type checking on the way. Everything else on this diagram happens at run time, inside a process that does not exist yet when you compile.',
      hot: ['build'],
    },
    {
      phase: 'The JVM is a process on your machine',
      narration:
        'A native program, built per platform. Your .class file is the portable part; this box is not. Everything inside it is the JVM\'s business, not your operating system\'s.',
      hot: ['jvm', 'loader', 'engine', 'meta'],
    },
    {
      phase: 'The heap is the shared part',
      narration:
        'Every object lives here and every thread can reach it. That single fact generates two entire problem domains: who reclaims objects (the collector) and who may see a half-finished write (the memory model). The heap is the hinge the whole diagram turns on.',
      hot: ['heap', 'young', 'old'],
    },
    {
      phase: 'Generations, and who cleans them',
      narration:
        'The heap is split because most objects die young. Young collections are frequent and cheap; old-generation work is rare and expensive. Which collector you pick decides the SHAPE of that cost, not its total.',
      hot: ['young', 'old', 'gc'],
    },
    {
      phase: 'Threads are the other axis',
      narration:
        'Each thread has its own stack, its own program counter, and its own working copy of whatever it touches. Nothing here is shared — which is exactly why reaching into the heap needs volatile, locks or CAS.',
      hot: ['threads', 'th1', 'th2', 'locks'],
    },
    {
      phase: 'And this is the only part you write',
      narration:
        'Your collections and pipelines sit on top of all of it. A HashMap is objects on the heap, so it is a GC concern — and the moment two threads share it, a concurrency concern too. A parallel stream is threads from a shared pool. The layers below are not trivia: they are why your code behaves the way it does.',
      hot: ['code', 'coll', 'cc', 'streams'],
    },
    {
      phase: 'How to use this',
      narration:
        'When a question lands, place it on the diagram first. "Why is my p99 spiky" is the collector box. "Why did my counter lose updates" is the threads box. "Why is lookup slow" is the collections box. Naming the box out loud is most of a senior answer — then open the matching animation and drill it.',
      hot: [],
    },
  ]
}

export function WholePicture({ onOpen }: { onOpen?: (visualId: string) => void }) {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 4000)
  const f = frames[frame]
  const hot = new Set(f.hot)
  const any = f.hot.length > 0

  return (
    <Stage
      phase={f.phase}
      narration={f.narration}
      controls={controls}
      index={index}
      total={total}
      legend={
        <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          click any zone to open the animation that expands it
        </span>
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="How the pieces fit together">
        <text x={14} y={22} fill="var(--ink-3)" style={{ font: '600 9px var(--font-sans)', letterSpacing: '.1em' }}>
          BUILD
        </text>
        <text x={158} y={18} fill="var(--ink-3)" style={{ font: '600 9px var(--font-sans)', letterSpacing: '.1em' }}>
          THE JVM PROCESS
        </text>

        {ZONES.map((z) => {
          const on = hot.has(z.id)
          const dim = any && !on
          const clickable = !!z.to && !!onOpen
          return (
            <g
              key={z.id}
              onClick={clickable ? () => onOpen!(z.to!) : undefined}
              style={{
                cursor: clickable ? 'pointer' : 'default',
                opacity: dim ? 0.34 : 1,
                transition: 'opacity .45s',
              }}
            >
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={4}
                fill={on ? 'var(--accent-soft)' : z.container ? 'none' : 'var(--surface-2)'}
                stroke={on ? 'var(--accent)' : 'var(--line-2)'}
                strokeWidth={on ? 1.5 : 1}
                strokeDasharray={z.container ? '4 4' : undefined}
                style={{ transition: 'fill .4s, stroke .4s, stroke-width .4s' }}
              />
              {z.title && (
                <text
                  x={z.x + 10}
                  y={z.y + (z.sub ? 19 : z.h / 2 + 4)}
                  fill={on ? 'var(--accent-ink)' : 'var(--ink)'}
                  style={{ font: '600 11px var(--font-sans)', transition: 'fill .4s' }}
                >
                  {z.title}
                </text>
              )}
              {z.sub && (
                <text x={z.x + 10} y={z.y + 33} fill="var(--ink-3)" style={{ font: '9px var(--font-mono)' }}>
                  {z.sub}
                </text>
              )}
              {clickable && (
                <text
                  x={z.x + z.w - 9}
                  y={z.y + 15}
                  textAnchor="end"
                  fill={on ? 'var(--accent)' : 'var(--ink-3)'}
                  style={{ font: '10px var(--font-mono)' }}
                >
                  ↗
                </text>
              )}
            </g>
          )
        })}

        <text x={172} y={240} fill="var(--ink-3)" style={{ font: '600 9px var(--font-sans)', letterSpacing: '.1em' }}>
          WHAT YOU WRITE
        </text>
      </svg>
    </Stage>
  )
}
