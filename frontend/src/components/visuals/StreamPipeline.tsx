import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * Streams: laziness, element-at-a-time traversal, short-circuiting,
 * stateful barriers, Collectors, then parallel split/combine.
 * The misconception this exists to kill: that filter runs over the
 * whole list, then map runs over the whole list.
 * ------------------------------------------------------------------ */

const VB = { w: 680, h: 300 }

interface Lane {
  /** x centre of the lane. */
  x: number
  label: string
}

interface Token {
  id: number
  /** 0 = source, 1..stages.length = after that stage, -1 = dropped. */
  stage: number
  lane: number
  value: string
  dropped?: boolean
}

interface Frame {
  phase: string
  narration: string
  code: string[]
  /** Which code line is executing. */
  codeHot?: number
  stages: string[]
  lanes: Lane[]
  tokens: Token[]
  sink: string[]
  barrier?: number
  note?: string
}

const SINGLE: Lane[] = [{ x: 340, label: '' }]
const PAR: Lane[] = [
  { x: 190, label: 'worker 1' },
  { x: 340, label: 'worker 2' },
  { x: 490, label: 'worker 3' },
]

const STAGES = ['stream()', 'filter(n -> n % 2 == 0)', 'map(n -> n * 10)', 'collect(toList())']

function build(): Frame[] {
  const f: Frame[] = []
  const code = [
    'List<Integer> out = nums.stream()',
    '    .filter(n -> n % 2 == 0)',
    '    .map(n -> n * 10)',
    '    .collect(Collectors.toList());',
  ]

  const push = (p: Omit<Frame, 'code' | 'stages' | 'lanes'> & Partial<Pick<Frame, 'stages' | 'lanes'>>) =>
    f.push({ code, stages: STAGES, lanes: SINGLE, ...p } as Frame)

  push({
    phase: 'Nothing has run yet',
    narration:
      'filter and map are INTERMEDIATE operations. Calling them builds a pipeline and returns a new stream — no element has been touched. Drop the terminal operation and this code does literally nothing, which is the classic "my stream did not run" bug.',
    codeHot: 1,
    tokens: [],
    sink: [],
    note: 'lazy — pipeline only described so far',
  })

  push({
    phase: 'The terminal operation starts it',
    narration:
      'collect() is terminal: it pulls. Only now does the source get traversed. A stream is single-use — pull it twice and you get IllegalStateException: stream has already been operated upon or closed.',
    codeHot: 3,
    tokens: [{ id: 1, stage: 0, lane: 0, value: '1' }],
    sink: [],
  })

  push({
    phase: 'One element, all the way down',
    narration:
      'Element 1 enters filter. This is the part people get wrong: filter does NOT run over the whole list before map starts. Each element is pushed through the entire pipeline before the next one is fetched — depth-first, not stage-by-stage.',
    codeHot: 1,
    tokens: [{ id: 1, stage: 1, lane: 0, value: '1' }],
    sink: [],
  })

  push({
    phase: '1 is odd — dropped',
    narration:
      'It fails the predicate, so it is discarded right there. map never sees it and the lambda is never invoked for it. With a big source and a selective filter, that is most of the work avoided.',
    codeHot: 1,
    tokens: [{ id: 1, stage: 1, lane: 0, value: '1', dropped: true }],
    sink: [],
  })

  push({
    phase: 'Next element',
    narration: '2 passes the predicate and moves on to map. Still only one element in flight.',
    codeHot: 2,
    tokens: [{ id: 2, stage: 2, lane: 0, value: '2' }],
    sink: [],
  })

  push({
    phase: 'Into the collector',
    narration:
      'map turns 2 into 20 and the collector accumulates it. A Collector is three things: a supplier that makes the container, an accumulator that folds one element in, and a combiner used only when running in parallel.',
    codeHot: 3,
    tokens: [{ id: 2, stage: 3, lane: 0, value: '20' }],
    sink: ['20'],
  })

  push({
    phase: 'Repeat, one at a time',
    narration:
      'The loop continues: 3 dropped, 4 → 40, 5 dropped, 6 → 60. Total lambda invocations: filter six times, map three times. Stage-by-stage evaluation would have been six and six, with an intermediate list allocated in between.',
    codeHot: 3,
    tokens: [{ id: 6, stage: 3, lane: 0, value: '60' }],
    sink: ['20', '40', '60'],
  })

  push({
    phase: 'Short-circuiting',
    narration:
      'Add .limit(2) or use findFirst / anyMatch and the source stops being pulled the moment the answer is known. That is why an infinite stream — Stream.iterate, a generator — is usable at all, and why order of operations matters: filter before map does less work than map before filter.',
    codeHot: 3,
    stages: ['stream()', 'filter(…)', 'map(…)', 'limit(2) → stop'],
    tokens: [{ id: 4, stage: 3, lane: 0, value: '40' }],
    sink: ['20', '40'],
    note: 'source never fully traversed',
  })

  push({
    phase: 'Stateful operations are barriers',
    narration:
      'sorted() and distinct() cannot emit anything until they have seen everything, so they buffer the whole stream and break the one-at-a-time flow. They also defeat short-circuiting and are the usual reason a "lazy" pipeline suddenly allocates. Know which ops are stateful: sorted, distinct, limit and skip.',
    codeHot: 2,
    stages: ['stream()', 'filter(…)', 'sorted()  ← barrier', 'collect(…)'],
    tokens: [
      { id: 1, stage: 2, lane: 0, value: '6' },
      { id: 2, stage: 2, lane: 0, value: '2' },
      { id: 3, stage: 2, lane: 0, value: '4' },
    ],
    sink: [],
    barrier: 2,
    note: 'buffering — nothing downstream yet',
  })

  push({
    phase: 'parallelStream()',
    narration:
      'The Spliterator splits the source into chunks and the chunks run on the common ForkJoinPool — which by default has (cores − 1) threads and is shared by the whole JVM. An ArrayList splits perfectly in half by index; a LinkedList or an IO-backed source barely splits at all, which is the first thing to check before reaching for parallel.',
    codeHot: 0,
    lanes: PAR,
    tokens: [
      { id: 1, stage: 1, lane: 0, value: '1,2' },
      { id: 2, stage: 1, lane: 1, value: '3,4' },
      { id: 3, stage: 1, lane: 2, value: '5,6' },
    ],
    sink: [],
    note: 'ForkJoinPool.commonPool()',
  })

  push({
    phase: 'Combine',
    narration:
      'Each worker builds a partial result and the collector\'s combiner merges them. The combiner must be associative and the accumulator must not touch shared mutable state — this is exactly why you use collect() rather than forEach with an external list. Break that and you get lost elements, not an exception.',
    lanes: PAR,
    codeHot: 3,
    tokens: [
      { id: 1, stage: 3, lane: 0, value: '20' },
      { id: 2, stage: 3, lane: 1, value: '40' },
      { id: 3, stage: 3, lane: 2, value: '60' },
    ],
    sink: ['20', '40', '60'],
    note: 'partial results merged',
  })

  push({
    phase: 'When parallel actually loses',
    narration:
      'Small N — the fork/join overhead dwarfs the work. Boxed Integers — pointer chasing kills it, use IntStream. An ordered collector or forEachOrdered — you pay to restore order you asked to lose. Blocking IO inside the lambda — you starve the common pool for every other user in the JVM. Measure it; parallel is a hypothesis, not an optimisation.',
    lanes: PAR,
    tokens: [],
    sink: ['20', '40', '60'],
  })

  return f
}

