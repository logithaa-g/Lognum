import React, { useState, useRef, useEffect } from 'react'
import { Btn, Input, Card, Badge, HistoryItem, WinBanner, LoseBanner } from '../components/UI.jsx'
import { pickSecret, getHint, hintMeta, getDirectionHint } from '../lib/gameLogic.js'

const STEP = {
  SETUP: 'setup',
  PLAY: 'play',
  WIN: 'win',
  GAVE_UP: 'gaveup',
}

export default function NumGuessSolo({ onBack }) {
  const [step, setStep] = useState(STEP.SETUP)
  const [lo, setLo] = useState('1')
  const [hi, setHi] = useState('100')
  const [secret, setSecret] = useState(null)
  const [guess, setGuess] = useState('')
  const [history, setHistory] = useState([])
  const [lastHint, setLastHint] = useState(null)
  const [shakeInput, setShakeInput] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    if (step === STEP.PLAY) inputRef.current?.focus()
  }, [step])

  function startGame() {
    const l = parseInt(lo), h = parseInt(hi)
    if (isNaN(l) || isNaN(h) || l >= h || l < 0 || h > 1_000_000) {
      triggerShake(); return
    }
    setSecret(pickSecret(l, h))
    setHistory([])
    setLastHint(null)
    setGuess('')
    setStep(STEP.PLAY)
  }

  function triggerShake() {
    setShakeInput(true)
    setTimeout(() => setShakeInput(false), 450)
  }

  function submitGuess() {
    const n = parseInt(guess)
    const l = parseInt(lo), h = parseInt(hi)
    if (isNaN(n) || n < l || n > h) { triggerShake(); return }

    const hint = getHint(n, secret)
    const dir  = getDirectionHint(n, secret)
    const meta = hintMeta[hint]

    setHistory(prev => [{ who: 'You', guess: n, hint: meta, direction: dir, id: Date.now() }, ...prev])
    setLastHint({ ...meta, direction: dir })
    setGuess('')
    inputRef.current?.focus()

    if (hint === 'exact') setStep(STEP.WIN)
  }

  function giveUp() {
    setStep(STEP.GAVE_UP)
  }

  function replay() {
    setStep(STEP.SETUP)
    setGuess('')
    setHistory([])
    setLastHint(null)
  }

  const loNum = parseInt(lo), hiNum = parseInt(hi)
  const rangeValid = !isNaN(loNum) && !isNaN(hiNum) && loNum < hiNum && loNum >= 0

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontSize: '1.4rem',
          cursor: 'pointer', color: 'var(--text3)', padding: 4, lineHeight: 1,
          WebkitTapHighlightColor: 'transparent',
        }}>←</button>
        <div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
            🔢 Number Quest · Solo
          </h1>
          {step === STEP.PLAY && (
            <p style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>
              Range: {lo}–{hi} · {history.length} guess{history.length !== 1 ? 'es' : ''}
            </p>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '12px 20px 32px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {/* SETUP */}
        {step === STEP.SETUP && (
          <div className="anim-fadeup">
            <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: '1rem' }}>
              Set the number range for your game:
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>
                  FROM
                </label>
                <input
                  value={lo} onChange={e => setLo(e.target.value)}
                  type="number" inputMode="numeric"
                  className={shakeInput ? 'anim-shake' : ''}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '1.4rem', fontWeight: 700,
                    width: '100%', textAlign: 'center', background: 'var(--bg2)',
                    border: '2px solid var(--border2)', borderRadius: 'var(--radius)',
                    color: 'var(--text)', padding: '14px 12px', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>
                  TO
                </label>
                <input
                  value={hi} onChange={e => setHi(e.target.value)}
                  type="number" inputMode="numeric"
                  className={shakeInput ? 'anim-shake' : ''}
                  onKeyDown={e => e.key === 'Enter' && startGame()}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '1.4rem', fontWeight: 700,
                    width: '100%', textAlign: 'center', background: 'var(--bg2)',
                    border: '2px solid var(--border2)', borderRadius: 'var(--radius)',
                    color: 'var(--text)', padding: '14px 12px', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {[[1,10],[1,100],[1,1000],[1,10000]].map(([a,b]) => (
                <button key={b} onClick={() => { setLo(String(a)); setHi(String(b)) }}
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--border2)',
                    borderRadius: 10, padding: '7px 14px', fontSize: '0.85rem',
                    color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)22'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
                >
                  1–{b.toLocaleString()}
                </button>
              ))}
            </div>

            <Btn onClick={startGame} variant="primary" size="xl" style={{ width: '100%' }} disabled={!rangeValid}>
              🎮 Start Game
            </Btn>
          </div>
        )}

        {/* PLAY */}
        {step === STEP.PLAY && (
          <div className="anim-fadeup">
            {/* Hint display */}
            <div style={{
              textAlign: 'center', padding: '20px 16px',
              background: lastHint ? lastHint.color + '18' : 'var(--bg2)',
              border: `1.5px solid ${lastHint ? lastHint.color + '44' : 'var(--border)'}`,
              borderRadius: 18, marginBottom: 20, transition: 'all 0.3s',
              minHeight: 90, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {lastHint ? (
                <>
                  <div style={{ fontSize: '2rem', lineHeight: 1 }}>{lastHint.emoji}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: lastHint.color, marginTop: 4 }}>
                    {lastHint.label}
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: 2 }}>
                    {lastHint.direction}
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text3)' }}>Make your first guess!</p>
              )}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                ref={inputRef}
                value={guess}
                onChange={e => setGuess(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && submitGuess()}
                inputMode="numeric"
                placeholder={`${lo}–${hi}`}
                className={shakeInput ? 'anim-shake' : ''}
                style={{
                  flex: 1, fontFamily: 'var(--mono)', fontSize: '1.6rem', fontWeight: 700,
                  textAlign: 'center', background: 'var(--bg2)', border: '2px solid var(--border2)',
                  borderRadius: 'var(--radius)', color: 'var(--text)', padding: '14px 12px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <Btn onClick={submitGuess} variant="primary" style={{ flexShrink: 0, padding: '14px 20px' }}>
                Guess
              </Btn>
            </div>

            <Btn onClick={giveUp} variant="ghost" size="sm" style={{ width: '100%', marginBottom: 24 }}>
              Give up & reveal
            </Btn>

            {/* History */}
            {history.length > 0 && (
              <div>
                <p style={{ color: 'var(--text3)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Guess History
                </p>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {history.map((h, i) => (
                    <HistoryItem key={h.id} {...h} isNew={i === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WIN */}
        {step === STEP.WIN && (
          <WinBanner
            title="You cracked it! 🎯"
            subtitle={`The number was ${secret}. Solved in ${history.length} guess${history.length !== 1 ? 'es' : ''}!`}
            onReplay={replay} onHome={onBack}
          />
        )}

        {/* GAVE UP */}
        {step === STEP.GAVE_UP && (
          <LoseBanner
            title="Better luck next time!"
            subtitle={`You gave up after ${history.length} guess${history.length !== 1 ? 'es' : ''}.`}
            secret={secret}
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
