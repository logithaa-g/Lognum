import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell, Btn, ModeCard, MonoInput, WinScreen, LoseScreen, Spinner } from '../components/UI.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { pickSecret, getHint, HINTS, dirHint, BotGuesser } from '../lib/game.js'
import { updateRoom, subscribeRoom, recordWin, recordLoss } from '../lib/supabase.js'
import MultiLobby from '../components/MultiLobby.jsx'

// ── Hub ────────────────────────────────────────────────────────
export default function NumGuess() {
  const nav = useNavigate()
  const [mode, setMode] = useState(null) // null | solo | multi
  const [lo, setLo]     = useState('1')
  const [hi, setHi]     = useState('100')

  if (mode === 'solo')  return <NumSolo  lo={lo} hi={hi} setLo={setLo} setHi={setHi} onBack={() => setMode(null)} />
  if (mode === 'multi') return <NumMultiHub lo={lo} hi={hi} setLo={setLo} setHi={setHi} onBack={() => setMode(null)} />

  return (
    <PageShell title="🔢 Number Quest" onBack={() => nav('/')}>
      <p style={{ color:'var(--text3)', marginBottom:20, lineHeight:1.5 }}>
        Guess the secret number using temperature hints. Set your range, then duel!
      </p>

      {/* Range picker */}
      <div style={{ background:'var(--bg2)', borderRadius:'var(--r2)', padding:'16px 18px', marginBottom:20 }}>
        <p style={{ color:'var(--text2)', fontWeight:600, marginBottom:12, fontSize:'.9rem' }}>Set Range</p>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          {[['From', lo, setLo], ['To', hi, setHi]].map(([lbl, val, set]) => (
            <div key={lbl} style={{ flex:1 }}>
              <p style={{ color:'var(--text3)', fontSize:'.75rem', fontWeight:600, marginBottom:5 }}>{lbl}</p>
              <input value={val} onChange={e => set(e.target.value)} type="number" inputMode="numeric"
                style={{
                  width:'100%', fontFamily:'var(--mono)', fontSize:'1.3rem', fontWeight:700,
                  textAlign:'center', background:'var(--card)', border:'2px solid var(--border2)',
                  borderRadius:'var(--r)', color:'var(--text)', padding:'10px', outline:'none',
                }}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--border2)'}
              />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[[1,10],[1,100],[1,1000],[1,10000]].map(([a,b]) => (
            <button key={b} onClick={() => { setLo(String(a)); setHi(String(b)) }}
              style={{
                background:'var(--card)', border:'1px solid var(--border2)',
                borderRadius:8, padding:'5px 12px', fontSize:'.82rem', color:'var(--text2)',
                cursor:'pointer', fontFamily:'var(--font)', fontWeight:600, transition:'all .15s',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background='var(--accent)22'; e.currentTarget.style.borderColor='var(--accent)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='var(--card)'; e.currentTarget.style.borderColor='var(--border2)' }}
            >1–{b.toLocaleString()}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <ModeCard emoji="🤖" title="vs Computer"     desc="Turn-based duel — you both guess each other's number" color="#6c3cf7" onClick={() => setMode('solo')}  />
        <ModeCard emoji="👥" title="2 Player Online" desc="Challenge a friend with a room code" color="#f5a623"  onClick={() => setMode('multi')} />
      </div>
    </PageShell>
  )
}

// ── Solo turn-based duel ───────────────────────────────────────
function NumSolo({ lo, hi, setLo, setHi, onBack }) {
  const { session, refreshProfile } = useAuth()
  const loN = parseInt(lo), hiN = parseInt(hi)

  const S = { SETUP:'setup', PLAY:'play', WIN:'win', LOSE:'lose' }
  const [step,      setStep]      = useState(S.SETUP)
  const [mySecret,  setMySecret]  = useState(null)
  const [botSecret, setBotSecret] = useState(null)
  const [turn,      setTurn]      = useState('player') // player | bot
  const [myGuess,   setMyGuess]   = useState('')
  const [myHistory, setMyHistory] = useState([])
  const [botHistory,setBotHistory]= useState([])
  const [lastHint,  setLastHint]  = useState(null)
  const [botMsg,    setBotMsg]    = useState('')
  const [shake,     setShake]     = useState(false)
  const [setupErr,  setSetupErr]  = useState('')
  const [mySecInput,setMySecInput]= useState('')
  const botRef = useRef(null)
  const inputRef = useRef()

  useEffect(() => { if (step === S.PLAY && turn === 'player') inputRef.current?.focus() }, [step, turn])

  function startGame() {
    if (!mySecInput) { setSetupErr('Enter your secret number'); return }
    const sec = parseInt(mySecInput)
    if (isNaN(sec) || sec < loN || sec > hiN) { setSetupErr(`Must be between ${loN} and ${hiN}`); return }
    setMySecret(sec)
    const bs = pickSecret(loN, hiN)
    setBotSecret(bs)
    botRef.current = new BotGuesser(loN, hiN)
    setMyHistory([]); setBotHistory([]); setLastHint(null); setMyGuess('')
    setTurn('player'); setStep(S.PLAY)
  }

  function doTrigShake() { setShake(true); setTimeout(() => setShake(false), 400) }

  function submitPlayerGuess() {
    const n = parseInt(myGuess)
    if (isNaN(n) || n < loN || n > hiN) { doTrigShake(); return }
    const hint = getHint(n, botSecret)
    const meta = HINTS[hint]
    const dir  = dirHint(n, botSecret)
    const entry = { guess: n, hint: meta, dir, id: Date.now() }
    setMyHistory(h => [entry, ...h])
    setLastHint({ ...meta, dir })
    setMyGuess('')

    if (hint === 'exact') {
      if (session?.user) { recordWin(session.user.id, 50).then(refreshProfile).catch(()=>{}) }
      setStep(S.WIN)
      return
    }
    // Switch to bot turn
    setTurn('bot')
    setTimeout(() => doBotTurn(), 800)
  }

  function doBotTurn() {
    const bot = botRef.current
    const g   = bot.next()
    const hint = getHint(g, mySecret)

    setBotMsg(`Computer guesses: ${g}`)
    const dir = dirHint(g, mySecret)

    if (hint === 'exact') {
      setBotHistory(h => [{ guess: g, dir: '🎯 Exact!', id: Date.now() }, ...h])
      if (session?.user) { recordLoss(session.user.id).then(refreshProfile).catch(()=>{}) }
      setStep(S.LOSE)
      return
    }

    bot.update(g < mySecret ? 'low' : 'high')
    setBotHistory(h => [{ guess: g, dir, id: Date.now() }, ...h])

    setTimeout(() => {
      setBotMsg('')
      setTurn('player')
    }, 1200)
  }

  function replay() { setStep(S.SETUP); setMySecInput(''); setSetupErr('') }

  return (
    <PageShell title="🔢 Number Quest · Solo"
      onBack={step === S.PLAY ? undefined : onBack}
      badge={step === S.PLAY
        ? <span style={{ color:'var(--text3)', fontSize:'.78rem' }}>{loN}–{hiN}</span>
        : null
      }
    >
      {step === S.SETUP && (
        <div className="fadeUp">
          <div style={{ background:'var(--accent)11', border:'1.5px solid var(--accent)25', borderRadius:'var(--r2)', padding:'14px 16px', marginBottom:20 }}>
            <p style={{ color:'var(--text2)', fontSize:'.9rem', lineHeight:1.55 }}>
              <b>Turn-based duel:</b> You and the computer each pick a secret number. Take turns guessing — first to crack the other's secret wins! 🎯
            </p>
          </div>
          <p style={{ color:'var(--text3)', fontWeight:600, fontSize:'.82rem', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
            Your secret number ({loN}–{hiN})
          </p>
          <MonoInput
            value={mySecInput}
            onChange={e => { setMySecInput(e.target.value.replace(/\D/g,'')); setSetupErr('') }}
            onKeyDown={e => e.key === 'Enter' && startGame()}
            placeholder={`${loN}–${hiN}`}
            autoFocus
          />
          {setupErr && <p style={{ color:'var(--red)', marginTop:8, fontSize:'.88rem' }}>{setupErr}</p>}
          <p style={{ color:'var(--text3)', fontSize:'.82rem', marginTop:10, marginBottom:20 }}>
            The computer will try to guess this. Keep it secret! 🤫
          </p>
          <Btn onClick={startGame} variant="primary" size="xl">🎮 Start Duel!</Btn>
        </div>
      )}

      {step === S.PLAY && (
        <div className="fadeUp">
          {/* Turn indicator */}
          <div style={{
            textAlign:'center', padding:'10px 14px', borderRadius:'var(--r)', marginBottom:14,
            background: turn === 'player' ? 'var(--accent)15' : 'var(--gold)15',
            border:`1.5px solid ${turn === 'player' ? 'var(--accent)35' : 'var(--gold)35'}`,
            color: turn === 'player' ? 'var(--accent2)' : 'var(--gold)',
            fontWeight:700, fontSize:'.95rem',
            animation: turn === 'bot' ? 'pulse 1.2s ease infinite' : 'none',
          }}>
            {turn === 'player' ? '➡️ Your turn — guess the computer\'s number' : `🤖 Computer is thinking… ${botMsg}`}
          </div>

          {/* Hint display */}
          {lastHint && (
            <div style={{
              textAlign:'center', padding:'16px', borderRadius:'var(--r2)', marginBottom:14,
              background: lastHint.color+'18', border:`1.5px solid ${lastHint.color}44`,
              transition:'all .3s',
            }}>
              <div style={{ fontSize:'1.8rem' }}>{lastHint.emoji}</div>
              <p style={{ color: lastHint.color, fontWeight:700, fontSize:'1.05rem', marginTop:4 }}>{lastHint.label}</p>
              <p style={{ color:'var(--text3)', fontSize:'.88rem', marginTop:2 }}>{lastHint.dir}</p>
            </div>
          )}

          {/* Your guess input */}
          {turn === 'player' && (
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <input
                ref={inputRef}
                value={myGuess}
                onChange={e => setMyGuess(e.target.value.replace(/\D/g,''))}
                onKeyDown={e => e.key === 'Enter' && submitPlayerGuess()}
                inputMode="numeric" placeholder={`${loN}–${hiN}`}
                className={shake ? 'shake' : ''}
                style={{
                  flex:1, fontFamily:'var(--mono)', fontSize:'1.6rem', fontWeight:700,
                  textAlign:'center', background:'var(--bg2)', border:'2.5px solid var(--border2)',
                  borderRadius:'var(--r)', color:'var(--text)', padding:'13px 10px',
                  outline:'none', transition:'border-color .2s',
                }}
                onFocus={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px rgba(108,60,247,.15)' }}
                onBlur={e=>{ e.target.style.borderColor='var(--border2)'; e.target.style.boxShadow='none' }}
              />
              <Btn onClick={submitPlayerGuess} variant="primary" style={{ flexShrink:0, padding:'13px 18px' }}>Guess</Btn>
            </div>
          )}
          {turn === 'bot' && (
            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0', marginBottom:14 }}>
              <Spinner />
            </div>
          )}

          {/* Score row */}
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <ScoreBox label="Your guesses" count={myHistory.length} color="var(--accent)" />
            <ScoreBox label="Computer"     count={botHistory.length} color="var(--gold)" />
          </div>

          {/* History */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <HistCol title="Your guesses" items={myHistory.map(h=>({ text:h.guess, sub: h.hint.emoji+' '+h.dir }))} color="var(--accent)" />
            <HistCol title="Computer" items={botHistory.map(h=>({ text:h.guess, sub: h.dir }))} color="var(--gold)" />
          </div>
        </div>
      )}

      {step === S.WIN && (
        <WinScreen secret={botSecret} guesses={myHistory.length} coinsEarned={50} onReplay={replay} onHome={onBack} />
      )}
      {step === S.LOSE && (
        <LoseScreen secret={botSecret} guesses={botHistory.length} onReplay={replay} onHome={onBack} />
      )}
    </PageShell>
  )
}

// ── Multiplayer hub ────────────────────────────────────────────
function NumMultiHub({ lo, hi, onBack }) {
  const { session, profile, refreshProfile } = useAuth()
  const [room, setRoom]   = useState(null)
  const [role, setRole]   = useState(null)
  const [phase, setPhase] = useState('lobby') // lobby | game
  const loN = parseInt(lo), hiN = parseInt(hi)

  function handleRoomReady(r, rl) {
    setRoom(r); setRole(rl); setPhase('game')
  }

  if (phase === 'game' && room) {
    return (
      <NumMultiGame
        room={room} role={role} lo={loN} hi={hiN}
        onBack={onBack}
        userId={session?.user?.id}
        onRefreshProfile={refreshProfile}
      />
    )
  }

  return (
    <PageShell title="🔢 Number Quest · 2P" onBack={onBack}>
      <MultiLobby
        gameType="numguess"
        gameConfig={{ lo: loN, hi: hiN }}
        onRoomReady={handleRoomReady}
        onBack={onBack}
      />
    </PageShell>
  )
}

// ── Multiplayer game ───────────────────────────────────────────
function NumMultiGame({ room, role, lo, hi, onBack, userId, onRefreshProfile }) {
  const S = { SETUP:'setup', PLAY:'play', WIN:'win', LOSE:'lose' }
  const [step,      setStep]      = useState(S.SETUP)
  const [secretInput, setSecretInput] = useState('')
  const [mySecret,  setMySecret]  = useState(null)
  const [guess,     setGuess]     = useState('')
  const [myHistory, setMyHistory] = useState([])
  const [oppHistory,setOppHistory]= useState([])
  const [lastHint,  setLastHint]  = useState(null)
  const [setupErr,  setSetupErr]  = useState('')
  const [shake,     setShake]     = useState(false)
  const [liveRoom,  setLiveRoom]  = useState(room)
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
      // sync opponent history
      setOppHistory(gs[oppHistKey] || [])
      // check if we won / lost
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
    const n = parseInt(secretInput)
    if (isNaN(n) || n < lo || n > hi) { setSetupErr(`Must be between ${lo} and ${hi}`); return }
    setMySecret(n)
    const gs = { ...(liveRoom.game_state || {}), [mySecKey]: n }
    await updateRoom(room.id, { game_state: gs })
    setStep(S.PLAY)
  }

  async function submitGuess() {
    const n = parseInt(guess)
    if (isNaN(n) || n < lo || n > hi) { setShake(true); setTimeout(() => setShake(false),400); return }

    const gs    = liveRoom.game_state || {}
    const oppSec = gs[oppSecKey]
    if (oppSec === undefined || oppSec === null) return

    const hint = getHint(n, oppSec)
    const meta = HINTS[hint]
    const dir  = dirHint(n, oppSec)
    const entry = { guess: n, hint: meta.label, color: meta.color, dir, id: Date.now() }

    const newMyHist = [entry, ...(gs[myHistKey] || [])]
    setMyHistory(newMyHist)
    setLastHint({ ...meta, dir })
    setGuess('')
    inputRef.current?.focus()

    const newGs = { ...gs, [myHistKey]: newMyHist }
    if (hint === 'exact') {
      newGs.winner = role
      await updateRoom(room.id, { game_state: newGs, status: 'finished' })
    } else {
      await updateRoom(room.id, { game_state: newGs })
    }
  }

  function replay() { onBack() }

  const oppName = role === 'host' ? liveRoom.guest_name : liveRoom.host_name
  const oppSec  = liveRoom.game_state?.[oppSecKey]

  return (
    <PageShell title={`🔢 vs ${oppName || 'Opponent'}`} onBack={onBack}>
      {step === S.SETUP && (
        <div className="fadeUp">
          <div style={{ background:'var(--accent)11', border:'1.5px solid var(--accent)25', borderRadius:'var(--r2)', padding:'14px 16px', marginBottom:20 }}>
            <p style={{ color:'var(--text2)', fontSize:'.9rem', lineHeight:1.55 }}>
              Pick your secret number ({lo}–{hi}). Your opponent <b>{oppName}</b> will try to guess it!
            </p>
          </div>
          <MonoInput
            value={secretInput}
            onChange={e => { setSecretInput(e.target.value.replace(/\D/g,'')); setSetupErr('') }}
            onKeyDown={e => e.key === 'Enter' && lockSecret()}
            placeholder={`${lo}–${hi}`} autoFocus
          />
          {setupErr && <p style={{ color:'var(--red)', marginTop:8, fontSize:'.88rem' }}>{setupErr}</p>}
          <p style={{ color:'var(--text3)', fontSize:'.82rem', marginTop:10, marginBottom:20 }}>
            {oppSec !== undefined ? `✅ ${oppName} has locked their secret!` : `⏳ ${oppName} is choosing their secret…`}
          </p>
          <Btn onClick={lockSecret} variant="primary" size="xl">🔒 Lock My Secret</Btn>
        </div>
      )}

      {step === S.PLAY && (
        <div className="fadeUp">
          {lastHint && (
            <div style={{
              textAlign:'center', padding:'14px', borderRadius:'var(--r2)', marginBottom:14,
              background: lastHint.color+'18', border:`1.5px solid ${lastHint.color}44`,
            }}>
              <div style={{ fontSize:'1.6rem' }}>{lastHint.emoji}</div>
              <p style={{ color:lastHint.color, fontWeight:700, fontSize:'1rem', marginTop:2 }}>{lastHint.label}</p>
              <p style={{ color:'var(--text3)', fontSize:'.85rem' }}>{lastHint.dir}</p>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <input
              ref={inputRef}
              value={guess}
              onChange={e => setGuess(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key === 'Enter' && submitGuess()}
              inputMode="numeric" placeholder={`${lo}–${hi}`}
              className={shake ? 'shake' : ''}
              style={{
                flex:1, fontFamily:'var(--mono)', fontSize:'1.6rem', fontWeight:700,
                textAlign:'center', background:'var(--bg2)', border:'2.5px solid var(--border2)',
                borderRadius:'var(--r)', color:'var(--text)', padding:'13px 10px',
                outline:'none', transition:'border-color .2s',
              }}
              onFocus={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px rgba(108,60,247,.15)' }}
              onBlur={e=>{ e.target.style.borderColor='var(--border2)'; e.target.style.boxShadow='none' }}
            />
            <Btn onClick={submitGuess} variant="primary" style={{ flexShrink:0, padding:'13px 18px' }}>Guess</Btn>
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <ScoreBox label="Your guesses" count={myHistory.length} color="var(--accent)" />
            <ScoreBox label={oppName}      count={oppHistory.length} color="var(--gold)"  />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <HistCol title="You" items={myHistory.map(h=>({ text:h.guess, sub: h.dir }))} color="var(--accent)" />
            <HistCol title={oppName} items={oppHistory.map(h=>({ text:h.guess, sub: h.dir }))} color="var(--gold)" />
          </div>
        </div>
      )}

      {step === S.WIN  && <WinScreen  guesses={myHistory.length}  coinsEarned={100} onReplay={replay} onHome={onBack} />}
      {step === S.LOSE && <LoseScreen guesses={oppHistory.length} onReplay={replay} onHome={onBack} />}
    </PageShell>
  )
}

// ── Shared sub-components ──────────────────────────────────────
function ScoreBox({ label, count, color }) {
  return (
    <div style={{
      flex:1, background: color+'12', border:`1px solid ${color}30`,
      borderRadius:'var(--r)', padding:'10px', textAlign:'center',
    }}>
      <p style={{ fontSize:'1.5rem', fontWeight:700, color, lineHeight:1 }}>{count}</p>
      <p style={{ color:'var(--text3)', fontSize:'.73rem', marginTop:3, fontWeight:600 }}>{label}</p>
    </div>
  )
}

function HistCol({ title, items, color }) {
  return (
    <div>
      <p style={{ color:'var(--text3)', fontSize:'.73rem', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:7 }}>{title}</p>
      <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
        {items.map((h, i) => (
          <div key={i} style={{
            background: color+'12', border:`1px solid ${color}22`,
            borderRadius:9, padding:'6px 9px',
          }}>
            <p style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:'.95rem', color:'var(--text)' }}>{h.text}</p>
            <p style={{ color:'var(--text3)', fontSize:'.75rem', marginTop:1 }}>{h.sub}</p>
          </div>
        ))}
        {items.length === 0 && <p style={{ color:'var(--text3)', fontSize:'.8rem', textAlign:'center', padding:'8px 0' }}>—</p>}
      </div>
    </div>
  )
}
