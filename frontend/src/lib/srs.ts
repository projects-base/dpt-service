import type { ReviewState } from '../types'
import { addDays, today } from './dates'

/** The +3 / +10 / +30 ladder. A miss sends the card back to the start. */
export const INTERVALS = [3, 10, 30]

export const nextInterval = (streak: number): number =>
  INTERVALS[Math.min(streak, INTERVALS.length - 1)]

export function grade(prev: ReviewState | undefined, recalled: boolean): ReviewState {
  const t = today()
  const streak = recalled ? (prev?.streak ?? 0) + 1 : 0
  return { streak, last: t, due: addDays(t, nextInterval(recalled ? streak : 0)) }
}

export const isDue = (r: ReviewState | undefined): boolean => !r || r.due <= today()
