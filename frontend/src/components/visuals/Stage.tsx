import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useKeys } from '../../lib/hooks'

export interface Controls {
  playing: boolean
  toggle: () => void
  next: () => void
  prev: () => void
  restart: () => void
  speed: number
  cycleSpeed: () => void
}

/**
 * Frame player shared by every animation. Stepping matters more than playing —
 * the useful moment is pausing on "survivors copy to S1, age + 1" and reading
 * why, so the controls are built around step-back and step-forward.
 */
export function useFrames(total: number, baseMs = 2400) {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  // One timeout per frame rather than a long-lived interval. The previous
  // version called setPlaying from inside a setFrame updater, which is an
  // impure updater — React may invoke it twice, and it made stopping at the
  // last frame unreliable.
  useEffect(() => {
    if (!playing) return
    if (frame >= total - 1) {
      setPlaying(false)
      return
    }
    const id = window.setTimeout(() => setFrame((f) => Math.min(f + 1, total - 1)), baseMs / speed)
    return () => window.clearTimeout(id)
  }, [playing, frame, speed, total, baseMs])

  const next = useCallback(() => {
    setPlaying(false)
    setFrame((f) => Math.min(f + 1, total - 1))
  }, [total])
  const prev = useCallback(() => {
    setPlaying(false)
    setFrame((f) => Math.max(f - 1, 0))
  }, [])
  const restart = useCallback(() => {
    setPlaying(false)
    setFrame(0)
  }, [])
  const toggle = useCallback(() => {
    setFrame((f) => (f >= total - 1 ? 0 : f))
    setPlaying((p) => !p)
  }, [total])
  const cycleSpeed = useCallback(() => setSpeed((s) => (s === 1 ? 1.75 : s === 1.75 ? 0.6 : 1)), [])

  useKeys(
    useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          next()
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          prev()
        }
      },
      [next, prev],
    ),
  )

  return {
    frame,
    index: frame + 1,
    total,
    controls: { playing, toggle, next, prev, restart, speed, cycleSpeed },
  }
}

export function Stage({
  phase,
  stw,
  narration,
  children,
  controls,
  index,
  total,
  legend,
  stats,
}: {
  phase: string
  stw?: boolean
  narration: string
  children: ReactNode
  controls: Controls
  index: number
  total: number
  legend?: ReactNode
  stats?: [string, number | string][]
}) {
  const [expanded, setExpanded] = useState(false)

  useKeys(
    useCallback(
      (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault()
          setExpanded((v) => !v)
        }
        if (e.key === 'Escape') setExpanded(false)
      },
      [],
    ),
  )

  // Nothing behind the overlay should scroll while it is up.
  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [expanded])

  return (
    <div className={expanded ? 'stage stage--expanded' : 'stage'}>
      <div className="stage-head">
        <span className="u-sans" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {phase}
        </span>
        {stw && <span className="stw-chip">stop-the-world</span>}
        <span className="u-mono ml-auto" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {index} / {total}
        </span>
        <button
          className="stage-expand"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? 'Exit full screen (Esc)' : 'Full screen (F)'}
          aria-label={expanded ? 'Exit full screen' : 'Full screen'}
        >
          {expanded ? '⤡' : '⤢'}
        </button>
      </div>

      <div className="stage-canvas">{children}</div>

      {(legend || stats) && (
        <div className="stage-meta">
          {legend && <div className="flex gap-4 flex-wrap items-center">{legend}</div>}
          {stats && (
            <div className="flex gap-4 flex-wrap ml-auto">
              {stats.map(([k, v]) => (
                <span key={k} className="u-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</b> {k}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="stage-narration">{narration}</p>

      <div className="stage-controls">
        <button className="ctl" onClick={controls.restart} title="Restart">
          ↺
        </button>
        <button className="ctl" onClick={controls.prev} title="Previous step (←)">
          ‹
        </button>
        <button className="ctl ctl-play" onClick={controls.toggle}>
          {controls.playing ? '❙❙ Pause' : '▶ Play'}
        </button>
        <button className="ctl" onClick={controls.next} title="Next step (→)">
          ›
        </button>
        <button className="ctl ml-auto" onClick={controls.cycleSpeed} title="Playback speed">
          {controls.speed}×
        </button>
      </div>

      <div className="stage-track" aria-hidden="true">
        <div className="stage-fill" style={{ width: `${(index / total) * 100}%` }} />
      </div>
    </div>
  )
}
