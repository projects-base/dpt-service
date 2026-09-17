import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories, companies, questions, topics, microsoftPlan } from '../data'
import { useDrill } from '../lib/drill'
import { useProgress } from '../lib/progress'
import { isDue } from '../lib/srs'

interface Item {
  kind: string
  label: string
  sub?: string
  run: () => void
}

/** ⌘K. Two keystrokes to anywhere, which is the whole point. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const navigate = useNavigate()
  const { open: openDrill } = useDrill()
  const { progress } = useProgress()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      navigate(to)
      onClose()
    }

    const dueIds = Object.keys(progress.reviews).filter((id) => isDue(progress.reviews[id]))
    const starredIds = Object.keys(progress.starred)

    const actions: Item[] = [
      {
        kind: 'Drill',
        label: `Drill everything due (${dueIds.length})`,
        sub: 'Full-screen card loop',
        run: () => {
          openDrill({ title: 'Due now', ids: dueIds })
          onClose()
        },
      },
      {
        kind: 'Drill',
        label: `Drill starred (${starredIds.length})`,
        run: () => {
          openDrill({ title: 'Starred', ids: starredIds })
          onClose()
        },
      },
      { kind: 'Go', label: 'Tonight', run: go('/') },
      { kind: 'Go', label: 'Plan', run: go('/plan') },
      { kind: 'Go', label: 'Topics', run: go('/topics') },
      { kind: 'Go', label: 'Companies', run: go('/companies') },
      { kind: 'Go', label: 'Review queue', run: go('/review') },
      { kind: 'Visual', label: 'The whole picture', sub: 'Map of every animation', run: go('/visuals/whole-picture') },
      { kind: 'Visual', label: 'How Java actually runs', sub: 'Animation', run: go('/visuals/how-java-works') },
      { kind: 'Visual', label: 'Threads, races & locks', sub: 'Animation', run: go('/visuals/threads') },
      { kind: 'Visual', label: 'HashMap & collisions', sub: 'Animation', run: go('/visuals/hashmap') },
      { kind: 'Visual', label: 'Collections vs concurrent', sub: 'Animation', run: go('/visuals/concurrent-collections') },
      { kind: 'Visual', label: 'Streams, Collectors & parallel', sub: 'Animation', run: go('/visuals/streams') },
      { kind: 'Visual', label: 'Object lifecycle & GC', sub: 'Animation', run: go('/visuals/gc-lifecycle') },
      { kind: 'Visual', label: 'How the JVM runs a class', sub: 'Animation', run: go('/visuals/jvm-areas') },
      { kind: 'Visual', label: 'Choosing a collector', sub: 'Animation', run: go('/visuals/collectors') },
    ]

    const cats: Item[] = categories.map((c) => ({
      kind: 'Category',
      label: c.name,
      run: go(`/topics?cat=${c.id}`),
    }))

    const comps: Item[] = companies.map((c) => ({
      kind: 'Company',
      label: c.name,
      sub: c.role,
      run: go(`/companies/${c.id}`),
    }))

    const weeks: Item[] = microsoftPlan.weeks.map((w) => ({
      kind: 'Week',
      label: `${w.n} — ${w.title}`,
      run: go(`/plan/${w.n}`),
    }))

    const tops: Item[] = topics.map((t) => ({
      kind: 'Topic',
      label: t.name,
      sub: categories.find((c) => c.id === t.categoryId)?.name,
      run: go(`/topics/${encodeURIComponent(t.id)}`),
    }))

    return [...actions, ...comps, ...cats, ...weeks, ...tops]
  }, [navigate, onClose, openDrill, progress])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items.slice(0, 14)

    const scored = items
      .map((it) => {
        const hay = `${it.label} ${it.sub ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return null
        return { it, score: hay.startsWith(term) ? 2 : it.label.toLowerCase().includes(term) ? 1 : 0 }
      })
      .filter(Boolean) as { it: Item; score: number }[]
    scored.sort((a, b) => b.score - a.score)

    // Fall through to the question bank only when nothing structural matched.
    const out = scored.slice(0, 14).map((s) => s.it)
    if (out.length < 8) {
      const qs = questions
        .filter((x) => x.prompt.toLowerCase().includes(term))
        .slice(0, 8 - out.length)
        .map<Item>((x) => ({
          kind: 'Question',
          label: x.prompt,
          sub: topics.find((t) => t.id === x.topicId)?.name,
          run: () => {
            navigate(`/topics/${encodeURIComponent(x.topicId)}?q=${encodeURIComponent(x.id)}`)
            onClose()
          },
        }))
      out.push(...qs)
    }
    return out
  }, [items, q, navigate, onClose])

  useEffect(() => {
    setSel(0)
  }, [q])

  useEffect(() => {
    listRef.current?.querySelector('[data-sel="1"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  return (
    <div className="palette-scrim" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to a topic, company, week — or search questions"
          className="palette-input u-sans"
          onKeyDown={(e) => {
            if (e.key === 'Escape') return onClose()
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSel((s) => Math.min(s + 1, results.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSel((s) => Math.max(s - 1, 0))
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              results[sel]?.run()
            }
          }}
        />
        <div className="palette-list" ref={listRef}>
          {results.length === 0 && <p className="meta px-4 py-5">Nothing matched.</p>}
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.label}-${i}`}
              data-sel={i === sel ? '1' : '0'}
              className="palette-row"
              style={{ background: i === sel ? 'var(--accent-soft)' : 'transparent' }}
              onMouseEnter={() => setSel(i)}
              onClick={r.run}
            >
              <span
                className="u-mono flex-none"
                style={{ fontSize: 9.5, color: 'var(--ink-3)', width: 62, textTransform: 'uppercase' }}
              >
                {r.kind}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className="u-sans block truncate"
                  style={{ fontSize: 13.5, color: i === sel ? 'var(--accent-ink)' : 'var(--ink)' }}
                >
                  {r.label}
                </span>
                {r.sub && (
                  <span className="u-sans block truncate" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {r.sub}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <span className="u-mono">↑↓</span> move
          <span className="u-mono ml-3">↵</span> open
          <span className="u-mono ml-3">esc</span> close
        </div>
      </div>
    </div>
  )
}
