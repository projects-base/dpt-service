import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * A deterministic walk through a generational heap: allocation, two
 * minor GCs with survivor copying and ageing, promotion, then a full
 * GC. Every narration line is something an interviewer actually asks.
 * ------------------------------------------------------------------ */

type Region = 'eden' | 's0' | 's1' | 'old' | 'gone'

interface Obj {
  id: number
  age: number
  live: boolean
  region: Region
}

interface Frame {
  phase: string
  stw: boolean
  narration: string
  objects: Obj[]
  counters: { minor: number; major: number; promoted: number }
}

/* --- geometry, in the SVG's own coordinate space --- */
const VB = { w: 680, h: 252 }
const BOX = { y: 52, h: 150 }
const REGIONS: Record<Exclude<Region, 'gone'>, { x: number; w: number; cols: number; label: string }> = {
  eden: { x: 18, w: 228, cols: 10, label: 'Eden' },
  s0: { x: 262, w: 76, cols: 3, label: 'S0' },
  s1: { x: 354, w: 76, cols: 3, label: 'S1' },
  old: { x: 446, w: 216, cols: 9, label: 'Old generation' },
}
const CELL = 21
const SIZE = 16

function slot(region: Region, i: number) {
  if (region === 'gone') return { x: VB.w / 2, y: BOX.y + BOX.h / 2, gone: true }
  const r = REGIONS[region]
  const col = i % r.cols
  const row = Math.floor(i / r.cols)
  return { x: r.x + 6 + col * CELL, y: BOX.y + 10 + row * CELL, gone: false }
}

