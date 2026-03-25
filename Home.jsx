import React from 'react'
import { useNavigate } from 'react-router-dom'

const games = [
  {
    id: 'numguess',
    title: 'Number Quest',
    desc: 'Guess the secret number within a range you set',
    emoji: '🔢',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed22, #a855f722)',
    border: '#7c3aed44',
  },
  {
    id: 'bullscows',
    title: 'Bulls & Cows',
    desc: 'Crack the 4-digit code with logic & deduction',
    emoji: '🐂',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #05966922, #10b98122)',
    border: '#05966944',
  },
]

export default function Home() {
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '32px 20px 16px', textAlign: 'center' }}>
        <img
          src="/icons/icon-512.png"
          alt="Lognum"
          style={{ width: 80, height: 80, borderRadius: 20, boxShadow: '0 8px 32px rgba(124,58,237,0.3)', marginBottom: 12 }}
        />
        <h1 style={{
          fontFamily: 'var(--font)', fontSize: 'clamp(2.2rem, 8vw, 3rem)',
          fontWeight: 700, color: 'var(--text)', lineHeight: 1,
          letterSpacing: '-0.01em',
        }}>
          Lognum
        </h1>
        <p style={{ color: 'var(--text3)', marginTop: 6, fontSize: '1rem' }}>
          Number games, elevated ✨
        </p>
      </header>

      {/* Game cards */}
      <main style={{
        flex: 1, padding: '16px 20px 32px',
        maxWidth: 480, width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Choose a game
        </p>

        <div className="stagger">
          {games.map(g => (
            <GameCard key={g.id} game={g} onSelect={() => nav(`/${g.id}`)} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 20px 32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>
          © 2025 Lognum · Developed by <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>Logithaa G</span>
        </p>
      </footer>
    </div>
  )
}

function GameCard({ game, onSelect }) {
  return (
    <div
      className="anim-fadeup"
      onClick={onSelect}
      style={{
        background: game.gradient,
        border: `1.5px solid ${game.border}`,
        borderRadius: 20, padding: '20px 22px',
        cursor: 'pointer', marginBottom: 12,
        transition: 'all 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: game.color + '22', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.8rem',
          border: `1px solid ${game.color}33`,
        }}>
          {game.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {game.title}
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem', lineHeight: 1.4 }}>
            {game.desc}
          </p>
        </div>
        <div style={{ color: game.color, fontSize: '1.3rem', flexShrink: 0 }}>›</div>
      </div>
    </div>
  )
}
