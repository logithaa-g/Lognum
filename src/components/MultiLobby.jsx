import React, { useState, useEffect, useRef } from 'react'
import { Btn, TextInput, Spinner } from '../components/UI.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { isReady, createRoom, joinRoom, subscribeRoom, updateRoom } from '../lib/supabase.js'

// status flow: waiting → lobby → setup → playing → finished

export default function MultiLobby({ gameType, gameConfig={}, onRoomReady, onBack }) {
  const { session, profile } = useAuth()
  const [screen, setScreen] = useState('choose') // choose | create | join | waiting | lobby
  const [name, setName]     = useState(profile?.username || '')
  const [code, setCode]     = useState('')
  const [room, setRoom]     = useState(null)
  const [role, setRole]     = useState(null) // host | guest
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)
  const [copied, setCopied] = useState(false)
  const unsubRef = useRef(null)

  const ready = isReady()

  // Cleanup subscription on unmount
  useEffect(() => () => unsubRef.current?.(), [])

  function handleRoomUpdate(updated) {
    setRoom(updated)
    // Guest joined → show lobby
    if (updated.status === 'lobby') setScreen('lobby')
    // Host started → hand off to game
    if (updated.status === 'setup' || updated.status === 'playing') {
      onRoomReady(updated, role)
    }
  }

  async function handleCreate() {
    if (!name.trim()) { setErr('Enter your name'); return }
    setBusy(true); setErr('')
    try {
      const r = await createRoom(
        gameType,
        session?.user?.id || null,
        name.trim(),
        gameConfig
      )
      setRoom(r)
      setRole('host')
      // Subscribe to real-time updates
      unsubRef.current = subscribeRoom(r.id, handleRoomUpdate)
      setScreen('waiting')
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleJoin() {
    if (!name.trim()) { setErr('Enter your name'); return }
    if (!code.trim()) { setErr('Enter the room code'); return }
    setBusy(true); setErr('')
    try {
      const r = await joinRoom(
        code.trim(),
        session?.user?.id || null,
        name.trim()
      )
      setRoom(r)
      setRole('guest')
      // Subscribe
      unsubRef.current = subscribeRoom(r.id, handleRoomUpdate)
      setScreen('lobby')
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleStartGame() {
    if (!room) return
    setBusy(true)
    try {
      const updated = await updateRoom(room.id, { status: 'setup' })
      onRoomReady(updated, 'host')
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  function copyCode() {
    navigator.clipboard?.writeText(room?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!ready) return <NoSupabase onBack={onBack} />

  // ── Choose screen ──────────────────────────────────
  if (screen === 'choose') return (
    <div className="fadeUp" style={{ padding:'8px 0' }}>
      <p style={{ color:'var(--text2)', marginBottom:24, lineHeight:1.55 }}>
        Enter your name, then create a room or join one with a code.
      </p>

      <TextInput
        label="YOUR NAME"
        value={name} onChange={e => setName(e.target.value)}
        placeholder="e.g. Logithaa"
        style={{ marginBottom:20 }}
      />

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div onClick={() => { if(name.trim()) setScreen('create'); else setErr('Enter your name first') }}
          style={{
            background:'var(--accent)12', border:'1.5px solid var(--accent)35',
            borderRadius:'var(--r2)', padding:'18px 20px', cursor:'pointer',
            transition:'all .18s', WebkitTapHighlightColor:'transparent',
          }}
          onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)' }}
          onMouseLeave={e=>{ e.currentTarget.style.transform='' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'1.8rem' }}>🏠</span>
            <div>
              <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--text)' }}>Create Room</p>
              <p style={{ color:'var(--text3)', fontSize:'.87rem' }}>Get a code and invite a friend</p>
            </div>
            <span style={{ color:'var(--accent)', fontSize:'1.3rem', marginLeft:'auto' }}>›</span>
          </div>
        </div>

        <div onClick={() => { if(name.trim()) setScreen('join'); else setErr('Enter your name first') }}
          style={{
            background:'var(--gold)12', border:'1.5px solid var(--gold)35',
            borderRadius:'var(--r2)', padding:'18px 20px', cursor:'pointer',
            transition:'all .18s', WebkitTapHighlightColor:'transparent',
          }}
          onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)' }}
          onMouseLeave={e=>{ e.currentTarget.style.transform='' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'1.8rem' }}>🚪</span>
            <div>
              <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--text)' }}>Join Room</p>
              <p style={{ color:'var(--text3)', fontSize:'.87rem' }}>Enter a 6-letter room code</p>
            </div>
            <span style={{ color:'var(--gold)', fontSize:'1.3rem', marginLeft:'auto' }}>›</span>
          </div>
        </div>
      </div>

      {err && <p style={{ color:'var(--red)', marginTop:12, fontSize:'.88rem', textAlign:'center' }}>{err}</p>}
    </div>
  )

  // ── Create confirmation ────────────────────────────
  if (screen === 'create') return (
    <div className="fadeUp" style={{ padding:'8px 0' }}>
      <div style={{
        background:'var(--accent)11', border:'1.5px solid var(--accent)33',
        borderRadius:'var(--r)', padding:'14px 16px', marginBottom:20,
      }}>
        <p style={{ color:'var(--text2)', fontSize:'.9rem' }}>
          Playing as: <b style={{ color:'var(--accent2)' }}>{name}</b>
        </p>
      </div>
      <p style={{ color:'var(--text3)', marginBottom:20, lineHeight:1.55 }}>
        A room will be created and you'll get a code to share with your friend.
      </p>
      <Btn onClick={handleCreate} variant="primary" size="xl" disabled={busy}>
        {busy ? <Spinner size={18}/> : '🏠 Create Room'}
      </Btn>
      <button onClick={() => setScreen('choose')} style={{
        display:'block', margin:'14px auto 0', background:'none', border:'none',
        color:'var(--text3)', cursor:'pointer', fontFamily:'var(--font)', fontSize:'.9rem',
      }}>← Back</button>
      {err && <p style={{ color:'var(--red)', marginTop:10, textAlign:'center', fontSize:'.88rem' }}>{err}</p>}
    </div>
  )

  // ── Join screen ────────────────────────────────────
  if (screen === 'join') return (
    <div className="fadeUp" style={{ padding:'8px 0' }}>
      <div style={{
        background:'var(--gold)11', border:'1.5px solid var(--gold)33',
        borderRadius:'var(--r)', padding:'14px 16px', marginBottom:20,
      }}>
        <p style={{ color:'var(--text2)', fontSize:'.9rem' }}>
          Playing as: <b style={{ color:'var(--gold2)' }}>{name}</b>
        </p>
      </div>
      <TextInput
        label="ROOM CODE"
        value={code}
        onChange={e => { setCode(e.target.value.toUpperCase().slice(0,6)); setErr('') }}
        placeholder="e.g. AB3X7K"
        style={{ fontFamily:'var(--mono)', fontSize:'1.4rem', letterSpacing:'.2em', textAlign:'center' }}
      />
      {err && <p style={{ color:'var(--red)', marginTop:8, fontSize:'.88rem' }}>{err}</p>}
      <Btn onClick={handleJoin} variant="gold" size="xl" disabled={busy} style={{ marginTop:16 }}>
        {busy ? <Spinner size={18}/> : '🚪 Join Room'}
      </Btn>
      <button onClick={() => setScreen('choose')} style={{
        display:'block', margin:'14px auto 0', background:'none', border:'none',
        color:'var(--text3)', cursor:'pointer', fontFamily:'var(--font)', fontSize:'.9rem',
      }}>← Back</button>
    </div>
  )

  // ── Waiting for opponent (host) ────────────────────
  if (screen === 'waiting') return (
    <div className="fadeUp" style={{ textAlign:'center', padding:'28px 0' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:16 }}>⏳</div>
      <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:6 }}>Waiting for opponent…</h2>
      <p style={{ color:'var(--text3)', fontSize:'.9rem', marginBottom:28 }}>
        Share this code with your friend:
      </p>

      {/* Big code display */}
      <div style={{
        background:'var(--bg2)', border:'2px dashed var(--border2)',
        borderRadius:'var(--r2)', padding:'20px 24px', marginBottom:16,
        display:'inline-block', minWidth:200,
      }}>
        <p style={{ color:'var(--text3)', fontSize:'.78rem', marginBottom:6, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>Room Code</p>
        <p style={{ fontFamily:'var(--mono)', fontSize:'2.5rem', fontWeight:700, color:'var(--accent)', letterSpacing:'.25em' }}>
          {room?.code}
        </p>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:24 }}>
        <Btn onClick={copyCode} variant="secondary" size="sm">
          {copied ? '✓ Copied!' : '📋 Copy Code'}
        </Btn>
      </div>

      {/* Opponent status */}
      <div style={{
        display:'flex', alignItems:'center', gap:10, justifyContent:'center',
        background:'var(--bg2)', borderRadius:'var(--r)', padding:'12px 20px',
        border:'1.5px solid var(--border)',
      }}>
        <Spinner size={16} />
        <p style={{ color:'var(--text3)', fontSize:'.9rem' }}>Waiting for someone to join…</p>
      </div>
    </div>
  )

  // ── Lobby (both players present) ──────────────────
  if (screen === 'lobby') return (
    <div className="fadeUp" style={{ padding:'8px 0' }}>
      {/* Players */}
      <div style={{
        background:'var(--green)11', border:'1.5px solid var(--green)35',
        borderRadius:'var(--r2)', padding:'16px 18px', marginBottom:20,
      }}>
        <p style={{ color:'var(--green)', fontWeight:700, marginBottom:12, fontSize:'.9rem', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:'1rem' }}>✅</span> Both players are here!
        </p>
        <div style={{ display:'flex', gap:12 }}>
          <PlayerChip name={room?.host_name} label="Host" color="var(--accent)" />
          <div style={{ display:'flex', alignItems:'center', color:'var(--text3)', fontWeight:700 }}>VS</div>
          <PlayerChip name={room?.guest_name} label="Guest" color="var(--gold)" />
        </div>
      </div>

      {role === 'host' ? (
        <>
          <p style={{ color:'var(--text2)', marginBottom:16, lineHeight:1.55, fontSize:'.95rem' }}>
            You're the host! When you're both ready, press Start to begin the game.
          </p>
          <Btn onClick={handleStartGame} variant="primary" size="xl" disabled={busy}>
            {busy ? <Spinner size={18}/> : '🚀 Start Game!'}
          </Btn>
        </>
      ) : (
        <div style={{ textAlign:'center', padding:'12px 0' }}>
          <Spinner />
          <p style={{ color:'var(--text3)', marginTop:14 }}>Waiting for host to start the game…</p>
        </div>
      )}
    </div>
  )

  return null
}