export function StreamPipeline() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 3400)
  const f = frames[frame]

  const stageY = (i: number) => 78 + i * 46

  return (
    <Stage
      phase={f.phase}
      narration={f.narration}
      controls={controls}
      index={index}
      total={total}
      legend={
        f.note ? (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--accent-ink)' }}>
            {f.note}
          </span>
        ) : (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            each element is pushed through every stage before the next is fetched
          </span>
        )
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="Stream pipeline animation">
        {/* code */}
        {f.code.map((line, i) => (
          <text
            key={i}
            x={14}
            y={16 + i * 14}
            fill={f.codeHot === i ? 'var(--accent-ink)' : 'var(--ink-3)'}
            style={{ font: `${f.codeHot === i ? 600 : 400} 10.5px var(--font-mono)`, transition: 'fill .3s' }}
          >
            {line}
          </text>
        ))}

        {/* lanes */}
        {f.lanes.map((ln, li) => (
          <g key={li}>
            {ln.label && (
              <text x={ln.x} y={68} textAnchor="middle" fill="var(--ink-3)" style={{ font: '9.5px var(--font-sans)' }}>
                {ln.label}
              </text>
            )}
            {f.stages.map((_, si) => (
              <line
                key={si}
                x1={ln.x}
                y1={stageY(si) + 22}
                x2={ln.x}
                y2={stageY(si + 1)}
                stroke="var(--line-2)"
                strokeDasharray="2 3"
              />
            ))}
          </g>
        ))}

        {/* stage bars */}
        {f.stages.map((s, i) => {
          const isBarrier = f.barrier === i
          return (
            <g key={i}>
              <rect
                x={120}
                y={stageY(i)}
                width={440}
                height={22}
                rx={3}
                fill={isBarrier ? 'var(--boss-soft)' : 'var(--surface-2)'}
                stroke={isBarrier ? 'var(--boss)' : 'var(--line-2)'}
                style={{ transition: 'fill .35s, stroke .35s' }}
              />
              <text
                x={130}
                y={stageY(i) + 15}
                fill={isBarrier ? 'var(--boss)' : 'var(--ink-2)'}
                style={{ font: '600 10.5px var(--font-mono)' }}
              >
                {s}
              </text>
            </g>
          )
        })}

        {/* tokens */}
        {f.tokens.map((t) => {
          const lane = f.lanes[t.lane] ?? f.lanes[0]
          const y = stageY(t.stage) + (t.stage === 0 ? -16 : 11)
          return (
            <g
              key={t.id}
              transform={`translate(${lane.x}, ${y})`}
              style={{ transition: 'transform .6s cubic-bezier(.4,0,.2,1), opacity .4s' }}
              opacity={t.dropped ? 0.35 : 1}
            >
              <rect
                x={-17}
                y={-9}
                width={34}
                height={18}
                rx={9}
                fill={t.dropped ? 'none' : 'var(--accent)'}
                stroke={t.dropped ? 'var(--ink-3)' : 'var(--accent)'}
                strokeDasharray={t.dropped ? '2 2' : undefined}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill={t.dropped ? 'var(--ink-3)' : 'var(--bg)'}
                style={{ font: '600 9.5px var(--font-mono)' }}
              >
                {t.value}
              </text>
              {t.dropped && (
                <text x={24} y={4} fill="var(--ink-3)" style={{ font: '9px var(--font-sans)' }}>
                  dropped
                </text>
              )}
            </g>
          )
        })}

        {/* sink */}
        <text x={120} y={stageY(4) + 6} fill="var(--ink-3)" style={{ font: '600 9.5px var(--font-sans)', letterSpacing: '.09em' }}>
          RESULT
        </text>
        {f.sink.map((v, i) => (
          <g key={i} transform={`translate(${186 + i * 40}, ${stageY(4) - 8})`}>
            <rect width={32} height={18} rx={3} fill="var(--accent-soft)" stroke="var(--accent)" />
            <text x={16} y={13} textAnchor="middle" fill="var(--accent-ink)" style={{ font: '600 9.5px var(--font-mono)' }}>
              {v}
            </text>
          </g>
        ))}
      </svg>
    </Stage>
  )
}
