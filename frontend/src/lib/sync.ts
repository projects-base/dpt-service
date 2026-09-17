import type { Progress, ReviewState } from '../types'

/**
 * Merging two copies of progress.
 *
 * Study happens on a laptop and a phone, often without either having seen the
 * other's session, so "last write wins" would silently throw a day away. Every
 * bucket here is additive: a check-in, a solved problem, a passed challenge and
 * a star are all facts that happened, and nothing undoes them except the user
 * explicitly un-ticking — which is rare and not worth losing a day over.
 *
 * Review state is the one exception: it is a position on a ladder rather than a
 * fact, so the more recently reviewed copy wins.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  return {
    checkins: { ...a.checkins, ...b.checkins },
    problems: { ...a.problems, ...b.problems },
    challenges: { ...a.challenges, ...b.challenges },
    starred: { ...a.starred, ...b.starred },
    bookmarks: { ...a.bookmarks, ...b.bookmarks },
    reviews: mergeReviews(a.reviews, b.reviews),
  }
}

function mergeReviews(
  a: Record<string, ReviewState>,
  b: Record<string, ReviewState>,
): Record<string, ReviewState> {
  const out: Record<string, ReviewState> = { ...a }
  for (const [id, mine] of Object.entries(b)) {
    const theirs = out[id]
    if (!theirs) {
      out[id] = mine
      continue
    }
    // Whichever device graded the card most recently holds the truer position.
    out[id] = mine.last >= theirs.last ? mine : theirs
  }
  return out
}

const EMPTY: Progress = {
  checkins: {},
  problems: {},
  challenges: {},
  reviews: {},
  starred: {},
  bookmarks: {},
}

/** Coerces whatever the server returns into the shape the app expects. */
export function asProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return structuredClone(EMPTY)
  const r = raw as Partial<Progress>
  return {
    checkins: r.checkins ?? {},
    problems: r.problems ?? {},
    challenges: r.challenges ?? {},
    reviews: r.reviews ?? {},
    starred: r.starred ?? {},
    bookmarks: r.bookmarks ?? {},
  }
}

export const EMPTY_PROGRESS = EMPTY
