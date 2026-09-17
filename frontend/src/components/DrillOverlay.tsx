import { useCallback, useEffect, useMemo, useState } from 'react'
import { questionById, topicById } from '../data'
import { useDrill } from '../lib/drill'
import { useProgress } from '../lib/progress'
import { useKeys } from '../lib/hooks'

/**
 * Full-screen study loop. The whole point is that one card costs one keypress:
 * Space to reveal, 1 or 2 to grade and advance. Nothing else is on screen.
 */
export function DrillOverlay() {
  const { queue, close } = useDrill()
  const { review, toggleStar, progress } = useProgress()
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ ok: 0, no: 0 })

  const ids = queue?.ids ?? []
  const done = i >= ids.length
  const question = !done ? questionById.get(ids[i]) : undefined
  const topic = question ? topicById.get(question.topicId) : undefined

  const advance = useCallback(() => {
    setRevealed(false)
    setI((n) => n + 1)
  }, [])

  const gradeAnd = useCallback(
    (ok: boolean) => {
      if (!question) return
      review(question.id, ok)
      setTally((t) => (ok ? { ...t, ok: t.ok + 1 } : { ...t, no: t.no + 1 }))
      advance()
    },
    [question, review, advance],
  )

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close()
      if (done) {
        if (e.key === 'Enter') close()
        return
      }
      if (e.key === ' ') {
        e.preventDefault()
        setRevealed(true)
        return
      }
      if (e.key === '1') return gradeAnd(true)
      if (e.key === '2') return gradeAnd(false)
      if (e.key.toLowerCase() === 'j') return advance()
      if (e.key.toLowerCase() === 'k') {
        setRevealed(false)
        setI((n) => Math.max(0, n - 1))
        return
      }
      if (e.key.toLowerCase() === 's' && question) toggleStar(question.id)
    },
    [close, done, gradeAnd, advance, question, toggleStar],
  )
  useKeys(onKey)

  // The page behind must not scroll while this is up.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const pct = useMemo(() => (ids.length ? Math.round((i / ids.length) * 100) : 0), [i, ids.length])

  if (!queue) return null

  return (
    <div className="drill" role="dialog" aria-modal="true" aria-label="Drill">
      <div className="drill-bar">
        <span className="u-sans" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
          {queue.title}
        </span>
        <span className="u-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {Math.min(i + 1, ids.length)} of {ids.length}
        </span>
        <button className="drill-x" onClick={close} title="Close (Esc)">
          ✕
        </button>
        <div className="drill-progress" style={{ width: `${pct}%` }} />
      </div>

      <div className="drill-body">
        {done ? (
          <div className="text-center max-w-[44ch]">
            <p className="eyebrow mb-4" style={{ color: 'var(--accent)' }}>
              Session complete
            </p>
            <h2 className="h-sec mb-4">
              {tally.ok} recalled, {tally.no} gone.
            </h2>
            <p className="body-sans mb-7">
              {tally.no === 0
                ? 'Clean sweep. The ones you had move out to a longer interval.'
                : `The ${tally.no} you missed come back in three days. That is the system working, not a bad night.`}
            </p>
            <button className="drill-key-btn" onClick={close}>
              Done <span className="u-mono">↵</span>
            </button>
          </div>
        ) : question ? (
          <div className="w-full max-w-[62ch]">
            {topic && (
              <p className="eyebrow mb-5" style={{ color: 'var(--ink-3)' }}>
                {topic.name}
              </p>
            )}
            <h2 className="drill-q">{question.prompt}</h2>

            {revealed ? (
              <div
                className="prose scroll-x mt-7 pt-6"
                style={{ borderTop: '1px solid var(--line)' }}
                dangerouslySetInnerHTML={{ __html: question.answerHtml }}
              />
            ) : (
              <button className="drill-reveal" onClick={() => setRevealed(true)}>
                Answer it out loud first, then press <span className="u-mono">Space</span>
              </button>
            )}
          </div>
        ) : (
          <p className="meta">That card is no longer in the bank.</p>
        )}
      </div>

      {!done && (
        <div className="drill-foot">
          <button className="drill-nav" onClick={() => { setRevealed(false); setI((n) => Math.max(0, n - 1)) }}>
            <span className="u-mono">K</span> back
          </button>

          <div className="flex gap-2">
            <button className="drill-key-btn" onClick={() => gradeAnd(true)}>
              <span className="u-mono">1</span> I had it
            </button>
            <button className="drill-key-btn drill-key-btn--miss" onClick={() => gradeAnd(false)}>
              <span className="u-mono">2</span> Gone
            </button>
          </div>

          <button
            className="drill-nav"
            onClick={() => question && toggleStar(question.id)}
            title="Star (S)"
          >
            {question && progress.starred[question.id] ? '★' : '☆'} <span className="u-mono">S</span>
          </button>
        </div>
      )}
    </div>
  )
}
