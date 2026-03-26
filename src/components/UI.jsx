import React from 'react'

// ── Button ─────────────────────────────────────────────────────
const VARS = {
  primary:   { bg: 'var(--accent)',  color: '#fff',           shadow: '0 4px 16px rgba(108,60,247,.35)' },
  secondary: { bg: 'var(--card2)',   color: 'var(--text)',    border: '1.5px solid var(--border2)' },
  gold:      { bg: 'linear-gradient(135deg,#f5a623,#ffc842)', color: '#1a0a00', shadow: '0 4px 16px rgba(245,166,35,.35)' },
  green:     { bg: 'var(--green)',   color: '#fff',           shadow: '0 4px 16px rgba(16,185,129,.3)' },
  danger:    { bg: 'var(--red)',     color: '#fff' },
  ghost:     { bg: 'transparent',   color: 'var(--accent)',  border: '1.5px solid var(--border2)' },
}
const SIZES = {
  sm: { padding: '8px 16px',  fontSize: '0.88rem' },
  md: { padding: '12px 24px', fontSize: '1rem'    },
  lg: { padding: '15px 32px', fontSize: '1.05rem' },
  xl: { padding: '17px 0',    fontSize: '1.1rem', width: '100%' },
}

export function Btn({ children, onClick, variant='primary', size='md', disabled, style, type='button' }) {
  const v = VARS[variant] || VARS.primary
  const s = SIZES[size]
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
      fontFamily:'var(--font)', fontWeight:600, letterSpacing:'0.01em', borderRadius:'var(--r)',
      border: v.border || 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: v.bg, color: v.color, boxShadow: v.shadow,
      opacity: disabled ? .5 : 1, transition:'all .18s ease',
      WebkitTapHighlightColor:'transparent', userSelect:'none',
      ...s, ...style,
    }}
      onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.transform='translateY(-2px) scale(1.02)' }}}
      onMouseLeave={e=>{ e.currentTarget.style.transform='' }}
      onMouseDown={e=>{ if(!disabled) e.currentTarget.style.transform='scale(.97)' }}
    >{children}</button>
  )
}

// ── TextInput ──────────────────────────────────────────────────
export function TextInput({ value, onChange, onKeyDown, placeholder, type='text',
  autoFocus, disabled, maxLength, inputMode, label, error, style }) {
  return (
    <div style={{ width:'100%' }}>
      {label && <label style={{ display:'block', color:'var(--text3)', fontSize:'.8rem',
        fontWeight:600, marginBottom:5, letterSpacing:'.04em' }}>{label}</label>}
      <input
        value={value} onChange={onChange} onKeyDown={onKeyDown}
        placeholder={placeholder} type={type} autoFocus={autoFocus}
        disabled={disabled} maxLength={maxLength} inputMode={inputMode}
        style={{
          width:'100%', fontFamily:'var(--font)', fontSize:'1rem', fontWeight:500,
          background:'var(--bg2)', border:`2px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
          borderRadius:'var(--r)', color:'var(--text)', padding:'13px 16px',
          outline:'none', transition:'border-color .2s, box-shadow .2s',
          ...style,
        }}
        onFocus={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px rgba(108,60,247,.15)' }}
        onBlur={e=>{ e.target.style.borderColor=error?'var(--red)':'var(--border2)'; e.target.style.boxShadow='none' }}
      />
      {error && <p style={{ color:'var(--red)', fontSize:'.82rem', marginTop:5 }}>{error}</p>}
    </div>
  )
}

// ── MonoInput (big digit input) ────────────────────────────────
export function MonoInput({ value, onChange, onKeyDown, placeholder, maxLength,
  inputMode='numeric', disabled, shake, autoFocus, style }) {
  return (
    <input
      value={value} onChange={onChange} onKeyDown={onKeyDown}
      placeholder={placeholder} maxLength={maxLength}
      inputMode={inputMode} disabled={disabled} autoFocus={autoFocus}
      className={shake ? 'shake' : ''}
      style={{
        fontFamily:'var(--mono)', fontSize:'2rem', fontWeight:700,
        width:'100%', textAlign:'center', background:'var(--bg2)',
        border:'2.5px solid var(--border2)', borderRadius:'var(--r)',
        color:'var(--text)', padding:'14px 12px', outline:'none',
        letterSpacing:'.18em', transition:'border-color .2s, box-shadow .2s',
        ...style,
      }}
      onFocus={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px rgba(108,60,247,.15)' }}
      onBlur={e=>{ e.target.style.borderColor='var(--border2)'; e.target.style.boxShadow='none' }}
    />
  )
}

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ size=22 }) {
  return <div style={{
    width:size, height:size, borderRadius:'50%',
    border:'3px solid var(--border2)', borderTopColor:'var(--accent)',
    animation:'spin .75s linear infinite', flexShrink:0,
  }}/>
}

// ── PageShell (header + scrollable content) ────────────────────
export function PageShell({ title, onBack, badge, children, footer=true }) {
  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto', width:'100%' }}>
      <header style={{ padding:'env(safe-area-inset-top,16px) 20px 12px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer',
            color:'var(--text3)', padding:'4px 6px', lineHeight:1, borderRadius:8,
            WebkitTapHighlightColor:'transparent', flexShrink:0,
          }}>←</button>
        )}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:10 }}>
          <h1 style={{ fontFamily:'var(--font)', fontSize:'1.25rem', fontWeight:700, color:'var(--text)' }}>
            {title}
          </h1>
          {badge}
        </div>
      </header>
      <main style={{ flex:1, padding:'4px 20px 24px', overflowY:'auto' }}>
        {children}
      </main>
      {footer && (
        <footer style={{ padding:'8px 20px 20px', textAlign:'center', flexShrink:0 }}>
          <p style={{ color:'var(--text3)', fontSize:'.73rem' }}>
            © 2025 Lognum · Developed by <span style={{ color:'var(--accent2)', fontWeight:600 }}>Logithaa G</span>
          </p>
        </footer>
      )}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'var(--card)', borderRadius:'var(--r2)',
      border:'1.5px solid var(--border)', boxShadow:'var(--shadow)',
      padding:20, cursor: onClick ? 'pointer' : 'default',
      transition: onClick ? 'all .18s ease' : 'none',
      ...style,
    }}
      onMouseEnter={e=>{ if(onClick){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow2)' }}}
      onMouseLeave={e=>{ if(onClick){ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow)' }}}
    >{children}</div>
  )
}

// ── ModeCard ───────────────────────────────────────────────────
export function ModeCard({ emoji, title, desc, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: color+'13', border:`1.5px solid ${color}35`,
      borderRadius:'var(--r2)', padding:'18px 20px', cursor:'pointer',
      transition:'all .18s ease', WebkitTapHighlightColor:'transparent',
      display:'flex', alignItems:'center', gap:14,
    }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${color}25` }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{
        width:50, height:50, borderRadius:14, background:color+'22',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'1.55rem', border:`1px solid ${color}33`, flexShrink:0,
      }}>{emoji}</div>
      <div style={{ flex:1 }}>
        <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--text)', marginBottom:3 }}>{title}</p>
        <p style={{ color:'var(--text3)', fontSize:'.88rem', lineHeight:1.4 }}>{desc}</p>
      </div>
      <span style={{ color, fontSize:'1.3rem', flexShrink:0 }}>›</span>
    </div>
  )
}

