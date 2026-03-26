import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { signOut } from '../lib/supabase.js'
import { CoinBadge } from '../components/UI.jsx'

export default function Home() {
  const nav = useNavigate()
  const { profile } = useAuth()

  const games = [
    { id:'numguess',  emoji:'🔢', title:'Number Quest', desc:'Guess the secret number with temperature hints', color:'#6c3cf7' },
    { id:'bullscows', emoji:'🐂', title:'Bulls & Cows',  desc:'Crack the 4-digit code with logic & deduction', color:'#059669' },
  ]

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto' }}>
      {/* Header */}
      <header style={{ padding:'env(safe-area-inset-top,20px) 20px 12px', display:'flex', alignItems:'center', gap:12 }}>
        <img src="/icons/icon-512.png" alt="Lognum" style={{ width:38, height:38, borderRadius:10 }} />
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'var(--font)', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', lineHeight:1 }}>Lognum</h1>
          {profile && <p style={{ color:'var(--text3)', fontSize:'.78rem' }}>Hey, {profile.username}! 👋</p>}
        </div>
        {profile && <CoinBadge coins={profile.coins || 0} />}
        <button onClick={() => nav('/profile')} style={{
          width:36, height:36, borderRadius:'50%', border:'2px solid var(--border2)',
          background:'var(--accent)22', cursor:'pointer', fontSize:'1.1rem',
          display:'flex', alignItems:'center', justifyContent:'center',
          WebkitTapHighlightColor:'transparent',
        }}>👤</button>
      </header>

      <main style={{ flex:1, padding:'8px 20px 24px' }}>
        {/* Welcome card */}
        <div className="fadeUp" style={{
          background:'linear-gradient(135deg, var(--accent)22, var(--accent3)11)',
          border:'1.5px solid var(--border2)', borderRadius:'var(--r2)',
          padding:'18px 20px', marginBottom:20,
        }}>
          <p style={{ color:'var(--text2)', lineHeight:1.55, fontSize:'.95rem' }}>
            Play solo against the computer or challenge a friend online with a room code! 🎮
          </p>
          {profile && (
            <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
              <span style={{ color:'var(--green)', fontSize:'.85rem', fontWeight:600 }}>
                🏆 {profile.games_won || 0} wins
              </span>
              <span style={{ color:'var(--accent2)', fontSize:'.85rem', fontWeight:600 }}>
                🔥 {profile.current_streak || 0} streak
              </span>
              <span style={{ color:'var(--gold)', fontSize:'.85rem', fontWeight:600 }}>
                🪙 {profile.coins || 0} coins
              </span>
            </div>
          )}
        </div>

        {/* Game cards */}
        <p style={{ color:'var(--text3)', fontSize:'.78rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:12 }}>
          Choose a game
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {games.map((g, i) => (
            <div key={g.id} className="fadeUp" style={{ animationDelay: `${i*0.08}s` }}
              onClick={() => nav(`/${g.id}`)}
            >
              <GameCard {...g} />
            </div>
          ))}
        </div>
      </main>

      <footer style={{ padding:'8px 20px 24px', textAlign:'center' }}>
        <button onClick={async () => { await signOut(); nav('/auth') }} style={{
          background:'none', border:'none', color:'var(--text3)', fontSize:'.82rem',
          cursor:'pointer', fontFamily:'var(--font)',
        }}>Sign out</button>
        <p style={{ color:'var(--text3)', fontSize:'.72rem', marginTop:4 }}>
          © 2025 · Developed by <span style={{ color:'var(--accent2)', fontWeight:600 }}>Logithaa G</span>
        </p>
      </footer>
    </div>
  )
}

function GameCard({ emoji, title, desc, color }) {
  return (
    <div style={{
      background: color+'13', border:`1.5px solid ${color}30`,
      borderRadius:'var(--r2)', padding:'18px 20px', cursor:'pointer',
      transition:'all .18s', WebkitTapHighlightColor:'transparent',
      display:'flex', alignItems:'center', gap:14,
    }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${color}25` }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{
        width:52, height:52, borderRadius:14, background:color+'22',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'1.6rem', border:`1px solid ${color}33`, flexShrink:0,
      }}>{emoji}</div>
      <div style={{ flex:1 }}>
        <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--text)', marginBottom:3 }}>{title}</p>
        <p style={{ color:'var(--text3)', fontSize:'.87rem', lineHeight:1.4 }}>{desc}</p>
      </div>
      <span style={{ color, fontSize:'1.3rem', flexShrink:0 }}>›</span>
    </div>
  )
}
