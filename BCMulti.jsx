import React, { useState, useEffect, useRef } from 'react'
import { Btn, Spinner } from '../components/UI.jsx'
import { calcBullsCows, generateBCSecret, isValidBCGuess, bcInitPool, bcFilterPool, bcPickGuess } from '../lib/gameLogic.js'
import { isSupabaseReady, createRoom, joinRoom, subscribeToRoom, updateRoomState } from '../lib/supabase.js'

const STEP = { LOBBY: 'lobby', WAITING: 'waiting', SETUP: 'setup', PLAY: 'play', WIN: 'win', LOSE: 'lose' }

export default function BCMulti({ onBack }) {
  const [step, setStep]         = useState(STEP.LOBBY)
  const [name, setName]         = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom]         = useState(null)
  const [role, setRole]         = useState(null)
  const [mySecret, setMySecret] = useState('')
  const [setupInput, setSetupInput] = useState('')
  const [setupError, setSetupError] = useState('')
  const [guess, setGuess]       = useState('')
  const [myHistory, setMyHistory] = useState([])
  const [oppHistory, setOppHistory] = useState([])
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shake, setShake]       = useState(false)
  const [winner, setWinner]     = useState(null)
  const inputRef = useRef()
  const unsubRef = useRef()

  const supReady = isSupabaseReady()

  useEffect(() => () => unsubRef.current?.(), [])
  useEffect(() => { if (step === STEP.PLAY) inputRef.current?.focus() }, [step])

  function handleRoomUpdate(roomData) {
    if (!roomData) return
    setRoom(roomData)
    const gs = roomData.game_state || {}

    if (roomData.state === 'ready' && step === STEP.WAITING) setStep(STEP.SETUP)

    if (roomData.state === 'playing') {
      setStep(STEP.PLAY)
      const myHistKey = role === 'host' ? 'host_history' : 'guest_history'
      const oppHistKey = role === 'host' ? 'guest_history' : 'host_history'
      setMyHistory(gs[myHistKey] || [])
      setOppHistory(gs[oppHistKey] || [])
    }

    if (roomData.state === 'finished') {
      setWinner(gs.winner)
      setStep(gs.winner === role ? STEP.WIN : STEP.LOSE)
    }
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true); setError('')
    try {
      const r = await createRoom('bullscows', name.trim())
      setRoom(r); setRole('host'); setStep(STEP.WAITING)
      unsubRef.current = subscribeToRoom(r.code, handleRoomUpdate)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function handleJoin() {
    if (!name.trim()) { setError('Enter your name'); return }
    if (!joinCode.trim()) { setError('Enter room code'); return }
    setLoading(true); setError('')
    try {
      const r = await joinRoom(joinCode.trim(), name.trim())
      setRoom(r); setRole('guest')
      unsubRef.current = subscribeToRoom(r.code, handleRoomUpdate)
      setStep(STEP.SETUP)
    } catch (e) { setError('Room not found or already started') }
    setLoading(false)
  }

  async function handleSetSecret() {
    if (!isValidBCGuess(setupInput)) { setSetupError('4 digits, no repeats!'); return }
    setMySecret(setupInput)
    const secretKey = role === 'host' ? 'host_secret' : 'guest_secret'
    const gs = { ...(room?.game_state || {}), [secretKey]: setupInput }
    const newState = role === 'host' ? room.state : 'playing'
    await updateRoomState(room.id, { game_state: gs, state: newState })
    if (role === 'guest') setStep(STEP.PLAY)
  }

  async function submitGuess() {
    if (!isValidBCGuess(guess)) {
      setShake(true); setTimeout(() => setShake(false), 450); return
    }
    const gs = room?.game_state || {}
    const oppSecret = role === 'host' ? gs.guest_secret : gs.host_secret
    if (!oppSecret) return

    const { bulls, cows } = calcBullsCows(guess, oppSecret)
    const entry = { guess, bulls, cows, id: Date.now() }
    const newMyHistory = [entry, ...myHistory]
    setMyHistory(newMyHistory)
    setGuess('')
    inputRef.current?.focus()

    const histKey = role === 'host' ? 'host_history' : 'guest_history'
    const updatedGs = { ...gs, [histKey]: newMyHistory }

    if (bulls === 4) {
      updatedGs.winner = role
      await updateRoomState(room.id, { game_state: updatedGs, state: 'finished' })
      setStep(STEP.WIN)
    } else {
      await updateRoomState(room.id, { game_state: updatedGs })
    }
  }

  function replay() {
    setStep(STEP.LOBBY); setRoom(null); setRole(null)
    setMyHistory([]); setOppHistory([])
    setMySecret(''); setSetupInput(''); setGuess('')
    setWinner(null)
  }

  if (!supReady) return <NoSupabase onBack={onBack} />

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text3)', padding: 4, WebkitTapHighlightColor: 'transparent' }}>←</button>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
          🐂 Bulls & Cows · 2P
        </h1>
      </header>

      <main style={{ flex: 1, padding: '12px 20px 32px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {step === STEP.LOBBY && (
          <div className="anim-fadeup">
            <div style={{ marginBottom: 20 }}>
              <label style={lblStyle}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" style={inpStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 14 }}>Create a Room</p>
              <Btn onClick={handleCreate} variant="primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <Spinner /> : '+ Create Room'}
              </Btn>
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 20 }}>
              <p style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 14 }}>Join a Room</p>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Room code" style={{ ...inpStyle, letterSpacing: '0.15em', marginBottom: 14 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
              <Btn onClick={handleJoin} variant="gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? <Spinner /> : 'Join Room →'}
              </Btn>
            </div>
            {error && <p style={{ color: 'var(--danger)', marginTop: 12, textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        {step === STEP.WAITING && (
          <div className="anim-fadeup" style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner />
            <p style={{ color: 'var(--text2)', marginTop: 16, fontWeight: 600 }}>Waiting for opponent…</p>
            <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '16px 24px', marginTop: 24, display: 'inline-block' }}>
              <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 6 }}>Room code:</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.2em' }}>{room?.code}</p>
            </div>
          </div>
        )}

        {step === STEP.SETUP && (
          <div className="anim-fadeup" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Set your secret code</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 20 }}>4 unique digits. Your opponent must crack it!</p>
            <input
              value={setupInput}
              onChange={e => { setSetupInput(e.target.value.replace(/\D/g,'').slice(0,4)); setSetupError('') }}
              inputMode="numeric" maxLength={4} placeholder="e.g. 4729"
              style={{ ...inpStyle, fontSize: '2rem', letterSpacing: '0.3em', marginBottom: 10 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
            {setupError && <p style={{ color: 'var(--danger)', marginBottom: 10, fontSize: '0.9rem' }}>{setupError}</p>}
            <Btn onClick={handleSetSecret} variant="success" size="xl" style={{ width: '100%' }}>
              🔒 Lock in my secret!
            </Btn>
          </div>
        )}

        {step === STEP.PLAY && (
          <div className="anim-fadeup">
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'var(--accent)11', border: '1px solid var(--accent)33', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginBottom: 2 }}>Your guesses</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{myHistory.length}</p>
              </div>
              <div style={{ flex: 1, background: 'var(--gold)11', border: '1px solid var(--gold)33', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginBottom: 2 }}>Opponent</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>{oppHistory.length}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                ref={inputRef}
                value={guess}
                onChange={e => setGuess(e.target.value.replace(/\D/g,'').slice(0,4))}
                onKeyDown={e => e.key === 'Enter' && submitGuess()}
                inputMode="numeric" maxLength={4} placeholder="••••"
                className={shake ? 'anim-shake' : ''}
                style={{ ...inpStyle, flex: 1, fontSize: '1.8rem', letterSpacing: '0.25em' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <Btn onClick={submitGuess} variant="primary" style={{ flexShrink: 0, padding: '14px 20px' }}>Guess</Btn>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <HistCol title="Your guesses" history={myHistory} color="var(--accent)" />
              <HistCol title="Opponent" history={oppHistory} color="var(--gold)" />
            </div>
          </div>
        )}

        {step === STEP.WIN && (
          <div className="anim-popin" style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '4rem' }}>🏆</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)', margin: '8px 0' }}>You Win!</h2>
            <p style={{ color: 'var(--text2)' }}>You cracked the code in {myHistory.length} guesses!</p>
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
            <p style={{ color: 'var(--text2)' }}>They cracked it faster. Rematch?</p>
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

