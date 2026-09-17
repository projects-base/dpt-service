import { useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '../lib/hooks'
import { ASIDE_MIN, DETAIL_MIN, LIST_MIN, clamp, usePaneLayout } from '../lib/panes'

/**
 * The workspace body: list, detail, and an optional third column for drilling
 * into something without losing what you were looking at — a topic opened from
 * a company, a question opened from a topic. Each pane scrolls independently.
 *
 * Wide (≥1180px) shows all three. Medium (900–1179px) has no room, so the third
 * column takes the detail slot. On a phone the three become a stack.
 */
export function Panes({
  listTitle,
  listMeta,
  listActions,
  list,
  detail,
  detailOpen,
  backTo,
  aside,
  asideTitle,
  asideActions,
  onCloseAside,
}: {
  listTitle: string
  listMeta?: string
  listActions?: ReactNode
  list: ReactNode
  detail: ReactNode
  /** True when a detail item is selected — drives the phone stack. */
  detailOpen: boolean
  /** Where the phone back control goes. */
  backTo: string
  /** Third column. Rendered only while it has content. */
  aside?: ReactNode
  asideTitle?: string
  asideActions?: ReactNode
  onCloseAside?: () => void
}) {
  const narrow = useMediaQuery('(max-width: 899px)')
  const roomForThree = useMediaQuery('(min-width: 1180px)')
  const navigate = useNavigate()
  const hasAside = !!aside
  const { layout, setListW, setAsideW, toggleList, resetWidths } = usePaneLayout()
  const rowRef = useRef<HTMLDivElement>(null)

  const asidePane = hasAside ? (
    <div className="pane-scroll flex-1 min-w-0">
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-2"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}
      >
        <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>
          {asideTitle ?? 'Detail'}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {asideActions}
          {onCloseAside && (
            <button
              onClick={onCloseAside}
              className="u-mono cursor-pointer"
              style={{ fontSize: 12, color: 'var(--ink-3)', padding: '2px 5px' }}
              title="Close"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </span>
      </div>
      {aside}
    </div>
  ) : null

  if (narrow) {
    if (hasAside) {
      return (
        <div className="pane-scroll flex-1">
          <button
            className="u-sans sticky top-0 z-10 w-full text-left px-5 py-3 cursor-pointer"
            style={{
              fontSize: 13,
              color: 'var(--accent-ink)',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--line)',
            }}
            onClick={onCloseAside}
          >
            ← back
          </button>
          {aside}
        </div>
      )
    }
    return detailOpen ? (
      <div className="pane-scroll flex-1">
        <button
          className="u-sans sticky top-0 z-10 w-full text-left px-5 py-3 cursor-pointer"
          style={{
            fontSize: 13,
            color: 'var(--accent-ink)',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--line)',
          }}
          onClick={() => navigate(backTo)}
        >
          ← {listTitle}
        </button>
        {detail}
      </div>
    ) : (
      <div className="pane-scroll flex-1">
        <ListHeader title={listTitle} meta={listMeta} actions={listActions} />
        {list}
      </div>
    )
  }

  const showThree = hasAside && roomForThree

  return (
    <div className="flex flex-1 min-w-0" ref={rowRef}>
      {layout.listCollapsed ? (
        <button
          className="pane-stub"
          onClick={toggleList}
          title={`Show ${listTitle}`}
          aria-label={`Show ${listTitle}`}
        >
          ›
        </button>
      ) : (
        <>
          <div className="pane-scroll flex-none" style={{ width: layout.listW }}>
            <ListHeader
              title={listTitle}
              meta={listMeta}
              actions={
                <>
                  {listActions}
                  <button
                    className="pane-collapse"
                    onClick={toggleList}
                    title={`Hide ${listTitle}`}
                    aria-label={`Hide ${listTitle}`}
                  >
                    ‹
                  </button>
                </>
              }
            />
            {list}
          </div>
          <Resizer
            width={layout.listW}
            setWidth={setListW}
            dir={1}
            min={LIST_MIN}
            maxWidth={() => {
              const total = rowRef.current?.clientWidth ?? 0
              return total - (showThree ? layout.asideW : 0) - DETAIL_MIN
            }}
            onReset={resetWidths}
            label={`Resize ${listTitle}`}
          />
        </>
      )}

      {/* Without room for three, the third column stands in for the detail. */}
      {hasAside && !roomForThree ? (
        asidePane
      ) : (
        <>
          <div className="pane-scroll flex-1 min-w-0">{detail}</div>
          {hasAside && (
            <>
              <Resizer
                width={layout.asideW}
                setWidth={setAsideW}
                dir={-1}
                min={ASIDE_MIN}
                maxWidth={() => {
                  const total = rowRef.current?.clientWidth ?? 0
                  return total - (layout.listCollapsed ? 26 : layout.listW) - DETAIL_MIN
                }}
                onReset={resetWidths}
                label="Resize panel"
              />
              <div
                className="flex flex-none"
                style={{ width: layout.asideW, borderLeft: '1px solid var(--line)' }}
              >
                {asidePane}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Drag handle between two panes. Drag to resize, double-click to reset,
 * arrow keys to nudge. `dir` is +1 for a pane that grows rightwards (the list)
 * and -1 for one that grows leftwards (the third column).
 */
function Resizer({
  width,
  setWidth,
  dir,
  min,
  maxWidth,
  onReset,
  label,
}: {
  width: number
  setWidth: (w: number) => void
  dir: 1 | -1
  min: number
  /** Largest width that still leaves the detail pane its minimum. */
  maxWidth: () => number
  onReset: () => void
  label: string
}) {
  const startX = useRef(0)
  const startW = useRef(0)
  const dragging = useRef(false)
  const el = useRef<HTMLDivElement>(null)

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    el.current?.setPointerCapture(e.pointerId)
    el.current?.setAttribute('data-drag', '1')
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const delta = (e.clientX - startX.current) * dir
    setWidth(clamp(startW.current + delta, min, Math.max(min, maxWidth())))
  }

  const stop = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    el.current?.releasePointerCapture(e.pointerId)
    el.current?.removeAttribute('data-drag')
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  return (
    <div
      ref={el}
      className="resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(width)}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const step = (e.key === 'ArrowRight' ? 16 : -16) * dir
        setWidth(clamp(width + step, min, Math.max(min, maxWidth())))
      }}
    />
  )
}

function ListHeader({
  title,
  meta,
  actions,
}: {
  title: string
  meta?: string
  actions?: ReactNode
}) {
  return (
    <div
      className="sticky top-0 z-10 px-4 py-3 flex items-baseline gap-2"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}
    >
      <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>
        {title}
      </span>
      {meta && (
        <span className="u-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {meta}
        </span>
      )}
      {actions && <span className="ml-auto flex gap-1.5">{actions}</span>}
    </div>
  )
}

/** A single pane with no list — used by Tonight. */
export function SinglePane({ children }: { children: ReactNode }) {
  return <div className="pane-scroll flex-1">{children}</div>
}

/** Rows in the list pane. One consistent shape everywhere. */
export function ListRow({
  active,
  title,
  meta,
  sub,
  dot,
  onClick,
  starred,
  onStar,
}: {
  active?: boolean
  title: string
  meta?: string
  sub?: string
  /** A small state mark — filled when done. */
  dot?: 'done' | 'due' | 'none'
  onClick: () => void
  starred?: boolean
  /** Supplying this puts a star control on the row. */
  onStar?: () => void
}) {
  return (
    <div
      className="list-row w-full text-left px-4 py-2.5 flex items-baseline gap-2.5 cursor-pointer transition-colors"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        background: active ? 'var(--accent-soft)' : 'transparent',
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
      }}
    >
      {dot && dot !== 'none' && (
        <span
          className="flex-none rounded-full mt-1.5"
          style={{
            width: 6,
            height: 6,
            background: dot === 'done' ? 'var(--accent)' : 'var(--boss)',
          }}
        />
      )}
      <span className="flex-1 min-w-0">
        <span
          className="u-sans block"
          style={{
            fontSize: 13.5,
            fontWeight: active ? 600 : 400,
            lineHeight: 1.4,
            color: active ? 'var(--accent-ink)' : 'var(--ink)',
          }}
        >
          {title}
        </span>
        {sub && (
          <span className="u-sans block mt-0.5" style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>
            {sub}
          </span>
        )}
      </span>
      {meta && (
        <span className="u-mono flex-none" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
          {meta}
        </span>
      )}
      {onStar && (
        <button
          className="row-star flex-none"
          data-on={starred ? '1' : '0'}
          onClick={(e) => {
            e.stopPropagation()
            onStar()
          }}
          title={starred ? 'Remove bookmark' : 'Bookmark'}
          aria-label={starred ? 'Remove bookmark' : 'Bookmark'}
        >
          {starred ? '★' : '☆'}
        </button>
      )}
    </div>
  )
}

/** Collapsible group header inside the list pane. */
export function ListGroup({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string
  count?: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-2 flex items-center gap-2 cursor-pointer"
        style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}
      >
        <span className="u-mono flex-none" style={{ fontSize: 9, color: 'var(--ink-3)' }}>
          {open ? '▾' : '▸'}
        </span>
        <span className="eyebrow flex-1" style={{ fontSize: 10.5 }}>
          {label}
        </span>
        {count !== undefined && (
          <span className="u-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            {count}
          </span>
        )}
      </button>
      {open && <div style={{ borderBottom: '1px solid var(--line)' }}>{children}</div>}
    </div>
  )
}

/** Standard padding for detail-pane content. */
export function Detail({ children }: { children: ReactNode }) {
  return <div className="px-6 py-7 max-w-[720px]">{children}</div>
}

export function DetailEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center px-6 py-16">
      <p className="meta text-center" style={{ maxWidth: '32ch' }}>
        {children}
      </p>
    </div>
  )
}
