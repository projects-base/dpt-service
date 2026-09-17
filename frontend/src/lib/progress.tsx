import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Progress, ReviewState } from '../types'
import { addDays, today } from './dates'
import { grade } from './srs'
import { ApiError, api } from './api'
import { useAuth } from './auth'
import { asProgress, mergeProgress } from './sync'

const KEY = 'prep-progress-v1'

const EMPTY: Progress = {
  checkins: {},
  problems: {},
  challenges: {},
  reviews: {},
  starred: {},
  bookmarks: {},
}

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(EMPTY)
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) }
  } catch {
    return structuredClone(EMPTY)
  }
}

interface Ctx {
  progress: Progress
  toggleCheckin: (date: string) => void
  toggleProblem: (slug: string) => void
  toggleChallenge: (id: string) => void
  toggleStar: (id: string) => void
  toggleBookmark: (key: string) => void
  review: (questionId: string, recalled: boolean) => void
  reset: () => void
  streak: number
  bestStreak: number
  totalCheckins: number
  /** Where this session's progress is being kept. */
  sync: SyncState
  exportJson: () => string
  importJson: (raw: string) => boolean
}

export type SyncState =
  | { kind: 'local' }
  | { kind: 'loading' }
  | { kind: 'synced'; at: number }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }

const ProgressContext = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(read)
  const first = useRef(true)
  const { signedIn } = useAuth()
  const [sync, setSync] = useState<SyncState>({ kind: 'local' })

  // The server's revision, so a write can be refused rather than clobber a
  // session from another device. Null means we have not read the server yet.
  const revision = useRef<number | null>(null)
  const pushTimer = useRef<number | null>(null)
  const dirty = useRef(false)

  /* --- pull once on sign-in, merging rather than replacing --- */
  useEffect(() => {
    if (!signedIn) {
      revision.current = null
      setSync({ kind: 'local' })
      return
    }
    let cancelled = false
    setSync({ kind: 'loading' })
    api
      .getProgress()
      .then((res) => {
        if (cancelled) return
        revision.current = res.revision
        // Local work done while signed out is real work — keep it.
        setProgress((local) => mergeProgress(asProgress(res.data), local))
        dirty.current = true
        setSync({ kind: 'synced', at: Date.now() })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof ApiError ? e.message : 'offline'
        setSync({ kind: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [signedIn])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      /* private window, blocked storage — the app still works, just forgets */
    }
    if (signedIn) schedulePush()
  }, [progress, signedIn])

  /**
   * Debounced push. On a 409 the server is ahead, so re-read, merge and send
   * again — a second device's day is never dropped on the floor.
   */
  const schedulePush = useCallback(() => {
    if (pushTimer.current) window.clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(async () => {
      setSync({ kind: 'saving' })
      const send = async (body: Progress, rev: number | null) =>
        api.putProgress(body as unknown as Record<string, unknown>, rev)
      try {
        const res = await send(latest.current, revision.current)
        revision.current = res.revision
        setSync({ kind: 'synced', at: Date.now() })
      } catch (e) {
        if (e instanceof ApiError && e.isConflict) {
          try {
            const server = await api.getProgress()
            const merged = mergeProgress(asProgress(server.data), latest.current)
            setProgress(merged)
            const res = await send(merged, server.revision)
            revision.current = res.revision
            setSync({ kind: 'synced', at: Date.now() })
            return
          } catch (inner) {
            const message = inner instanceof ApiError ? inner.message : 'sync failed'
            setSync({ kind: 'error', message })
            return
          }
        }
        const message = e instanceof ApiError ? e.message : 'offline'
        setSync({ kind: 'error', message })
      }
    }, 1200)
  }, [])

  // The push runs after a delay, so it must read the newest state, not the
  // state captured when it was scheduled.
  const latest = useRef(progress)
  useEffect(() => {
    latest.current = progress
  }, [progress])

  const toggleIn = useCallback(
    (bucket: 'checkins' | 'problems' | 'challenges' | 'starred' | 'bookmarks', key: string) => {
      setProgress((p) => {
        const next = { ...p, [bucket]: { ...p[bucket] } }
        const b = next[bucket] as Record<string, 1>
        if (b[key]) delete b[key]
        else b[key] = 1
        return next
      })
    },
    [],
  )

  const review = useCallback((questionId: string, recalled: boolean) => {
    setProgress((p) => {
      const prev: ReviewState | undefined = p.reviews[questionId]
      return { ...p, reviews: { ...p.reviews, [questionId]: grade(prev, recalled) } }
    })
  }, [])

  const { streak, bestStreak, totalCheckins } = useMemo(() => {
    const dates = Object.keys(progress.checkins).sort()
    if (!dates.length) return { streak: 0, bestStreak: 0, totalCheckins: 0 }

    let best = 0
    let run = 0
    let prev: string | null = null
    for (const d of dates) {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1
      if (run > best) best = run
      prev = d
    }

    // Current streak counts back from today, or from yesterday if today is
    // not yet done — a day in progress should not read as a broken chain.
    const t = today()
    let anchor = progress.checkins[t] ? t : addDays(t, -1)
    let cur = 0
    while (progress.checkins[anchor]) {
      cur++
      anchor = addDays(anchor, -1)
    }

    return { streak: cur, bestStreak: best, totalCheckins: dates.length }
  }, [progress.checkins])

  const value: Ctx = {
    progress,
    toggleCheckin: (d) => toggleIn('checkins', d),
    toggleProblem: (s) => toggleIn('problems', s),
    toggleChallenge: (i) => toggleIn('challenges', i),
    toggleStar: (i) => toggleIn('starred', i),
    toggleBookmark: (k) => toggleIn('bookmarks', k),
    review,
    reset: () => setProgress(structuredClone(EMPTY)),
    streak,
    bestStreak,
    totalCheckins,
    sync,
    exportJson: () => JSON.stringify(progress, null, 2),
    importJson: (raw) => {
      try {
        const parsed = JSON.parse(raw)
        setProgress({ ...structuredClone(EMPTY), ...parsed })
        return true
      } catch {
        return false
      }
    },
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
