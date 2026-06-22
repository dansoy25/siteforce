import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const [companyCode, setCompanyCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password, companyCode)
    } catch (err) {
      setError(
        err?.name === 'CompanyCodeError'
          ? "Company code doesn't match this account."
          : 'Invalid company code, email, or password.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-page flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[1180px] md:h-[720px] bg-white rounded-2xl overflow-hidden shadow-[0_18px_44px_rgba(10,10,9,0.18)] flex">
        {/* Hero */}
        <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 text-white"
             style={{ background: 'radial-gradient(circle at 30% 20%, #2A2A27, #0A0A09)' }}>
          <div className="flex items-center gap-3">
            <BrandLogo
              imgClass="h-14 w-auto object-contain bg-white rounded-xl p-1.5"
              fallback={<div className="w-[42px] h-[42px] rounded-[13px] bg-orange flex items-center justify-center text-[21px] font-extrabold">J</div>}
            />
            <div className="leading-tight">
              <div className="text-xl font-extrabold">Jaway Construction Services Inc.</div>
              <div className="text-[11px] text-white/45">Designed and Developed By TingSync</div>
            </div>
          </div>
          <div>
            <div className="text-[34px] font-extrabold tracking-tight leading-tight max-w-[420px]">
              Workforce, attendance &amp; payroll in one place.
            </div>
            <div className="text-white/60 text-[15px] mt-4 max-w-[380px]">
              Attendance flows straight into automatic Philippine payroll.
            </div>
            <div className="flex gap-7 mt-7">
              <div>
                <div className="text-[#FF9963] text-[26px] font-extrabold tnum">7</div>
                <div className="text-white/55 text-[13px]">employees</div>
              </div>
              <div>
                <div className="text-[#FF9963] text-[26px] font-extrabold tnum">3</div>
                <div className="text-white/55 text-[13px]">active sites</div>
              </div>
            </div>
          </div>
          <div className="text-white/40 text-[13px]">© 2026 Jaway Construction Services Inc. · Iloilo City, PH</div>
        </div>

        {/* Form */}
        <div className="w-full lg:w-[480px] flex flex-col justify-center p-8 sm:p-14">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <BrandLogo
              imgClass="h-12 w-auto object-contain"
              fallback={<div className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center text-lg font-extrabold text-white">J</div>}
            />
            <div className="leading-tight">
              <div className="text-lg font-extrabold">Jaway Construction Services Inc.</div>
              <div className="text-[10px] text-faint">Designed and Developed By TingSync</div>
            </div>
          </div>
          <div className="text-[26px] font-extrabold tracking-tight">Welcome back</div>
          <div className="text-[15px] text-muted mt-1.5 mb-8">Sign in to the admin console.</div>

          <form onSubmit={submit}>
            <label className="text-[13px] font-semibold text-ink-soft mb-1.5 block">Company code</label>
            <input
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="e.g. SAN-ANT"
              className="w-full border-[1.5px] border-stroke rounded-[14px] px-4 py-[14px] text-[15px] mb-[18px] outline-none focus:border-orange placeholder:text-faint uppercase"
            />
            <label className="text-[13px] font-semibold text-ink-soft mb-1.5 block">Work email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@company.ph"
              className="w-full border-[1.5px] border-stroke rounded-[14px] px-4 py-[14px] text-[15px] mb-[18px] outline-none focus:border-orange placeholder:text-faint"
            />
            <label className="text-[13px] font-semibold text-ink-soft mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full border-[1.5px] border-stroke rounded-[14px] px-4 py-[14px] text-[15px] mb-2 outline-none focus:border-orange"
            />
            <div className="min-h-[20px] mb-3 text-[13px]" style={{ color: error ? '#e04444' : '#9b9b96' }}>
              {error || 'Use your administrator account.'}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full border-none bg-orange text-white text-base font-semibold py-[15px] rounded-[14px] shadow-[0_6px_16px_rgba(242,92,31,0.28)] disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <a href={import.meta.env.BASE_URL} className="text-center text-[13px] text-muted mt-5 hover:text-orange">
            ← Back to employee app
          </a>
        </div>
      </div>
    </div>
  )
}
