import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * HashMap: hashing, bucket selection, collision chaining, treeify and
 * resize. The table is drawn with 8 buckets for legibility; every
 * constant quoted in the narration is the real one.
 * ------------------------------------------------------------------ */

interface HNode {
  key: string
  hash: number
  bucket: number
  /** Position along the collision chain. */
  pos: number
  mark?: 'new' | 'probe' | 'tree' | 'moved'
}

interface Frame {
  phase: string
  narration: string
  cap: number
  nodes: HNode[]
  hot?: number
  /** Lines shown in the computation readout. */
  calc?: string[]
  size: number
}

const VB = { w: 680, h: 322 }
const TOP = 106
const ROW = 27
const BX = 118
const BW = 52
const NX = 186
const NW = 74
const NGAP = 8

const KEYS: { key: string; hash: number }[] = [
  { key: '"alice"', hash: 93110141 },
  { key: '"bob"', hash: 97714 },
  { key: '"carol"', hash: 94427452 },
  { key: '"dave"', hash: 3076010 },
  { key: '"erin"', hash: 3123477 },
  { key: '"frank"', hash: 97711389 },
  { key: '"grace"', hash: 98615748 },
]

const idx = (hash: number, cap: number) => hash & (cap - 1)

function build(): Frame[] {
  const frames: Frame[] = []
  let nodes: HNode[] = []
  let cap = 8

  const put = (k: { key: string; hash: number }, mark: HNode['mark'] = 'new') => {
    const b = idx(k.hash, cap)
    const pos = nodes.filter((n) => n.bucket === b).length
    nodes = [...nodes.map((n) => ({ ...n, mark: undefined })), { ...k, bucket: b, pos, mark }]
    return b
  }

  const snap = (phase: string, narration: string, hot?: number, calc?: string[]) =>
    frames.push({
      phase,
      narration,
      cap,
      nodes: nodes.map((n) => ({ ...n })),
      hot,
      calc,
      size: nodes.length,
    })

  snap(
    'An empty table',
    'A HashMap is an array of buckets plus a collision strategy. Default capacity is 16 and the load factor is 0.75, so it resizes at 12 entries. The table here is drawn with 8 buckets so the chains stay readable — everything else is exactly as the JDK does it.',
  )

  let b = put(KEYS[0])
  snap(
    'put("alice", …) — hash',
    'First the key\'s hashCode(), then HashMap spreads it: h ^ (h >>> 16). The bucket index is hash & (capacity − 1), which only looks at the LOW bits — so two keys differing only in their high bits would always collide. XOR-ing the high half down is what stops that.',
    b,
    [`hashCode()      = ${KEYS[0].hash}`, `spread          = h ^ (h >>> 16)`, `index = hash & (${cap} − 1) = ${b}`],
  )

  b = put(KEYS[1])
  snap(
    'A second key, a different bucket',
    'A different index, so it simply lands in its own bucket. With a good hash and a table that is not too full, this is the common case and get/put are O(1).',
    b,
    [`index = hash & (${cap} − 1) = ${b}`],
  )

  // force a collision into the same bucket as alice
  const collide = { key: '"carol"', hash: (KEYS[0].hash & ~(cap - 1)) | idx(KEYS[0].hash, cap) }
  b = put(collide)
  snap(
    'Collision',
    'Two different keys, two different hash codes, but the same INDEX — that is what a collision is. It does not mean the hashes are equal. The new entry is appended to the tail of the bucket\'s linked list; Java 7 prepended to the head, and the change to tail insertion is what removed the infinite-loop-on-resize bug.',
    b,
    [`carol index = ${b}`, `alice index = ${b}`, `→ same bucket, chained`],
  )

  nodes = nodes.map((n) => ({ ...n, mark: n.bucket === b ? 'probe' : undefined }))
  snap(
    'get("carol") — walking the chain',
    'Find the bucket, then walk it. For each node the comparison is: hashes equal first (cheap), then reference ==, only then equals(). That ordering is why a slow equals() rarely hurts — most candidates are rejected on the integer compare.',
    b,
    ['1. index → bucket', '2. hash == hash ?', '3. key == key ?', '4. key.equals(key) ?'],
  )

  for (let i = 3; i < 6; i++) {
    const forced = { key: KEYS[i].key, hash: (KEYS[i].hash & ~(cap - 1)) | b }
    put(forced)
  }
  snap(
    'A chain forming',
    'A poor hash — or a deliberate attack — piles everything into one bucket. Now lookup in that bucket is a linear scan: O(n). This is the degenerate case that makes people say "HashMap is O(n) worst case".',
    b,
    [`bucket ${b} length = ${nodes.filter((n) => n.bucket === b).length}`],
  )

  snap(
    'Too long a chain — resize, or treeify?',
    'This is the question people get wrong. A long bin does NOT automatically become a tree. treeifyBin() checks the table size first: if capacity < MIN_TREEIFY_CAPACITY (64) it calls resize() instead, on the reasoning that a small crowded table needs more buckets, not a tree. Only at 64 buckets or more does it actually build one.',
    b,
    ['bin length ≥ 8 on insert', 'capacity < 64  → resize()', 'capacity ≥ 64  → treeify this bin'],
  )

  nodes = nodes.map((n) => (n.bucket === b ? { ...n, mark: 'tree' } : n))
  snap(
    'Treeify — one bin, not the table',
    'With a big enough table that single bin becomes a red-black tree: O(n) → O(log n) for lookups in it. Every other bin stays a linked list. On the exact threshold: TREEIFY_THRESHOLD is 8 and the test is binCount >= 8 - 1 after appending, so you are inserting into a bin that ALREADY holds 8 — the ninth is what converts it. It orders by hash, then compareTo if the keys are Comparable, otherwise a tie-break on identity hash.',
    b,
  )

  nodes = nodes.map((n) => ({ ...n, mark: undefined }))
  snap(
    'And it can untreeify',
    'Trees are not permanent. When a resize splits a bin into its two halves, any half left with UNTREEIFY_THRESHOLD (6) nodes or fewer converts straight back to a linked list. A tree is a local, temporary response to a bad hash distribution — not a mode the map enters.',
    b,
  )

  nodes = nodes.map((n) => ({ ...n, mark: undefined }))
  snap(
    'Crossing the load factor',
    `A second, completely separate reason to resize. putVal ends with if (++size > threshold) resize() — that is the load factor, and it fires however short every chain is. So resize has two triggers (load factor, and a long bin in a small table) while treeify has one. size ${nodes.length} against threshold capacity × 0.75 = ${cap * 0.75}. Load factor is the trade: lower means fewer collisions and more memory, higher means a fuller, slower table. 0.75 is the JDK's compromise and is almost never worth changing.`,
    undefined,
    [`size      = ${nodes.length}`, `threshold = ${cap} × 0.75 = ${cap * 0.75}`, 'size > threshold → resize'],
  )

  const oldCap = cap
  cap = 16
  nodes = nodes.map((n) => {
    const nb = idx(n.hash, cap)
    return { ...n, bucket: nb, mark: nb !== n.bucket ? 'moved' : undefined }
  })
  // recompute chain positions
  const seen: Record<number, number> = {}
  nodes = nodes.map((n) => {
    seen[n.bucket] = (seen[n.bucket] ?? 0) + 1
    return { ...n, pos: seen[n.bucket] - 1 }
  })
  snap(
    'Resize — and the trick that makes it cheap',
    `The table doubled from ${oldCap} to ${cap}. Because capacity is always a power of two, one extra bit enters the mask — so an entry either stays at index i or moves to i + ${oldCap}, and nothing else. The JDK splits each chain into exactly those two lists without recomputing a single hash. That is why capacity is a power of two, not a prime.`,
    undefined,
    [`old index = hash & ${oldCap - 1}`, `new index = hash & ${cap - 1}`, `→ i  or  i + ${oldCap}`],
  )

  nodes = nodes.map((n) => ({ ...n, mark: undefined }))
  snap(
    'What breaks the contract',
    'Mutate a field that hashCode() uses after inserting the key, and the entry is now sitting in the bucket for its OLD hash. get() computes the new hash, looks in the new bucket, and finds nothing — the entry is unreachable but still counted in size(). That is the real reason keys should be immutable, and why records and Strings make such good keys.',
  )

  snap(
    'And the concurrency answer',
    'None of this is synchronised. Two threads resizing at once can corrupt the table — in Java 7 it could spin forever in a cycle; in Java 8 you more often lose entries. The fix is not Collections.synchronizedMap, which locks the whole map: it is ConcurrentHashMap, which locks per bucket and treeifies the same way.',
  )

  return frames
}

