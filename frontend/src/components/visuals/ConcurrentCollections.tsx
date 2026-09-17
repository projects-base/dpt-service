import { useMemo } from 'react'
import { Stage, useFrames } from './Stage'

/* ------------------------------------------------------------------ *
 * Plain vs synchronized vs concurrent collections. The point the whole
 * thing turns on: lock GRANULARITY. Two threads writing different
 * buckets are serialised by a synchronized wrapper and run in parallel
 * on a ConcurrentHashMap.
 * ------------------------------------------------------------------ */

const VB = { w: 680, h: 330 }
const PW = 196
const PX = [22, 240, 458]
const BUCKET_Y = 96
const BUCKET_H = 22
const NBUCKETS = 4

type Who = 't1' | 't2'

interface Bucket {
  node?: string
  lockedBy?: Who
}

interface Panel {
  title: string
  sub: string
  /** Shown in the lock strip under the title. */
  lock?: string
  lockTone?: 'none' | 'held' | 'striped'
  buckets?: Bucket[]
  /** Free text instead of buckets, for the non-map frames. */
  lines?: string[]
  t1?: string
  t2?: string
  bad?: boolean
}

interface Frame {
  phase: string
  narration: string
  focus?: number
  panels: [Panel, Panel, Panel]
  note?: string
  bad?: string
}

const empty = (): Bucket[] => Array.from({ length: NBUCKETS }, () => ({}))
const withNodes = (m: Record<number, string>, locks: Record<number, Who> = {}): Bucket[] =>
  Array.from({ length: NBUCKETS }, (_, i) => ({ node: m[i], lockedBy: locks[i] }))