/* --- the script --- */
function build(): Frame[] {
  const frames: Frame[] = []
  let id = 0
  let objects: Obj[] = []
  const counters = { minor: 0, major: 0, promoted: 0 }

  const snap = (phase: string, narration: string, stw = false) =>
    frames.push({
      phase,
      stw,
      narration,
      objects: objects.map((o) => ({ ...o })),
      counters: { ...counters },
    })

  // Deterministic liveness, so the story reads the same every run: one in
  // `surviveEvery` objects is still reachable when the collection happens.
  const allocFixed = (n: number, surviveEvery: number) => {
    for (let i = 0; i < n; i++) {
      const next = id++
      objects.push({ id: next, age: 0, live: next % surviveEvery === 0, region: 'eden' })
    }
  }

  snap(
    'Empty heap',
    'A fresh heap. Almost every object is born in Eden — the JVM bumps a pointer inside a thread-local buffer (TLAB), which is why allocation in Java is closer to a pointer increment than to malloc.',
  )

  allocFixed(12, 3)
  snap(
    'Allocation',
    'Twelve objects allocated into Eden. Nothing has been collected yet; the JVM is just moving the bump pointer. Filled squares are still reachable from a GC root, hollow ones have already gone unreachable.',
  )

  allocFixed(8, 3)
  snap(
    'Eden is full',
    'Eden has no room for the next allocation. That — not a timer, not System.gc() — is what triggers a young collection. This is the single most common thing candidates get wrong.',
  )

  counters.minor++
  snap(
    'Minor GC — mark',
    'Stop-the-world. Threads reach a safepoint and pause. The collector traces from GC roots (stack frames, static fields, JNI handles) and marks what is reachable. Cost is proportional to the LIVE set, not to the garbage — which is why a young collection is fast when most objects die young.',
    true,
  )

  // survivors copy to S0 with age 1, garbage disappears
  objects = objects
    .map((o) => {
      if (o.region !== 'eden') return o
      if (!o.live) return { ...o, region: 'gone' as Region }
      return { ...o, region: 's0' as Region, age: 1 }
    })
    .filter((o) => o.region !== 'gone')
  snap(
    'Minor GC — copy',
    'Survivors are COPIED into S0 and their age becomes 1. Eden is then declared empty in one move — no sweeping, no per-object free. This is a copying collector: dead objects cost nothing to reclaim.',
    true,
  )

  allocFixed(14, 3)
  snap(
    'Threads resume',
    'The pause ends and allocation continues in Eden. Note S1 is completely empty — one survivor space is always empty. That is the invariant that makes the copy possible.',
  )

  counters.minor++
  objects = objects
    .map((o) => {
      if (o.region === 'eden') {
        return o.live ? { ...o, region: 's1' as Region, age: 1 } : { ...o, region: 'gone' as Region }
      }
      if (o.region === 's0') {
        return o.live ? { ...o, region: 's1' as Region, age: o.age + 1 } : { ...o, region: 'gone' as Region }
      }
      return o
    })
    .filter((o) => o.region !== 'gone')
  snap(
    'Second minor GC',
    'Eden AND S0 are collected together; everything still alive lands in S1, ageing by one. The two survivor spaces swap roles on every collection. An object copied back and forth is being re-copied each time — that is the cost people forget when they shrink the survivor spaces.',
    true,
  )

  allocFixed(12, 3)
  counters.minor++
  objects = objects
    .map((o) => {
      if (o.region === 'eden') {
        return o.live ? { ...o, region: 's0' as Region, age: 1 } : { ...o, region: 'gone' as Region }
      }
      if (o.region === 's1') {
        if (!o.live) return { ...o, region: 'gone' as Region }
        const age = o.age + 1
        if (age >= 3) {
          counters.promoted++
          return { ...o, region: 'old' as Region, age }
        }
        return { ...o, region: 's0' as Region, age }
      }
      return o
    })
    .filter((o) => o.region !== 'gone')
  snap(
    'Promotion (tenuring)',
    'Objects that reached the tenuring threshold are promoted into the old generation. The threshold is adaptive and capped by -XX:MaxTenuringThreshold (15 by default). If a survivor space is too small the JVM promotes early — "premature promotion" — and the old generation fills with objects that were about to die anyway.',
    true,
  )

  allocFixed(16, 2)
  counters.minor++
  objects = objects
    .map((o) => {
      if (o.region === 'eden' || o.region === 's0') {
        if (!o.live) return { ...o, region: 'gone' as Region }
        const age = o.age + 1
        if (age >= 3) {
          counters.promoted++
          return { ...o, region: 'old' as Region, age }
        }
        return { ...o, region: 's1' as Region, age }
      }
      return o
    })
    .filter((o) => o.region !== 'gone')
  snap(
    'Old generation filling',
    'A few more cycles and the old generation is filling up. Everything so far has been a young collection: frequent, short, and it never touched the old generation.',
  )

  // kill some old objects so the full GC has something to do
  objects = objects.map((o) => (o.region === 'old' && o.id % 2 === 0 ? { ...o, live: false } : o))
  snap(
    'Old generation occupancy crosses the threshold',
    'Some tenured objects have since become garbage (hollow). A young collection will never reclaim them — only a collection of the old generation will. With G1 this is where a concurrent marking cycle starts; with Parallel it is where a full GC becomes inevitable.',
  )

  counters.major++
  objects = objects.filter((o) => !(o.region === 'old' && !o.live))
  snap(
    'Full GC — mark, sweep, compact',
    'The whole heap is collected and compacted. This is the expensive one: the pause scales with the LIVE set of the old generation, which is large by definition. It also collects Metaspace. A full GC every few seconds is the classic symptom of a leak or an undersized heap.',
    true,
  )

  snap(
    'Back to steady state',
    'Compacted, contiguous, and allocation is a pointer bump again. The whole design bets on one observation: the weak generational hypothesis — most objects die young. When your objects do not die young (a cache, a session map, a growing list) that bet fails and you see exactly the full-GC churn above.',
  )

  return frames
}

const REGION_NOTE: Record<string, string> = {
  eden: 'Where almost every object is born',
  s0: 'Survivor 0',
  s1: 'Survivor 1',
  old: 'Tenured — survivors that outlived the threshold',
}

