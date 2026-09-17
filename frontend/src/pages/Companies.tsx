import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  categoryById,
  companies,
  companyById,
  notesByTopic,
  questionsByTopic,
  topicById,
  topicsByCompany,
} from '../data'
import { Detail, DetailEmpty, ListRow, Panes } from '../components/Panes'
import { Button, Pill } from '../components/ui'
import { useDrill } from '../lib/drill'
import { useProgress } from '../lib/progress'
import { pretty } from '../lib/dates'
import { TopicPanel } from '../components/TopicPanel'

const STATUS: Record<string, string> = {
  active: 'in flight',
  upcoming: 'upcoming',
  past: 'closed',
}

export function Companies() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const { progress, toggleBookmark } = useProgress()
  const [params, setParams] = useSearchParams()
  const company = companyId ? companyById[companyId] : undefined
  const openTopicId = params.get('t')
  const openTopic = openTopicId ? topicById.get(openTopicId) : undefined

  const list = (
    <div>
      {companies.map((c) => {
        const ts = topicsByCompany[c.id] ?? []
        const qn = ts.reduce((n, t) => n + (questionsByTopic[t.id]?.length ?? 0), 0)
        return (
          <ListRow
            key={c.id}
            active={c.id === companyId}
            title={c.name}
            sub={c.role}
            meta={qn ? String(qn) : STATUS[c.status]}
            starred={!!progress.bookmarks[`company:${c.id}`]}
            onStar={() => toggleBookmark(`company:${c.id}`)}
            onClick={() => navigate(`/companies/${c.id}`)}
          />
        )
      })}
    </div>
  )

  return (
    <Panes
      listTitle="Companies"
      listMeta={String(companies.length)}
      list={list}
      detail={
        company ? (
          <CompanyDetail
            id={company.id}
            openTopicId={openTopicId}
            onOpenTopic={(tid) => setParams({ t: tid })}
          />
        ) : (
          <DetailEmpty>Pick a company.</DetailEmpty>
        )
      }
      detailOpen={!!company}
      backTo="/companies"
      aside={openTopic ? <TopicPanel topicId={openTopic.id} /> : undefined}
      asideTitle={openTopic?.name}
      asideActions={
        openTopic ? (
          <Link
            to={`/topics/${encodeURIComponent(openTopic.id)}`}
            className="u-mono"
            style={{ fontSize: 10, color: 'var(--ink-3)' }}
            title="Open in Topics"
          >
            ↗
          </Link>
        ) : undefined
      }
      onCloseAside={() => setParams({})}
    />
  )
}

function CompanyDetail({
  id,
  openTopicId,
  onOpenTopic,
}: {
  id: string
  openTopicId: string | null
  onOpenTopic: (topicId: string) => void
}) {
  const c = companyById[id]
  const navigate = useNavigate()
  const { open: openDrill } = useDrill()
  const topics = topicsByCompany[id] ?? []
  const allIds = topics.flatMap((t) => (questionsByTopic[t.id] ?? []).map((q) => q.id))
  const [tab, setTab] = useState<'loop' | 'material'>('loop')

  return (
    <Detail>
      <div className="flex items-baseline gap-2.5 flex-wrap mb-2">
        <Pill tone={c.status === 'active' ? 'boss' : 'accent'}>{STATUS[c.status]}</Pill>
        {c.interviewDate && (
          <span className="u-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            {pretty(c.interviewDate)}
          </span>
        )}
      </div>
      <h1 className="h-sec mb-1.5">{c.name}</h1>
      <p className="u-sans mb-4" style={{ fontSize: 14.5, color: 'var(--ink-2)' }}>
        {c.role}
      </p>
      <p className="body-sans mb-5" style={{ maxWidth: '58ch' }}>
        {c.blurb}
      </p>

      <div className="flex gap-2 flex-wrap mb-7">
        {allIds.length > 0 && (
          <Button variant="fill" onClick={() => openDrill({ title: c.name, ids: allIds })}>
            Drill {allIds.length} {c.name} cards
          </Button>
        )}
        {c.planId && <Button onClick={() => navigate('/plan')}>Open the plan</Button>}
      </div>

      <div className="tabs" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === 'loop'} onClick={() => setTab('loop')}>
          The loop
        </button>
        <button
          className="tab"
          role="tab"
          aria-selected={tab === 'material'}
          onClick={() => setTab('material')}
        >
          Material <span className="tab-count">{topics.length}</span>
        </button>
      </div>

      {tab === 'loop' && (
        <>
          <p className="eyebrow mb-2.5">What they weight</p>
          <ul className="list-none p-0 m-0 mb-7 flex flex-col gap-2">
            {c.focus.map((f) => (
              <li key={f} className="body-sans flex gap-3">
                <span
                  className="flex-none rounded-full mt-2"
                  style={{ width: 5, height: 5, background: 'var(--accent)', opacity: 0.6 }}
                />
                {f}
              </li>
            ))}
          </ul>

          <p className="eyebrow mb-2.5">Rounds</p>
          <div className="mb-7">
            {c.rounds.map((r, i) => (
              <div key={r.name} className="py-3" style={i ? { borderTop: '1px solid var(--line)' } : undefined}>
                <div className="flex items-baseline gap-3 flex-wrap mb-1">
                  <span className="u-sans" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                    {r.name}
                  </span>
                  <span className="u-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {r.format}
                  </span>
                </div>
                <p className="body-sans m-0">{r.scored}</p>
              </div>
            ))}
          </div>

          {c.notes && c.notes.length > 0 && (
            <>
              <p className="eyebrow mb-2.5">Intelligence</p>
              {c.notes.map((n, i) => (
                <p
                  key={i}
                  className="body-sans mb-2.5 pl-4"
                  style={{ borderLeft: '2px solid var(--line-2)' }}
                >
                  {n}
                </p>
              ))}
            </>
          )}
        </>
      )}

      {tab === 'material' && (
        <>
          <p className="eyebrow mb-2.5">Drill these areas</p>
          <div className="flex gap-2 flex-wrap mb-6">
            {c.drill.map((cid) => {
              const cat = categoryById[cid]
              if (!cat) return null
              return (
                <button key={cid} onClick={() => navigate(`/topics?cat=${cid}`)}>
                  <Pill tone="accent">{cat.name} →</Pill>
                </button>
              )
            })}
          </div>

          {topics.length > 0 ? (
            <>
              <p className="eyebrow mb-2">{c.name}-specific topics</p>
              {topics.map((t) => {
                const qn = questionsByTopic[t.id]?.length ?? 0
                const nn = notesByTopic[t.id]?.length ?? 0
                return (
                  <button
                    key={t.id}
                    onClick={() => onOpenTopic(t.id)}
                    className="w-full text-left flex gap-3 items-baseline py-2.5 cursor-pointer group"
                    style={{
                      borderBottom: '1px solid var(--line)',
                      background: t.id === openTopicId ? 'var(--accent-soft)' : 'transparent',
                    }}
                  >
                    <span
                      className="u-sans flex-1 transition-colors group-hover:[color:var(--accent-ink)]"
                      style={{
                        fontSize: 14,
                        color: t.id === openTopicId ? 'var(--accent-ink)' : 'var(--ink)',
                      }}
                    >
                      {t.name}
                    </span>
                    <span className="u-mono flex-none" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                      {qn ? `${qn} Q` : `${nn} notes`}
                    </span>
                  </button>
                )
              })}
            </>
          ) : (
            <p className="meta">
              No company-specific topics filed yet — set{' '}
              <span className="u-mono">companyId: '{c.id}'</span> on a topic.
            </p>
          )}
        </>
      )}
    </Detail>
  )
}
