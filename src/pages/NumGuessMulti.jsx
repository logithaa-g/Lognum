import React, { useState, useEffect, useRef } from 'react'
import { Btn, Card, Spinner, Modal } from '../components/UI.jsx'
import { pickSecret, getHint, hintMeta, getDirectionHint } from '../lib/gameLogic.js'
import { isSupabaseReady, createRoom, joinRoom, subscribeToRoom, updateRoomState, generateRoomCode } from '../lib/supabase.js'

const STEP = { LOBBY: 'lobby', WAITING: 'waiting', SETUP: 'setup', PLAY: 'play', WIN: 'win', LOSE: 'lose' }

export default function NumGuessMulti({ onBack }) {
  const [step, setStep] = useState(STEP.LOBBY)
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState(null)
  const [role, setRole] = useState(null) // 'host' | 'guest'
  const [lo, setLo] = useState('1')
  const [hi, setHi] = useState('100')
  const [guess, setGuess] = useState('')
  const [myHistory, setMyHistory] = useState([])
  const [oppHistory, setOppHistory] = useState([])
  const [mySecret, setMySecret] = useState(null)
  const [oppSecret, setOppSecret] = useState(null)
  const [myGuessCount, setMyGuessCount] = useState(0)
  const [oppGuessCount, setOppGuessCount] = useState(0)
  const [winner, setWinner] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shakeInput, setShakeInput] = useState(false)
  const inputRef = useRef()
  const unsubRef = useRef()

  useEffect(() => () => unsubRef.current?.(), [])

  const supReady = isSupabaseReady()

  function handleRoomUpdate(roomData) {
    if (!roomData) return
    setRoom(roomData)
    const gs = roomData.game_state || {}
    const gc = roomData.game_config || {}

    if (roomData.state === 'ready' && step === STEP.WAITING) {
      setStep(STEP.SETUP)
    }

    if (roomData.state === 'playing') {
      setStep(STEP.PLAY)
      if (role === 'host') {
        setOppHistory(gs.guest_history || [])
        setOppGuessCount(gs.guest_guess_count || 0)
        if (gs.host_secret) setMySecret(gs.host_secret)
        if (gs.guest_secret) setOppSecret(gs.guest_secret)
      } else {
        setOppHistory(gs.host_history || [])
        setOppGuessCount(gs.host_guess_count || 0)
        if (gs.guest_secret) setMySecret(gs.guest_secret)
        if (gs.host_secret) setOppSecret(gs.host_secret)
      }
    }

    if (roomData.state === 'finished') {
      setWinner(gs.winner)
      setStep(gs.winner === role ? STEP.WIN : STEP.LOSE)
    }
  }

  async function handleCreateRoom() {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true); setError('')
    try {
      const r = await createRoom('numguess', name.trim(), { lo: parseInt(lo), hi: parseInt(hi) })
      setRoom(r); setRole('host'); setStep(STEP.WAITING)
      unsubRef.current = subscribeToRoom(r.code, handleRoomUpdate)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function handleJoinRoom() {
    if (!name.trim()) { setError('Enter your name'); return }
    if (!joinCode.trim()) { setError('Enter room code'); return }
    setLoading(true); setError('')
    try {
      const r = await joinRoom(joinCode.trim(), name.trim())
      setRoom(r); setRole('guest')
      const gc = r.game_config || {}
      if (gc.lo) setLo(String(gc.lo))
      if (gc.hi) setHi(String(gc.hi))
      unsubRef.current = subscribeToRoom(r.code, handleRoomUpdate)
      setStep(STEP.SETUP)
    } catch (e) { setError('Room not found or already started') }
    setLoading(false)
  }

  async function handleStartPlay() {
    if (!room) return
    const secret = pickSecret(parseInt(lo), parseInt(hi))
    setMySecret(secret)
    const secretKey = role === 'host' ? 'host_secret' : 'guest_secret'
    const gs = { ...(room.game_state || {}), [secretKey]: secret }
    const newState = role === 'host' ? 'playing' : room.state
    await updateRoomState(room.id, { game_state: gs, state: newState })
    if (role === 'guest') setStep(STEP.PLAY)
  }

  async function submitGuess() {
    const n = parseInt(guess)
    const l = parseInt(lo), h = parseInt(hi)
    if (isNaN(n) || n < l || n > h) { setShakeInput(true); setTimeout(() => setShakeInput(false), 450); return }
    if (!oppSecret) { setError('Waiting for opponent secret'); return }

    const hint = getHint(n, oppSecret)
    const dir  = getDirectionHint(n, oppSecret)
    const meta = hintMeta[hint]
    const newCount = myGuessCount + 1
    const entry = { who: 'You', guess: n, hint: meta, direction: dir, id: Date.now() }

    setMyHistory(prev => [entry, ...prev])
    setMyGuessCount(newCount)
    setGuess('')
    inputRef.current?.focus()

    const histKey = role === 'host' ? 'host_history' : 'guest_history'
    const countKey = role === 'host' ? 'host_guess_count' : 'guest_guess_count'
    const gs = { ...(room.game_state || {}), [histKey]: [entry, ...(room.game_state?.[histKey] || [])], [countKey]: newCount }

    if (hint === 'exact') {
      gs.winner = role
      await updateRoomState(room.id, { game_state: gs, state: 'finished' })
      setStep(STEP.WIN)
    } else {
      await updateRoomState(room.id, { game_state: gs })
    }
  }

  function replay() { setStep(STEP.LOBBY); setRoom(null); setRole(null); setMyHistory([]); setOppHistory([]); setMyGuessCount(0); setOppGuessCount(0); setMySecret(null); setOppSecret(null); setWinner(null) }

  if (!supReady) return <NoSupabase onBack={onBack} />

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={step === STEP.LOBBY ? onBack : () => setStep(STEP.LOBBY)}
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text3)', padding: 4, lineHeight: 1, WebkitTapHighlightColor: 'transparent' }}>←</button>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
          🔢 Number Quest · 2P
        </h1>
      </header>

      <main style={{ flex: 1, padding: '12px 20px 32px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {step === STEP.LOBBY && (
          <div className="anim-fadeup">
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
                style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
            </div>

            <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <p style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 14 }}>Create a Room</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>From</label>
                  <input value={lo} onChange={e => setLo(e.target.value)} type="number" inputMode="numeric" style={{ ...inputStyle, fontSize: '1.1rem', padding: '10px' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>To</label>
                  <input value={hi} onChange={e => setHi(e.target.value)} type="number" inputMode="numeric" style={{ ...inputStyle, fontSize: '1.1rem', padding: '10px' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
                </div>
              </div>
              <Btn onClick={handleCreateRoom} variant="primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <Spinner /> : '+ Create Room'}
              </Btn>
            </div>

            <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 20 }}>
              <p style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 14 }}>Join a Room</p>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Room code (e.g. ABCD12)"
                style={{ ...inputStyle, letterSpacing: '0.15em', marginBottom: 14 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
              <Btn onClick={handleJoinRoom} variant="gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? <Spinner /> : 'Join Room →'}
              </Btn>
            </div>

            {error && <p style={{ color: 'var(--danger)', marginTop: 12, textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
          </div>
        )}

        {step === STEP.WAITING && (
          <div className="anim-fadeup" style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner />
            <p style={{ color: 'var(--text2)', marginTop: 16, fontSize: '1.1rem', fontWeight: 600 }}>Waiting for opponent…</p>
            <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '16px 24px', marginTop: 24, display: 'inline-block' }}>
              <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 6 }}>Share this code:</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.2em' }}>
                {room?.code}
              </p>
            </div>
          </div>
        )}

        {step === STEP.SETUP && (
          <div className="anim-fadeup" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Set your secret!</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 24 }}>
              A random number between <b>{lo}</b> and <b>{hi}</b> will be your secret for your opponent to guess.
            </p>
            <Btn onClick={handleStartPlay} variant="primary" size="xl" style={{ width: '100%' }}>
              🔒 Lock in my secret & start!
            </Btn>
          </div>
        )}

        {step === STEP.PLAY && (
          <div className="anim-fadeup">
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'var(--accent)11', border: '1px solid var(--accent)33', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginBottom: 2 }}>Your guesses</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{myGuessCount}</p>
              </div>
              <div style={{ flex: 1, background: 'var(--gold)11', border: '1px solid var(--gold)33', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginBottom: 2 }}>Opponent</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>{oppGuessCount}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                ref={inputRef}
                value={guess}
                onChange={e => setGuess(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && submitGuess()}
                inputMode="numeric"
                placeholder={`${lo}–${hi}`}
                className={shakeInput ? 'anim-shake' : ''}
                style={{ ...inputStyle, flex: 1, fontSize: '1.6rem' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <Btn onClick={submitGuess} variant="primary" style={{ flexShrink: 0, padding: '14px 20px' }}>Guess</Btn>
            </div>

            <p style={{ color: 'var(--text3)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your History</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {myHistory.map((h, i) => (
                <div key={h.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--accent)11', borderRadius: 10, marginBottom: 5,
                  border: '1px solid var(--accent)22',
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{h.guess}</span>
                  <span style={{ color: h.hint.color, fontWeight: 600, fontSize: '0.9rem' }}>{h.hint.label}</span>
                  <span style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>{h.direction}</span>
                </div>
              ))}
              {myHistory.length === 0 && <p style={{ color: 'var(--text3)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>No guesses yet</p>}
            </div>
          </div>
        )}

        {step === STEP.WIN && (
          <div className="anim-popin" style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '4rem' }}>🏆</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)', margin: '8px 0' }}>You Win!</h2>
            <p style={{ color: 'var(--text2)' }}>You guessed the number in {myGuessCount} tries!</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <Btn onClick={replay} variant="gold">Play Again</Btn>
              <Btn onClick={onBack} variant="secondary">Home</Btn>
            </div>
          </div>
        )}

        {step === STEP.LOSE && (
          <div className="anim-popin" style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3.5rem' }}>😔</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)', margin: '8px 0' }}>Opponent Wins!</h2>
            <p style={{ color: 'var(--text2)' }}>They cracked it faster. Try again!</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <Btn onClick={replay} variant="primary">Rematch</Btn>
              <Btn onClick={onBack} variant="secondary">Home</Btn>
            </div>
          </div>
        )}

      </main>

      <footer style={{ padding: '8px 20px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
          Developed by <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>Logithaa G</span>
        </p>
      </footer>
    </div>
  )
}

