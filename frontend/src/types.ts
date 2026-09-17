/**
 * The whole content model. Everything the app renders is one of these shapes,
 * so adding material is always a data edit, never a component edit.
 */

export type CategoryId =
  | 'dsa'
  | 'java'
  | 'spring'
  | 'design'
  | 'web'
  | 'behavioural'
  | 'deepdive'
  | 'company'
  | 'misc'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Category {
  id: CategoryId
  name: string
  blurb: string
  /** Company prep is a section of its own, not a peer of the knowledge areas. */
  kind: 'knowledge' | 'company'
  order: number
}

export interface Topic {
  id: string
  categoryId: CategoryId
  name: string
  blurb?: string
  /** Legacy part number this came from, when it came from the old kit. */
  part?: number
  companyId?: string | null
  order: number
}

export interface FollowUp {
  q: string
  /** HTML or plain text. Follow-ups are where interviews are actually lost. */
  a: string
}

export interface Question {
  id: string
  topicId: string
  categoryId: CategoryId
  companyId?: string | null
  part?: number
  prompt: string
  /** Rendered as HTML — the legacy bank is already marked up. */
  answerHtml: string
  followUps: FollowUp[]
  tags: string[]
  difficulty?: Difficulty
  /** Companies known to ask this one. Drives the company views. */
  askedBy?: string[]
  source?: string
}

export interface Round {
  name: string
  format: string
  scored: string
}

export interface Company {
  id: string
  name: string
  role: string
  status: 'active' | 'upcoming' | 'past'
  /** ISO date, when one is known. */
  interviewDate?: string
  blurb: string
  focus: string[]
  rounds: Round[]
  /** Topic ids worth drilling for this company, in priority order. */
  drill: string[]
  notes?: string[]
  planId?: string
}

/* ---------------- study plan ---------------- */

export interface PlanWeek {
  n: string
  /** ISO dates, inclusive. */
  start: string
  end: string
  title: string
  weekdays: string
  weekend: string
  /** LeetCode slugs paired with display names. */
  problems: [string, string][]
  challenge: string
  video: [label: string, searchQuery: string]
  algomaster: string
  milestone?: string
  light?: boolean
}

export interface BossFight {
  when: string
  html: string
  big?: boolean
}

export interface Plan {
  id: string
  companyId: string
  title: string
  subtitle: string
  start: string
  end: string
  /** The day interviews begin. */
  liveFrom: string
  weeks: PlanWeek[]
  bosses: BossFight[]
  rules: { title: string; body: string }[]
}

/* ---------------- progress ---------------- */

export interface Progress {
  /** ISO date -> 1, for days the 25-minute floor was hit. */
  checkins: Record<string, 1>
  /** LeetCode slug -> 1. */
  problems: Record<string, 1>
  /** Week id -> 1. */
  challenges: Record<string, 1>
  /** Question id -> spaced-repetition state. */
  reviews: Record<string, ReviewState>
  /** Question id -> 1, starred for another look. */
  starred: Record<string, 1>
  /** Bookmarks on non-question things, keyed `topic:<id>` / `week:<n>` / `company:<id>`. */
  bookmarks: Record<string, 1>
}

export interface ReviewState {
  /** How many successful recalls in a row. Drives the +3/+10/+30 ladder. */
  streak: number
  /** ISO date of the last review. */
  last: string
  /** ISO date this is next due. */
  due: string
}

/** Prose reference material — parts 3, 5 and 8 of the legacy kit are this. */
export interface Note {
  id: string
  topicId: string
  categoryId: CategoryId
  companyId?: string | null
  part?: number
  heading: string
  level: number
  html: string
  source?: string
}
