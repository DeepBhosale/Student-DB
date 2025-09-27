import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    if (!email || !password) return alert('Enter email and password')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setLoading(false)
      return alert('Signup error: ' + error.message)
    }

    // If signUp returns a user (email confirm may delay), create profile with role 'student'
    const userId = data?.user?.id
    if (userId) {
      // create a profile row in `profiles` table
      const profilePayload = {
        id: userId,
        full_name: fullName || null,
        role: 'student',
        email
      }
      const { error: pErr } = await supabase.from('profiles').insert([profilePayload])
      if (pErr) {
        console.warn('Profile insert warning:', pErr.message)
      }
    }

    setLoading(false)
    alert('Signup submitted. If email confirmation is enabled, check your email. You can now sign in.')
    setMode('signin')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    if (!email || !password) return alert('Enter email and password')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    setLoading(false)
    if (error) return alert('Sign in error: ' + error.message)
    // Notify parent that auth succeeded
    onAuthSuccess && onAuthSuccess(data?.user || null)
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <button onClick={() => setMode('signin')} className={mode === 'signin' ? 'active' : ''}>Sign in</button>
          <button onClick={() => setMode('signup')} className={mode === 'signup' ? 'active' : ''}>Sign up</button>
        </div>

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Full name (optional)" value={fullName} onChange={e => setFullName(e.target.value)} />
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          </form>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
