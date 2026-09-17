import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { GOOGLE_CLIENT_ID, getToken, setToken } from './api'

/**
 * Google sign-in, only so the study client can reach the tracker service.
 *
 * Signing in is entirely optional: with no token the app runs exactly as it
 * did before, against bundled content and localStorage. Being signed in adds
 * cross-device progress, nothing else — so a failure here degrades to the
 * offline app rather than blocking it.
 */

interface Account {
  email?: string
  name?: string
  picture?: string
}

interface Ctx {
  /** Null while unknown, false once we know GSI could not load. */
  ready: boolean | null
  signedIn: boolean
  account: Account | null
  signIn: () => void
  signOut: () => void
  error: string | null
}

const AuthContext = createContext<Ctx | null>(null)

const GSI_SRC = 'https://accounts.google.com/gsi/client'

/** A Google ID token is a JWT; its payload carries the profile claims. */
function decode(token: string): Account | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(decodeURIComponent(escape(json)))
    return { email: claims.email, name: claims.name, picture: claims.picture }
  } catch {
    return null
  }
}

/** Expired tokens are worse than none — they make every call 401. */
function expired(token: string): boolean {
  try {
    const claims = JSON.parse(atob(token.split('.')[1]))
    return typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void
          prompt: (listener?: (n: unknown) => void) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState<boolean | null>(null)
  const [account, setAccount] = useState<Account | null>(() => {
    const t = getToken()
    if (!t || expired(t)) {
      if (t) setToken(null)
      return null
    }
    return decode(t)
  })
  const [error, setError] = useState<string | null>(null)

  const handleCredential = useCallback((response: { credential?: string }) => {
    if (!response?.credential) return
    setToken(response.credential)
    setAccount(decode(response.credential))
    setError(null)
  }, [])

  useEffect(() => {
    if (document.querySelector(`script[src="${GSI_SRC}"]`)) {
      setReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      try {
        window.google?.accounts?.id?.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          auto_select: false,
        })
        setReady(true)
      } catch {
        setReady(false)
        setError('Google sign-in failed to initialise')
      }
    }
    script.onerror = () => {
      // Offline, or the script is blocked. The app still works.
      setReady(false)
    }
    document.head.appendChild(script)
  }, [handleCredential])

  const signIn = useCallback(() => {
    const id = window.google?.accounts?.id
    if (!id) {
      setError('Google sign-in is not available')
      return
    }
    setError(null)
    id.prompt()
  }, [])

  const signOut = useCallback(() => {
    window.google?.accounts?.id?.disableAutoSelect()
    setToken(null)
    setAccount(null)
  }, [])

  const value = useMemo<Ctx>(
    () => ({ ready, signedIn: !!account, account, signIn, signOut, error }),
    [ready, account, signIn, signOut, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