export function HashMapInternals() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 3200)
  const f = frames[frame]
  const rows = f.cap

  return (
    <Stage
      phase={f.phase}
      narration={f.narration}
      controls={controls}
      index={index}
      total={total}
      stats={[
        ['capacity', f.cap],
        ['size', f.size],
        ['threshold', f.cap * 0.75],
      ]}
      legend={
        <>
          <Sw fill="var(--accent)" label="entry" />
          <Sw fill="var(--boss)" label="being touched" />
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            chains grow to the right
          </span>
        </>
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${Math.max(VB.h, TOP + rows * ROW + 16)}`} width="100%" role="img" aria-label="HashMap internals">
        {/* computation readout */}
        {f.calc?.map((line, i) => (
          <text
            key={i}
            x={16}
            y={20 + i * 15}
            fill={i === (f.calc?.length ?? 0) - 1 ? 'var(--accent-ink)' : 'var(--ink-3)'}
            style={{ font: '11px var(--font-mono)' }}
          >
            {line}
          </text>
        ))}

        <text x={16} y={TOP - 16} fill="var(--ink-3)" style={{ font: '600 9.5px var(--font-sans)', letterSpacing: '.1em' }}>
          TABLE — Node&lt;K,V&gt;[]
        </text>

        {Array.from({ length: rows }).map((_, i) => {
          const y = TOP + i * ROW
          const on = f.hot === i
          return (
            <g key={i}>
              <text x={BX - 10} y={y + 15} textAnchor="end" fill="var(--ink-3)" style={{ font: '10px var(--font-mono)' }}>
                {i}
              </text>
              <rect
                x={BX}
                y={y}
                width={BW}
                height={ROW - 5}
                rx={2}
                fill={on ? 'var(--accent-soft)' : 'var(--surface-2)'}
                stroke={on ? 'var(--accent)' : 'var(--line-2)'}
                style={{ transition: 'fill .35s, stroke .35s' }}
              />
            </g>
          )
        })}

        {f.nodes.map((n) => {
          const x = NX + n.pos * (NW + NGAP)
          const y = TOP + n.bucket * ROW
          const tone =
            n.mark === 'probe' || n.mark === 'new' || n.mark === 'moved'
              ? 'var(--boss)'
              : n.mark === 'tree'
                ? 'var(--accent-ink)'
                : 'var(--accent)'
          return (
            <g
              key={n.key + n.hash}
              transform={`translate(${x}, ${y})`}
              style={{ transition: 'transform .55s cubic-bezier(.4,0,.2,1)' }}
            >
              <line x1={-NGAP} y1={(ROW - 5) / 2} x2={0} y2={(ROW - 5) / 2} stroke="var(--line-2)" />
              <rect
                width={NW}
                height={ROW - 5}
                rx={2}
                fill={tone}
                opacity={n.mark === 'tree' ? 0.85 : 1}
                style={{ transition: 'fill .35s' }}
              />
              <text x={6} y={15} fill="var(--bg)" style={{ font: '600 10px var(--font-mono)' }}>
                {n.key.replace(/"/g, '')}
              </text>
            </g>
          )
        })}
      </svg>
    </Stage>
  )
}

function Sw({ fill, label }: { fill: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="11" height="11" aria-hidden="true">
        <rect width="11" height="11" rx="2" fill={fill} />
      </svg>
      <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
        {label}
      </span>
    </span>
  )
}
