import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell, Btn, ModeCard, MonoInput, WinScreen, LoseScreen, Spinner } from '../components/UI.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { calcBC, genBCSecret, validBC, bcInitPool, bcFilter, bcPick } from '../lib/game.js'
import { updateRoom, subscribeRoom, recordWin, recordLoss } from '../lib/supabase.js'
import MultiLobby from '../components/MultiLobby.jsx'

// ── Hub ────────────────────────────────────────────────────────
export default function BullsCows() {
  const nav = useNavigate()
  const [mode, setMode] = useState(null)

  if (mode === 'solo')  return <BCSolo  onBack={() => setMode(null)} />
  if (mode === 'multi') return <BCMultiHub onBack={() => setMode(null)} />

  return (
    <PageShell title="🐂 Bulls & Cows" onBack={() => nav('/')}>
      <div style={{
        background:'var(--green)11', border:'1.5px solid var(--green)30',
        borderRadius:'var(--r)', padding:'14px 16px', marginBottom:22,
      }}>
        <p style={{ color:'var(--text2)', fontSize:'.9rem', lineHeight:1.6 }}>
          🐂 <b>Bull</b> = right digit, right position &nbsp;·&nbsp; 🐄 <b>Cow</b> = right digit, wrong position<br/>
          <span style={{ color:'var(--text3)', fontSize:'.82rem' }}>4 unique digits, no repeats. Crack the code!</span>
        </p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <ModeCard emoji="🤖" title="vs Computer"     desc="Competitive duel — you both guess each other's code simultaneously" color="#059669" onClick={() => setMode('solo')}  />
        <ModeCard emoji="👥" title="2 Player Online" desc="Challenge a friend with a room code"                                color="#f5a623" onClick={() => setMode('multi')} />
      </div>
    </PageShell>
  )
}

