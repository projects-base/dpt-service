import { useState } from 'react'
import { notesByTopic, questionsByTopic, topicById } from '../data'
import { useDrill } from '../lib/drill'
import { useProgress } from '../lib/progress'
import { Button } from './ui'

/**
 * A topic rendered for the third column — narrower than the detail pane, so
 * questions expand in place rather than pushing you to yet another view.
 */
export function TopicPanel({ topicId }: { topicId: string }) {
  const t = topicById.get(topicId)
  const { open: openDrill } = useDrill()
  const { progress, review, toggleStar } = useProgress()
  const qs = questionsByTopic[topicId] ?? []
  const ns = notesByTopic[topicId] ?? []
  const [tab, setTab] = useState<'q' | 'ref'>(qs.length ? 'q' : 'ref')
  const [openId, setOpenId] = useState<string | null>(null)

  if (!t) return <p className="meta px-5 py-6">That topic no longer exists.</p>

  return (
    <div className="px-5 py-5">
      <h2 className="mb-3" style={{ fontSize: 19, lineHeight: 1.3, fontWeight: 500 }}>
        {t.name}
      </h2>
      {t.blurb && <p className="body-sans mb-4">{t.blurb}</p>}

      {qs.length > 0 && (
        <Button variant="fill" onClick={() => openDrill({ title: t.name, ids: qs.map((q) => q.id) })}>
          Drill {qs.length} cards
        </Button>
      )}

      {qs.length > 0 && ns.length > 0 && (
        <div className="tabs mt-5" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === 'q'} onClick={() => setTab('q')}>
            Questions <span className="tab-count">{qs.length}</span>
          </button>
          <button className="tab" role="tab" aria-selected={tab === 'ref'} onClick={() => setTab('ref')}>
            Reference <span className="tab-count">{ns.length}</span>
          </button>
        </div>
      )}

      <div className="mt-5">
        {tab === 'q' &&
          qs.map((q, i) => {
            const isOpen = openId === q.id
            const starred = !!progress.starred[q.id]
            return (
              <div key={q.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <button
                  onClick={() => setOpenId(isOpen ? null : q.id)}
                  className="w-full text-left flex gap-2.5 items-baseline py-3 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="u-mono flex-none w-5" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                    {i + 1}
                  </span>
                  <span
                    className="u-sans flex-1 min-w-0"
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      color: isOpen ? 'var(--accent-ink)' : 'var(--ink)',
                      fontWeight: isOpen ? 600 : 400,
                    }}
                  >
                    {q.prompt}
                  </span>
                  {starred && <span style={{ color: 'var(--boss)', fontSize: 10 }}>★</span>}
                </button>

                {isOpen && (
                  <div className="pb-4 pl-7">
                    <div
                      className="prose scroll-x"
                      style={{ fontSize: 15.5 }}
                      dangerouslySetInnerHTML={{ __html: q.answerHtml }}
                    />
                    <div className="flex gap-1.5 mt-4 flex-wrap">
                      <Button variant="tiny" onClick={() => review(q.id, true)}>
                        I had it
                      </Button>
                      <Button variant="tiny" onClick={() => review(q.id, false)}>
                        Gone
                      </Button>
                      <Button variant="tiny" active={starred} onClick={() => toggleStar(q.id)}>
                        {starred ? '★' : '☆'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

        {tab === 'ref' &&
          ns.map((n) => (
            <div key={n.id} className="mb-7">
              {n.level > 2 && (
                <h3 className="u-sans mb-2" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  {n.heading}
                </h3>
              )}
              <div
                className="prose scroll-x"
                style={{ fontSize: 15.5 }}
                dangerouslySetInnerHTML={{ __html: n.html }}
              />
            </div>
          ))}

        {qs.length === 0 && ns.length === 0 && <p className="meta">Nothing filed here yet.</p>}
      </div>
    </div>
  )
}
