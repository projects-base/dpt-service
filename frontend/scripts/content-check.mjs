/**
 * Integrity check for the question bank.
 *
 *   node scripts/content-check.mjs
 *
 * This exists because of a bug that shipped. The legacy extractor sliced each
 * answer to the start of the NEXT card rather than to the card's own closing
 * tag, so answers swallowed a stray `</div>` — which closed `.prose` early and
 * silently blanked the rest of the page. It looked fine in the data and broke
 * in the browser, and it was found by a human reading the Entain material
 * rather than by anything automated.
 *
 * So the rules below are the ones that would have caught it:
 *
 *   • every answer's HTML is balanced, and never closes more than it opens
 *   • every question points at a topic that exists
 *   • ids are unique — a duplicate silently overwrites in `questionById`
 *   • authored answers only use CSS classes `.prose` actually styles
 *
 * The last rule matters for hand-authored content specifically: a typo in a
 * class name renders as unstyled text rather than as an error.
 */
import { createServer } from 'vite'
import fs from 'node:fs'

const failures = []
const check = (name, ok, detail) => {
  console.log((ok ? '  ok    ' : '  FAIL  ') + name + (!ok && detail ? ' — ' + detail : ''))
  if (!ok) failures.push(name)
}
const section = (t) => console.log('\n' + t)

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

const data = await server.ssrLoadModule('/src/data/index.ts')
const { questions, topics, authoredQuestions, questionsByTopic } = data

/* ── which classes may appear in authored markup ─────────────────────────── */

const css = fs.readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8')
const styledClasses = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))

/** Void elements never need closing, so they are excluded from the balance check. */
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr'])

/** Returns the first imbalance found, or null. */
function imbalance(html) {
  const stack = []
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g)) {
    const [, closing, tag, selfClosing] = m
    const name = tag.toLowerCase()
    if (VOID.has(name) || selfClosing) continue
    if (closing) {
      if (stack.length === 0) return `closes </${name}> that was never opened`
      const open = stack.pop()
      if (open !== name) return `closes </${name}> while <${open}> is still open`
    } else {
      stack.push(name)
    }
  }
  return stack.length ? `leaves <${stack[stack.length - 1]}> unclosed` : null
}

section('the bank is internally consistent')

const topicIds = new Set(topics.map((t) => t.id))
const orphans = questions.filter((q) => !topicIds.has(q.topicId))
check(
  `all ${questions.length} questions point at a real topic`,
  orphans.length === 0,
  orphans.slice(0, 5).map((q) => `${q.id} → ${q.topicId}`).join(', '),
)

const seen = new Map()
const dupes = []
for (const q of questions) {
  if (seen.has(q.id)) dupes.push(q.id)
  seen.set(q.id, q)
}
check('question ids are unique', dupes.length === 0, dupes.slice(0, 5).join(', '))

const topicDupes = []
const seenTopics = new Set()
for (const t of topics) {
  if (seenTopics.has(t.id)) topicDupes.push(t.id)
  seenTopics.add(t.id)
}
check('topic ids are unique', topicDupes.length === 0, topicDupes.slice(0, 5).join(', '))

section('every answer is renderable')

const broken = []
for (const q of questions) {
  const bad = imbalance(q.answerHtml)
  if (bad) broken.push(`${q.id}: ${bad}`)
  for (const f of q.followUps || []) {
    const badF = imbalance(f.a)
    if (badF) broken.push(`${q.id} follow-up: ${badF}`)
  }
}
check('answer HTML is balanced', broken.length === 0, broken.slice(0, 6).join(' | '))

section('authored answers use classes the stylesheet knows')

const unknown = new Set()
for (const q of authoredQuestions) {
  for (const m of q.answerHtml.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls && !styledClasses.has(cls)) unknown.add(`${cls} (in ${q.id})`)
    }
  }
}
check('no unstyled class names', unknown.size === 0, [...unknown].slice(0, 8).join(', '))

section('the hand-authored design set landed')

const DESIGN_TOPICS = [
  'design--s-single-responsibility-principle',
  'design--o-open-closed-principle',
  'design--l-liskov-substitution-principle',
  'design--i-interface-segregation-principle',
  'design--d-dependency-inversion-principle',
  'design--2-design-patterns',
  'design--creational',
  'design--structural',
  'design--behavioural',
]
const emptyDesign = DESIGN_TOPICS.filter((id) => !(questionsByTopic[id] || []).length)
check(
  `all ${DESIGN_TOPICS.length} SOLID and pattern topics have questions`,
  emptyDesign.length === 0,
  emptyDesign.join(', '),
)

const noFollowUps = authoredQuestions.filter((q) => !(q.followUps || []).length)
check(
  'every authored question carries follow-ups',
  noFollowUps.length === 0,
  noFollowUps.map((q) => q.id).join(', '),
)

section('authored code fits the column it is read in')

// The drill panel is a narrow third column. Long lines do not wrap — the block
// gets a horizontal scrollbar — and it is always the trailing comment that
// disappears off the right edge, which is exactly the part carrying the point.
// 72 is the usual review limit and leaves the comments visible in the wider
// reading view. Only authored code is checked; the generated bank is what it is.
const CODE_WIDTH = 72
const wide = []
for (const file of [
  'solid.ts',
  'patterns-creational.ts',
  'patterns-structural.ts',
  'patterns-behavioural.ts',
]) {
  const src = fs.readFileSync(new URL(`../src/data/design/${file}`, import.meta.url), 'utf8')
  for (const m of src.matchAll(/java\(`([\s\S]*?)`\)/g)) {
    for (const line of m[1].split('\n')) {
      // CRLF checkouts leave a carriage return on every line; not a column.
      const clean = line.replace(/\r$/, '')
      if (clean.length > CODE_WIDTH) wide.push(`${file}: ${clean.length} — ${clean.trim().slice(0, 40)}`)
    }
  }
}
check(`authored code lines fit ${CODE_WIDTH} columns`, wide.length === 0, wide.slice(0, 5).join(' | '))

const noCode = authoredQuestions.filter((q) => !/<pre|<code/.test(q.answerHtml))
check(
  'every authored answer shows code',
  noCode.length === 0,
  noCode.map((q) => q.id).join(', '),
)

await server.close()

console.log(
  failures.length
    ? `\n${failures.length} failing`
    : `\nall good — ${questions.length} questions, ${authoredQuestions.length} authored`,
)
process.exit(failures.length ? 1 : 0)