// ── Coin badge ─────────────────────────────────────────────────
export function CoinBadge({ coins }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      background:'var(--gold)22', color:'var(--gold)', border:'1px solid var(--gold)44',
      borderRadius:99, padding:'4px 12px', fontSize:'.85rem', fontWeight:700,
    }}>🪙 {coins}</span>
  )
}

// ── WinScreen / LoseScreen ─────────────────────────────────────
export function WinScreen({ secret, guesses, coinsEarned=50, onReplay, onHome }) {
  return (
    <div className="popIn" style={{ textAlign:'center', padding:'28px 8px' }}>
      <div style={{ fontSize:'3.5rem' }}>🏆</div>
      <h2 style={{ fontSize:'2rem', fontWeight:700, color:'var(--gold)', margin:'10px 0 6px' }}>You Win!</h2>
      {secret && <p style={{ color:'var(--text3)', marginBottom:4 }}>Answer: <b style={{ fontFamily:'var(--mono)', color:'var(--accent2)' }}>{secret}</b></p>}
      <p style={{ color:'var(--text2)', marginBottom:6 }}>Solved in <b>{guesses}</b> guess{guesses!==1?'es':''}</p>
      <p style={{ color:'var(--gold)', fontWeight:700, fontSize:'1.1rem', marginBottom:20 }}>+🪙 {coinsEarned} coins earned!</p>
      <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
        <Btn onClick={onReplay} variant="gold">Play Again</Btn>
        <Btn onClick={onHome}   variant="secondary">Home</Btn>
      </div>
    </div>
  )
}

export function LoseScreen({ secret, guesses, onReplay, onHome }) {
  return (
    <div className="popIn" style={{ textAlign:'center', padding:'28px 8px' }}>
      <div style={{ fontSize:'3.5rem' }}>😔</div>
      <h2 style={{ fontSize:'2rem', fontWeight:700, color:'var(--red)', margin:'10px 0 6px' }}>Better Luck!</h2>
      {secret && <p style={{ color:'var(--text2)', marginBottom:4 }}>
        Answer was <b style={{ fontFamily:'var(--mono)', color:'var(--accent2)' }}>{secret}</b>
      </p>}
      {guesses && <p style={{ color:'var(--text3)', marginBottom:20 }}>You tried {guesses} time{guesses!==1?'s':''}</p>}
      <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
        <Btn onClick={onReplay} variant="primary">Try Again</Btn>
        <Btn onClick={onHome}   variant="secondary">Home</Btn>
      </div>
    </div>
  )
}

// ── Stat tile ──────────────────────────────────────────────────
export function StatTile({ label, value, color='var(--accent)', emoji }) {
  return (
    <div style={{
      background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:'var(--r)',
      padding:'14px 10px', textAlign:'center',
    }}>
      {emoji && <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{emoji}</div>}
      <p style={{ fontSize:'1.6rem', fontWeight:700, color, lineHeight:1 }}>{value}</p>
      <p style={{ color:'var(--text3)', fontSize:'.75rem', marginTop:4, fontWeight:600 }}>{label}</p>
    </div>
  )
}