function build(): Frame[] {
  const HEADS = {
    plain: { title: 'HashMap', sub: 'no thread safety' },
    sync: { title: 'Collections.synchronizedMap', sub: 'one lock, whole map' },
    chm: { title: 'ConcurrentHashMap', sub: 'one lock per bin' },
  }

  return [
    {
      phase: 'Three answers to the same problem',
      narration:
        'All three store key/value pairs. What differs is what happens when two threads arrive at once — and the answer is not "safe or unsafe", it is how much of the structure gets locked.',
      panels: [
        { ...HEADS.plain, lock: 'no lock', lockTone: 'none', buckets: withNodes({ 0: 'a', 2: 'b' }) },
        { ...HEADS.sync, lock: 'map lock — free', lockTone: 'none', buckets: withNodes({ 0: 'a', 2: 'b' }) },
        { ...HEADS.chm, lock: 'per-bin', lockTone: 'striped', buckets: withNodes({ 0: 'a', 2: 'b' }) },
      ],
    },
    {
      phase: 'HashMap — nothing stops them',
      narration:
        'Both threads write at once with no coordination. Best case you lose an entry; worst case a concurrent resize leaves the table structurally broken. In Java 7 two threads resizing could build a cycle in a bin and spin a CPU at 100% forever. It does not throw — it just goes wrong, usually in production.',
      focus: 0,
      bad: 'silent corruption, no exception',
      panels: [
        {
          ...HEADS.plain,
          lock: 'no lock',
          lockTone: 'none',
          buckets: withNodes({ 0: 'a', 1: '?', 2: 'b', 3: '?' }),
          t1: 'writing bin 1',
          t2: 'writing bin 3',
          bad: true,
        },
        { ...HEADS.sync, lock: '', buckets: withNodes({ 0: 'a', 2: 'b' }) },
        { ...HEADS.chm, lock: '', buckets: withNodes({ 0: 'a', 2: 'b' }) },
      ],
    },
    {
      phase: 'synchronizedMap — correct, but one at a time',
      narration:
        'Every method is wrapped in synchronized on a single mutex. T1 takes it to write bin 1. T2 wants bin 3 — a completely different part of the table — and is BLOCKED anyway. Correctness at the cost of throughput: under contention this map performs like a single thread.',
      focus: 1,
      panels: [
        { ...HEADS.plain, lock: '', buckets: withNodes({ 0: 'a', 2: 'b' }) },
        {
          ...HEADS.sync,
          lock: 'map lock — T1',
          lockTone: 'held',
          buckets: withNodes({ 0: 'a', 1: 'x', 2: 'b' }, { 0: 't1', 1: 't1', 2: 't1', 3: 't1' }),
          t1: 'writing bin 1',
          t2: 'BLOCKED',
        },
        { ...HEADS.chm, lock: '', buckets: withNodes({ 0: 'a', 2: 'b' }) },
      ],
    },
    {
      phase: 'ConcurrentHashMap — both proceed',
      narration:
        'Since Java 8 there are no segments. A write locks the FIRST NODE of its own bin, using synchronized on that node — so T1 on bin 1 and T2 on bin 3 never meet. Contention only happens when two threads hit the same bin, which with a decent hash is rare.',
      focus: 2,
      note: 'lock granularity = one bin',
      panels: [
        { ...HEADS.plain, lock: '', buckets: withNodes({ 0: 'a', 2: 'b' }) },
        { ...HEADS.sync, lock: '', buckets: withNodes({ 0: 'a', 1: 'x', 2: 'b' }) },
        {
          ...HEADS.chm,
          lock: 'bins 1 and 3 held',
          lockTone: 'striped',
          buckets: withNodes({ 0: 'a', 1: 'x', 2: 'b', 3: 'y' }, { 1: 't1', 3: 't2' }),
          t1: 'writing bin 1',
          t2: 'writing bin 3',
        },
      ],
    },
    {
      phase: 'And an empty bin needs no lock at all',
      narration:
        'If the target bin is empty, ConcurrentHashMap does not lock anything — it CAS-es the new node straight into the table slot and retries if it loses. Locking only starts once a bin actually has a chain to walk. Java 7 used 16 fixed segments; Java 8 replaced that with CAS plus per-bin synchronized, which is both finer and cheaper.',
      focus: 2,
      note: 'CAS on empty bin, synchronized on the bin head otherwise',
      panels: [
        { ...HEADS.plain, lock: '', buckets: withNodes({ 0: 'a', 2: 'b' }) },
        { ...HEADS.sync, lock: '', buckets: withNodes({ 0: 'a', 1: 'x', 2: 'b' }) },
        {
          ...HEADS.chm,
          lock: 'no lock — CAS',
          lockTone: 'striped',
          buckets: withNodes({ 0: 'a', 1: 'x', 2: 'b', 3: 'y' }),
          t1: 'CAS into empty bin',
        },
      ],
    },
    {
      phase: 'The trap: a thread-safe map is not a thread-safe operation',
      narration:
        'This is the question that separates people. Each call is individually synchronised — and the pair is still a race. Two threads can both see the key missing and both put. Wrapping a map does nothing for COMPOUND actions; you need one atomic call.',
      focus: 1,
      bad: 'check-then-act — two locks, one race',
      panels: [
        {
          title: 'The broken idiom',
          sub: 'on any synchronized map',
          lines: ['if (!map.containsKey(k))', '    map.put(k, v);', '', '← lock released between', '   the two calls'],
          bad: true,
        },
        {
          title: 'The fix',
          sub: 'one atomic operation',
          lines: ['map.putIfAbsent(k, v);', 'map.computeIfAbsent(k, …);', 'map.merge(k, v, …);', '', 'ConcurrentHashMap only'],
        },
        {
          title: 'Why it matters',
          sub: '',
          lines: [
            'computeIfAbsent holds the',
            'bin lock across the whole',
            'compute — so the mapping',
            'function runs at most once',
            'per key.',
          ],
        },
      ],
    },
    {
      phase: 'Iterators behave differently too',
      narration:
        'A HashMap iterator is fail-fast: it checks a modCount and throws ConcurrentModificationException — best-effort only, never rely on it for correctness. ConcurrentHashMap is weakly consistent: it never throws, and reflects some state at or after the iterator was made. CopyOnWriteArrayList hands you a frozen snapshot of the array as it was when you asked.',
      panels: [
        {
          title: 'HashMap / ArrayList',
          sub: 'fail-fast',
          lines: ['modCount changed?', '→ ConcurrentModification', '   Exception', '', 'a bug detector, not', 'a safety guarantee'],
        },
        {
          title: 'ConcurrentHashMap',
          sub: 'weakly consistent',
          lines: ['never throws', 'sees some state at or', 'after creation', '', 'traverse while others', 'write — safely'],
        },
        {
          title: 'CopyOnWriteArrayList',
          sub: 'snapshot',
          lines: ['iterator is frozen at', 'creation', '', 'later writes are', 'invisible to it', 'remove() unsupported'],
        },
      ],
    },
    {
      phase: 'CopyOnWriteArrayList — reads never block',
      narration:
        'Every mutation locks, copies the ENTIRE backing array, mutates the copy and swaps the reference. Readers hold the old array and never take a lock, so reads are as fast as an ArrayList. Perfect for a listener list read constantly and changed twice a day. Catastrophic for anything write-heavy: every add is O(n).',
      focus: 2,
      note: 'read-mostly and small — or not at all',
      panels: [
        { title: 'ArrayList', sub: 'not safe', lines: ['fastest', 'single-threaded only'] },
        {
          title: 'synchronizedList',
          sub: 'one lock',
          lines: ['reads block too', 'iteration needs YOUR', 'synchronized block'],
        },
        {
          title: 'CopyOnWriteArrayList',
          sub: 'copy on every write',
          lines: ['reads: lock-free', 'writes: O(n) copy', '', 'listener lists, config', 'NOT a work queue'],
        },
      ],
    },
    {
      phase: 'Queues — and the one that gives you backpressure',
      narration:
        'For producer/consumer, reach for a BlockingQueue: put() blocks when full, take() blocks when empty, and a BOUNDED queue is how you get backpressure instead of an OutOfMemoryError. ConcurrentLinkedQueue is lock-free and unbounded — fast, but it will happily grow until the heap dies.',
      panels: [
        {
          title: 'ArrayBlockingQueue',
          sub: 'bounded, one lock',
          lines: ['fixed capacity', 'put/take block', '', 'backpressure by design'],
        },
        {
          title: 'LinkedBlockingQueue',
          sub: 'two locks',
          lines: ['separate head and tail', 'locks — producer and', 'consumer rarely meet', '', 'bound it explicitly'],
        },
        {
          title: 'ConcurrentLinkedQueue',
          sub: 'lock-free, unbounded',
          lines: ['CAS, never blocks', 'no capacity limit', '', 'size() is O(n) — do', 'not poll it in a loop'],
        },
      ],
    },
    {
      phase: 'Two more things they will ask',
      narration:
        'size() on a ConcurrentHashMap is an ESTIMATE — it sums striped counter cells rather than holding a global count, precisely to avoid the contention a single counter would cause. And null keys and values are forbidden: get() returning null would be ambiguous between "absent" and "mapped to null", and you cannot disambiguate with containsKey when another thread may write between the two calls.',
      panels: [
        {
          title: 'size()',
          sub: 'ConcurrentHashMap',
          lines: ['baseCount + CounterCell[]', 'striped to avoid', 'contention', '', 'an estimate under', 'concurrent writes'],
        },
        {
          title: 'null keys / values',
          sub: 'forbidden',
          lines: ['HashMap: allowed', 'ConcurrentHashMap: NPE', '', 'null return would be', 'ambiguous and you', 'cannot re-check safely'],
        },
        {
          title: 'Hashtable / Vector',
          sub: 'legacy',
          lines: ['synchronized on every', 'method since 1.0', '', 'no reason to choose', 'them in new code'],
        },
      ],
    },
    {
      phase: 'How to answer "which one"',
      narration:
        'Single-threaded, or confined to one thread? Plain HashMap — do not pay for safety you do not need. Shared and written concurrently? ConcurrentHashMap, and use its atomic compound methods rather than check-then-act. Read-mostly list that almost never changes? CopyOnWriteArrayList. Producer/consumer? A BOUNDED BlockingQueue. Collections.synchronizedX and Hashtable are what you inherit, not what you choose.',
      panels: [
        {
          title: 'Not shared',
          sub: '',
          lines: ['HashMap', 'ArrayList', '', 'fastest — no lock,', 'no copy'],
        },
        {
          title: 'Shared, written',
          sub: '',
          lines: ['ConcurrentHashMap', 'ConcurrentSkipListMap', '  (sorted)', '', 'use putIfAbsent /', 'computeIfAbsent'],
        },
        {
          title: 'Shared, read-mostly',
          sub: '',
          lines: ['CopyOnWriteArrayList', '', 'and for handoff:', 'ArrayBlockingQueue', '(bounded)'],
        },
      ],
    },
  ]
}