function NoSupabase({ onBack }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text3)', padding: 4, WebkitTapHighlightColor: 'transparent' }}>←</button>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>🔢 Number Quest · 2P</h1>
      </header>
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <div style={{ background: 'var(--gold)11', border: '1.5px solid var(--gold)44', borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 12 }}>⚙️</div>
          <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 12 }}>Supabase Setup Required</h2>
          <p style={{ color: 'var(--text3)', lineHeight: 1.6, marginBottom: 16, fontSize: '0.95rem' }}>
            To enable real-time 2-player mode, add your Supabase credentials to the <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 6 }}>.env</code> file:
          </p>
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.8 }}>
            VITE_SUPABASE_URL=https://xxx.supabase.co<br />
            VITE_SUPABASE_ANON_KEY=your_anon_key
          </div>
          <p style={{ color: 'var(--text3)', marginTop: 14, fontSize: '0.85rem' }}>
            Also run the SQL in <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 6 }}>supabase-schema.sql</code> in your Supabase dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}

const labelStyle = { display: 'block', color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }
const inputStyle = {
  fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 700,
  width: '100%', textAlign: 'center', background: 'var(--bg2)',
  border: '2px solid var(--border2)', borderRadius: 'var(--radius)',
  color: 'var(--text)', padding: '12px', outline: 'none', transition: 'border-color 0.2s',
}
