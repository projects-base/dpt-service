/**
 * Talking to the DailyProblemTracker service.
 *
 * The service is an OAuth2 resource server that validates Google ID tokens
 * directly, so the bearer token IS the Google credential — there is no separate
 * exchange to do. The web dashboard stores it under `gToken`; this uses the
 * same key so the two behave alike, though they are different origins and do
 * not actually share storage.
 */

const TOKEN_KEY = 'gToken'
const API_OVERRIDE_KEY = 'dpt_api_base'

export const GOOGLE_CLIENT_ID =
  '683627191123-5551q39di0quqsd7p3oj1nt6oodlajfe.apps.googleusercontent.com'

/** Same resolution order as the dashboard: ?api= override, then host. */
export function apiBase(): string {
  try {
    const param = new URLSearchParams(window.location.search).get('api')
    if (param) {
      localStorage.setItem(API_OVERRIDE_KEY, param)
      return param
    }
    const saved = localStorage.getItem(API_OVERRIDE_KEY)
    if (saved) return saved
  } catch {
    /* blocked storage just means no override */
  }
  // Served from the service itself, so same origin — which also means no CORS
  // and no second host to configure. The dev server proxies /api across.
  return ''
}

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* a signed-in session simply will not survive a reload */
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
  /** The caller's state is behind the server's — re-read and merge. */
  get isConflict() {
    return this.status === 409
  }
  get isUnauthorized() {
    return this.status === 401 || this.status === 403
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new ApiError(401, 'Not signed in')

  const res = await fetch(apiBase() + path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* a non-JSON error body is fine, the status carries the meaning */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/* ---------------- shapes, mirroring PrepDtos ---------------- */

export interface ApiFollowUp {
  q: string
  a: string
}

export interface ApiQuestion {
  key: string
  topicKey: string
  categoryKey: string | null
  companyKey: string | null
  prompt: string
  answerHtml: string | null
  followUps: ApiFollowUp[]
  tags: string[]
  difficulty: string | null
  source: string | null
}

export interface ApiProgress {
  data: Record<string, unknown>
  revision: number
}

export const api = {
  health: async (): Promise<boolean> => {
    try {
      const res = await fetch(apiBase() + '/actuator/health')
      return res.ok
    } catch {
      return false
    }
  },

  questions: (topicKey: string) =>
    request<ApiQuestion[]>(`/api/prep/questions/${encodeURIComponent(topicKey)}`),

  search: (q: string) =>
    request<ApiQuestion[]>(`/api/prep/search?q=${encodeURIComponent(q)}`),

  getProgress: () => request<ApiProgress>('/api/prep/progress'),

  putProgress: (data: Record<string, unknown>, revision: number | null) =>
    request<ApiProgress>('/api/prep/progress', {
      method: 'PUT',
      body: JSON.stringify(revision === null ? { data } : { data, revision }),
    }),
}
