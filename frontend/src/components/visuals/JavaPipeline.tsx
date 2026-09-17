import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * How Java gets from source to running native code, and where the
 * portability actually comes from. Deliberately the toolchain view —
 * the runtime internals live in the JVM animation.
 * ------------------------------------------------------------------ */

const VB = { w: 680, h: 262 }

interface Node {
  id: string
  x: number
  y: number
  w: number
  h: number
  title: string
  sub?: string
}

const NODES: Node[] = [
  { id: 'src', x: 14, y: 96, w: 92, h: 46, title: 'Order.java', sub: 'source' },
  { id: 'javac', x: 126, y: 96, w: 86, h: 46, title: 'javac', sub: 'compiler' },
  { id: 'class', x: 232, y: 96, w: 96, h: 46, title: 'Order.class', sub: 'bytecode' },
  { id: 'jvm', x: 358, y: 62, w: 110, h: 42, title: 'JVM (Linux)', sub: 'x86-64' },
  { id: 'jvm2', x: 358, y: 110, w: 110, h: 42, title: 'JVM (macOS)', sub: 'arm64' },
  { id: 'jvm3', x: 358, y: 158, w: 110, h: 42, title: 'JVM (Windows)', sub: 'x86-64' },
  { id: 'interp', x: 494, y: 62, w: 104, h: 42, title: 'Interpreter', sub: 'runs it now' },
  { id: 'jit', x: 494, y: 110, w: 104, h: 42, title: 'JIT', sub: 'C1 → C2' },
  { id: 'native', x: 494, y: 158, w: 104, h: 42, title: 'Native code', sub: 'code cache' },
]

interface Frame {
  phase: string
  narration: string
  hot: string[]
  edges: [string, string][]
  token?: { x: number; y: number; label: string }
  caption?: string
}

const EDGES_BASE: [string, string][] = [
  ['src', 'javac'],
  ['javac', 'class'],
]

function build(): Frame[] {
  return [
    {
      phase: 'You write source',
      narration:
        'A .java file is just text. Nothing about it is platform-specific and nothing in it can run yet.',
      hot: ['src'],
      edges: [],
      token: { x: 60, y: 119, label: '.java' },
    },
    {
      phase: 'javac compiles — but not to machine code',
      narration:
        'javac does NOT produce an executable for your CPU. It produces bytecode: instructions for an abstract stack machine that no physical processor implements. It also does the type checking, so most of your errors are caught here, before anything runs.',
      hot: ['javac'],
      edges: [EDGES_BASE[0]],
      token: { x: 169, y: 119, label: '.java' },
    },
    {
      phase: 'Bytecode is the portable artifact',
      narration:
        'Order.class holds the constant pool, field and method descriptors, and the bytecode itself. THIS is the thing that is "write once, run anywhere" — not your source. Ship the same jar to every machine.',
      hot: ['class'],
      edges: EDGES_BASE,
      token: { x: 280, y: 119, label: '.class' },
      caption: 'javap -c Order.class will print it',
    },
    {
      phase: 'The JVM is the part that is NOT portable',
      narration:
        'There is a different JVM build for every OS and architecture, each one a native program. Portability is not magic in the bytecode — it is that someone has already written a JVM for your platform. Same artifact, different interpreter of it.',
      hot: ['jvm', 'jvm2', 'jvm3'],
      edges: [...EDGES_BASE, ['class', 'jvm'], ['class', 'jvm2'], ['class', 'jvm3']],
      caption: 'one artifact → many runtimes',
    },
    {
      phase: 'Loaded, verified, then interpreted',
      narration:
        'The JVM loads the class, verifies the bytecode is safe, and starts INTERPRETING — decoding one instruction at a time. Startup is immediate; throughput is poor. Every method begins life here.',
      hot: ['jvm2', 'interp'],
      edges: [...EDGES_BASE, ['class', 'jvm2'], ['jvm2', 'interp']],
      token: { x: 546, y: 83, label: 'run' },
    },
    {
      phase: 'The JIT notices what is hot',
      narration:
        'The JVM counts invocations and loop back-edges. Cross a threshold and the method is compiled to real machine code: C1 fast for decent code, then C2 for the aggressive work — inlining, escape analysis, dead code elimination, loop unrolling.',
      hot: ['jit'],
      edges: [...EDGES_BASE, ['class', 'jvm2'], ['jvm2', 'interp'], ['interp', 'jit']],
      caption: 'tiered compilation',
    },
    {
      phase: 'Now it runs as native code',
      narration:
        'The compiled version lands in the code cache and subsequent calls go straight there. This is why a warmed-up JVM can match C for long-running work, and why a benchmark measured in the first second measures nothing — you timed the interpreter.',
      hot: ['native', 'jit'],
      edges: [...EDGES_BASE, ['class', 'jvm2'], ['jvm2', 'interp'], ['interp', 'jit'], ['jit', 'native']],
      token: { x: 546, y: 179, label: 'fast' },
    },
    {
      phase: 'It can go backwards',
      narration:
        'C2 optimises on assumptions — "this call site has only ever seen one implementation". Load a second implementation and the assumption is invalid, so the JVM DEOPTIMISES: throws the compiled code away, returns to the interpreter, and recompiles. Steady-state performance can legitimately change mid-run.',
      hot: ['native', 'interp'],
      edges: [...EDGES_BASE, ['class', 'jvm2'], ['jvm2', 'interp'], ['interp', 'jit'], ['jit', 'native']],
      caption: 'deoptimisation',
    },
    {
      phase: 'Why any of this matters in an interview',
      narration:
        'Three things fall out of this picture. Compilation is ahead-of-time but to bytecode, so type errors are early and platform binding is late. Execution is adaptive, so performance is a curve not a number. And the JVM is free to optimise across your abstractions — which is why "this extra method call will be slow" is usually wrong, and why measuring beats reasoning.',
      hot: ['src', 'javac', 'class', 'jvm', 'jvm2', 'jvm3', 'interp', 'jit', 'native'],
      edges: [...EDGES_BASE, ['class', 'jvm'], ['class', 'jvm2'], ['class', 'jvm3'], ['jvm2', 'interp'], ['interp', 'jit'], ['jit', 'native']],
    },
  ]
}

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]))

