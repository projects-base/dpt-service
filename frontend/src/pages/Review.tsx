import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { questionById, topicById } from '../data'
import { useProgress } from '../lib/progress'
import { useDrill } from '../lib/drill'
import { isDue } from '../lib/srs'
import { Detail, ListRow, Panes } from '../components/Panes'
import { Button } from '../components/ui'
import { QuestionDetail } from '../components/QuestionDetail'

type Mode = 'due' | 'weak' | 'starred' | 'all'

const MODES: { id: Mode; label: string }[] = [
  { id: 'due', label: 'Due' },
  { id: 'weak', label: 'Missed' },
  { id: 'starred', label: 'Starred' },
  { id: 'all', label: 'All' },
]

export function ReviewPage() {
  const { progress } = useProgress()
  const { open: openDrill } = useDrill()
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>('due')
  const selected = params.get('q')

  const ids = useMemo(() => {
    const graded = Object.keys(progress.reviews)
    if (mode === 'starred') return Object.keys(progress.starred)
    if (mode === 'weak') return graded.filter((id) => (progress.reviews[id]?.streak ?? 0) === 0)
    if (mode === 'all') return graded
    return graded.filter((id) => isDue(progress.reviews[id]))
  }, [mode, progress])

  const coldStart = useMemo(() => {
    const vals = Object.values(progress.reviews)
    if (!vals.length) return null
    return Math.round((vals.filter((v) => v.streak > 0).length / vals.length) * 100)
  }, [progress.reviews])

  const list = (
    <div>
      <div
        className="flex gap-1 px-3 py-2.5 flex-wrap"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        {MODES.map((m) => (
          <Button key={m.id} variant="tiny" active={mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </Button>
        ))}
      </div>

      {ids.length > 0 && (
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--line)' }}>
          <Button
            variant="fill"
            onClick={() => openDrill({ title: MODES.find((m) => m.id === mode)!.label, ids })}
          >
            Drill all {ids.length}
          </Button>
        </div>
      )}

      {ids.map((id) => {
        const q = questionById.get(id)
        if (!q) return null
        const st = progress.reviews[id]
        return (
          <ListRow
            key={id}
            active={id === selected}
            title={q.prompt}
            sub={topicById.get(q.topicId)?.name}
            dot={st && !isDue(st) ? 'done' : 'due'}
            onClick={() => setParams({ q: id })}
          />
        )
      })}

      {ids.length === 0 && (
        <p className="meta px-4 py-6">
          {Object.keys(progress.reviews).length === 0
            ? 'Nothing graded yet. Open a topic and grade a few — they enter the ladder from there.'
            : 'Nothing here. Come back tomorrow.'}
        </p>
      )}
    </div>
  )

  const detail = selected ? (
    <QuestionDetail
      questionId={selected}
      siblingIds={ids}
      onSelect={(id) => setParams(id ? { q: id } : {}, { replace: true })}
      backLabel="Review"
    />
  ) : (
    <Detail>
      <h1 className="h-sec mb-4">Review queue</h1>
      <p className="body-sans mb-5" style={{ maxWidth: '58ch' }}>
        A review is four minutes, not a re-solve. Read the prompt, state the answer out loud in under
        two minutes, then check. Only a failure sends a card back to the start of the +3 / +10 / +30
        ladder.
      </p>
      {coldStart !== null ? (
        <p className="u-mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          Cold-start rate {coldStart}% over {Object.keys(progress.reviews).length} graded cards ·
          target above 70% by mid-December
        </p>
      ) : (
        <p className="meta">No cards graded yet.</p>
      )}
      {ids.length > 0 && (
        <p className="meta mt-6">
          Use <span className="u-mono">Drill all</span> rather than clicking through — one keypress
          per card beats four.
        </p>
      )}
    </Detail>
  )

  return (
    <Panes
      listTitle="Review"
      listMeta={String(ids.length)}
      list={list}
      detail={detail}
      detailOpen={!!selected}
      backTo="/review"
    />
  )
}