// ── Solo competitive duel ──────────────────────────────────────
function BCSolo({ onBack }) {
  const { session, refreshProfile } = useAuth()
  const S = { SETUP:'setup', PLAY:'play', WIN:'win', LOSE:'lose' }

  const [step,       setStep]       = useState(S.SETUP)
  const [mySecInput, setMySecInput] = useState('')
  const [mySecret,   setMySecret]   = useState('')
  const [compSecret, setCompSecret] = useState('')
  const [guess,      setGuess]      = useState('')
  const [myHistory,  setMyHistory]  = useState([])
  const [compHistory,setCompHistory]= useState([])
  const [pool,       setPool]       = useState([])
  const [compGuess,  setCompGuess]  = useState(null)
  const [awaitFeedback, setAwaitFeedback] = useState(false)
  const [bulls,      setBulls]      = useState(0)
  const [cows,       setCows]       = useState(0)
  const [fbError,    setFbError]    = useState('')
  const [turn,       setTurn]       = useState('player')
  const [shake,      setShake]      = useState(false)
  const [setupErr,   setSetupErr]   = useState('')
  const inputRef = useRef()

  useEffect(() => {
    if (step === S.PLAY && turn === 'player' && !awaitFeedback) inputRef.current?.focus()
  }, [step, turn, awaitFeedback])

  function startGame() {
    if (!validBC(mySecInput)) { setSetupErr('Enter 4 unique digits (no repeats)'); return }
    setMySecret(mySecInput)
    setCompSecret(genBCSecret())
    setPool(bcInitPool())
    setMyHistory([]); setCompHistory([])
    setGuess(''); setTurn('player')
    setAwaitFeedback(false)
    setStep(S.PLAY)
  }

  function doShake() { setShake(true); setTimeout(() => setShake(false), 400) }

  function submitPlayerGuess() {
    if (!validBC(guess)) { doShake(); return }
    const { bulls: b, cows: c } = calcBC(guess, compSecret)
    const entry = { guess, bulls: b, cows: c, id: Date.now() }
    setMyHistory(h => [entry, ...h])
    setGuess('')

    if (b === 4) {
      if (session?.user) recordWin(session.user.id, 50).then(refreshProfile).catch(()=>{})
      setStep(S.WIN); return
    }
    // Computer's turn
    setTurn('comp')
    setTimeout(doCompGuess, 700)
  }

  function doCompGuess() {
    const g = bcPick(pool)
    setCompGuess(g)
    setAwaitFeedback(true)
    setBulls(0); setCows(0); setFbError('')
  }

  function submitFeedback() {
    const b = parseInt(bulls), c = parseInt(cows)
    if (isNaN(b) || isNaN(c) || b < 0 || c < 0 || b + c > 4) {
      setFbError('Bulls + Cows must be between 0 and 4'); return
    }
    // Verify against actual secret
    const correct = calcBC(compGuess, mySecret)
    if (correct.bulls !== b || correct.cows !== c) {
      setFbError(`Incorrect! Correct: 🐂 ${correct.bulls} · 🐄 ${correct.cows}`)
      return
    }
    setFbError('')
    const entry = { guess: compGuess, bulls: b, cows: c, id: Date.now() }
    setCompHistory(h => [entry, ...h])

    if (b === 4) {
      if (session?.user) recordLoss(session.user.id).then(refreshProfile).catch(()=>{})
      setStep(S.LOSE); return
    }
    const newPool = bcFilter(pool, compGuess, b, c)
    setPool(newPool)
    setAwaitFeedback(false)
    setCompGuess(null)
    setTurn('player')
  }

  function replay() { setStep(S.SETUP); setMySecInput(''); setSetupErr('') }

  return (
    <PageShell
      title="🐂 Bulls & Cows · Solo"
      onBack={onBack}
      badge={step === S.PLAY
        ? <span style={{ color:'var(--text3)', fontSize:'.78rem' }}>
            You: {myHistory.length} · Bot: {compHistory.length}
          </span>
        : null}
    >
      {/* SETUP */}
      {step === S.SETUP && (
        <div className="fadeUp">
          <div style={{ background:'var(--green)11', border:'1.5px solid var(--green)28', borderRadius:'var(--r2)', padding:'14px 16px', marginBottom:20 }}>
            <p style={{ color:'var(--text2)', fontSize:'.9rem', lineHeight:1.55 }}>
              <b>Competitive duel:</b> You set a secret, computer sets a secret. Take turns guessing — first to crack the other's code wins! 🎯
            </p>
          </div>
          <p style={{ color:'var(--text3)', fontWeight:600, fontSize:'.82rem', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
            Your secret code
          </p>
          <MonoInput
            value={mySecInput}
            onChange={e => { setMySecInput(e.target.value.replace(/\D/g,'').slice(0,4)); setSetupErr('') }}
            onKeyDown={e => e.key === 'Enter' && startGame()}
            placeholder="e.g. 4729"
            style={{ letterSpacing:'.3em' }}
            autoFocus
          />
          {setupErr && <p style={{ color:'var(--red)', marginTop:8, fontSize:'.88rem' }}>{setupErr}</p>}
          <p style={{ color:'var(--text3)', fontSize:'.82rem', marginTop:8, marginBottom:20 }}>
            4 unique digits • no repeats • e.g. 1234, 5809
          </p>
          <Btn onClick={startGame} variant="green" size="xl">🎮 Start Duel!</Btn>
        </div>
      )}

      {/* PLAY */}
      {step === S.PLAY && (
        <div className="fadeUp">
          {/* Turn bar */}
          <div style={{
            textAlign:'center', padding:'10px 14px', borderRadius:'var(--r)', marginBottom:14,
            background: turn === 'player' ? 'var(--green)15' : 'var(--gold)15',
            border:`1.5px solid ${turn === 'player' ? 'var(--green)35' : 'var(--gold)35'}`,
            color: turn === 'player' ? 'var(--green)' : 'var(--gold)',
            fontWeight:700, fontSize:'.92rem',
          }}>
            {turn === 'player'
              ? awaitFeedback ? '🤖 Computer guessed — give feedback below' : '➡️ Your turn — guess the computer\'s code'
              : '🤖 Computer is thinking…'}
          </div>

          {/* Player guess */}
          {turn === 'player' && !awaitFeedback && (
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <input
                ref={inputRef}
                value={guess}
                onChange={e => setGuess(e.target.value.replace(/\D/g,'').slice(0,4))}
                onKeyDown={e => e.key === 'Enter' && submitPlayerGuess()}
                inputMode="numeric" maxLength={4} placeholder="••••"
                className={shake ? 'shake' : ''}
                style={{
                  flex:1, fontFamily:'var(--mono)', fontSize:'2rem', fontWeight:700,
                  textAlign:'center', background:'var(--bg2)', border:'2.5px solid var(--border2)',
                  borderRadius:'var(--r)', color:'var(--text)', padding:'13px 10px',
                  outline:'none', letterSpacing:'.25em', transition:'border-color .2s',
                }}
                onFocus={e=>{ e.target.style.borderColor='var(--green)'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,.15)' }}
                onBlur={e=>{ e.target.style.borderColor='var(--border2)'; e.target.style.boxShadow='none' }}
              />
              <Btn onClick={submitPlayerGuess} variant="green" style={{ flexShrink:0, padding:'13px 18px' }}>
                Guess
              </Btn>
            </div>
          )}

          {/* Feedback panel */}
          {awaitFeedback && compGuess && (
            <div className="slideUp" style={{
              background:'var(--gold)11', border:'1.5px solid var(--gold)40',
              borderRadius:'var(--r2)', padding:'18px 16px', marginBottom:14,
            }}>
              <p style={{ color:'var(--text3)', fontSize:'.8rem', fontWeight:600, marginBottom:6 }}>
                Computer guessed:
              </p>
              <p style={{ fontFamily:'var(--mono)', fontSize:'2.4rem', fontWeight:700, color:'var(--gold2)', letterSpacing:'.3em', textAlign:'center', marginBottom:14 }}>
                {compGuess}
              </p>
              <p style={{ color:'var(--text2)', fontSize:'.88rem', marginBottom:12 }}>
                Rate this against your secret <span style={{ fontFamily:'var(--mono)', color:'var(--accent2)', fontWeight:700 }}>{mySecret}</span>:
              </p>
              <div style={{ display:'flex', gap:14, justifyContent:'center', marginBottom:12 }}>
                {[{ lbl:'🐂 Bulls', val:bulls, set:setBulls, c:'#ef4444' }, { lbl:'🐄 Cows', val:cows, set:setCows, c:'#f59e0b' }].map(f => (
                  <div key={f.lbl} style={{ textAlign:'center' }}>
                    <p style={{ color:f.c, fontSize:'.82rem', fontWeight:700, marginBottom:5 }}>{f.lbl}</p>
                    <input
                      type="number" min={0} max={4} value={f.val}
                      onChange={e => { f.set(parseInt(e.target.value)||0); setFbError('') }}
                      style={{
                        width:68, fontFamily:'var(--mono)', fontSize:'1.6rem', fontWeight:700,
                        textAlign:'center', background:'var(--bg2)', border:`2px solid ${f.c}44`,
                        borderRadius:10, color:'var(--text)', padding:'8px', outline:'none',
                      }}
                      onFocus={e=>e.target.style.borderColor=f.c}
                      onBlur={e=>e.target.style.borderColor=f.c+'44'}
                    />
                  </div>
                ))}
              </div>
              {fbError && <p style={{ color:'var(--red)', fontSize:'.84rem', textAlign:'center', marginBottom:8 }}>{fbError}</p>}
              <Btn onClick={submitFeedback} variant="gold" size="xl">Submit Feedback →</Btn>
            </div>
          )}

          {/* Scores + history */}
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <BCScoreBox label="Your guesses" count={myHistory.length} color="var(--green)" />
            <BCScoreBox label="Computer"     count={compHistory.length} color="var(--gold)" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <BCHistCol title="Your guesses" items={myHistory} color="var(--green)" />
            <BCHistCol title="Computer"     items={compHistory} color="var(--gold)" />
          </div>
        </div>
      )}

      {step === S.WIN  && <WinScreen  secret={compSecret} guesses={myHistory.length} coinsEarned={50} onReplay={replay} onHome={onBack} />}
      {step === S.LOSE && <LoseScreen secret={compSecret} guesses={compHistory.length} onReplay={replay} onHome={onBack} />}
    </PageShell>
  )
}

// ── Multiplayer hub ────────────────────────────────────────────
function BCMultiHub({ onBack }) {
  const { session, refreshProfile } = useAuth()
  const [room,  setRoom]  = useState(null)
  const [role,  setRole]  = useState(null)
  const [phase, setPhase] = useState('lobby')

  function handleRoomReady(r, rl) { setRoom(r); setRole(rl); setPhase('game') }

  if (phase === 'game' && room) {
    return (
      <BCMultiGame
        room={room} role={role} onBack={onBack}
        userId={session?.user?.id}
        onRefreshProfile={refreshProfile}
      />
    )
  }

  return (
    <PageShell title="🐂 Bulls & Cows · 2P" onBack={onBack}>
      <MultiLobby gameType="bullscows" onRoomReady={handleRoomReady} onBack={onBack} />
    </PageShell>
  )
}

// ── Multiplayer game ───────────────────────────────────────────
function BCMultiGame({ room, role, onBack, userId, onRefreshProfile }) {
  const S = { SETUP:'setup', PLAY:'play', WIN:'win', LOSE:'lose' }
  const [step,       setStep]       = useState(S.SETUP)
  const [secretInput,setSecretInput]= useState('')
  const [mySecret,   setMySecret]   = useState('')
  const [guess,      setGuess]      = useState('')
  const [myHistory,  setMyHistory]  = useState([])
  const [oppHistory, setOppHistory] = useState([])
  const [setupErr,   setSetupErr]   = useState('')
  const [shake,      setShake]      = useState(false)
  const [liveRoom,   setLiveRoom]   = useState(room)
  const inputRef = useRef()
  const unsubRef = useRef()

  const myHistKey  = role === 'host' ? 'host_history'  : 'guest_history'
  const oppHistKey = role === 'host' ? 'guest_history' : 'host_history'
  const mySecKey   = role === 'host' ? 'host_secret'   : 'guest_secret'
  const oppSecKey  = role === 'host' ? 'guest_secret'  : 'host_secret'

  useEffect(() => {
    unsubRef.current = subscribeRoom(room.id, updated => {
      setLiveRoom(updated)
      const gs = updated.game_state || {}
      setOppHistory(gs[oppHistKey] || [])
      if (updated.status === 'finished') {
        if (gs.winner === role) {
          if (userId) recordWin(userId, 100).then(onRefreshProfile).catch(()=>{})
          setStep(S.WIN)
        } else {
          if (userId) recordLoss(userId).then(onRefreshProfile).catch(()=>{})
          setStep(S.LOSE)
        }
      }
    })
    return () => unsubRef.current?.()
  }, [])

  useEffect(() => { if (step === S.PLAY) inputRef.current?.focus() }, [step])

  async function lockSecret() {
    if (!validBC(secretInput)) { setSetupErr('4 unique digits, no repeats'); return }
    setMySecret(secretInput)
    const gs = { ...(liveRoom.game_state || {}), [mySecKey]: secretInput }
    await updateRoom(room.id, { game_state: gs })
    setStep(S.PLAY)
  }

  async function submitGuess() {
    if (!validBC(guess)) { setShake(true); setTimeout(() => setShake(false), 400); return }
    const gs     = liveRoom.game_state || {}
    const oppSec = gs[oppSecKey]
    if (!oppSec) return

    const { bulls, cows } = calcBC(guess, oppSec)
    const entry = { guess, bulls, cows, id: Date.now() }
    const newMyHist = [entry, ...(gs[myHistKey] || [])]
    setMyHistory(newMyHist)
    setGuess('')
    inputRef.current?.focus()

    const newGs = { ...gs, [myHistKey]: newMyHist }
    if (bulls === 4) {
      newGs.winner = role
      await updateRoom(room.id, { game_state: newGs, status: 'finished' })
    } else {
      await updateRoom(room.id, { game_state: newGs })
    }
  }

  const oppName = role === 'host' ? liveRoom.guest_name : liveRoom.host_name
  const oppSec  = liveRoom.game_state?.[oppSecKey]

  return (
    <PageShell title={`🐂 vs ${oppName || 'Opponent'}`} onBack={onBack}>
      {step === S.SETUP && (
        <div className="fadeUp">
          <div style={{ background:'var(--green)11', border:'1.5px solid var(--green)28', borderRadius:'var(--r2)', padding:'14px 16px', marginBottom:20 }}>
            <p style={{ color:'var(--text2)', fontSize:'.9rem', lineHeight:1.55 }}>
              Set your secret 4-digit code. <b>{oppName}</b> will try to guess it!
            </p>
          </div>
          <MonoInput
            value={secretInput}
            onChange={e => { setSecretInput(e.target.value.replace(/\D/g,'').slice(0,4)); setSetupErr('') }}
            onKeyDown={e => e.key === 'Enter' && lockSecret()}
            placeholder="e.g. 4729"
            style={{ letterSpacing:'.3em' }}
            autoFocus
          />
          {setupErr && <p style={{ color:'var(--red)', marginTop:8, fontSize:'.88rem' }}>{setupErr}</p>}
          <p style={{ color:'var(--text3)', fontSize:'.82rem', marginTop:8, marginBottom:4 }}>
            4 unique digits • no repeats
          </p>
          <p style={{ color: oppSec ? 'var(--green)' : 'var(--text3)', fontSize:'.85rem', marginBottom:20, fontWeight: oppSec ? 700 : 400 }}>
            {oppSec ? `✅ ${oppName} has locked their code!` : `⏳ ${oppName} is choosing their code…`}
          </p>
          <Btn onClick={lockSecret} variant="green" size="xl">🔒 Lock My Code</Btn>
        </div>
      )}

      {step === S.PLAY && (
        <div className="fadeUp">
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <BCScoreBox label="Your guesses" count={myHistory.length}  color="var(--green)" />
            <BCScoreBox label={oppName}      count={oppHistory.length} color="var(--gold)"  />
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <input
              ref={inputRef}
              value={guess}
              onChange={e => setGuess(e.target.value.replace(/\D/g,'').slice(0,4))}
              onKeyDown={e => e.key === 'Enter' && submitGuess()}
              inputMode="numeric" maxLength={4} placeholder="••••"
              className={shake ? 'shake' : ''}
              style={{
                flex:1, fontFamily:'var(--mono)', fontSize:'2rem', fontWeight:700,
                textAlign:'center', background:'var(--bg2)', border:'2.5px solid var(--border2)',
                borderRadius:'var(--r)', color:'var(--text)', padding:'13px 10px',
                outline:'none', letterSpacing:'.25em', transition:'border-color .2s',
              }}
              onFocus={e=>{ e.target.style.borderColor='var(--green)'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,.15)' }}
              onBlur={e=>{ e.target.style.borderColor='var(--border2)'; e.target.style.boxShadow='none' }}
            />
            <Btn onClick={submitGuess} variant="green" style={{ flexShrink:0, padding:'13px 18px' }}>Guess</Btn>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <BCHistCol title="You"     items={myHistory}  color="var(--green)" />
            <BCHistCol title={oppName} items={oppHistory} color="var(--gold)"  />
          </div>
        </div>
      )}

      {step === S.WIN  && <WinScreen  guesses={myHistory.length}  coinsEarned={100} onReplay={onBack} onHome={onBack} />}
      {step === S.LOSE && <LoseScreen guesses={oppHistory.length} onReplay={onBack} onHome={onBack} />}
    </PageShell>
  )
}

// ── Shared sub-components ──────────────────────────────────────
function BCScoreBox({ label, count, color }) {
  return (
    <div style={{
      flex:1, background:color+'12', border:`1px solid ${color}30`,
      borderRadius:'var(--r)', padding:'10px', textAlign:'center',
    }}>
      <p style={{ fontSize:'1.5rem', fontWeight:700, color, lineHeight:1 }}>{count}</p>
      <p style={{ color:'var(--text3)', fontSize:'.73rem', marginTop:3, fontWeight:600 }}>{label}</p>
    </div>
  )
}

function BCHistCol({ title, items, color }) {
  return (
    <div>
      <p style={{ color:'var(--text3)', fontSize:'.73rem', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:7 }}>{title}</p>
      <div style={{ maxHeight:240, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
        {items.map(h => (
          <div key={h.id} style={{
            background:color+'12', border:`1px solid ${color}22`,
            borderRadius:9, padding:'7px 9px',
          }}>
            <p style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:'1rem', color:'var(--text)', letterSpacing:'.12em' }}>{h.guess}</p>
            <p style={{ color:'var(--text3)', fontSize:'.75rem', marginTop:2 }}>🐂{h.bulls} · 🐄{h.cows}</p>
          </div>
        ))}
        {items.length === 0 && <p style={{ color:'var(--text3)', fontSize:'.8rem', textAlign:'center', padding:'8px 0' }}>—</p>}
      </div>
    </div>
  )
}
