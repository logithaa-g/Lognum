import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BCSolo from './BCSolo.jsx'
import BCMulti from './BCMulti.jsx'

export default function BullsCows() {
  const nav = useNavigate()
  const [mode, setMode] = useState(null)

  if (mode === 'solo') return <BCSolo onBack={() => setMode(null)} />
  if (mode === 'multi') return <BCMulti onBack={() => setMode(null)} />

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => nav('/')} style={{
          background: 'none', border: 'none', fontSize: '1.4rem',
          cursor: 'pointer', color: 'var(--text3)', padding: 4, lineHeight: 1,
          WebkitTapHighlightColor: 'transparent',
        }}>←</button>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
          🐂 Bulls & Cows
        </h1>
      </header>

      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <div style={{
          background: '#05966911', border: '1.5px solid #05966933',
          borderRadius: 16, padding: '14px 18px', marginBottom: 24,
        }}>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.55 }}>
            🐂 <b>Bull</b> = right digit, right place &nbsp;·&nbsp; 🐄 <b>Cow</b> = right digit, wrong place
          </p>
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 6 }}>
            No repeated digits. Crack the 4-digit code!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="stagger">
          {[
            { emoji: '🤖', title: 'vs Computer', desc: 'Guess the computer\'s 4-digit code', color: '#059669', onClick: () => setMode('solo') },
            { emoji: '👥', title: '2 Player (Online)', desc: 'Challenge a friend with a room code', color: '#f59e0b', onClick: () => setMode('multi') },
          ].map(m => (
            <div key={m.title} className="anim-fadeup" onClick={m.onClick} style={{
              background: m.color + '11', border: `1.5px solid ${m.color}33`,
              borderRadius: 20, padding: '20px 22px', cursor: 'pointer',
              transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}22` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: m.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: `1px solid ${m.color}33`, flexShrink: 0 }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{m.title}</h3>
                  <p style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>{m.desc}</p>
                </div>
                <span style={{ color: m.color, fontSize: '1.2rem' }}>›</span>
              </div>
            </div>
          ))}
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