function PlayerChip({ name, label, color }) {
  return (
    <div style={{
      flex:1, background: color+'15', border:`1.5px solid ${color}35`,
      borderRadius:'var(--r)', padding:'10px 12px', textAlign:'center',
    }}>
      <p style={{ fontSize:'1.3rem', marginBottom:2 }}>
        {name?.[0]?.toUpperCase() || '?'}
      </p>
      <p style={{ color:'var(--text)', fontWeight:700, fontSize:'.9rem' }}>{name || '—'}</p>
      <p style={{ color, fontSize:'.75rem', fontWeight:600 }}>{label}</p>
    </div>
  )
}

function NoSupabase({ onBack }) {
  return (
    <div style={{ padding:'8px 0' }}>
      <div style={{
        background:'var(--gold)11', border:'1.5px solid var(--gold)35',
        borderRadius:'var(--r2)', padding:22,
      }}>
        <h3 style={{ fontWeight:700, marginBottom:10 }}>⚙️ Supabase Setup Needed</h3>
        <p style={{ color:'var(--text3)', lineHeight:1.6, fontSize:'.9rem', marginBottom:14 }}>
          To play online, add your Supabase credentials to Vercel environment variables:
        </p>
        <div style={{ background:'var(--bg)', borderRadius:'var(--r)', padding:14, fontFamily:'var(--mono)', fontSize:'.8rem', color:'var(--text2)', lineHeight:1.9 }}>
          VITE_SUPABASE_URL=...<br/>
          VITE_SUPABASE_ANON_KEY=...
        </div>
        <p style={{ color:'var(--text3)', fontSize:'.82rem', marginTop:12 }}>
          Also run <code style={{ background:'var(--bg3)', padding:'2px 6px', borderRadius:4 }}>supabase-schema.sql</code> in your Supabase SQL editor.
        </p>
      </div>
    </div>
  )
}
