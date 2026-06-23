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
          : 'Invalid company code, username, or password.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center p-4 md:p-6"
      style={{ background: 'linear-gradient(131deg, #fcf1df 67%, #22408a 95%)' }}
    >
      <div className="w-full max-w-[1180px] md:h-[720px] bg-white rounded-[16px] overflow-hidden shadow-[0_18px_44px_rgba(10,10,9,0.25)] flex">
        {/* LEFT — dark hero */}
        <div
          className="hidden lg:flex flex-[1.55] relative flex-col justify-between p-14 text-white overflow-hidden"
          style={{ background: 'radial-gradient(120% 120% at 22% 22%, #74746f 0%, #4d4d55 46%, #393a49 69%, #26263c 92%)' }}
        >
          <BrandLogo imgClass="h-[72px] w-auto object-contain self-start" fallback={<div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center font-extrabold text-xl">J</div>} />

          <div>
            <h1 className="font-['Hedvig_Letters_Sans'] text-[40px] leading-tight max-w-[440px] mb-7">
              Jaway Construction Services Incorporated
            </h1>
            <div className="font-extrabold text-[34px] leading-[1.15] tracking-[-0.02em] max-w-[420px]">
              Workforce, attendance &amp; payroll in one place.
            </div>
            <div className="text-white/60 text-[16px] mt-4 max-w-[400px] leading-relaxed">
              Attendance flows straight into automatic Philippine payroll — SSS, PhilHealth,
              Pag-IBIG and tax computed for you.
            </div>
            <div className="flex gap-9 mt-8">
              <div>
                <div className="text-[#7cc04a] text-[26px] font-extrabold tnum leading-none">239</div>
                <div className="text-white/55 text-[13px] mt-1">employees</div>
              </div>
              <div>
                <div className="text-[#22c98a] text-[26px] font-extrabold tnum leading-none">12</div>
                <div className="text-white/55 text-[13px] mt-1">active sites</div>
              </div>
            </div>
          </div>

          <div className="text-white/40 text-[13px]">© 2026 Jaway Construction Services Incorporated</div>
        </div>

        {/* RIGHT — form on cream */}
        <div
          className="w-full lg:w-[540px] flex flex-col items-center justify-center p-8 sm:p-12"
          style={{ background: 'linear-gradient(150deg, #fdf4e3 55%, #dfe6f7 130%)' }}
        >
          <BrandLogo
            imgClass="h-[84px] w-auto object-contain mb-2"
            fallback={<div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center font-extrabold text-xl text-white">J</div>}
          />
          <div className="text-[26px] sm:text-[30px] font-bold text-ink text-center leading-tight">
            Jaway Construction Services System
          </div>
          <div className="text-center mt-2 mb-7">
            <div className="text-[15px] text-ink">Sign in to the admin console.</div>
            <div className="text-[10px] text-muted">Designed &amp; Developed By TingSync</div>
          </div>

          <form onSubmit={submit} className="w-full max-w-[412px]">
            <input
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Company Code"
              className="w-full text-center border border-stroke rounded-[14px] px-4 py-[13px] text-[15px] mb-3 bg-white/70 shadow-[0_4px_4px_rgba(0,0,0,0.06)] outline-none focus:border-brand uppercase placeholder:text-[#5e5e48] placeholder:normal-case"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Username (work email)"
              className="w-full text-center border border-stroke rounded-[14px] px-4 py-[13px] text-[15px] mb-4 bg-white/70 shadow-[0_4px_4px_rgba(0,0,0,0.06)] outline-none focus:border-brand placeholder:text-[#5e5e48]"
            />
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[13px] font-semibold text-ink-soft">Password</label>
              <span className="text-[13px] text-ink-soft">Forgot?</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full text-center border border-stroke rounded-[14px] px-4 py-[13px] text-[18px] tracking-[3px] mb-2 bg-white/70 shadow-[0_4px_4px_rgba(0,0,0,0.06)] outline-none focus:border-brand placeholder:text-ink"
            />
            <div className="min-h-[20px] mb-2 text-[13px] text-center" style={{ color: error ? '#e04444' : '#9b9b96' }}>
              {error || 'Use your administrator account.'}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full text-white text-base font-semibold py-[14px] rounded-[14px] shadow-[0_6px_8px_rgba(85,85,79,0.35)] disabled:opacity-60"
              style={{ background: 'linear-gradient(to bottom, #83a4f8, #031c5b)' }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="text-center text-[13px] text-ink mt-4">Protected by TingSync</div>
          </form>

          <a href={import.meta.env.BASE_URL} className="text-center text-[13px] text-muted mt-5 hover:text-brand">
            ← Back to employee app
          </a>
        </div>
      </div>
    </div>
  )
}
