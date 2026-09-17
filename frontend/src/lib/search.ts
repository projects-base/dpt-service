import type { Question } from '../types'

const norm = (s: string) => s.toLowerCase()
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ')

export interface Indexed {
  q: Question
  haystack: string
}

export function buildIndex(questions: Question[]): Indexed[] {
  return questions.map((q) => ({
    q,
    haystack: norm(`${q.prompt} ${stripHtml(q.answerHtml)} ${q.tags.join(' ')}`),
  }))
}

/** Every term must appear somewhere. Prompt hits rank above answer hits. */
export function search(index: Indexed[], raw: string, limit = 60): Question[] {
  const terms = norm(raw).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const hits: { q: Question; score: number }[] = []
  for (const { q, haystack } of index) {
    if (!terms.every((t) => haystack.includes(t))) continue
    const prompt = norm(q.prompt)
    let score = 0
    for (const t of terms) if (prompt.includes(t)) score += 10
    if (prompt.includes(norm(raw))) score += 25
    hits.push({ q, score })
  }
  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit).map((h) => h.q)
}
