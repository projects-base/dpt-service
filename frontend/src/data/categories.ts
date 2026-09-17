import type { Category } from '../types'

export const categories: Category[] = [
  {
    id: 'dsa',
    name: 'Data structures & algorithms',
    blurb:
      'Patterns rather than problems. The spine is Blind 75 plus the Microsoft-frequent set — around 125 problems seen three times each.',
    kind: 'knowledge',
    order: 1,
  },
  {
    id: 'java',
    name: 'Java, JVM & concurrency',
    blurb:
      'Language semantics, collections, memory model, garbage collection and threading. The part interviewers probe hardest at 5+ years.',
    kind: 'knowledge',
    order: 2,
  },
  {
    id: 'spring',
    name: 'Spring, data & services',
    blurb:
      'Spring core and Boot internals, JPA and SQL, REST design, microservices and messaging. Not tested at Microsoft; heavily tested nearly everywhere else.',
    kind: 'knowledge',
    order: 3,
  },
  {
    id: 'design',
    name: 'Design — LLD & HLD',
    blurb:
      'SOLID and the patterns you must be able to write, then distributed systems: sharding, caching, queues, consistency and the capacity math.',
    kind: 'knowledge',
    order: 4,
  },
  {
    id: 'web',
    name: 'Frontend & DevOps',
    blurb: 'React, Angular, build tooling, CI/CD and containers — the 20% of a full-stack loop.',
    kind: 'knowledge',
    order: 5,
  },
  {
    id: 'behavioural',
    name: 'Behavioural & leadership',
    blurb:
      'STAR stories that end in a number, scope and ambiguity questions, and the growth-mindset framing Microsoft listens for.',
    kind: 'knowledge',
    order: 6,
  },
  {
    id: 'deepdive',
    name: 'Long-form answers & code',
    blurb: 'The answers that need a page and a code listing rather than a paragraph.',
    kind: 'knowledge',
    order: 7,
  },
  {
    id: 'company',
    name: 'Company-specific',
    blurb:
      'Per-company intelligence: the loop, what each round scores, reported questions, and the topics worth drilling for that employer alone.',
    kind: 'company',
    order: 8,
  },
  {
    id: 'misc',
    name: 'Unfiled',
    blurb: 'Anything not yet placed.',
    kind: 'knowledge',
    order: 9,
  },
]

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