function HistCol({ title, history, color }) {
  return (
    <div>
      <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{title}</p>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {history.map(h => (
          <div key={h.id} style={{ background: color + '11', border: `1px solid ${color}22`, borderRadius: 10, padding: '7px 10px', marginBottom: 5, fontSize: '0.82rem' }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text)' }}>{h.guess}</span>
            <span style={{ display: 'block', color: 'var(--text3)', marginTop: 2 }}>🐂{h.bulls} · 🐄{h.cows}</span>
          </div>
        ))}
        {history.length === 0 && <p style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '8px 0' }}>—</p>}
      </div>
    </div>
  )
}

function NoSupabase({ onBack }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text3)', padding: 4, WebkitTapHighlightColor: 'transparent' }}>←</button>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>🐂 Bulls & Cows · 2P</h1>
      </header>
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <div style={{ background: 'var(--gold)11', border: '1.5px solid var(--gold)44', borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 12 }}>⚙️</div>
          <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 12 }}>Supabase Setup Required</h2>
          <p style={{ color: 'var(--text3)', lineHeight: 1.6, marginBottom: 16, fontSize: '0.95rem' }}>
            Add your Supabase credentials to the <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 6 }}>.env</code> file to enable multiplayer.
          </p>
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.8 }}>
            VITE_SUPABASE_URL=https://xxx.supabase.co<br />
            VITE_SUPABASE_ANON_KEY=your_anon_key
          </div>
        </div>
      </main>
    </div>
  )
}

const lblStyle = { display: 'block', color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }
const inpStyle = {
  fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 700,
  width: '100%', textAlign: 'center', background: 'var(--bg2)',
  border: '2px solid var(--border2)', borderRadius: 'var(--radius)',
  color: 'var(--text)', padding: '12px', outline: 'none', transition: 'border-color 0.2s',
}
