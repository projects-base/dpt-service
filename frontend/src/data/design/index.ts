import type { Question } from '../../types'
import { solidQuestions } from './solid'
import { patternOverviewQuestions } from './patterns-overview'
import { creationalQuestions } from './patterns-creational'
import { structuralQuestions } from './patterns-structural'
import { behaviouralQuestions } from './patterns-behavioural'

/**
 * Hand-authored LLD material: SOLID and the design patterns, as drillable
 * questions.
 *
 * Why this exists alongside the generated bank. The legacy kit carries these
 * topics as reference prose — a paragraph per principle, a line per pattern.
 * Prose is not drillable: it never enters the +3/+10/+30 review ladder, so the
 * one part of the loop you most need to rehearse out loud was the one part you
 * could only read. These are the same topics written as question, violation,
 * fix and follow-up, attached to the topic ids the extractor already created.
 *
 * Adding more: drop a new `Question` into the file for its family and it
 * appears. No component knows any of these ids.
 */
export const designQuestions: Question[] = [
  ...solidQuestions,
  ...patternOverviewQuestions,
  ...creationalQuestions,
  ...structuralQuestions,
  ...behaviouralQuestions,
]
