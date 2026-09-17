import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface DrillQueue {
  title: string
  /** Question ids, in the order they will be shown. */
  ids: string[]
}

interface Ctx {
  queue: DrillQueue | null
  open: (q: DrillQueue) => void
  close: () => void
}

const DrillContext = createContext<Ctx | null>(null)

export function DrillProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DrillQueue | null>(null)
  const open = useCallback((q: DrillQueue) => {
    if (q.ids.length) setQueue(q)
  }, [])
  const close = useCallback(() => setQueue(null), [])
  const value = useMemo(() => ({ queue, open, close }), [queue, open, close])
  return <DrillContext.Provider value={value}>{children}</DrillContext.Provider>
}

export function useDrill(): Ctx {
  const ctx = useContext(DrillContext)
  if (!ctx) throw new Error('useDrill must be used inside DrillProvider')
  return ctx
}
