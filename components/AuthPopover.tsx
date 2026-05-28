'use client'

import { useState, useRef, useEffect } from 'react'
import { signIn, signUp, signOut, User } from '@/lib/auth'

interface AuthPopoverProps {
  user: User | null
  onMigrateGuest?: () => Promise<void>
}

type AuthMode = 'signin' | 'signup'
type AuthStatus = 'idle' | 'loading' | 'success' | 'error'

export function AuthPopover({ user, onMigrateGuest }: AuthPopoverProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmMsg, setConfirmMsg] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus email on open
  useEffect(() => {
    if (open && !user) {
      setTimeout(() => emailRef.current?.focus(), 50)
    }
  }, [open, user])

  const reset = () => {
    setEmail('')
    setPassword('')
    setStatus('idle')
    setErrorMsg('')
    setConfirmMsg('')
  }

  const handleToggleOpen = () => {
    if (!open) reset()
    setOpen((v) => !v)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setStatus('loading')
    setErrorMsg('')
    setConfirmMsg('')

    try {
      if (mode === 'signin') {
        await signIn(email, password)
        if (onMigrateGuest) await onMigrateGuest()
        setOpen(false)
        reset()
      } else {
        await signUp(email, password)
        // Supabase may require email confirmation
        setStatus('success')
        setConfirmMsg('Check your email to confirm your account.')
      }
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="auth-anchor" ref={popoverRef}>
      {/* The chip */}
      <button
        className={`auth-chip ${user ? 'auth-chip--signed-in' : 'auth-chip--guest'}`}
        onClick={handleToggleOpen}
        aria-label={user ? 'Account' : 'Sign in'}
      >
        {user ? (
          <span className="auth-chip-avatar">{initial}</span>
        ) : (
          <span className="auth-chip-guest">guest</span>
        )}
      </button>

      {/* The popover */}
      {open && (
        <div className="auth-popover">
          {user ? (
            /* Signed-in state */
            <div className="auth-signed-in">
              <p className="auth-email">{user.email}</p>
              <button className="auth-signout" onClick={handleSignOut}>
                sign out
              </button>
            </div>
          ) : (
            /* Auth form */
            <>
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
                  onClick={() => { setMode('signin'); reset() }}
                >
                  sign in
                </button>
                <button
                  className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
                  onClick={() => { setMode('signup'); reset() }}
                >
                  sign up
                </button>
              </div>

              {status === 'success' ? (
                <p className="auth-confirm">{confirmMsg}</p>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit}>
                  <input
                    ref={emailRef}
                    className="auth-input"
                    type="email"
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                  />
                  {errorMsg && <p className="auth-error">{errorMsg}</p>}
                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? '…' : mode === 'signin' ? 'sign in' : 'create account'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}