export function ConcurrentCollections() {
  const frames = useMemo(build, [])
  const { frame, controls, index, total } = useFrames(frames.length, 3600)
  const f = frames[frame]

  return (
    <Stage
      phase={f.phase}
      narration={f.narration}
      controls={controls}
      index={index}
      total={total}
      legend={
        f.bad ? (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--boss)', fontWeight: 600 }}>
            {f.bad}
          </span>
        ) : f.note ? (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--accent-ink)' }}>
            {f.note}
          </span>
        ) : (
          <span className="u-sans" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            what differs is how much of the structure a writer has to lock
          </span>
        )
      }
    >
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" role="img" aria-label="Collections versus concurrent collections">
        {f.panels.map((p, i) => {
          const x = PX[i]
          const dim = f.focus !== undefined && f.focus !== i
          const tone = p.bad ? 'var(--boss)' : f.focus === i ? 'var(--accent)' : 'var(--line-2)'
          return (
            <g key={i} style={{ opacity: dim ? 0.34 : 1, transition: 'opacity .45s' }}>
              <rect
                x={x}
                y={28}
                width={PW}
                height={278}
                rx={4}
                fill={f.focus === i ? 'var(--accent-soft)' : 'var(--surface-2)'}
                stroke={tone}
                strokeWidth={f.focus === i || p.bad ? 1.5 : 1}
                style={{ transition: 'fill .4s, stroke .4s' }}
              />
              <text
                x={x + 10}
                y={48}
                fill={p.bad ? 'var(--boss)' : 'var(--ink)'}
                style={{ font: '600 10.5px var(--font-sans)' }}
              >
                {p.title}
              </text>
              {p.sub && (
                <text x={x + 10} y={62} fill="var(--ink-3)" style={{ font: '9px var(--font-mono)' }}>
                  {p.sub}
                </text>
              )}

              {p.lock !== undefined && p.lock !== '' && (
                <>
                  <rect
                    x={x + 10}
                    y={70}
                    width={PW - 20}
                    height={18}
                    rx={9}
                    fill={p.lockTone === 'held' ? 'var(--boss-soft)' : 'none'}
                    stroke={
                      p.lockTone === 'held'
                        ? 'var(--boss)'
                        : p.lockTone === 'striped'
                          ? 'var(--accent)'
                          : 'var(--line-2)'
                    }
                  />
                  <text
                    x={x + PW / 2}
                    y={83}
                    textAnchor="middle"
                    fill={
                      p.lockTone === 'held'
                        ? 'var(--boss)'
                        : p.lockTone === 'striped'
                          ? 'var(--accent-ink)'
                          : 'var(--ink-3)'
                    }
                    style={{ font: '600 8.5px var(--font-mono)' }}
                  >
                    {p.lock}
                  </text>
                </>
              )}

              {p.buckets?.map((b, bi) => {
                const by = BUCKET_Y + bi * (BUCKET_H + 4)
                return (
                  <g key={bi}>
                    <rect
                      x={x + 10}
                      y={by}
                      width={PW - 20}
                      height={BUCKET_H}
                      rx={2}
                      fill={b.lockedBy ? 'var(--boss-soft)' : 'var(--surface)'}
                      stroke={b.lockedBy ? 'var(--boss)' : 'var(--line-2)'}
                      style={{ transition: 'fill .4s, stroke .4s' }}
                    />
                    <text x={x + 17} y={by + 15} fill="var(--ink-3)" style={{ font: '8.5px var(--font-mono)' }}>
                      {bi}
                    </text>
                    {b.node && (
                      <>
                        <rect x={x + 32} y={by + 4} width={34} height={14} rx={2} fill="var(--accent)" />
                        <text
                          x={x + 49}
                          y={by + 14}
                          textAnchor="middle"
                          fill="var(--bg)"
                          style={{ font: '600 8.5px var(--font-mono)' }}
                        >
                          {b.node}
                        </text>
                      </>
                    )}
                    {b.lockedBy && (
                      <text
                        x={x + PW - 17}
                        y={by + 15}
                        textAnchor="end"
                        fill="var(--boss)"
                        style={{ font: '600 8px var(--font-mono)' }}
                      >
                        🔒 {b.lockedBy.toUpperCase()}
                      </text>
                    )}
                  </g>
                )
              })}

              {p.lines?.map((l, li) => (
                <text
                  key={li}
                  x={x + 10}
                  y={BUCKET_Y + 4 + li * 16}
                  fill={li === 0 ? 'var(--ink)' : 'var(--ink-3)'}
                  style={{ font: `${li === 0 ? 600 : 400} 9.5px var(--font-mono)` }}
                >
                  {l}
                </text>
              ))}

              {(p.t1 || p.t2) && (
                <g>
                  {p.t1 && (
                    <text x={x + 10} y={252} fill="var(--accent-ink)" style={{ font: '600 9px var(--font-sans)' }}>
                      T1 · {p.t1}
                    </text>
                  )}
                  {p.t2 && (
                    <text
                      x={x + 10}
                      y={268}
                      fill={p.t2 === 'BLOCKED' ? 'var(--boss)' : 'var(--accent-ink)'}
                      style={{ font: '600 9px var(--font-sans)' }}
                    >
                      T2 · {p.t2}
                    </text>
                  )}
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </Stage>
  )
}
