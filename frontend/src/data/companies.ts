import type { Company } from '../types'

export const companies: Company[] = [
  {
    id: 'microsoft',
    name: 'Microsoft',
    role: 'SDE II / Senior SDE — IDC',
    status: 'upcoming',
    interviewDate: '2027-01-01',
    planId: 'microsoft-15w',
    blurb:
      'Problems are easier than Google’s; the expectations on how you get there are stricter. Communication and clean code are weighted above algorithmic exotica.',
    focus: [
      'Arrays, strings, linked lists, trees',
      '“Design this data structure”',
      'LLD / machine coding (common in India loops)',
      'System design at Senior level',
      'Growth mindset — “learn-it-all, not know-it-all”',
    ],
    rounds: [
      { name: 'Recruiter screen', format: '30 min', scored: 'Resume walkthrough, why Microsoft, level calibration, notice period' },
      { name: 'Phone / online screen', format: '45–60 min, 1–2 problems', scored: 'Clean code while talking' },
      { name: 'Loop 1–2', format: '60 min each', scored: 'DSA and problem solving' },
      { name: 'Loop 3 — design', format: '60 min', scored: 'LLD at SDE II, HLD at Senior' },
      {
        name: 'AA round (“As Appropriate”)',
        format: '60 min, senior/principal or hiring manager',
        scored: 'Judgment, scope, culture — plus one more technical question. Can override the rest of the loop in either direction.',
      },
    ],
    drill: ['dsa', 'design', 'behavioural'],
    notes: [
      'Dry-run your own solution on an example before they ask. This habit separates hires from no-hires here more than any other.',
      'Restate the problem and confirm constraints before writing anything. State the brute force and its complexity out loud, then improve it.',
      'India loops (Hyderabad / Bangalore / Noida) frequently add a 60–90 minute machine-coding round: real, compiling, testable OO code.',
      'Spring Boot is not tested — the coding rounds are language-agnostic.',
      'Level call is due ~28 Nov on mock evidence: Senior (L63) if HLD mocks land clean and you have 2+ cross-team impact stories, else SDE II (L62).',
      'Do not self-downgrade in the recruiter screen. Let the recruiter calibrate.',
    ],
  },
  {
    id: 'entain',
    name: 'Entain',
    role: 'SDE II — Entain India',
    status: 'active',
    interviewDate: '2026-09-18',
    blurb:
      'Invite names Java Concepts, Coding Concepts and Problem Solving. A first-hand tip from a current employee points at event-driven, WebSocket, SQL, AWS, multithreading and casino architecture.',
    focus: [
      'Event-driven architecture',
      'WebSockets',
      'SQL',
      'AWS (they run EKS + Aurora PostgreSQL)',
      'Multithreading',
      'Casino / betting platform architecture',
      'Java memory management',
    ],
    rounds: [
      { name: 'Technical round', format: '~60 min on Teams', scored: 'Java concepts, coding concepts, problem solving' },
    ],
    drill: ['java', 'spring', 'design'],
    notes: [
      'The named invitee is Entain India’s tech recruiter, so an unnamed engineer most likely runs the technical hour.',
      'The employee tip outranks Glassdoor. Weight event-driven, WebSocket, SQL, AWS, multithreading and casino architecture above everything else.',
    ],
  },
  {
    id: 'epam',
    name: 'EPAM',
    role: 'SDE3 Full Stack',
    status: 'active',
    blurb:
      'Roughly 80% Java backend, 20% React and Angular. Two rounds: a technical round and a managerial round on how you tackle projects and teams.',
    focus: [
      'Java backend depth',
      'React + Angular',
      'Project narrative and delivery',
      'Leading teams without authority',
    ],
    rounds: [
      { name: 'Technical round', format: '~60 min', scored: 'Java depth, design, live coding' },
      { name: 'Managerial round', format: '~45 min', scored: 'How you tackle projects and teams' },
    ],
    drill: ['java', 'web', 'behavioural'],
    notes: [
      'The project narrative is the spine of both rounds — the same story, pitched two different ways.',
      'At SDE3 the same question gets a different answer than at mid-level: scope, trade-offs and who you brought with you.',
    ],
  },
]

export const companyById = Object.fromEntries(companies.map((c) => [c.id, c]))
