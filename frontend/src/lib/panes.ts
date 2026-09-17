import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = 'prep-panes-v1'

export interface PaneLayout {
  listW: number
  asideW: number
  listCollapsed: boolean
}

const DEFAULTS: PaneLayout = { listW: 292, asideW: 520, listCollapsed: false }

export const LIST_MIN = 190
export const LIST_MAX = 480
export const ASIDE_MIN = 320
export const ASIDE_MAX = 900
/** The detail pane never gets squeezed below this. */
export const DETAIL_MIN = 300

function read(): PaneLayout {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

/** Pane widths, dragged by the user and remembered between sessions. */
export function usePaneLayout() {
  const [layout, setLayout] = useState<PaneLayout>(read)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(layout))
    } catch {
      /* blocked storage just means the layout resets next time */
    }
  }, [layout])

  const setListW = useCallback((w: number) => {
    setLayout((l) => ({ ...l, listW: clamp(w, LIST_MIN, LIST_MAX) }))
  }, [])

  const setAsideW = useCallback((w: number) => {
    setLayout((l) => ({ ...l, asideW: clamp(w, ASIDE_MIN, ASIDE_MAX) }))
  }, [])

  const toggleList = useCallback(() => {
    setLayout((l) => ({ ...l, listCollapsed: !l.listCollapsed }))
  }, [])

  const resetWidths = useCallback(() => {
    setLayout((l) => ({ ...l, listW: DEFAULTS.listW, asideW: DEFAULTS.asideW }))
  }, [])

  return { layout, setListW, setAsideW, toggleList, resetWidths }
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
