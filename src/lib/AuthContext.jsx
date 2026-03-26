import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, onAuthChange, getProfile } from '../lib/supabase.js'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(undefined) // undefined=loading
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    // initial session
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_e, sess) => {
      setSession(sess)
      if (sess) loadProfile(sess.user.id)
      else { setProfile(null); setLoading(false) }
    }) ?? { data: { subscription: { unsubscribe: () => {} } } }

    return () => subscription?.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    try {
      const p = await getProfile(uid)
      setProfile(p)
    } catch { setProfile(null) }
    setLoading(false)
  }

  function refreshProfile() {
    if (session?.user) loadProfile(session.user.id)
  }

  return (
    <Ctx.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
