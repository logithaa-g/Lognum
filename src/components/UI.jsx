import React from 'react'

const s = {
  btn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontFamily: 'var(--font)', fontWeight: 600, fontSize: '1rem',
    padding: '12px 24px', borderRadius: 'var(--radius)', border: 'none',
    cursor: 'pointer', transition: 'all 0.18s ease', userSelect: 'none',
    WebkitTapHighlightColor: 'transparent', letterSpacing: '0.01em',
  },
}

export function Btn({ children, onClick, variant = 'primary', disabled, style, size = 'md', className = '' }) {
  const variants = {
    primary:  { background: 'var(--accent)',  color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' },
    secondary:{ background: 'var(--card2)',   color: 'var(--text)', border: '1.5px solid var(--border2)' },
    ghost:    { background: 'transparent',    color: 'var(--accent)', border: '1.5px solid var(--border2)' },
    danger:   { background: 'var(--danger)',  color: '#fff' },
    success:  { background: 'var(--success)', color: '#fff' },
    gold:     { background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1a1030', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' },
  }
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '0.875rem' },
    md: {},
    lg: { padding: '16px 32px', fontSize: '1.1rem' },
    xl: { padding: '18px 40px', fontSize: '1.2rem', borderRadius: 20 },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...s.btn, ...variants[variant], ...sizes[size],
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', transform: 'none' } : {}),
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
    >
      {children}
    </button>
  )
}

export function Card({ children, style, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--card)', borderRadius: 'var(--radius2)',
      border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)',
      padding: 24, ...style,
    }}>
      {children}
    </div>
  )
}

export function Input({ value, onChange, onKeyDown, placeholder, maxLength, type = 'text', disabled, style, autoFocus, inputMode }) {
  return (
    <input
      value={value} onChange={onChange} onKeyDown={onKeyDown}
      placeholder={placeholder} maxLength={maxLength} type={type}
      disabled={disabled} autoFocus={autoFocus} inputMode={inputMode}
      style={{
        fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 700,
        width: '100%', textAlign: 'center', background: 'var(--bg2)',
        border: '2px solid var(--border2)', borderRadius: 'var(--radius)',
        color: 'var(--text)', padding: '14px 16px', outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        letterSpacing: '0.15em', ...style,
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export function Badge({ children, color = 'var(--accent)', style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 99, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 600,
      ...style,
    }}>
      {children}
    </span>
  )
}

export function Spinner() {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      border: '3px solid var(--border2)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
    }} />
  )
}

export function Modal({ open, onClose, children, title }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="anim-popin" style={{
        background: 'var(--card)', borderRadius: 'var(--radius2)',
        border: '1.5px solid var(--border2)', boxShadow: 'var(--shadow2)',
        padding: 28, width: '100%', maxWidth: 420,
      }}>
        {title && <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function HistoryItem({ who, guess, bulls, cows, hint, direction, isNew }) {
  const isBullsCows = bulls !== undefined
  return (
    <div className={isNew ? 'anim-slidein' : ''} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 12,
      background: who === 'You' ? 'var(--accent)11' : 'var(--bg3)',
      border: `1px solid ${who === 'You' ? 'var(--accent)33' : 'var(--border)'}`,
      marginBottom: 6, fontSize: '0.9rem',
    }}>
      <span style={{ color: who === 'You' ? 'var(--accent2)' : 'var(--text3)', fontWeight: 600, minWidth: 40 }}>
        {who}
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
        {guess}
      </span>
      {isBullsCows ? (
        <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>
          🐂 <b>{bulls}</b> · 🐄 <b>{cows}</b>
        </span>
      ) : (
        <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
          {hint?.emoji} {direction}
        </span>
      )}
    </div>
  )
}

export function WinBanner({ title, subtitle, onReplay, onHome }) {
  return (
    <div className="anim-popin" style={{
      textAlign: 'center', padding: '32px 16px',
    }}>
      <div style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: 8 }}>🎉</div>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: '1.05rem' }}>{subtitle}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={onReplay} variant="gold">Play Again</Btn>
        <Btn onClick={onHome} variant="secondary">Home</Btn>
      </div>
    </div>
  )
}

export function LoseBanner({ title, subtitle, secret, onReplay, onHome }) {
  return (
    <div className="anim-popin" style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: 8 }}>😔</div>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 8, fontSize: '1.05rem' }}>{subtitle}</p>
      {secret && (
        <p style={{ color: 'var(--text3)', marginBottom: 24 }}>
          The answer was <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent2)', fontWeight: 700 }}>{secret}</span>
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={onReplay} variant="primary">Try Again</Btn>
        <Btn onClick={onHome} variant="secondary">Home</Btn>
      </div>
    </div>
  )
}
