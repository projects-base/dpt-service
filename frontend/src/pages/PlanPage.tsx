import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { microsoftPlan } from '../data/plans'
import { useProgress } from '../lib/progress'
import { pretty, today } from '../lib/dates'
import { Detail, ListRow, Panes } from '../components/Panes'
import { Button, Pill } from '../components/ui'

const plan = microsoftPlan
const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`
const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

export function PlanPage() {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const t = today()
  const currentWeek = plan.weeks.find((w) => t >= w.start && t <= w.end)
  const week = plan.weeks.find((w) => w.n === weekId)
  const { progress, toggleBookmark } = useProgress()

  const list = (
    <div>
      {plan.weeks.map((w) => (
        <ListRow
          key={w.n}
          active={w.n === weekId}
          title={`${w.n} · ${w.title}`}
          sub={`${pretty(w.start)} – ${pretty(w.end)}${w === currentWeek ? '  · now' : ''}`}
          dot={progress.challenges[w.n] ? 'done' : 'none'}
          starred={!!progress.bookmarks[`week:${w.n}`]}
          onStar={() => toggleBookmark(`week:${w.n}`)}
          onClick={() => navigate(`/plan/${w.n}`)}
        />
      ))}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--line)' }}>
        <p className="eyebrow mb-2.5">Boss fights</p>
        {plan.bosses.map((b, i) => (
          <div key={i} className="flex gap-2.5 mb-2 items-baseline">
            <span className="u-mono flex-none" style={{ fontSize: 10, color: 'var(--ink-3)', width: 46 }}>
              {b.when}
            </span>
            <span
              className="u-sans flex-1"
              style={{ fontSize: 12, lineHeight: 1.45, color: b.big ? 'var(--boss)' : 'var(--ink-2)' }}
              dangerouslySetInnerHTML={{ __html: b.html }}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const detail = week ? (
    <WeekDetail week={week} isNow={week === currentWeek} />
  ) : (
    <Detail>
      <h1 className="h-sec mb-4">{plan.title}</h1>
      <p className="body-sans mb-7" style={{ maxWidth: '58ch' }}>
        {plan.subtitle}
      </p>
      {currentWeek && (
        <Button variant="fill" onClick={() => navigate(`/plan/${currentWeek.n}`)}>
          Go to this week — {currentWeek.n}
        </Button>
      )}

      <div className="mt-9">
        <p className="eyebrow mb-4">The method</p>
        {plan.rules.map((r, i) => (
          <div key={r.title} className="flex gap-4 py-3.5" style={{ borderBottom: '1px solid var(--line)' }}>
            <span className="u-mono flex-none w-6 pt-1" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="u-sans mb-1" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                {r.title}
              </h3>
              <p className="body-sans m-0">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Detail>
  )

  return (
    <Panes
      listTitle="Plan"
      listMeta={`${plan.weeks.length} weeks`}
      list={list}
      detail={detail}
      detailOpen={!!week}
      backTo="/plan"
    />
  )
}

function WeekDetail({ week: w, isNow }: { week: (typeof plan.weeks)[number]; isNow: boolean }) {
  const { progress, toggleProblem, toggleChallenge } = useProgress()
  const challengeDone = !!progress.challenges[w.n]
  const [tab, setTab] = useState<'work' | 'problems'>('work')
  const solved = w.problems.filter(([, s]) => progress.problems[s]).length

  return (
    <Detail>
      <div className="flex items-baseline gap-2.5 flex-wrap mb-2">
        <span className="u-mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
          {w.n}
        </span>
        <span className="u-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          {pretty(w.start)} – {pretty(w.end)}
        </span>
        {isNow && <Pill tone="accent">this week</Pill>}
        {w.light && <Pill>light week</Pill>}
      </div>
      <h1 className="h-sec mb-6">{w.title}</h1>

      {w.problems.length > 0 && (
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === 'work'} onClick={() => setTab('work')}>
            The work
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={tab === 'problems'}
            onClick={() => setTab('problems')}
          >
            Problems <span className="tab-count">{solved}/{w.problems.length}</span>
          </button>
        </div>
      )}

      {tab === 'work' && (
        <>
          <Field label="Weekdays">{w.weekdays}</Field>
          <Field label="Weekend anchor">{w.weekend}</Field>

          <div
            className="mb-6 pl-4"
            style={{ borderLeft: `2px solid var(--${w.n === 'W14' ? 'boss' : 'accent'})` }}
          >
            <p className="eyebrow mb-2" style={{ color: `var(--${w.n === 'W14' ? 'boss' : 'accent'})` }}>
              Challenge
            </p>
            <p className="body-sans mb-3">{w.challenge}</p>
            <Button variant="tiny" active={challengeDone} onClick={() => toggleChallenge(w.n)}>
              {challengeDone ? 'Passed ✓' : 'Mark passed'}
            </Button>
          </div>

          {w.milestone && <Field label="Milestone">{w.milestone}</Field>}
          <Field label="AlgoMaster">{w.algomaster}</Field>

          <a
            href={yt(w.video[1])}
            target="_blank"
            rel="noopener noreferrer"
            className="u-sans inline-flex items-center gap-2"
            style={{
              fontSize: 13.5,
              color: 'var(--ink-2)',
              border: '1px solid var(--line-2)',
              borderRadius: 3,
              padding: '7px 13px',
            }}
          >
            {w.video[0]}
            <span className="u-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
              YOUTUBE ↗
            </span>
          </a>
        </>
      )}

      {tab === 'problems' && (
        <div className="flex flex-col">
          {w.problems.map(([name, slug]) => {
            const done = !!progress.problems[slug]
            return (
              <div
                key={slug}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: '1px solid var(--line)' }}
              >
                <button
                  onClick={() => toggleProblem(slug)}
                  className="flex-none rounded-[2px] cursor-pointer"
                  style={{
                    width: 15,
                    height: 15,
                    background: done ? 'var(--accent)' : 'var(--surface)',
                    border: `1px solid ${done ? 'var(--accent)' : 'var(--line-2)'}`,
                  }}
                  aria-label={done ? `Mark ${name} unsolved` : `Mark ${name} solved`}
                />
                <span
                  className="u-sans flex-1"
                  style={{
                    fontSize: 14,
                    color: done ? 'var(--ink-3)' : 'var(--ink)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {name}
                </span>
                <a
                  href={lc(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="u-mono flex-none"
                  style={{ fontSize: 10.5, color: 'var(--ink-3)' }}
                >
                  LEETCODE ↗
                </a>
              </div>
            )
          })}
        </div>
      )}
    </Detail>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="eyebrow mb-1.5">{label}</p>
      <p className="body-sans m-0">{children}</p>
    </div>
  )
}
