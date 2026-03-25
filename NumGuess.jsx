import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Card } from '../components/UI.jsx'
import NumGuessSolo from './NumGuessSolo.jsx'
import NumGuessMulti from './NumGuessMulti.jsx'

export default function NumGuess() {
  const nav = useNavigate()
  const [mode, setMode] = useState(null) // null | 'solo' | 'multi'

  if (mode === 'solo') return <NumGuessSolo onBack={() => setMode(null)} />
  if (mode === 'multi') return <NumGuessMulti onBack={() => setMode(null)} />

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => nav('/')} style={{
          background: 'none', border: 'none', fontSize: '1.4rem',
          cursor: 'pointer', color: 'var(--text3)', padding: 4,
          lineHeight: 1, WebkitTapHighlightColor: 'transparent',
        }}>←</button>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
          🔢 Number Quest
        </h1>
      </header>

      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <p style={{ color: 'var(--text3)', marginBottom: 28, fontSize: '1rem', lineHeight: 1.5 }}>
          Set your range, then find the secret number using temperature hints!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="stagger">
          <ModeCard
            emoji="🤖" title="vs Computer"
            desc="You guess the computer's secret number"
            color="#7c3aed"
            onClick={() => setMode('solo')}
          />
          <ModeCard
            emoji="👥" title="2 Player (Online)"
            desc="Challenge a friend with a room code"
            color="#f59e0b"
            onClick={() => setMode('multi')}
          />
        </div>
      </main>

      <footer style={{ padding: '16px 20px 32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>
          Developed by <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>Logithaa G</span>
        </p>
      </footer>
    </div>
  )
}

function ModeCard({ emoji, title, desc, color, onClick }) {
  return (
    <div
      className="anim-fadeup"
      onClick={onClick}
      style={{
        background: color + '11', border: `1.5px solid ${color}33`,
        borderRadius: 20, padding: '20px 22px', cursor: 'pointer',
        transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: color + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', border: `1px solid ${color}33`, flexShrink: 0,
        }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{title}</h3>
          <p style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>{desc}</p>
        </div>
        <span style={{ color, fontSize: '1.2rem' }}>›</span>
      </div>
    </div>
  )
}
