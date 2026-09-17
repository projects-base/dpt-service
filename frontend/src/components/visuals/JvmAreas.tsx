import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * A .class file travelling through the JVM: loaded, linked, initialised,
 * then executed — with a frame pushed onto a thread stack and the JIT
 * eventually taking over. Highlights say which box is doing the work.
 * ------------------------------------------------------------------ */

const VB = { w: 680, h: 300 }

interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
  title: string
  sub?: string
  group: 'loader' | 'data' | 'engine'
  perThread?: boolean
}

const BOXES: Box[] = [
  { id: 'load', x: 16, y: 40, w: 92, h: 40, title: 'Loading', sub: 'find + read bytes', group: 'loader' },
  { id: 'link', x: 16, y: 88, w: 92, h: 56, title: 'Linking', sub: 'verify → prepare → resolve', group: 'loader' },
  { id: 'init', x: 16, y: 152, w: 92, h: 40, title: 'Initialising', sub: '<clinit>, statics', group: 'loader' },

  { id: 'method', x: 140, y: 40, w: 150, h: 54, title: 'Metaspace', sub: 'class metadata · native memory', group: 'data' },
  { id: 'heap', x: 140, y: 102, w: 150, h: 64, title: 'Heap', sub: 'all objects · shared · GC lives here', group: 'data' },
  { id: 'stack', x: 140, y: 174, w: 150, h: 48, title: 'JVM stacks', sub: 'one per thread · frames', group: 'data', perThread: true },
  { id: 'pc', x: 140, y: 230, w: 72, h: 40, title: 'PC', sub: 'per thread', group: 'data', perThread: true },
  { id: 'native', x: 218, y: 230, w: 72, h: 40, title: 'Native', sub: 'per thread', group: 'data', perThread: true },

  { id: 'interp', x: 328, y: 40, w: 110, h: 44, title: 'Interpreter', sub: 'runs bytecode', group: 'engine' },
  { id: 'jit', x: 328, y: 92, w: 110, h: 60, title: 'JIT', sub: 'C1 → C2, on hot paths', group: 'engine' },
  { id: 'gc', x: 328, y: 160, w: 110, h: 44, title: 'GC', sub: 'reclaims the heap', group: 'engine' },
]

interface Frame {
  phase: string
  narration: string
  hot: string[]
  token?: { x: number; y: number; label: string }
  frames: number
  stw?: boolean
}

function build(): Frame[] {
  return [
    {
      phase: 'A class is requested',
      narration:
        'Something references OrderService for the first time. The JVM does not have it yet, so the class loader subsystem goes looking. Loading is lazy — a class is loaded on first active use, not at startup.',
      hot: ['load'],
      token: { x: 62, y: 60, label: '.class' },
      frames: 0,
    },
    {
      phase: 'Loading — delegation',
      narration:
        'The application loader asks its parent first, which asks its parent, up to the bootstrap loader. Only if no ancestor can find it does the child try. That parent-delegation order is what stops your classpath from shadowing java.lang.String.',
      hot: ['load'],
      token: { x: 62, y: 60, label: '.class' },
      frames: 0,
    },
    {
      phase: 'Linking — verify',
      narration:
        'The bytecode is verified: stack discipline, type safety, no jumps outside the method. This is why the JVM can run untrusted bytecode at all. A malformed class fails here with VerifyError.',
      hot: ['link'],
      token: { x: 62, y: 112, label: '.class' },
      frames: 0,
    },
    {
      phase: 'Linking — prepare',
      narration:
        'Static fields are allocated and set to DEFAULT values — 0, false, null. Not your initialisers yet. This is the gap that explains why a static field can be observed as 0 during a circular class initialisation.',
      hot: ['link', 'method'],
      token: { x: 62, y: 112, label: '.class' },
      frames: 0,
    },
    {
      phase: 'Linking — resolve',
      narration:
        'Symbolic references in the constant pool are turned into direct references. The spec allows this to be lazy, and HotSpot is lazy: a reference is resolved the first time the instruction executes.',
      hot: ['link', 'method'],
      frames: 0,
    },
    {
      phase: 'Initialising',
      narration:
        'Now <clinit> runs: static initialisers and static field assignments, in source order, exactly once, and thread-safely — the JVM holds a lock per class. That guarantee is what makes the static-holder singleton idiom correct without any synchronized of your own.',
      hot: ['init', 'method'],
      frames: 0,
    },
    {
      phase: 'Class metadata lands in Metaspace',
      narration:
        'The class structure lives in Metaspace, which is NATIVE memory, not the heap — that changed in Java 8 when PermGen was removed. It grows on demand, so a class-loader leak shows up as native memory growth and OutOfMemoryError: Metaspace, not as a heap problem.',
      hot: ['method'],
      frames: 0,
    },
    {
      phase: 'Object allocated',
      narration:
        'new OrderService() allocates in the heap — shared across all threads, which is precisely why it needs a garbage collector and why visibility between threads needs the memory model.',
      hot: ['heap'],
      token: { x: 215, y: 130, label: 'obj' },
      frames: 0,
    },
    {
      phase: 'Method invoked — a frame is pushed',
      narration:
        'Calling a method pushes a frame onto THIS thread\'s stack: local variables, operand stack, a reference to the constant pool. Each thread has its own stack, so locals are never shared — only what they point to, on the heap, is.',
      hot: ['stack', 'pc'],
      frames: 1,
    },
    {
      phase: 'Deeper call chain',
      narration:
        'Frames stack up as calls nest. The PC register tracks which instruction this thread is on. Run away with recursion and you exhaust this stack: StackOverflowError — a thread-local failure, nothing to do with the heap.',
      hot: ['stack', 'pc'],
      frames: 4,
    },
    {
      phase: 'Interpreted first',
      narration:
        'The execution engine starts by interpreting bytecode one instruction at a time. Startup is fast, throughput is poor. Every method begins life here.',
      hot: ['interp'],
      frames: 4,
    },
    {
      phase: 'It gets hot — JIT compiles it',
      narration:
        'Invocation and loop-back-edge counters cross a threshold, so the method is compiled: C1 quickly for decent code, then C2 for aggressive optimisation — inlining, escape analysis, loop unrolling. This is why a JVM benchmark must be warmed up before it means anything.',
      hot: ['jit', 'interp'],
      frames: 3,
    },
    {
      phase: 'Deoptimisation',
      narration:
        'C2 optimises on assumptions — "this call site only ever sees one implementation". Load a second implementation and the assumption breaks, so the JVM deoptimises back to the interpreter and recompiles. Your steady-state performance can legitimately change while the process runs.',
      hot: ['jit', 'interp'],
      frames: 3,
    },
    {
      phase: 'GC reclaims the heap',
      narration:
        'Meanwhile the collector works the heap. Note what it does NOT touch: thread stacks, the PC register, and Metaspace class metadata — those are reclaimed by their own rules. GC is a heap concern.',
      hot: ['gc', 'heap'],
      frames: 2,
      stw: true,
    },
    {
      phase: 'The whole picture',
      narration:
        'Three subsystems: the class loader brings classes in, the runtime data areas hold state — some shared (heap, Metaspace), some per-thread (stack, PC, native stack) — and the execution engine runs it. If you can draw the shared-versus-per-thread split, you can answer most JVM memory questions from first principles.',
      hot: ['load', 'link', 'init', 'method', 'heap', 'stack', 'pc', 'native', 'interp', 'jit', 'gc'],
      frames: 2,
    },
  ]
}

