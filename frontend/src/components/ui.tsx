import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/* ---------- surfaces ---------- */

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[860px] px-5 pb-24">{children}</div>
}

export function Section({
  eyebrow,
  children,
  first,
}: {
  eyebrow?: string
  children: ReactNode
  first?: boolean
}) {
  return (
    <section
      className="py-9"
      style={first ? undefined : { borderTop: '1px solid var(--line)' }}
    >
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      {children}
    </section>
  )
}

export function Card({
  children,
  accent,
}: {
  children: ReactNode
  accent?: 'accent' | 'boss'
}) {
  return (
    <div
      className="rounded-[4px] overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderLeft: accent ? `2px solid var(--${accent})` : '1px solid var(--line)',
      }}
    >
      {children}
    </div>
  )
}

/* ---------- controls ---------- */

export function Button({
  children,
  onClick,
  variant = 'ghost',
  active,
  disabled,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'fill' | 'tiny'
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  const base =
    'u-sans cursor-pointer transition-[border-color,background,color] duration-150 disabled:opacity-45 disabled:cursor-default'
  const styles: Record<string, React.CSSProperties> = {
    ghost: {
      fontSize: 13.5,
      fontWeight: 500,
      padding: '7px 15px',
      borderRadius: 3,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--line-2)'}`,
      background: active ? 'var(--accent-soft)' : 'var(--surface)',
      color: active ? 'var(--accent-ink)' : 'var(--ink)',
    },
    fill: {
      fontSize: 13.5,
      fontWeight: 500,
      padding: '7px 15px',
      borderRadius: 3,
      border: '1px solid var(--accent)',
      background: active ? 'var(--accent-soft)' : 'var(--accent)',
      color: active ? 'var(--accent-ink)' : 'var(--bg)',
    },
    tiny: {
      fontSize: 12,
      fontWeight: 500,
      padding: '4px 10px',
      borderRadius: 3,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--line-2)'}`,
      background: active ? 'var(--accent-soft)' : 'var(--surface)',
      color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
    },
  }
  return (
    <button className={base} style={styles[variant]} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

export function Pill({ children, tone }: { children: ReactNode; tone?: 'accent' | 'boss' }) {
  return (
    <span
      className="u-sans inline-block"
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        padding: '2px 8px',
        borderRadius: 999,
        background: tone === 'boss' ? 'var(--boss-soft)' : tone ? 'var(--accent-soft)' : 'var(--surface-2)',
        color: tone === 'boss' ? 'var(--boss)' : tone ? 'var(--accent-ink)' : 'var(--ink-3)',
      }}
    >
      {children}
    </span>
  )
}

/* ---------- navigation ---------- */

export function RowLink({
  to,
  n,
  title,
  meta,
  blurb,
}: {
  to: string
  n?: string
  title: string
  meta?: string
  blurb?: string
}) {
  return (
    <Link
      to={to}
      className="group flex gap-4 py-4 items-baseline"
      style={{ borderBottom: '1px solid var(--line)' }}
    >
      {n && (
        <span className="u-mono flex-none w-8" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          {n}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span
          className="u-sans block transition-colors group-hover:[color:var(--accent-ink)]"
          style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}
        >
          {title}
        </span>
        {blurb && (
          <span className="body-sans block mt-1" style={{ fontSize: 13.5 }}>
            {blurb}
          </span>
        )}
      </span>
      {meta && (
        <span className="u-mono flex-none" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          {meta}
        </span>
      )}
    </Link>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="body-sans py-10 text-center" style={{ color: 'var(--ink-3)' }}>
      {children}
    </p>
  )
}
