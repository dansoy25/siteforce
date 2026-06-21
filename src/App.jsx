import { useAuth } from './context/AuthContext'
import Login from './screens/Login'
import Shell from './Shell'
import AdminLogin from './admin/AdminLogin'
import AdminShell from './admin/AdminShell'

function Splash() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-page">
      <div className="w-[68px] h-[68px] rounded-[20px] bg-orange flex items-center justify-center text-[32px] font-extrabold text-white shadow-[0_10px_28px_rgba(242,92,31,0.32)]">
        S
      </div>
      <div className="mt-4 text-sm text-muted">Loading SiteForce…</div>
    </div>
  )
}

function NotAuthorized({ onSignOut }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-page px-6 text-center">
      <div className="text-2xl font-extrabold mb-2">Admin access only</div>
      <div className="text-sm text-muted max-w-sm mb-6">
        This account isn’t an administrator. Use the employee app instead, or sign in with an
        admin account.
      </div>
      <div className="flex gap-3">
        <a href={import.meta.env.BASE_URL} className="px-4 py-2 rounded-xl bg-ink text-white text-sm font-semibold">
          Employee app
        </a>
        <button onClick={onSignOut} className="px-4 py-2 rounded-xl border border-stroke text-sm font-semibold">
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { loading, session, profile, signOut } = useAuth()
  // Works both locally (/admin) and under the GitHub Pages base (/siteforce/admin)
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.includes('/admin')

  if (loading) return <Splash />

  // ----- Web admin surface -----
  if (isAdminRoute) {
    if (!session) return <AdminLogin />
    if (!profile) return <Splash />
    if (!profile.is_admin) return <NotAuthorized onSignOut={signOut} />
    return <AdminShell />
  }

  // ----- Employee mobile surface -----
  if (!session) return <Login />
  if (!profile) return <Splash />
  return <Shell />
}
