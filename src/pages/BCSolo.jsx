import React, { useState, useRef, useEffect } from 'react'
import { Btn, WinBanner, LoseBanner } from '../components/UI.jsx'
import { calcBullsCows, generateBCSecret, isValidBCGuess, bcInitPool, bcFilterPool, bcPickGuess } from '../lib/gameLogic.js'

const STEP = { SETUP: 'setup', PLAY: 'play', WIN: 'win', LOSE: 'lose' }

export default function BCSolo({ onBack }) {
  const [step, setStep]         = useState(STEP.SETUP)
  const [userSecret, setUserSecret] = useState('')
  const [compSecret, setCompSecret] = useState('')
  const [guess, setGuess]       = useState('')
  const [userHistory, setUserHistory] = useState([])
  const [compHistory, setCompHistory] = useState([])
  const [pool, setPool]         = useState([])
  const [compGuess, setCompGuess] = useState(null)
  const [pendingFeedback, setPendingFeedback] = useState(false)
  const [bulls, setBulls]       = useState(0)
  const [cows, setCows]         = useState(0)
  const [feedbackError, setFeedbackError] = useState('')
  const [shake, setShake]       = useState(false)
  const [setupError, setSetupError] = useState('')
  const [turn, setTurn]         = useState('user') // 'user' | 'computer'
  const inputRef = useRef()

  useEffect(() => {
    if (step === STEP.PLAY && turn === 'user') inputRef.current?.focus()
  }, [step, turn])

  function startGame() {
    if (!isValidBCGuess(userSecret)) {
      setSetupError('Enter a valid 4-digit code with no repeated digits'); return
    }
    const cs = generateBCSecret()
    setCompSecret(cs)
    const p = bcInitPool()
    setPool(p)
    setUserHistory([]); setCompHistory([])
    setGuess(''); setTurn('user')
    setPendingFeedback(false)
    setStep(STEP.PLAY)
  }

  function submitUserGuess() {
    if (!isValidBCGuess(guess)) {
      setShake(true); setTimeout(() => setShake(false), 450); return
    }
    const { bulls: b, cows: c } = calcBullsCows(guess, compSecret)
    const entry = { guess, bulls: b, cows: c, id: Date.now() }
    setUserHistory(prev => [entry, ...prev])
    setGuess('')

    if (b === 4) { setStep(STEP.WIN); return }

    setTurn('computer')
    setTimeout(() => doCompGuess(), 600)
  }

  function doCompGuess() {
    const g = bcPickGuess(pool)
    setCompGuess(g)
    setPendingFeedback(true)
    setBulls(0); setCows(0); setFeedbackError('')
  }

  function submitFeedback() {
    const b = parseInt(bulls), c = parseInt(cows)
    if (isNaN(b) || isNaN(c) || b + c > 4 || b < 0 || c < 0) {
      setFeedbackError('Invalid feedback (bulls + cows ≤ 4)'); return
    }
    const correct = calcBullsCows(compGuess, userSecret)
    if (correct.bulls !== b || correct.cows !== c) {
      setFeedbackError(`Incorrect! Correct feedback: 🐂 ${correct.bulls} · 🐄 ${correct.cows}`)
      return
    }
    setFeedbackError('')
    const entry = { guess: compGuess, bulls: b, cows: c, id: Date.now() }
    setCompHistory(prev => [entry, ...prev])

    if (b === 4) { setStep(STEP.LOSE); return }

    const newPool = bcFilterPool(pool, compGuess, b, c)
    setPool(newPool)
    setPendingFeedback(false)
    setCompGuess(null)
    setTurn('user')
  }

  function replay() {
    setStep(STEP.SETUP); setUserSecret(''); setGuess('')
    setUserHistory([]); setCompHistory([]); setSetupError('')
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text3)', padding: 4, lineHeight: 1, WebkitTapHighlightColor: 'transparent' }}>←</button>
        <div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
            🐂 Bulls & Cows · Solo
          </h1>
          {step === STEP.PLAY && (
            <p style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>
              Your guesses: {userHistory.length} · Computer guesses: {compHistory.length}
            </p>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '12px 20px 32px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {step === STEP.SETUP && (
          <div className="anim-fadeup">
            <p style={{ color: 'var(--text2)', marginBottom: 20, lineHeight: 1.55 }}>
              Set a 4-digit secret code for the computer to crack. No repeated digits!
            </p>
            <div style={{ marginBottom: 20 }}>
              <input
                value={userSecret}
                onChange={e => { setUserSecret(e.target.value.replace(/\D/g,'').slice(0,4)); setSetupError('') }}
                onKeyDown={e => e.key === 'Enter' && startGame()}
                inputMode="numeric"
                placeholder="e.g. 1234"
                maxLength={4}
                className={shake ? 'anim-shake' : ''}
                style={{
                  fontFamily: 'var(--mono)', fontSize: '2.2rem', fontWeight: 700,
                  width: '100%', textAlign: 'center', background: 'var(--bg2)',
                  border: '2px solid var(--border2)', borderRadius: 'var(--radius)',
                  color: 'var(--text)', padding: '16px', outline: 'none',
                  letterSpacing: '0.3em', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              {setupError && <p style={{ color: 'var(--danger)', fontSize: '0.88rem', marginTop: 8 }}>{setupError}</p>}
            </div>

            <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: 'var(--text3)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                ✅ Use digits 0–9 &nbsp;·&nbsp; ✅ Exactly 4 digits &nbsp;·&nbsp; ❌ No repeats
              </p>
            </div>

            <Btn onClick={startGame} variant="success" size="xl" style={{ width: '100%' }}>
              🎮 Start Duel
            </Btn>
          </div>
        )}

        {step === STEP.PLAY && (
          <div className="anim-fadeup">
            {/* Turn indicator */}
            <div style={{
              textAlign: 'center', padding: '12px 16px', borderRadius: 14, marginBottom: 16,
              background: turn === 'user' ? 'var(--accent)11' : 'var(--gold)11',
              border: `1.5px solid ${turn === 'user' ? 'var(--accent)33' : 'var(--gold)33'}`,
              color: turn === 'user' ? 'var(--accent2)' : 'var(--gold)',
              fontWeight: 700, fontSize: '0.95rem',
            }}>
              {turn === 'user' ? '➡️ Your turn — guess the computer\'s code' : '🤖 Computer\'s turn — give feedback'}
            </div>

            {/* User guessing area */}
            {turn === 'user' && !pendingFeedback && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input
                    ref={inputRef}
                    value={guess}
                    onChange={e => setGuess(e.target.value.replace(/\D/g,'').slice(0,4))}
                    onKeyDown={e => e.key === 'Enter' && submitUserGuess()}
                    inputMode="numeric" maxLength={4} placeholder="••••"
                    className={shake ? 'anim-shake' : ''}
                    style={{
                      flex: 1, fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 700,
                      textAlign: 'center', background: 'var(--bg2)', border: '2px solid var(--border2)',
                      borderRadius: 'var(--radius)', color: 'var(--text)', padding: '14px',
                      outline: 'none', letterSpacing: '0.25em', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                  />
                  <Btn onClick={submitUserGuess} variant="primary" style={{ flexShrink: 0, padding: '14px 20px' }}>Guess</Btn>
                </div>
              </div>
            )}

            {/* Computer feedback area */}
            {pendingFeedback && compGuess && (
              <div className="anim-slidein" style={{
                background: 'var(--gold)11', border: '1.5px solid var(--gold)44',
                borderRadius: 18, padding: '20px 18px', marginBottom: 20,
              }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 8, fontWeight: 600 }}>Computer guessed:</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--gold2)', letterSpacing: '0.3em', textAlign: 'center', marginBottom: 16 }}>
                  {compGuess}
                </p>
                <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 12 }}>
                  Rate this against your secret <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{userSecret}</span>:
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, justifyContent: 'center' }}>
                  {[
                    { label: '🐂 Bulls', val: bulls, set: setBulls, color: '#ef4444' },
                    { label: '🐄 Cows', val: cows, set: setCows, color: '#f59e0b' },
                  ].map(f => (
                    <div key={f.label} style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ color: f.color, fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{f.label}</p>
                      <input
                        type="number" min={0} max={4} value={f.val}
                        onChange={e => { f.set(parseInt(e.target.value) || 0); setFeedbackError('') }}
                        style={{
                          width: '70px', fontFamily: 'var(--mono)', fontSize: '1.6rem', fontWeight: 700,
                          textAlign: 'center', background: 'var(--bg2)', border: `2px solid ${f.color}44`,
                          borderRadius: 12, color: 'var(--text)', padding: '10px', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = f.color}
                        onBlur={e => e.target.style.borderColor = f.color + '44'}
                      />
                    </div>
                  ))}
                </div>
                {feedbackError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 10, textAlign: 'center' }}>{feedbackError}</p>}
                <Btn onClick={submitFeedback} variant="gold" style={{ width: '100%' }}>Submit Feedback</Btn>
              </div>
            )}

            {/* Two-column history */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <HistoryCol title="Your guesses" history={userHistory} color="var(--accent)" />
              <HistoryCol title="Computer" history={compHistory} color="var(--gold)" />
            </div>
          </div>
        )}

        {step === STEP.WIN && (
          <WinBanner
            title="You Win! 🎯"
            subtitle={`You cracked the code (${compSecret}) in ${userHistory.length} guesses!`}
            onReplay={replay} onHome={onBack}
          />
        )}

        {step === STEP.LOSE && (
          <LoseBanner
            title="Computer Wins!"
            subtitle={`Computer cracked your code (${userSecret}) in ${compHistory.length} guesses.`}
            secret={`Computer's code: ${compSecret}`}
            onReplay={replay} onHome={onBack}
          />
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

function HistoryCol({ title, history, color }) {
  return (
    <div>
      <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {history.map(h => (
          <div key={h.id} style={{
            background: color + '11', border: `1px solid ${color}22`,
            borderRadius: 10, padding: '7px 10px', marginBottom: 5, fontSize: '0.82rem',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>{h.guess}</span>
            <span style={{ display: 'block', color: 'var(--text3)', marginTop: 2 }}>
              🐂{h.bulls} · 🐄{h.cows}
            </span>
          </div>
        ))}
        {history.length === 0 && (
          <p style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '8px 0' }}>—</p>
        )}
      </div>
    </div>
  )
}
