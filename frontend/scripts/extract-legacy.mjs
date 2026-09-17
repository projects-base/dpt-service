/**
 * Extracts the question bank out of the legacy single-file kits into typed data
 * modules the app consumes.
 *
 *   node scripts/extract-legacy.mjs
 *
 * Source of truth is still ../interview-prep.html — re-run this whenever that
 * file changes. Everything it writes under src/data/generated is disposable.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const LEGACY = resolve(ROOT, 'source', 'interview-prep.html')
const OUT_DIR = resolve(ROOT, 'src', 'data', 'generated')

/** Which coarse category each legacy part belongs to. */
const PART_CATEGORY = {
  1: 'java',
  2: 'spring',
  3: 'design',
  4: 'web',
  5: 'behavioural',
  6: 'java',
  7: 'spring',
  8: 'java',
  9: 'company',
  10: 'company',
  11: 'deepdive',
  12: 'company',
}

/** Parts that belong to a specific company rather than the general bank. */
const PART_COMPANY = { 9: 'epam', 10: 'epam', 12: 'entain' }

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

/** Headings carry a trailing "#" anchor link in the legacy kit. */
const cleanHeading = (s) =>
  stripTags(s.replace(/<a[^>]*>\s*[#¶]\s*<\/a>/gi, '')).replace(/\s*#+\s*$/, '').trim()

const slug = (s) =>
  stripTags(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)

function main() {
  const html = readFileSync(LEGACY, 'utf8')

  // ---- part titles, from the nav rail -------------------------------------
  const partTitles = {}
  for (const m of html.matchAll(
    /id="tab-(\d+)"[\s\S]{0,400}?<span class="grp-t">([\s\S]*?)<\/span>/g,
  )) {
    partTitles[Number(m[1])] = stripTags(m[2])
  }

  // ---- panel boundaries ---------------------------------------------------
  const panels = []
  for (const m of html.matchAll(/<section class="panel" id="panel-(\d+)"[^>]*>/g)) {
    panels.push({ part: Number(m[1]), start: m.index + m[0].length })
  }
  panels.forEach((p, i) => {
    p.end = i + 1 < panels.length ? panels[i + 1].start : html.length
    p.html = html.slice(p.start, p.end)
  })

  const topics = []
  const questions = []
  const notes = []
  let skipped = 0

  for (const panel of panels) {
    const part = panel.part
    const category = PART_CATEGORY[part] ?? 'misc'
    const company = PART_COMPANY[part] ?? null

    // Walk headings and question cards in document order so each question
    // lands under the heading that precedes it.
    const marks = []
    for (const m of panel.html.matchAll(
      /<h([2-4])\s+id="(p\d+-[^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g,
    )) {
      marks.push({
        kind: 'h',
        at: m.index,
        end: m.index + m[0].length,
        id: m[2],
        title: cleanHeading(m[3]),
        level: Number(m[1]),
      })
    }
    for (const m of panel.html.matchAll(/<section class="qa" id="(q\d+-\d+)"[^>]*>/g)) {
      marks.push({ kind: 'q', at: m.index, id: m[1], bodyStart: m.index + m[0].length })
    }
    marks.sort((a, b) => a.at - b.at)

    let currentTopic = null
    const fallbackTopic = {
      id: `${category}--part-${part}`,
      categoryId: category,
      part,
      companyId: company,
      name: partTitles[part] ?? `Part ${part}`,
      order: topics.length,
    }

    for (let i = 0; i < marks.length; i++) {
      const mark = marks[i]

      if (mark.kind === 'h') {
        // Only h2/h3 open a topic; h4 is a sub-heading inside one.
        if (mark.level <= 3) {
          currentTopic = {
            id: `${category}--${slug(mark.title) || mark.id}`,
            categoryId: category,
            part,
            companyId: company,
            name: mark.title,
            order: topics.length,
          }
          if (!topics.some((t) => t.id === currentTopic.id)) topics.push(currentTopic)
          else currentTopic = topics.find((t) => t.id === currentTopic.id)
        }

        // Prose between this heading and whatever comes next is reference
        // material — parts 3, 5 and 8 are almost entirely this.
        const nextMark = marks[i + 1]
        const prose = panel.html
          .slice(mark.end, nextMark ? nextMark.at : panel.html.length)
          .trim()
        if (currentTopic && stripTags(prose).length > 40) {
          notes.push({
            id: `note-${part}-${slug(mark.title) || mark.id}-${mark.level}`,
            topicId: currentTopic.id,
            categoryId: category,
            companyId: company,
            part,
            heading: mark.title,
            level: mark.level,
            html: prose,
            source: 'interview-prep.html',
          })
        }
        continue
      }

      // A qa card is closed by its own </section> and never nests one, so the
      // first closer after it is the real end. Slicing to the next mark instead
      // swallowed the trailing markup — an unbalanced </div> that closed the
      // prose container early, plus whatever prose followed the card.
      const next = marks[i + 1]
      const closeAt = panel.html.indexOf('</section>', mark.bodyStart)
      const bodyEnd = closeAt === -1 ? (next ? next.at : panel.html.length) : closeAt
      const body = panel.html.slice(mark.bodyStart, bodyEnd)

      const qm = body.match(
        /<p class="q">\s*(?:<span class="qnum">[^<]*<\/span>)?\s*<span class="qtext">([\s\S]*?)<\/span>\s*<\/p>/,
      )
      if (!qm) {
        skipped++
        continue
      }
      const prompt = stripTags(qm[1])

      const aIdx = body.indexOf('<div class="a">')
      let answerHtml = ''
      if (aIdx !== -1) {
        answerHtml = body.slice(aIdx + '<div class="a">'.length).replace(/<\/div>\s*$/, '').trim()
      }

      if (!currentTopic) {
        if (!topics.some((t) => t.id === fallbackTopic.id)) topics.push(fallbackTopic)
        currentTopic = topics.find((t) => t.id === fallbackTopic.id)
      }

      // Anything between this card's close and the next mark is section prose
      // (SECTION D/E blocks and closing notes live here). It used to be glued
      // onto the answer above; now it becomes a note of its own.
      if (closeAt !== -1) {
        const gapStart = closeAt + '</section>'.length
        const gapEnd = next ? next.at : panel.html.length
        const gap = panel.html
          .slice(gapStart, gapEnd)
          .replace(/(<\/div>\s*<\/section>\s*)+$/, '')
          .replace(/^\s*<hr\s*\/?>\s*/, '')
          .trim()
        if (currentTopic && stripTags(gap).length > 30) {
          notes.push({
            id: `note-${part}-${mark.id}-tail`,
            topicId: currentTopic.id,
            categoryId: category,
            companyId: company,
            part,
            heading: currentTopic.name,
            level: 3,
            html: gap,
            source: 'interview-prep.html',
          })
        }
      }

      questions.push({
        id: `${part}-${mark.id}`,
        topicId: currentTopic.id,
        categoryId: category,
        companyId: company,
        part,
        prompt,
        answerHtml,
        followUps: [],
        tags: [],
        source: 'interview-prep.html',
      })
    }
  }

  mkdirSync(OUT_DIR, { recursive: true })

  const banner = `// GENERATED by scripts/extract-legacy.mjs — do not edit by hand.
// Re-run \`npm run extract\` after changing ../interview-prep.html.
import type { Topic, Question, Note } from '../../types'
`

  writeFileSync(
    resolve(OUT_DIR, 'topics.ts'),
    `${banner}\nexport const generatedTopics: Topic[] = ${JSON.stringify(topics, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    resolve(OUT_DIR, 'questions.ts'),
    `${banner}\nexport const generatedQuestions: Question[] = ${JSON.stringify(questions, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    resolve(OUT_DIR, 'notes.ts'),
    `${banner}\nexport const generatedNotes: Note[] = ${JSON.stringify(notes, null, 2)}\n`,
    'utf8',
  )

  const byCat = {}
  for (const q of questions) byCat[q.categoryId] = (byCat[q.categoryId] ?? 0) + 1

  console.log(`parts     ${panels.length}`)
  console.log(`topics    ${topics.length}`)
  console.log(`questions ${questions.length}${skipped ? ` (${skipped} skipped)` : ''}`)
  console.log(`notes     ${notes.length}`)
  console.log('by category:', byCat)
}

main()
