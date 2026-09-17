import type { Question, Topic, Note } from '../types'
import { generatedQuestions } from './generated/questions'
import { generatedTopics } from './generated/topics'
import { generatedNotes } from './generated/notes'
import { dsaTopics } from './dsa'

export { categories, categoryById } from './categories'
export { companies, companyById } from './companies'
export { plans, planById, microsoftPlan } from './plans'

/** Hand-authored questions go here; they merge with the generated bank. */
export const authoredQuestions: Question[] = []

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
