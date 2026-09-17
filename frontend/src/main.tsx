import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './styles/index.css'
import { AuthProvider } from './lib/auth'
import { ProgressProvider } from './lib/progress'
import { DrillProvider } from './lib/drill'
import { AppShell } from './components/AppShell'
import { Tonight } from './pages/Tonight'
import { PlanPage } from './pages/PlanPage'

// The question bank is ~1 MB and Tonight never needs it, so every section that
// reads it loads on demand instead of blocking the nightly open.
const Topics = lazy(() => import('./pages/Topics').then((m) => ({ default: m.Topics })))
const Companies = lazy(() => import('./pages/Companies').then((m) => ({ default: m.Companies })))
const ReviewPage = lazy(() => import('./pages/Review').then((m) => ({ default: m.ReviewPage })))
const Starred = lazy(() => import('./pages/Starred').then((m) => ({ default: m.Starred })))
const Visuals = lazy(() => import('./pages/Visuals').then((m) => ({ default: m.Visuals })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))

const Loading = () => (
  <div className="flex-1 flex items-center justify-center">
    <p className="meta">Loading…</p>
  </div>
)

// HashRouter so a production build also works opened straight off disk.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProgressProvider>
        <DrillProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Tonight />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="plan/:weekId" element={<PlanPage />} />
              <Route
                path="topics"
                element={
                  <Suspense fallback={<Loading />}>
                    <Topics />
                  </Suspense>
                }
              />
              <Route
                path="topics/:topicId"
                element={
                  <Suspense fallback={<Loading />}>
                    <Topics />
                  </Suspense>
                }
              />
              <Route
                path="companies"
                element={
                  <Suspense fallback={<Loading />}>
                    <Companies />
                  </Suspense>
                }
              />
              <Route
                path="companies/:companyId"
                element={
                  <Suspense fallback={<Loading />}>
                    <Companies />
                  </Suspense>
                }
              />
              <Route
                path="visuals"
                element={
                  <Suspense fallback={<Loading />}>
                    <Visuals />
                  </Suspense>
                }
              />
              <Route
                path="visuals/:visualId"
                element={
                  <Suspense fallback={<Loading />}>
                    <Visuals />
                  </Suspense>
                }
              />
              <Route
                path="review"
                element={
                  <Suspense fallback={<Loading />}>
                    <ReviewPage />
                  </Suspense>
                }
              />
              <Route
                path="starred"
                element={
                  <Suspense fallback={<Loading />}>
                    <Starred />
                  </Suspense>
                }
              />
              <Route
                path="search"
                element={
                  <Suspense fallback={<Loading />}>
                    <SearchPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Tonight />} />
            </Route>
          </Routes>
        </HashRouter>
        </DrillProvider>
      </ProgressProvider>
    </AuthProvider>
  </StrictMode>,
)
