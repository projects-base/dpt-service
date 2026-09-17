import { lazy, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Detail, DetailEmpty, ListRow, Panes } from '../components/Panes'
import { Pill } from '../components/ui'
import { useProgress } from '../lib/progress'

const GcLifecycle = lazy(() => import('../components/visuals/GcLifecycle').then((m) => ({ default: m.GcLifecycle })))
const JvmAreas = lazy(() => import('../components/visuals/JvmAreas').then((m) => ({ default: m.JvmAreas })))
const Collectors = lazy(() => import('../components/visuals/Collectors').then((m) => ({ default: m.Collectors })))
const JavaPipeline = lazy(() => import('../components/visuals/JavaPipeline').then((m) => ({ default: m.JavaPipeline })))
const StreamPipeline = lazy(() => import('../components/visuals/StreamPipeline').then((m) => ({ default: m.StreamPipeline })))
const HashMapInternals = lazy(() => import('../components/visuals/HashMapInternals').then((m) => ({ default: m.HashMapInternals })))
const ThreadsAndLocks = lazy(() => import('../components/visuals/ThreadsAndLocks').then((m) => ({ default: m.ThreadsAndLocks })))
const WholePicture = lazy(() => import('../components/visuals/WholePicture').then((m) => ({ default: m.WholePicture })))
const ConcurrentCollections = lazy(() =>
  import('../components/visuals/ConcurrentCollections').then((m) => ({ default: m.ConcurrentCollections })),
)

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

interface Visual {
  id: string
  title: string
  blurb: string
  /** Topic ids this backs up, for the "then drill it" link. */
  drillTopic?: string
  asked: string[]
  videos: { label: string; note: string; url: string }[]
  render: (open: (visualId: string) => void) => ReactElement
}

