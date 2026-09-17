import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { questions, topicById } from '../data'
import { buildIndex, search } from '../lib/search'
import { useDrill } from '../lib/drill'
import { DetailEmpty, ListRow, Panes } from '../components/Panes'
import { Button } from '../components/ui'
import { QuestionDetail } from '../components/QuestionDetail'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState(params.get('s') ?? '')
  const selected = params.get('q')
  const inputRef = useRef<HTMLInputElement>(null)
  const { open: openDrill } = useDrill()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const index = useMemo(() => buildIndex(questions), [])
  const results = useMemo(() => (term.trim().length > 1 ? search(index, term) : []), [index, term])
  const ids = useMemo(() => results.map((r) => r.id), [results])

  const list = (
    <div>
      <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--line)' }}>
        <input
          ref={inputRef}
          value={term}
          onChange={(e) => {
            const v = e.target.value
            setTerm(v)
            const next: Record<string, string> = { s: v }
            if (selected) next.q = selected
            setParams(next, { replace: true })
          }}
          placeholder="volatile, CAP, hashCode…"
          className="u-sans w-full"
          style={{
            fontSize: 13.5,
            padding: '7px 10px',
            borderRadius: 3,
            border: '1px solid var(--line-2)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
      </div>

      {ids.length > 0 && (
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--line)' }}>
          <Button variant="fill" onClick={() => openDrill({ title: term, ids })}>
            Drill these {ids.length}
          </Button>
        </div>
      )}

      {results.map((r) => (
        <ListRow
          key={r.id}
          active={r.id === selected}
          title={r.prompt}
          sub={topicById.get(r.topicId)?.name}
          onClick={() => setParams({ s: term, q: r.id })}
        />
      ))}

      {term.trim().length > 1 && results.length === 0 && (
        <p className="meta px-4 py-6">Nothing matched.</p>
      )}
    </div>
  )

  const detail = selected ? (
    <QuestionDetail
      questionId={selected}
      siblingIds={ids}
      onSelect={(id) => setParams(id ? { s: term, q: id } : { s: term }, { replace: true })}
      backLabel="Results"
    />
  ) : (
    <DetailEmpty>
      Searching all {questions.length} questions — prompts and answers. Every term has to appear;
      prompt matches rank first.
    </DetailEmpty>
  )

  return (
    <Panes
      listTitle="Search"
      listMeta={term.trim().length > 1 ? String(results.length) : undefined}
      list={list}
      detail={detail}
      detailOpen={!!selected}
      backTo={`/search?s=${encodeURIComponent(term)}`}
    />
  )
}