const GROUP_LABEL: Record<Box['group'], { title: string; x: number }> = {
  loader: { title: 'CLASS LOADER SUBSYSTEM', x: 16 },
  data: { title: 'RUNTIME DATA AREAS', x: 140 },
  engine: { title: 'EXECUTION ENGINE', x: 328 },
}

export function JvmAreas() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 3000)
  const f = frames[frame]
  const hot = new Set(f.hot)

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
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            <b style={{ color: 'var(--accent-ink)' }}>Highlighted</b> = doing the work this step
          </span>
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            dashed border = per-thread, not shared
          </span>
        </>
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="JVM architecture animation">
        {(Object.keys(GROUP_LABEL) as Box['group'][]).map((g) => (
          <text
            key={g}
            x={GROUP_LABEL[g].x}
            y={24}
            fill="var(--ink-3)"
            style={{ font: '600 9.5px var(--font-sans)', letterSpacing: '.1em' }}
          >
            {GROUP_LABEL[g].title}
          </text>
        ))}

        {BOXES.map((b) => {
          const on = hot.has(b.id)
          return (
            <g key={b.id} style={{ transition: 'opacity .3s' }}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={3}
                fill={on ? 'var(--accent-soft)' : 'var(--surface-2)'}
                stroke={on ? 'var(--accent)' : 'var(--line-2)'}
                strokeWidth={on ? 1.5 : 1}
                strokeDasharray={b.perThread ? '3 3' : undefined}
                style={{ transition: 'fill .35s, stroke .35s, stroke-width .35s' }}
              />
              <text
                x={b.x + 8}
                y={b.y + 17}
                fill={on ? 'var(--accent-ink)' : 'var(--ink)'}
                style={{ font: '600 11px var(--font-sans)', transition: 'fill .35s' }}
              >
                {b.title}
              </text>
              {b.sub && (
                <text x={b.x + 8} y={b.y + 30} fill="var(--ink-3)" style={{ font: '9px var(--font-sans)' }}>
                  {b.sub}
                </text>
              )}
              {/* stack frames stacking up */}
              {b.id === 'stack' &&
                Array.from({ length: f.frames }).map((_, i) => (
                  <rect
                    key={i}
                    x={b.x + 8 + i * 15}
                    y={b.y + b.h - 15}
                    width={12}
                    height={9}
                    rx={1.5}
                    fill="var(--accent)"
                    style={{ transition: 'opacity .3s' }}
                  />
                ))}
            </g>
          )
        })}

        {/* flow arrows */}
        <path d="M112 112 L136 112" stroke="var(--line-2)" strokeWidth={1} markerEnd="url(#ar)" />
        <path d="M294 112 L324 112" stroke="var(--line-2)" strokeWidth={1} markerEnd="url(#ar)" />
        <defs>
          <marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--line-2)" />
          </marker>
        </defs>

        {f.token && (
          <g
            transform={`translate(${f.token.x}, ${f.token.y})`}
            style={{ transition: 'transform .6s cubic-bezier(.4,0,.2,1)' }}
          >
            <rect x={-20} y={-9} width={40} height={18} rx={9} fill="var(--boss)" />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="var(--bg)"
              style={{ font: '600 9px var(--font-mono)' }}
            >
              {f.token.label}
            </text>
          </g>
        )}
      </svg>
    </Stage>
  )
}
