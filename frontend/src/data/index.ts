import type { Question, Topic, Note } from '../types'
import { generatedQuestions } from './generated/questions'
import { generatedTopics } from './generated/topics'
import { generatedNotes } from './generated/notes'
import { dsaTopics } from './dsa'
import { designQuestions } from './design'

export { categories, categoryById } from './categories'
export { companies, companyById } from './companies'
export { plans, planById, microsoftPlan } from './plans'

/**
 * Hand-authored questions go here; they merge with the generated bank.
 *
 * The design set is kept in its own folder rather than inline: SOLID and the
 * pattern families change for different reasons and are reviewed separately,
 * so they are separate files. See data/design/index.ts.
 */
export const authoredQuestions: Question[] = [...designQuestions]

export const questions: Question[] = [...generatedQuestions, ...authoredQuestions]
export const topics: Topic[] = [...generatedTopics, ...dsaTopics]
export const notes: Note[] = [...generatedNotes]

export const questionById = new Map(questions.map((q) => [q.id, q]))
export const topicById = new Map(topics.map((t) => [t.id, t]))

export const questionsByTopic = topics.reduce<Record<string, Question[]>>((acc, t) => {
  acc[t.id] = []
  return acc
}, {})
for (const q of questions) (questionsByTopic[q.topicId] ??= []).push(q)

export const notesByTopic = notes.reduce<Record<string, Note[]>>((acc, n) => {
  ;(acc[n.topicId] ??= []).push(n)
  return acc
}, {})

export const topicsByCategory = topics.reduce<Record<string, Topic[]>>((acc, t) => {
  ;(acc[t.categoryId] ??= []).push(t)
  return acc
}, {})

export const countsByCategory = questions.reduce<Record<string, number>>((acc, q) => {
  acc[q.categoryId] = (acc[q.categoryId] ?? 0) + 1
  return acc
}, {})

export const topicsByCompany = topics.reduce<Record<string, Topic[]>>((acc, t) => {
  if (t.companyId) (acc[t.companyId] ??= []).push(t)
  return acc
}, {})
