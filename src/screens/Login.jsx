import { useState, useEffect } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export default function Login() {
  const { signIn } = useAuth()
  const [companyCode, setCompanyCode] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const ready = companyCode.trim() && email.trim()

  async function attempt(nextPin) {
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), nextPin, companyCode)
      // success — AuthProvider flips the app to the shell
    } catch (e) {
      setError(
        e?.name === 'CompanyCodeError'
          ? "Company code doesn't match this account."
          : 'Incorrect company code, email, or PIN.'
      )
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  // Auto-submit once 6 digits are entered (kept out of the setState updater so
  // React StrictMode's double-invocation can't trigger a double sign-in).
  useEffect(() => {
    if (pin.length === 6 && !busy) attempt(pin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  function press(k) {
    if (busy) return
    if (k === 'del') {
      setPin((p) => p.slice(0, -1))
      setError('')
      return
    }
    if (k === '') return
    if (!ready) {
      setError('Enter your company code and email first.')
      return
    }
    setPin((p) => (p.length >= 6 ? p : p + k))
  }

  // Multicolor PIN dots, matching the Figma mobile login.
  const DOT_COLORS = ['#facc15', '#ec4899', '#ef4444', '#22c55e', '#3b82f6', '#a855f7']

  return (
    <PhoneFrame bg="linear-gradient(180deg, #fdf4e3 0%, #f3ecdb 26%, #6f93ec 72%, #1e44b0 100%)">
      <div className="flex-1 flex flex-col px-7 pt-9 pb-9 animate-fadeIn overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center mt-[14px] mb-[30px]">
          <BrandLogo
            imgClass="max-h-[120px] w-auto object-contain mb-3"
            fallback={
              <div className="w-16 h-16 rounded-[20px] bg-brand flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.34)] mb-[18px]">
                <span className="text-white text-[30px] font-extrabold">J</span>
              </div>
            }
          />
          <div className="text-xl font-extrabold tracking-tight text-center">Jaway Construction Services Inc.</div>
          <div className="text-xs text-faint mt-1">Designed and Developed By TingSync</div>
          <div className="text-sm text-muted mt-4">Enter your 6-digit PIN</div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            value={companyCode}
            onChange={(e) => { setCompanyCode(e.target.value); setError('') }}
            placeholder="Company code (e.g. SAN-ANT)"
            spellCheck={false}
            autoCapitalize="characters"
            className="border border-stroke rounded-[14px] px-[15px] py-[14px] text-sm text-ink bg-white shadow-[0_4px_10px_rgba(10,10,9,0.08)] outline-none focus:border-brand placeholder:text-faint uppercase"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="Username (work email)"
            spellCheck={false}
            autoCapitalize="none"
            className="border border-stroke rounded-[14px] px-[15px] py-[14px] text-sm text-ink bg-white shadow-[0_4px_10px_rgba(10,10,9,0.08)] outline-none focus:border-brand placeholder:text-faint"
          />
        </div>

        <div className="flex justify-center gap-[13px] mb-[26px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[15px] h-[15px] rounded-full transition-colors"
              style={{
                background: i < pin.length ? DOT_COLORS[i] : 'rgba(255,255,255,0.55)',
                border: i < pin.length ? 'none' : '1.5px solid rgba(120,120,111,0.5)',
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-[13px]">
          {KEYS.map((k, idx) =>
            k === '' ? (
              <div key={idx} />
            ) : (
              <button
                key={idx}
                onClick={() => press(k)}
                disabled={busy}
                className={
                  k === 'del'
                    ? 'h-[58px] border-none rounded-2xl bg-transparent text-xl text-ink/70 disabled:opacity-50'
                    : 'h-[58px] border-none rounded-2xl bg-white text-[23px] font-semibold shadow-[0_4px_10px_rgba(10,10,9,0.12)] active:scale-95 transition-transform disabled:opacity-50'
                }
              >
                {k === 'del' ? '⌫' : k}
              </button>
            )
          )}
        </div>

        <div className="text-center text-xs mt-[18px] min-h-[18px] font-medium" style={{ color: error ? '#fecaca' : 'rgba(255,255,255,0.85)' }}>
          {busy ? 'Verifying…' : error || 'Enter your company code, username & 6-digit PIN'}
        </div>
      </div>
    </PhoneFrame>
  )
}
