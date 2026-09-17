import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { microsoftPlan } from '../data/plans'
import { useProgress } from '../lib/progress'
import { useDrill } from '../lib/drill'
import { isDue } from '../lib/srs'
import { DAY_NAMES, addDays, clamp, daysBetween, isWeekend, parseYmd, pretty, today } from '../lib/dates'
import { SinglePane } from '../components/Panes'
import { Button } from '../components/ui'

const plan = microsoftPlan

/**
 * Deliberately one screen. The single thing you are meant to do sits above the
 * fold with one primary control; everything else is supporting detail.
 */
export function Tonight() {
  const t = today()
  const cur = clamp(t, plan.start, plan.end)
  const week = plan.weeks.find((w) => cur >= w.start && cur <= w.end) ?? plan.weeks[0]
  const weekend = isWeekend(t)
  const { progress, streak, toggleCheckin } = useProgress()
  const { open: openDrill } = useDrill()
  const done = !!progress.checkins[t]

  // Counted off review state alone, so this page never loads the question bank.
  const dueIds = useMemo(
    () => Object.keys(progress.reviews).filter((id) => isDue(progress.reviews[id])),
    [progress.reviews],
  )

  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(25 * 60)
  const tick = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    tick.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [running])

  // The two things you always do together, behind one button.
  const startSession = useCallback(() => {
    setRunning(true)
    if (dueIds.length) openDrill({ title: 'Tonight', ids: dueIds })
  }, [dueIds, openDrill])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const toLive = daysBetween(t, plan.liveFrom)

  const task = weekend ? week.weekend : week.weekdays

  return (
    <SinglePane>
      <div className="px-6 py-7 max-w-[760px] mx-auto">
        {/* --- the one card --- */}
        <div
          className="rounded-[5px] overflow-hidden mb-6"
          style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}
        >
          <div
            className="flex items-baseline gap-3 flex-wrap px-5 py-3"
            style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}
          >
            <span className="u-sans" style={{ fontSize: 13, fontWeight: 600 }}>
              {DAY_NAMES[parseYmd(t).getDay()]}, {pretty(t)}
            </span>
            <Link to={`/plan/${week.n}`} className="u-mono" style={{ fontSize: 11.5, color: 'var(--accent-ink)' }}>
              {week.n} · {week.title} →
            </Link>
            <span className="u-mono ml-auto" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              day {Math.max(1, daysBetween(plan.start, cur) + 1)}/106 · {toLive}d to 1 Jan
            </span>
          </div>

          <div className="px-5 py-5">
            <p className="eyebrow mb-2" style={{ color: 'var(--accent)' }}>
              {weekend ? 'Weekend anchor · 3–4 hrs' : 'Tonight · 25 minutes'}
            </p>
            <p
              className="mb-5"
              style={{ fontSize: 19, lineHeight: 1.5, color: 'var(--ink)', textWrap: 'balance' }}
            >
              {task}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="u-mono"
                style={{
                  fontSize: 30,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: left === 0 ? 'var(--boss)' : running ? 'var(--accent)' : 'var(--ink)',
                }}
              >
                {mm}:{ss}
              </span>

              {!running && left === 25 * 60 ? (
                <Button variant="fill" onClick={startSession}>
                  Start {dueIds.length ? `· ${dueIds.length} cards due` : 'the 25 minutes'}
                </Button>
              ) : (
                <>
                  <Button onClick={() => setRunning((r) => !r)} disabled={left === 0}>
                    {running ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    onClick={() => {
                      setRunning(false)
                      setLeft(25 * 60)
                    }}
                  >
                    Reset
                  </Button>
                  {dueIds.length > 0 && (
                    <Button onClick={() => openDrill({ title: 'Tonight', ids: dueIds })}>
                      Drill {dueIds.length}
                    </Button>
                  )}
                </>
              )}

              <span className="ml-auto">
                <Button variant={done ? 'fill' : 'ghost'} active={done} onClick={() => toggleCheckin(t)}>
                  {done ? 'Floor hit ✓' : 'Mark floor hit'}
                </Button>
              </span>
            </div>

            {left === 0 && (
              <p className="body-sans mt-4" style={{ color: 'var(--boss)' }}>
                That is the floor. Log your line, then stop — the day already counts.
              </p>
            )}
          </div>
        </div>

        {/* --- compact streak strip, not a wall of dots --- */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="eyebrow">Chain</span>
            <span className="u-mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>
              {streak} day{streak === 1 ? '' : 's'}
            </span>
            <Link to="/plan" className="u-mono ml-auto" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              full calendar →
            </Link>
          </div>
          <LastThirty />
        </div>

        {/* --- this week's challenge, the thing worth reading --- */}
        <div className="pl-4 mb-6" style={{ borderLeft: '2px solid var(--accent)' }}>
          <p className="eyebrow mb-1.5" style={{ color: 'var(--accent)' }}>
            {week.n} challenge
          </p>
          <p className="body-sans m-0">{week.challenge}</p>
        </div>

        <p className="meta">
          <span className="u-mono">⌘K</span> jumps anywhere · <span className="u-mono">1–8</span> switch
          sections · in a drill, <span className="u-mono">Space</span> reveals and{' '}
          <span className="u-mono">1</span>/<span className="u-mono">2</span> grade.
        </p>
      </div>
    </SinglePane>
  )
}

/** Thirty days is enough to see a chain; 106 is a wall. */
function LastThirty() {
  const { progress, toggleCheckin } = useProgress()
  const t = today()
  const days = useMemo(() => {
    const out: string[] = []
    for (let i = 29; i >= 0; i--) out.push(addDays(t, -i))
    return out
  }, [t])

  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((d) => {
        const on = !!progress.checkins[d]
        const inPlan = d >= plan.start && d <= plan.end
        return (
          <button
            key={d}
            title={pretty(d)}
            aria-label={pretty(d)}
            onClick={() => toggleCheckin(d)}
            className="flex-none rounded-[2px] cursor-pointer"
            style={{
              width: 14,
              height: 14,
              opacity: inPlan ? 1 : 0.4,
              background: on ? 'var(--accent)' : 'var(--surface-2)',
              border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
              boxShadow: d === t ? '0 0 0 2px var(--bg), 0 0 0 3px var(--ink-3)' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