export function JavaPipeline() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 3200)
  const f = frames[frame]
  const hot = new Set(f.hot)

  return (
    <Stage
      phase={f.phase}
      narration={f.narration}
      controls={controls}
      index={index}
      total={total}
      legend={
        f.caption ? (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--accent-ink)' }}>
            {f.caption}
          </span>
        ) : (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            the .class file is the portable artifact — the JVM is the platform-specific part
          </span>
        )
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="How Java runs">
        <text x={14} y={22} fill="var(--ink-3)" style={{ font: '600 9.5px var(--font-sans)', letterSpacing: '.1em' }}>
          BUILD TIME
        </text>
        <text x={358} y={22} fill="var(--ink-3)" style={{ font: '600 9.5px var(--font-sans)', letterSpacing: '.1em' }}>
          RUN TIME
        </text>
        <line x1={344} y1={30} x2={344} y2={232} stroke="var(--line-2)" strokeDasharray="3 4" />

        <defs>
          <marker id="jp-ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--line-2)" />
          </marker>
        </defs>

        {f.edges.map(([a, b], i) => {
          const from = byId[a]
          const to = byId[b]
          if (!from || !to) return null
          const x1 = from.x + from.w
          const y1 = from.y + from.h / 2
          const x2 = to.x
          const y2 = to.y + to.h / 2
          const mid = (x1 + x2) / 2
          return (
            <path
              key={i}
              d={`M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2 - 4} ${y2}`}
              fill="none"
              stroke="var(--line-2)"
              strokeWidth={1}
              markerEnd="url(#jp-ar)"
              style={{ transition: 'opacity .4s' }}
            />
          )
        })}

        {NODES.map((n) => {
          const on = hot.has(n.id)
          return (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={3}
                fill={on ? 'var(--accent-soft)' : 'var(--surface-2)'}
                stroke={on ? 'var(--accent)' : 'var(--line-2)'}
                strokeWidth={on ? 1.5 : 1}
                style={{ transition: 'fill .35s, stroke .35s, stroke-width .35s' }}
              />
              <text
                x={n.x + 9}
                y={n.y + 19}
                fill={on ? 'var(--accent-ink)' : 'var(--ink)'}
                style={{ font: '600 11px var(--font-sans)', transition: 'fill .35s' }}
              >
                {n.title}
              </text>
              {n.sub && (
                <text x={n.x + 9} y={n.y + 33} fill="var(--ink-3)" style={{ font: '9px var(--font-mono)' }}>
                  {n.sub}
                </text>
              )}
            </g>
          )
        })}

        {f.token && (
          <g
            transform={`translate(${f.token.x}, ${f.token.y})`}
            style={{ transition: 'transform .6s cubic-bezier(.4,0,.2,1)' }}
          >
            <rect x={-22} y={-9} width={44} height={18} rx={9} fill="var(--boss)" />
            <text x={0} y={4} textAnchor="middle" fill="var(--bg)" style={{ font: '600 9px var(--font-mono)' }}>
              {f.token.label}
            </text>
          </g>
        )}
      </svg>
    </Stage>
  )
}
