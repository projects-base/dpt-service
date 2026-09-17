import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { companyById, microsoftPlan, questionById, topicById } from '../data'
import { useProgress } from '../lib/progress'
import { useDrill } from '../lib/drill'
import { Detail, ListGroup, ListRow, Panes } from '../components/Panes'
import { Button } from '../components/ui'
import { QuestionDetail } from '../components/QuestionDetail'

/**
 * Everything the user has flagged, in one place: starred questions plus
 * bookmarked topics, weeks and companies. Bookmark keys are `kind:id`.
 */
export function Starred() {
  const { progress, toggleStar, toggleBookmark } = useProgress()
  const { open: openDrill } = useDrill()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const selected = params.get('q')

  const questionIds = useMemo(() => Object.keys(progress.starred), [progress.starred])

  const marks = useMemo(() => {
    const keys = Object.keys(progress.bookmarks)
    return {
      topics: keys.filter((k) => k.startsWith('topic:')).map((k) => k.slice(6)),
      weeks: keys.filter((k) => k.startsWith('week:')).map((k) => k.slice(5)),
      companies: keys.filter((k) => k.startsWith('company:')).map((k) => k.slice(8)),
    }
  }, [progress.bookmarks])

  const total =
    questionIds.length + marks.topics.length + marks.weeks.length + marks.companies.length

  const list = (
    <div>
      {questionIds.length > 0 && (
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--line)' }}>
          <Button variant="fill" onClick={() => openDrill({ title: 'Starred', ids: questionIds })}>
            Drill {questionIds.length} starred
          </Button>
        </div>
      )}

      {questionIds.length > 0 && (
        <ListGroup label="Questions" count={questionIds.length} open onToggle={() => {}}>
          {questionIds.map((id) => {
            const q = questionById.get(id)
            if (!q) return null
            return (
              <ListRow
                key={id}
                active={id === selected}
                title={q.prompt}
                sub={topicById.get(q.topicId)?.name}
                starred
                onStar={() => toggleStar(id)}
                onClick={() => setParams({ q: id })}
              />
            )
          })}
        </ListGroup>
      )}

      {marks.topics.length > 0 && (
        <ListGroup label="Topics" count={marks.topics.length} open onToggle={() => {}}>
          {marks.topics.map((tid) => {
            const t = topicById.get(tid)
            if (!t) return null
            return (
              <ListRow
                key={tid}
                title={t.name}
                starred
                onStar={() => toggleBookmark(`topic:${tid}`)}
                onClick={() => navigate(`/topics/${encodeURIComponent(tid)}`)}
              />
            )
          })}
        </ListGroup>
      )}

      {marks.weeks.length > 0 && (
        <ListGroup label="Plan weeks" count={marks.weeks.length} open onToggle={() => {}}>
          {marks.weeks.map((n) => {
            const w = microsoftPlan.weeks.find((x) => x.n === n)
            if (!w) return null
            return (
              <ListRow
                key={n}
                title={`${w.n} · ${w.title}`}
                starred
                onStar={() => toggleBookmark(`week:${n}`)}
                onClick={() => navigate(`/plan/${n}`)}
              />
            )
          })}
        </ListGroup>
      )}

      {marks.companies.length > 0 && (
        <ListGroup label="Companies" count={marks.companies.length} open onToggle={() => {}}>
          {marks.companies.map((cid) => {
            const c = companyById[cid]
            if (!c) return null
            return (
              <ListRow
                key={cid}
                title={c.name}
                sub={c.role}
                starred
                onStar={() => toggleBookmark(`company:${cid}`)}
                onClick={() => navigate(`/companies/${cid}`)}
              />
            )
          })}
        </ListGroup>
      )}

      {total === 0 && (
        <p className="meta px-4 py-6">
          Nothing starred yet. Hit ☆ on any row, or the star inside a question or a drill card.
        </p>
      )}
    </div>
  )

  const detail = selected ? (
    <QuestionDetail
      questionId={selected}
      siblingIds={questionIds}
      onSelect={(id) => setParams(id ? { q: id } : {}, { replace: true })}
      backLabel="Starred"
    />
  ) : (
    <Detail>
      <h1 className="h-sec mb-4">Starred</h1>
      <p className="body-sans mb-6" style={{ maxWidth: '58ch' }}>
        Your own shortlist — the questions that caught you out and the topics, weeks and companies
        worth coming back to. It is separate from the review ladder on purpose: the ladder decides
        what is <em>due</em>, this decides what <em>matters</em>.
      </p>
      <p className="meta">
        In a drill, press <span className="u-mono">S</span> to star the card in front of you.
      </p>
    </Detail>
  )

  return (
    <Panes
      listTitle="Starred"
      listMeta={String(total)}
      list={list}
      detail={detail}
      detailOpen={!!selected}
      backTo="/starred"
    />
  )
}
