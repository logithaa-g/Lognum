import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { PageShell, StatTile, CoinBadge } from '../components/UI.jsx'

export default function ProfilePage() {
  const nav = useNavigate()
  const { profile } = useAuth()

  if (!profile) return (
    <PageShell title="Profile" onBack={() => nav('/')}>
      <p style={{ color:'var(--text3)', textAlign:'center', paddingTop:40 }}>Loading…</p>
    </PageShell>
  )

  const played = profile.games_played || 0
  const won    = profile.games_won    || 0
  const winPct = played > 0 ? Math.round((won / played) * 100) : 0
  const lost   = played - won

  const avatarColors = ['#6c3cf7','#059669','#f5a623','#ef4444','#3b82f6','#ec4899','#8b5cf6']
  const color = profile.avatar_color || '#6c3cf7'

  return (
    <PageShell title="My Profile" onBack={() => nav('/')}>
      {/* Avatar + name */}
      <div className="fadeUp" style={{ textAlign:'center', padding:'20px 0 24px' }}>
        <div style={{
          width:80, height:80, borderRadius:'50%', background: color+'33',
          border:`3px solid ${color}`, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:'2.2rem', margin:'0 auto 12px',
          boxShadow:`0 0 0 6px ${color}18`,
        }}>
          {profile.username?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text)', marginBottom:4 }}>
          {profile.username}
        </h2>
        <CoinBadge coins={profile.coins || 0} />
      </div>

      {/* Win % big display */}
      <div className="fadeUp s1" style={{
        background:`linear-gradient(135deg, ${color}20, ${color}10)`,
        border:`1.5px solid ${color}35`, borderRadius:'var(--r2)',
        padding:'20px', textAlign:'center', marginBottom:16,
      }}>
        <p style={{ color:'var(--text3)', fontSize:'.82rem', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:6 }}>
          Win Rate
        </p>
        <p style={{ fontSize:'3.5rem', fontWeight:700, color, lineHeight:1 }}>{winPct}%</p>
        <p style={{ color:'var(--text3)', marginTop:6, fontSize:'.9rem' }}>
          {won} wins · {lost} losses · {played} played
        </p>
      </div>

      {/* Stats grid */}
      <div className="fadeUp s2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatTile emoji="🏆" label="Games Won"      value={won}                         color="var(--gold)"    />
        <StatTile emoji="🎮" label="Games Played"   value={played}                      color="var(--accent2)" />
        <StatTile emoji="🔥" label="Current Streak" value={profile.current_streak || 0} color="var(--red)"     />
        <StatTile emoji="⚡" label="Best Streak"    value={profile.highest_streak || 0} color="var(--green)"   />
      </div>

      {/* Coins */}
      <div className="fadeUp s3" style={{
        background:'var(--gold)15', border:'1.5px solid var(--gold)35',
        borderRadius:'var(--r)', padding:'16px 18px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <p style={{ color:'var(--text3)', fontSize:'.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>Total Coins</p>
          <p style={{ fontSize:'1.8rem', fontWeight:700, color:'var(--gold)', lineHeight:1.2 }}>
            🪙 {profile.coins || 0}
          </p>
        </div>
        <div style={{ textAlign:'right', color:'var(--text3)', fontSize:'.82rem', lineHeight:1.7 }}>
          <p>Win 1P: +50 🪙</p>
          <p>Win 2P: +100 🪙</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="fadeUp s4" style={{ marginTop:16 }}>
        <p style={{ color:'var(--text3)', fontSize:'.78rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10 }}>
          Achievements
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { emoji:'🎯', label:'First Win',       unlocked: won >= 1     },
            { emoji:'🔥', label:'On Fire (3 wins)', unlocked: won >= 3    },
            { emoji:'⚡', label:'Streak of 5',      unlocked: (profile.highest_streak||0) >= 5 },
            { emoji:'🪙', label:'100 Coins',        unlocked: (profile.coins||0) >= 100  },
            { emoji:'👑', label:'10 Wins',          unlocked: won >= 10   },
          ].map(a => (
            <div key={a.label} style={{
              display:'flex', alignItems:'center', gap:12,
              background: a.unlocked ? 'var(--accent)11' : 'var(--bg2)',
              border:`1px solid ${a.unlocked ? 'var(--accent)33' : 'var(--border)'}`,
              borderRadius:'var(--r)', padding:'10px 14px',
              opacity: a.unlocked ? 1 : .45,
            }}>
              <span style={{ fontSize:'1.3rem' }}>{a.emoji}</span>
              <span style={{ color: a.unlocked ? 'var(--text)' : 'var(--text3)', fontWeight:600, fontSize:'.92rem' }}>
                {a.label}
              </span>
              {a.unlocked && <span style={{ marginLeft:'auto', color:'var(--green)', fontSize:'.8rem', fontWeight:700 }}>✓ Unlocked</span>}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
