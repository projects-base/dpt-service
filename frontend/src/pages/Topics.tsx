import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  categories,
  categoryById,
  notesByTopic,
  questionsByTopic,
  topicById,
  topicsByCategory,
} from '../data'
import { Detail, DetailEmpty, ListGroup, ListRow, Panes } from '../components/Panes'
import { Button, Pill } from '../components/ui'
import { useDrill } from '../lib/drill'
import { useProgress } from '../lib/progress'
import { QuestionDetail } from '../components/QuestionDetail'

/**
 * Topics section. The list pane holds every topic, grouped by category and
 * collapsible — so there is no separate category page and no funnel: any topic
 * is one click away from any other.
 */
export function Topics() {
  const { topicId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { open: openDrill } = useDrill()
  const { progress, toggleBookmark } = useProgress()

  const id = topicId ? decodeURIComponent(topicId) : ''
  const topic = id ? topicById.get(id) : undefined
  const selectedQ = params.get('q')

  const knowledge = useMemo(() => categories.filter((c) => c.kind === 'knowledge'), [])
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const c of knowledge) init[c.id] = topic ? topic.categoryId === c.id : c.id === 'dsa'
    return init
  })

  const totalTopics = knowledge.reduce((n, c) => n + (topicsByCategory[c.id]?.length ?? 0), 0)

  const list = (
    <div>
      {knowledge.map((c) => {
        const ts = topicsByCategory[c.id] ?? []
        if (!ts.length) return null
        return (
          <ListGroup
            key={c.id}
            label={c.name}
            count={ts.length}
            open={!!openCats[c.id]}
            onToggle={() => setOpenCats((o) => ({ ...o, [c.id]: !o[c.id] }))}
          >
            {ts.map((t) => {
              const qn = questionsByTopic[t.id]?.length ?? 0
              const nn = notesByTopic[t.id]?.length ?? 0
              return (
                <ListRow
                  key={t.id}
                  active={t.id === id}
                  title={t.name}
                  meta={qn ? String(qn) : nn ? `${nn}n` : undefined}
                  starred={!!progress.bookmarks[`topic:${t.id}`]}
                  onStar={() => toggleBookmark(`topic:${t.id}`)}
                  onClick={() => navigate(`/topics/${encodeURIComponent(t.id)}`)}
                />
              )
            })}
          </ListGroup>
        )
      })}
    </div>
  )

  const detail = !topic ? (
    <DetailEmpty>
      Pick a topic on the left, or press <span className="u-mono">⌘K</span> to jump straight to one.
    </DetailEmpty>
  ) : (
    <TopicDetail
      topicId={topic.id}
      openQuestionId={selectedQ}
      onOpenQuestion={(qid) => setParams({ q: qid })}
    />
  )

  const siblingIds = topic ? (questionsByTopic[topic.id] ?? []).map((q) => q.id) : []
  const aside =
    topic && selectedQ ? (
      <QuestionDetail
        questionId={selectedQ}
        siblingIds={siblingIds}
        onSelect={(qid) => setParams(qid ? { q: qid } : {}, { replace: true })}
        backLabel={topic.name}
        compact
      />
    ) : undefined

  return (
    <Panes
      listTitle="Topics"
      listMeta={`${totalTopics}`}
      listActions={
        <button
          className="u-mono"
          style={{ fontSize: 10, color: 'var(--ink-3)' }}
          onClick={() => {
            const allOpen = knowledge.every((c) => openCats[c.id])
            const next: Record<string, boolean> = {}
            for (const c of knowledge) next[c.id] = !allOpen
            setOpenCats(next)
          }}
        >
          ⇅
        </button>
      }
      list={list}
      detail={detail}
      detailOpen={!!topic}
      backTo="/topics"
      aside={aside}
      asideTitle={selectedQ ? `Question ${siblingIds.indexOf(selectedQ) + 1} of ${siblingIds.length}` : undefined}
      onCloseAside={() => setParams({})}
    />
  )

  function TopicDetail({
    topicId: tid,
    openQuestionId,
    onOpenQuestion,
  }: {
    topicId: string
    openQuestionId: string | null
    onOpenQuestion: (qid: string) => void
  }) {
    const t = topicById.get(tid)!
    const qs = questionsByTopic[tid] ?? []
    const ns = notesByTopic[tid] ?? []
    const cat = categoryById[t.categoryId]
    const [tab, setTab] = useState<'q' | 'ref'>(qs.length ? 'q' : 'ref')

    return (
      <Detail>
        <p className="eyebrow mb-2">{cat?.name}</p>
        <h1 className="h-sec mb-3">{t.name}</h1>
        {t.blurb && <p className="body-sans mb-4">{t.blurb}</p>}

        <div className="flex gap-2 flex-wrap items-center mb-6">
          {qs.length > 0 && (
            <Button
              variant="fill"
              onClick={() => openDrill({ title: t.name, ids: qs.map((q) => q.id) })}
            >
              Drill {qs.length} cards
            </Button>
          )}
          {t.companyId && <Pill tone="boss">{t.companyId}</Pill>}
        </div>

        {qs.length > 0 && ns.length > 0 && (
          <div className="tabs" role="tablist">
            <button className="tab" role="tab" aria-selected={tab === 'q'} onClick={() => setTab('q')}>
              Questions <span className="tab-count">{qs.length}</span>
            </button>
            <button className="tab" role="tab" aria-selected={tab === 'ref'} onClick={() => setTab('ref')}>
              Reference <span className="tab-count">{ns.length}</span>
            </button>
          </div>
        )}

        {tab === 'q' &&
          qs.map((q, i) => {
            const st = progress.reviews[q.id]
            return (
              <button
                key={q.id}
                onClick={() => onOpenQuestion(q.id)}
                className="w-full text-left flex gap-3 items-baseline py-3 cursor-pointer group"
                style={{
                  borderBottom: '1px solid var(--line)',
                  background: q.id === openQuestionId ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <span className="u-mono flex-none w-7" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {i + 1}
                </span>
                <span
                  className="u-sans flex-1 min-w-0 transition-colors group-hover:[color:var(--accent-ink)]"
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    color: q.id === openQuestionId ? 'var(--accent-ink)' : 'var(--ink)',
                    fontWeight: q.id === openQuestionId ? 600 : 400,
                  }}
                >
                  {q.prompt}
                </span>
                {progress.starred[q.id] && <span style={{ color: 'var(--boss)', fontSize: 11 }}>★</span>}
                {st && st.streak > 0 && (
                  <span className="u-mono flex-none" style={{ fontSize: 10, color: 'var(--accent)' }}>
                    {'●'.repeat(Math.min(st.streak, 3))}
                  </span>
                )}
              </button>
            )
          })}

        {tab === 'ref' &&
          ns.map((n) => (
            <div key={n.id} className="mb-8">
              {n.level > 2 && (
                <h3 className="u-sans mb-2" style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>
                  {n.heading}
                </h3>
              )}
              <div className="prose scroll-x" dangerouslySetInnerHTML={{ __html: n.html }} />
            </div>
          ))}

        {qs.length === 0 && ns.length === 0 && <p className="meta">Nothing filed here yet.</p>}
      </Detail>
    )
  }
}
