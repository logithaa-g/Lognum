import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, TextInput } from '../components/UI.jsx'
import { signIn, signUp } from '../lib/supabase.js'

export default function AuthPage() {
  const nav = useNavigate()
  const [tab, setTab]       = useState('login') // 'login' | 'signup'
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [uname, setUname]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(email.trim(), pw)
      } else {
        if (!uname.trim()) { setError('Username is required'); setLoading(false); return }
        if (uname.trim().length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return }
        await signUp(email.trim(), pw, uname.trim())
      }
      nav('/')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100dvh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'24px 20px',
      background:'var(--bg)',
    }}>
      {/* Logo */}
      <div className="fadeUp" style={{ textAlign:'center', marginBottom:32 }}>
        <img src="/icons/icon-512.png" alt="Lognum"
          style={{ width:80, height:80, borderRadius:20, boxShadow:'0 8px 28px rgba(108,60,247,.3)', marginBottom:12 }} />
        <h1 style={{ fontFamily:'var(--font)', fontSize:'2.2rem', fontWeight:700, color:'var(--text)' }}>Lognum</h1>
        <p style={{ color:'var(--text3)', fontSize:'.9rem', marginTop:4 }}>Number games, elevated ✨</p>
      </div>

      {/* Card */}
      <div className="fadeUp s1" style={{
        width:'100%', maxWidth:400,
        background:'var(--card)', borderRadius:'var(--r2)',
        border:'1.5px solid var(--border)', boxShadow:'var(--shadow2)',
        padding:'28px 24px',
      }}>
        {/* Tabs */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          background:'var(--bg2)', borderRadius:'var(--r)', padding:4, marginBottom:24,
        }}>
          {['login','signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              fontFamily:'var(--font)', fontWeight:600, fontSize:'1rem',
              border:'none', cursor:'pointer', borderRadius:10, padding:'10px',
              background: tab===t ? 'var(--card)' : 'transparent',
              color: tab===t ? 'var(--accent)' : 'var(--text3)',
              boxShadow: tab===t ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
              transition:'all .18s',
            }}>{t === 'login' ? 'Log In' : 'Sign Up'}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {tab === 'signup' && (
            <TextInput
              label="USERNAME"
              value={uname} onChange={e => setUname(e.target.value)}
              placeholder="e.g. logithaa_g"
            />
          )}
          <TextInput
            label="EMAIL"
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
          <TextInput
            label="PASSWORD"
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <div style={{
              background:'var(--red)18', border:'1px solid var(--red)44',
              borderRadius:'var(--r)', padding:'10px 14px',
              color:'var(--red)', fontSize:'.88rem',
            }}>{error}</div>
          )}

          <Btn type="submit" variant="primary" size="xl" disabled={loading} style={{ marginTop:4 }}>
            {loading ? '⏳ Please wait…' : tab === 'login' ? '🚀 Log In' : '🎮 Create Account'}
          </Btn>
        </form>

        {tab === 'signup' && (
          <p style={{ color:'var(--text3)', fontSize:'.8rem', marginTop:14, textAlign:'center', lineHeight:1.5 }}>
            After signing up, check your email to confirm your account, then log in.
          </p>
        )}
      </div>

      <p style={{ color:'var(--text3)', fontSize:'.73rem', marginTop:28 }}>
        © 2025 Lognum · Developed by <span style={{ color:'var(--accent2)', fontWeight:600 }}>Logithaa G</span>
      </p>
    </div>
  )
}