export function GcLifecycle() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 2600)
  const f = frames[frame]

  // stable slot index per region so objects glide instead of jumping
  const positions = useMemo(() => {
    const counts: Record<string, number> = { eden: 0, s0: 0, s1: 0, old: 0, gone: 0 }
    const map = new Map<number, ReturnType<typeof slot>>()
    for (const o of f.objects) {
      map.set(o.id, slot(o.region, counts[o.region]++))
    }
    return map
  }, [f])

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
          <LegendSwatch fill="var(--accent)" label="reachable" />
          <LegendSwatch fill="none" stroke label="unreachable (garbage)" />
          <span className="u-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
            digit = object age (survived N collections)
          </span>
        </>
      }
      stats={[
        ['minor GCs', f.counters.minor],
        ['full GCs', f.counters.major],
        ['promoted', f.counters.promoted],
      ]}
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="Generational heap animation">
        {(Object.keys(REGIONS) as (keyof typeof REGIONS)[]).map((k) => {
          const r = REGIONS[k]
          return (
            <g key={k}>
              <rect
                x={r.x}
                y={BOX.y}
                width={r.w}
                height={BOX.h}
                rx={3}
                fill="var(--surface-2)"
                stroke="var(--line-2)"
                strokeWidth={1}
              />
              <text
                x={r.x}
                y={BOX.y - 20}
                fill="var(--ink-2)"
                style={{ font: '600 11px var(--font-sans)', letterSpacing: '.06em' }}
              >
                {r.label.toUpperCase()}
              </text>
              <text x={r.x} y={BOX.y - 7} fill="var(--ink-3)" style={{ font: '10px var(--font-sans)' }}>
                {REGION_NOTE[k]}
              </text>
            </g>
          )
        })}

        {/* young / old divider */}
        <line
          x1={(REGIONS.s1.x + REGIONS.s1.w + REGIONS.old.x) / 2}
          y1={BOX.y - 34}
          x2={(REGIONS.s1.x + REGIONS.s1.w + REGIONS.old.x) / 2}
          y2={BOX.y + BOX.h + 12}
          stroke="var(--line-2)"
          strokeDasharray="3 4"
        />
        <text
          x={REGIONS.eden.x}
          y={BOX.y + BOX.h + 22}
          fill="var(--ink-3)"
          style={{ font: '10px var(--font-sans)' }}
        >
          Young generation — collected often, briefly
        </text>
        <text
          x={REGIONS.old.x}
          y={BOX.y + BOX.h + 22}
          fill="var(--ink-3)"
          style={{ font: '10px var(--font-sans)' }}
        >
          Collected rarely, expensively
        </text>

        {f.objects.map((o) => {
          const p = positions.get(o.id)!
          return (
            <g
              key={o.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ transition: 'transform .55s cubic-bezier(.4,0,.2,1), opacity .3s' }}
            >
              <rect
                width={SIZE}
                height={SIZE}
                rx={2.5}
                fill={o.live ? 'var(--accent)' : 'none'}
                stroke={o.live ? 'var(--accent)' : 'var(--ink-3)'}
                strokeWidth={1}
                strokeDasharray={o.live ? undefined : '2 2'}
                style={{ transition: 'fill .35s, stroke .35s' }}
              />
              {o.age > 0 && o.live && (
                <text
                  x={SIZE / 2}
                  y={SIZE / 2 + 3.5}
                  textAnchor="middle"
                  style={{ font: '600 9px var(--font-mono)' }}
                  fill="var(--bg)"
                >
                  {o.age}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </Stage>
  )
}

function LegendSwatch({ fill, stroke, label }: { fill: string; stroke?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="11" height="11" aria-hidden="true">
        <rect
          width="11"
          height="11"
          rx="2"
          fill={fill}
          stroke={stroke ? 'var(--ink-3)' : fill}
          strokeDasharray={stroke ? '2 2' : undefined}
        />
      </svg>
      <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
        {label}
      </span>
    </span>
  )
}
