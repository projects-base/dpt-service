import { useState } from 'react'
import { questionById } from '../data'
import { useProgress } from '../lib/progress'
import { pretty } from '../lib/dates'
import { Detail, DetailEmpty } from './Panes'
import { Button } from './ui'

/**
 * One question, filling the detail pane, with prev/next across its siblings —
 * so reading a topic never means scrolling past twenty other questions.
 */
export function QuestionDetail({
  questionId,
  siblingIds,
  onSelect,
  backLabel,
  compact,
}: {
  questionId: string
  siblingIds: string[]
  /** Null goes back to the list. */
  onSelect: (id: string | null) => void
  backLabel: string
  /** Set when rendered in the narrower third column. */
  compact?: boolean
}) {
  const q = questionById.get(questionId)
  const { progress, review, toggleStar } = useProgress()
  const [revealed, setRevealed] = useState(false)

  if (!q) return <DetailEmpty>That question is no longer in the bank.</DetailEmpty>

  const i = siblingIds.indexOf(questionId)
  const prev = i > 0 ? siblingIds[i - 1] : null
  const next = i >= 0 && i < siblingIds.length - 1 ? siblingIds[i + 1] : null
  const st = progress.reviews[q.id]
  const starred = !!progress.starred[q.id]

  const go = (id: string | null) => {
    setRevealed(false)
    onSelect(id)
  }

  const Wrap = compact ? CompactWrap : Detail

  return (
    <Wrap>
      {!compact && (
        <div className="flex items-center gap-3 mb-6">
          <button
            className="u-sans cursor-pointer"
            style={{ fontSize: 12.5, color: 'var(--accent-ink)' }}
            onClick={() => go(null)}
          >
            ← {backLabel}
          </button>
          {i >= 0 && (
            <span className="u-mono ml-auto" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {i + 1} / {siblingIds.length}
            </span>
          )}
        </div>
      )}

      <h1
        className="mb-6"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: compact ? 19 : 'clamp(21px, 2.6vw, 27px)',
          lineHeight: 1.3,
          fontWeight: 500,
          letterSpacing: '-0.012em',
          textWrap: 'balance',
        }}
      >
        {q.prompt}
      </h1>

      {revealed ? (
        <div
          className="prose scroll-x"
          style={compact ? { fontSize: 15.5 } : undefined}
          dangerouslySetInnerHTML={{ __html: q.answerHtml }}
        />
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="w-full cursor-pointer transition-colors"
          style={{
            padding: '22px 18px',
            border: '1px dashed var(--line-2)',
            borderRadius: 4,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--ink-3)',
            background: 'none',
          }}
        >
          Answer it out loud first — then reveal
        </button>
      )}

      {q.followUps.length > 0 && revealed && (
        <div className="mt-7 pt-5" style={{ borderTop: '1px solid var(--line)' }}>
          <p className="eyebrow mb-3">Follow-ups</p>
          {q.followUps.map((f, n) => (
            <FollowUp key={n} q={f.q} a={f.a} />
          ))}
        </div>
      )}

      <div className="mt-8 pt-5 flex items-center gap-2 flex-wrap" style={{ borderTop: '1px solid var(--line)' }}>
        <Button variant="fill" onClick={() => { review(q.id, true); go(next) }}>
          I had it
        </Button>
        <Button onClick={() => { review(q.id, false); go(next) }}>Gone</Button>
        <Button variant="tiny" active={starred} onClick={() => toggleStar(q.id)}>
          {starred ? '★' : '☆'}
        </Button>
        <span className="ml-auto flex gap-1.5">
          <Button variant="tiny" disabled={!prev} onClick={() => prev && go(prev)}>
            ←
          </Button>
          <Button variant="tiny" disabled={!next} onClick={() => next && go(next)}>
            →
          </Button>
        </span>
      </div>

      {st && (
        <p className="u-mono mt-3" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
          streak {st.streak} · last {pretty(st.last)} · due {pretty(st.due)}
        </p>
      )}
    </Wrap>
  )
}

function CompactWrap({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-5">{children}</div>
}

function FollowUp({ q, a }: { q: string; a: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="mb-3">
      <button
        className="u-sans text-left cursor-pointer"
        style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--accent-ink)' }}
        onClick={() => setShow((s) => !s)}
      >
        {show ? '−' : '+'} {q}
      </button>
      {show && <div className="prose mt-2" style={{ fontSize: 15.5 }} dangerouslySetInnerHTML={{ __html: a }} />}
    </div>
  )
}
