/**
 * Turns the generated bank into the payload POST /api/prep/import expects,
 * and optionally pushes it.
 *
 *   npm run export:bank              # write build/prep-bank.json
 *   npm run push:bank -- <jwt>       # write it and POST it
 *
 * The token is a Google ID token from the dashboard's session — the same one
 * the web app sends. It is read from the argument or PREP_TOKEN, never stored.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const OUT = resolve(ROOT, 'build', 'prep-bank.json')
const API = process.env.PREP_API ?? 'http://localhost:8080'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
})

const { categories } = await server.ssrLoadModule('/src/data/categories.ts')
const { dsaTopics } = await server.ssrLoadModule('/src/data/dsa.ts')
const { generatedTopics } = await server.ssrLoadModule('/src/data/generated/topics.ts')
const { generatedQuestions } = await server.ssrLoadModule('/src/data/generated/questions.ts')
const { generatedNotes } = await server.ssrLoadModule('/src/data/generated/notes.ts')
const { microsoftPlan } = await server.ssrLoadModule('/src/data/plans.ts')
await server.close()

const topics = [...generatedTopics, ...dsaTopics]

const payload = {
  categories: categories.map((c, i) => ({
    key: c.id,
    name: c.name,
    blurb: c.blurb,
    kind: c.kind,
    order: c.order ?? i,
  })),
  topics: topics.map((t, i) => ({
    key: t.id,
    categoryKey: t.categoryId,
    name: t.name,
    blurb: t.blurb ?? null,
    companyKey: t.companyId ?? null,
    part: t.part ?? null,
    order: t.order ?? i,
  })),
  questions: generatedQuestions.map((q) => ({
    key: q.id,
    topicKey: q.topicId,
    categoryKey: q.categoryId,
    companyKey: q.companyId ?? null,
    prompt: q.prompt,
    answerHtml: q.answerHtml,
    followUps: q.followUps ?? [],
    tags: q.tags ?? [],
    difficulty: q.difficulty ?? null,
    source: q.source ?? null,
  })),
  references: generatedNotes.map((n) => ({
    key: n.id,
    topicKey: n.topicId,
    categoryKey: n.categoryId,
    companyKey: n.companyId ?? null,
    heading: n.heading,
    level: n.level,
    html: n.html,
    source: n.source ?? null,
  })),
  plan: {
    key: microsoftPlan.id,
    weeks: microsoftPlan.weeks.map((w, i) => ({
      key: w.n,
      start: w.start,
      end: w.end,
      title: w.title,
      weekdays: w.weekdays,
      weekend: w.weekend,
      problems: w.problems.map(([name, slug]) => [name, slug]),
      challenge: w.challenge,
      videoLabel: w.video[0],
      videoQuery: w.video[1],
      algomaster: w.algomaster,
      milestone: w.milestone ?? null,
      light: !!w.light,
      order: i,
    })),
  },
}

/* --- the import is a replace, so a payload that lost rows would delete them --- */
const problems = []
const topicKeys = new Set(payload.topics.map((t) => t.key))
const categoryKeys = new Set(payload.categories.map((c) => c.key))
for (const q of payload.questions) {
  if (!topicKeys.has(q.topicKey)) problems.push(`question ${q.key} → unknown topic ${q.topicKey}`)
}
for (const r of payload.references) {
  if (!topicKeys.has(r.topicKey)) problems.push(`reference ${r.key} → unknown topic ${r.topicKey}`)
}
for (const t of payload.topics) {
  if (!categoryKeys.has(t.categoryKey)) problems.push(`topic ${t.key} → unknown category ${t.categoryKey}`)
}
const dupes = (arr) => {
  const seen = new Set()
  const out = []
  for (const k of arr) {
    if (seen.has(k)) out.push(k)
    seen.add(k)
  }
  return out
}
for (const k of dupes(payload.questions.map((q) => q.key))) problems.push(`duplicate question key ${k}`)
for (const k of dupes(payload.topics.map((t) => t.key))) problems.push(`duplicate topic key ${k}`)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(payload), 'utf8')

const bytes = JSON.stringify(payload).length
console.log(`categories ${payload.categories.length}`)
console.log(`topics     ${payload.topics.length}`)
console.log(`questions  ${payload.questions.length}`)
console.log(`references ${payload.references.length}`)
console.log(`plan weeks ${payload.plan.weeks.length}`)
console.log(`payload    ${(bytes / 1024 / 1024).toFixed(2)} MB → ${OUT}`)

if (problems.length) {
  console.error(`\n${problems.length} referential problems — NOT pushing:`)
  problems.slice(0, 20).forEach((p) => console.error('  ' + p))
  process.exit(1)
}
console.log('referential integrity OK')

const token = process.argv[2] ?? process.env.PREP_TOKEN
if (!token) {
  console.log('\nNo token given — wrote the file only.')
  console.log(`To push:  npm run push:bank -- <google-id-token>   (PREP_API=${API})`)
  process.exit(0)
}

const res = await fetch(`${API}/api/prep/import`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
})
const text = await res.text()
if (!res.ok) {
  console.error(`\nimport failed ${res.status}: ${text.slice(0, 400)}`)
  process.exit(1)
}
console.log(`\nimported: ${text}`)
