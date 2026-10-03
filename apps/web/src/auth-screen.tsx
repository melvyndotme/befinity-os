import { useState } from 'react'
import { supabase } from './supabase'

type AuthMode = 'sign-in' | 'sign-up'

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function signInWithProvider(provider: 'google' | 'github') {
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setMessage(error.message)
      setBusy(false)
    }
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const result =
      mode === 'sign-up'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    setMessage(
      result.error
        ? result.error.message
        : mode === 'sign-up'
          ? 'Check your email to confirm the account, then return here.'
          : 'Signed in.',
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <span className="brand-mark" /> TACT Notes
        </div>
        <p className="eyebrow">Your local-first working memory</p>
        <h1>{mode === 'sign-in' ? 'Welcome back.' : 'Create your notes vault.'}</h1>
        <p className="auth-intro">
          Sign in before you create a local encrypted vault, connect a private Git repository, or
          link a read-only calendar.
        </p>

        <div className="oauth-actions">
          <button
            className="button button-quiet"
            disabled={busy}
            onClick={() => void signInWithProvider('google')}
          >
            Continue with Google
          </button>
          <button
            className="button button-quiet"
            disabled={busy}
            onClick={() => void signInWithProvider('github')}
          >
            Continue with GitHub
          </button>
        </div>

        <div className="auth-divider">
          <span>or use email</span>
        </div>
        <form className="auth-form" onSubmit={(event) => void submitEmail(event)}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="button button-primary" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}
        <button
          className="auth-switch"
          disabled={busy}
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        >
          {mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  )
}
