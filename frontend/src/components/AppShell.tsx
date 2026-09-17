import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useProgress } from '../lib/progress'
import { useKeys, useMediaQuery } from '../lib/hooks'
import { useDrill } from '../lib/drill'
import { useAuth } from '../lib/auth'

const CommandPalette = lazy(() =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
)
const DrillOverlay = lazy(() => import('./DrillOverlay').then((m) => ({ default: m.DrillOverlay })))

const SECTIONS = [
  { to: '/', label: 'Tonight', glyph: '◐', key: '1', end: true },
  { to: '/plan', label: 'Plan', glyph: '◈', key: '2' },
  { to: '/topics', label: 'Topics', glyph: '▤', key: '3' },
  { to: '/companies', label: 'Companies', glyph: '▦', key: '4' },
  { to: '/visuals', label: 'Visuals', glyph: '◉', key: '5' },
  { to: '/review', label: 'Review', glyph: '↻', key: '6' },
  { to: '/starred', label: 'Starred', glyph: '★', key: '7' },
  { to: '/search', label: 'Search', glyph: '⌕', key: '8' },
]

export function AppShell() {
  const { streak, sync } = useProgress()
  const { signedIn, account, signIn, signOut, ready } = useAuth()
  const { queue } = useDrill()
  const navigate = useNavigate()
  const loc = useLocation()
  const narrow = useMediaQuery('(max-width: 899px)')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [theme, setTheme] = useState<string | null>(() => {
    try {
      return localStorage.getItem('prep-theme')
    } catch {
      return null
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme) root.setAttribute('data-theme', theme)
    else root.removeAttribute('data-theme')
    try {
      if (theme) localStorage.setItem('prep-theme', theme)
      else localStorage.removeItem('prep-theme')
    } catch {
      /* blocked storage is fine — the app just forgets the preference */
    }
  }, [theme])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const hit = SECTIONS.find((s) => s.key === e.key)
      if (hit) {
        e.preventDefault()
        navigate(hit.to)
      }
    },
    [navigate],
  )
  useKeys(onKey, !queue)

  const cycleTheme = () => {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme((t) => (t ? (t === 'dark' ? 'light' : null) : sysDark ? 'light' : 'dark'))
  }

  return (
    <div className="app-root">
      {!narrow && (
        <nav className="rail" aria-label="Sections">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className="rail-btn"
              title={`${s.label}  (${s.key})`}
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent-ink)' : 'var(--ink-3)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
              })}
            >
              <span className="rail-glyph">{s.glyph}</span>
              <span className="rail-label">{s.label}</span>
            </NavLink>
          ))}

          <div className="mt-auto flex flex-col items-center gap-2 pb-2">
            {ready !== false && (
              <button
                className="rail-mini"
                onClick={signedIn ? signOut : signIn}
                title={
                  signedIn
                    ? `${account?.email ?? 'Signed in'} — ${syncLabel(sync)}. Click to sign out.`
                    : 'Sign in to sync progress across devices'
                }
              >
                <span className="sync-dot" data-state={sync.kind} />
                {signedIn ? 'sync' : 'in'}
              </button>
            )}
            <button className="rail-mini" onClick={() => setPaletteOpen(true)} title="Command palette (⌘K)">
              ⌘K
            </button>
            <button className="rail-mini" onClick={cycleTheme} title={`Theme: ${theme ?? 'system'}`}>
              {theme === 'dark' ? '◑' : theme === 'light' ? '◐' : '◎'}
            </button>
            <span className="u-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }} title="Day streak">
              {streak}d
            </span>
          </div>
        </nav>
      )}

      <main className="app-body">
        <Outlet />
      </main>

      {narrow && (
        <nav className="tabbar" aria-label="Sections">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className="tab-btn"
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent-ink)' : 'var(--ink-3)',
              })}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{s.glyph}</span>
              <span className="tab-label" style={{ fontSize: 9.5 }}>
                {s.label}
              </span>
            </NavLink>
          ))}
        </nav>
      )}

      <Suspense fallback={null}>
        {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
        {queue && <DrillOverlay />}
      </Suspense>

      {/* route changes reset scroll inside the panes, not the window */}
      <ScrollReset key={loc.pathname} />
    </div>
  )
}

function syncLabel(sync: ReturnType<typeof useProgress>['sync']): string {
  switch (sync.kind) {
    case 'local':
      return 'this browser only'
    case 'loading':
      return 'loading from the tracker'
    case 'saving':
      return 'saving'
    case 'synced':
      return 'synced with the tracker'
    case 'error':
      return `not syncing: ${sync.message}`
  }
}

function ScrollReset() {
  useEffect(() => {
    document.querySelectorAll('.pane-scroll').forEach((el) => {
      el.scrollTop = 0
    })
  }, [])
  return null
}
