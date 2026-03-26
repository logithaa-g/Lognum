import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import { isReady } from './lib/supabase.js'
import AuthPage    from './pages/AuthPage.jsx'
import Home        from './pages/Home.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NumGuess    from './pages/NumGuess.jsx'
import BullsCows   from './pages/BullsCows.jsx'

function Guard({ children }) {
  const { session, loading } = useAuth()
  // If supabase not configured, allow access without login
  if (!isReady()) return children
  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{
        width:32, height:32, borderRadius:'50%',
        border:'3px solid var(--border2)', borderTopColor:'var(--accent)',
        animation:'spin .75s linear infinite',
      }}/>
    </div>
  )
  if (!session) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Guard><Home /></Guard>} />
        <Route path="/profile" element={<Guard><ProfilePage /></Guard>} />
        <Route path="/numguess" element={<Guard><NumGuess /></Guard>} />
        <Route path="/bullscows" element={<Guard><BullsCows /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
