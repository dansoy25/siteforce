import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fetchProfile, logActivity } from '../lib/api'

// Thrown when the entered company code doesn't match the account's organization.
export class CompanyCodeError extends Error {
  constructor() {
    super('company-code-mismatch')
    this.name = 'CompanyCodeError'
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    try {
      const p = await fetchProfile(userId)
      setProfile(p)
    } catch (e) {
      console.error('Failed to load profile', e)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      if (sess?.user) {
        await loadProfile(sess.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  // Sign in with a company code gate. `password` is the 6-digit PIN for
  // employees, or the account password for admins. The company code must match
  // the account's organization, otherwise we immediately sign back out.
  const signIn = useCallback(async (email, password, companyCode) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Verify the company code against the account's org (session is now active).
    const p = await fetchProfile(data.user.id)
    const entered = (companyCode || '').trim().toUpperCase()
    const actual = (p?.organization?.code || '').toUpperCase()
    if (!entered || entered !== actual) {
      await supabase.auth.signOut()
      throw new CompanyCodeError()
    }

    setProfile(p)
    logActivity({
      orgId: p.org_id,
      actorId: p.id,
      actorName: p.full_name,
      type: 'login',
    })
    return data
  }, [])

  // Back-compat alias (employee PIN sign-in).
  const signInWithPin = signIn

  const signOut = useCallback(async () => {
    // Best-effort logout event before the session is torn down.
    if (profile) {
      await logActivity({
        orgId: profile.org_id,
        actorId: profile.id,
        actorName: profile.full_name,
        type: 'logout',
      })
    }
    await supabase.auth.signOut()
    setProfile(null)
  }, [profile])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signInWithPin, signIn, signOut, refreshProfile, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