export const VISUALS: Visual[] = [
  {
    id: 'whole-picture',
    title: 'The whole picture',
    blurb: 'Every other animation in its place — build, the JVM, the heap, threads, and your code on top. Zones are clickable.',
    asked: [
      'Walk me through what happens when you run a Java program',
      'Where does the garbage collector fit in all this?',
      'What is shared between threads and what is not?',
      'Why is a HashMap both a GC concern and a concurrency concern?',
    ],
    videos: [
      {
        label: 'The JVM end to end',
        note: 'Start here if the whole stack still feels like separate topics.',
        url: yt('java virtual machine architecture overview heap threads garbage collection'),
      },
    ],
    render: (open) => <WholePicture onOpen={open} />,
  },
  {
    id: 'how-java-works',
    title: 'How Java actually runs',
    blurb: 'Source → bytecode → JVM → interpreter → JIT → native, and where portability really comes from.',
    drillTopic: 'java--1-oop-language-fundamentals',
    asked: [
      'What does javac actually produce?',
      'What makes Java platform-independent?',
      'Interpreted or compiled — which is Java?',
      'What is the JIT, and what are C1 and C2?',
      'Why does a JVM benchmark need warming up?',
    ],
    videos: [
      {
        label: 'How the JVM executes bytecode',
        note: 'Search results; prefer one that shows javap output next to the source.',
        url: yt('how java works javac bytecode JVM interpreter JIT explained'),
      },
      {
        label: 'JIT and tiered compilation',
        note: 'C1, C2, deoptimisation and why warmup matters.',
        url: yt('java JIT tiered compilation C1 C2 deoptimization explained'),
      },
    ],
    render: () => <JavaPipeline />,
  },
  {
    id: 'hashmap',
    title: 'HashMap & collisions',
    blurb: 'Hashing, bucket selection, chaining, treeify at 8, and the power-of-two resize trick.',
    drillTopic: 'java--2-collections-framework',
    asked: [
      'How does HashMap work internally?',
      'What happens on a collision?',
      'Why is the capacity always a power of two?',
      'When does a bucket become a tree?',
      'What breaks if you mutate a key after inserting it?',
      'Why is HashMap unsafe under concurrency?',
    ],
    videos: [
      {
        label: 'HashMap internals — buckets, chaining, treeify',
        note: 'Search results; look for one that walks the JDK source.',
        url: yt('java hashmap internal working collision treeify resize explained'),
      },
      {
        label: 'ConcurrentHashMap vs synchronizedMap',
        note: 'The follow-up that always comes next.',
        url: yt('concurrenthashmap vs synchronizedmap vs hashtable java explained'),
      },
    ],
    render: () => <HashMapInternals />,
  },
  {
    id: 'concurrent-collections',
    title: 'Collections vs concurrent',
    blurb: 'Lock granularity side by side: HashMap, synchronizedMap and ConcurrentHashMap under two threads.',
    drillTopic: 'java--2-collections-framework',
    asked: [
      'Difference between HashMap, Hashtable and ConcurrentHashMap',
      'Why is Collections.synchronizedMap not enough?',
      'How does ConcurrentHashMap lock — segments or something else?',
      'Fail-fast vs weakly consistent iterators',
      'When would you use CopyOnWriteArrayList?',
      'Why does ConcurrentHashMap forbid null keys and values?',
      'Which queue for producer/consumer, and why bounded?',
    ],
    videos: [
      {
        label: 'ConcurrentHashMap internals since Java 8',
        note: 'Search results; make sure it covers the Java 8 change away from segments.',
        url: yt('concurrenthashmap java 8 internal working CAS synchronized bin no segments'),
      },
      {
        label: 'BlockingQueue and producer/consumer',
        note: 'Bounded queues as backpressure rather than an OOM.',
        url: yt('java blockingqueue producer consumer bounded backpressure explained'),
      },
    ],
    render: () => <ConcurrentCollections />,
  },
  {
    id: 'streams',
    title: 'Streams, Collectors & parallel',
    blurb: 'Laziness, element-at-a-time traversal, short-circuiting, barriers, then fork/join split and combine.',
    drillTopic: 'java--3-java-8-21-features-very-likely-at-5-yrs',
    asked: [
      'What is lazy evaluation in a stream?',
      'Does filter run over the whole list before map?',
      'What is a terminal vs intermediate operation?',
      'Which operations are stateful, and why does that matter?',
      'How does a Collector work — supplier, accumulator, combiner?',
      'When is parallelStream a bad idea?',
    ],
    videos: [
      {
        label: 'Stream laziness and the pipeline',
        note: 'Search results; the good ones trace one element through every stage.',
        url: yt('java stream lazy evaluation pipeline intermediate terminal explained'),
      },
      {
        label: 'Parallel streams and the common ForkJoinPool',
        note: 'Including why blocking IO inside a parallel stream is a trap.',
        url: yt('java parallel stream forkjoinpool common pool pitfalls'),
      },
    ],
    render: () => <StreamPipeline />,
  },
  {
    id: 'threads',
    title: 'Threads, races & locks',
    blurb: 'Working copies, a lost update, visibility vs atomicity, synchronized, CAS, thread states and deadlock.',
    drillTopic: 'java--5-concurrency-multithreading-heavily-asked',
    asked: [
      'Why is count++ not atomic?',
      'What does volatile actually guarantee — and what does it not?',
      'Difference between BLOCKED and WAITING',
      'How does synchronized give you visibility as well as exclusion?',
      'How would you detect and fix a deadlock?',
      'How do you size a thread pool?',
    ],
    videos: [
      {
        label: 'The Java Memory Model, visually',
        note: 'Search results; prefer one that draws per-thread caches against main memory.',
        url: yt('java memory model happens before volatile visibility explained'),
      },
      {
        label: 'synchronized, locks and CAS',
        note: 'Monitors, AtomicInteger and when lock-free actually wins.',
        url: yt('java synchronized vs lock vs atomic CAS compare and swap explained'),
      },
    ],
    render: () => <ThreadsAndLocks />,
  },
  {
    id: 'gc-lifecycle',
    title: 'Object lifecycle & GC',
    blurb: 'Eden → survivors → tenured, with ageing, promotion and a full GC. Step through it.',
    drillTopic: 'company--6-java-concepts-i-memory-management-end-to-end',
    asked: [
      'Walk me through what happens when Eden fills up',
      'Minor vs major vs full GC',
      'Why are there two survivor spaces?',
      'What is the tenuring threshold?',
      'What causes premature promotion?',
    ],
    videos: [
      {
        label: 'Java garbage collection — Eden, survivor, tenured',
        note: 'Search results; look for one that draws the heap rather than reading slides.',
        url: yt('java garbage collection eden survivor tenured explained animation'),
      },
      {
        label: 'Visualising GC with real logs',
        note: 'Pair the animation with actual -Xlog:gc* output so you recognise it live.',
        url: yt('java gc log analysis Xlog gc explained'),
      },
    ],
    render: () => <GcLifecycle />,
  },
  {
    id: 'jvm-areas',
    title: 'How the JVM runs a class',
    blurb: 'Load → link → initialise, the runtime data areas, then interpreter and JIT.',
    drillTopic: 'java--4-jvm-memory-gc',
    asked: [
      'Walk me through the JVM memory model — what areas exist and what lives where',
      'Stack vs heap — what actually goes where',
      'What changed when PermGen became Metaspace?',
      'What is class loader delegation and why does it matter?',
      'StackOverflowError vs OutOfMemoryError',
    ],
    videos: [
      {
        label: 'JVM architecture walkthrough',
        note: 'Search results; prefer one that separates per-thread from shared areas.',
        url: yt('JVM architecture class loader runtime data areas execution engine explained'),
      },
      {
        label: 'JIT compilation and warmup',
        note: 'Why benchmarks need warming up, C1 vs C2, deoptimisation.',
        url: yt('java JIT compiler C1 C2 tiered compilation explained'),
      },
      {
        label: 'Inside Java (official channel)',
        note: 'Oracle’s own channel — deeper talks once the basics are solid.',
        url: 'https://www.youtube.com/@java',
      },
    ],
    render: () => <JvmAreas />,
  },
  {
    id: 'collectors',
    title: 'Choosing a collector',
    blurb: 'Serial, Parallel, G1 and ZGC drawn as pause shape rather than throughput numbers.',
    drillTopic: 'java--4-jvm-memory-gc',
    asked: [
      'Which garbage collectors do you know, and when would you pick each?',
      'What is a stop-the-world pause, and what is a safepoint?',
      'Why is G1 the default?',
      'How would you tune GC for a latency-sensitive service?',
    ],
    videos: [
      {
        label: 'G1 explained',
        note: 'Regions, concurrent marking, and the pause-time goal.',
        url: yt('G1 garbage collector explained regions concurrent marking'),
      },
      {
        label: 'ZGC / Shenandoah — sub-millisecond pauses',
        note: 'Coloured pointers and load barriers, at a level you can repeat.',
        url: yt('ZGC shenandoah colored pointers load barriers explained'),
      },
    ],
    render: () => <Collectors />,
  },
]

export function Visuals() {
  const { visualId } = useParams()
  const navigate = useNavigate()
  const { progress, toggleBookmark } = useProgress()
  const visual = VISUALS.find((v) => v.id === visualId)

  const list = (
    <div>
      {VISUALS.map((v) => (
        <ListRow
          key={v.id}
          active={v.id === visualId}
          title={v.title}
          sub={v.blurb}
          starred={!!progress.bookmarks[`visual:${v.id}`]}
          onStar={() => toggleBookmark(`visual:${v.id}`)}
          onClick={() => navigate(`/visuals/${v.id}`)}
        />
      ))}
      <p className="meta px-4 py-5" style={{ borderTop: '1px solid var(--line)' }}>
        Step with <span className="u-mono">←</span> <span className="u-mono">→</span>. Each step is a
        thing you can be asked to explain — read the caption, then say it out loud before you advance.
      </p>
    </div>
  )

  const detail = visual ? (
    <Detail>
      <h1 className="h-sec mb-2">{visual.title}</h1>
      <p className="body-sans mb-6">{visual.blurb}</p>

      <Suspense fallback={<p className="meta py-10">Loading…</p>}>
        {visual.render((id) => navigate(`/visuals/${id}`))}
      </Suspense>

      <div className="mt-8">
        <p className="eyebrow mb-2.5">What this answers</p>
        <ul className="list-none p-0 m-0 flex flex-col gap-2 mb-7">
          {visual.asked.map((q) => (
            <li key={q} className="body-sans flex gap-3">
              <span
                className="flex-none rounded-full mt-2"
                style={{ width: 5, height: 5, background: 'var(--accent)', opacity: 0.6 }}
              />
              {q}
            </li>
          ))}
        </ul>

        {visual.drillTopic && (
          <button
            onClick={() => navigate(`/topics/${encodeURIComponent(visual.drillTopic!)}`)}
            className="mb-7"
          >
            <Pill tone="accent">Now drill the questions →</Pill>
          </button>
        )}

        <p className="eyebrow mb-2.5">Watch</p>
        {visual.videos.map((v) => (
          <a
            key={v.url}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            <span
              className="u-sans block"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent-ink)' }}
            >
              {v.label} <span className="u-mono" style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
            </span>
            <span className="u-sans block mt-0.5" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              {v.note}
            </span>
          </a>
        ))}
        <p className="meta mt-4">
          These open a YouTube search rather than one fixed video — links rot, and the top result for
          these queries is reliably a good one.
        </p>
      </div>
    </Detail>
  ) : (
    <DetailEmpty>
      Pick an animation. Each one steps through a mechanism you will be asked to explain out loud.
    </DetailEmpty>
  )

  return (
    <Panes
      listTitle="Visuals"
      listMeta={String(VISUALS.length)}
      list={list}
      detail={detail}
      detailOpen={!!visual}
      backTo="/visuals"
    />
  )
}
