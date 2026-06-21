import { useState } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import StatusBar from '../components/StatusBar'
import { useAuth } from '../context/AuthContext'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export default function Login() {
  const { signInWithPin } = useAuth()
  const [companyCode] = useState('SAN-ANT')
  const [email, setEmail] = useState('maria.santos@sanantonio.ph')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function attempt(nextPin) {
    setBusy(true)
    setError('')
    try {
      await signInWithPin(email.trim(), nextPin)
      // success — AuthProvider flips the app to the shell
    } catch (e) {
      setError('Incorrect PIN. Try again.')
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  function press(k) {
    if (busy) return
    if (k === 'del') {
      setPin((p) => p.slice(0, -1))
      setError('')
      return
    }
    if (k === '') return
    setPin((p) => {
      if (p.length >= 6) return p
      const next = p + k
      if (next.length === 6) attempt(next)
      return next
    })
  }

  return (
    <PhoneFrame bg="#fafaf9">
      <StatusBar fg="#131312" />
      <div className="flex-1 flex flex-col px-7 pt-[14px] pb-9 animate-fadeIn overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center mt-[14px] mb-[30px]">
          <div className="w-16 h-16 rounded-[20px] bg-orange flex items-center justify-center shadow-[0_8px_20px_rgba(242,92,31,0.34)] mb-[18px]">
            <span className="text-white text-[30px] font-extrabold">S</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight">SiteForce</div>
          <div className="text-sm text-muted mt-1">Enter your 6-digit PIN</div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="border-[1.5px] border-stroke rounded-[14px] px-[15px] py-[13px] text-sm text-muted bg-white flex justify-between">
            Company code <span className="text-ink font-semibold">{companyCode}</span>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            className="border-[1.5px] border-stroke rounded-[14px] px-[15px] py-[13px] text-sm text-ink bg-white outline-none focus:border-orange"
          />
        </div>

        <div className="flex justify-center gap-[13px] mb-[26px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[14px] h-[14px] rounded-full"
              style={{
                background: i < pin.length ? '#f25c1f' : 'transparent',
                border: i < pin.length ? 'none' : '1.5px solid #c2c2bd',
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
                    ? 'h-[58px] border-none rounded-2xl bg-transparent text-xl text-muted disabled:opacity-50'
                    : 'h-[58px] border-none rounded-2xl bg-white text-[23px] font-semibold shadow-[0_1px_2px_rgba(10,10,9,0.06)] active:scale-95 transition-transform disabled:opacity-50'
                }
              >
                {k === 'del' ? '⌫' : k}
              </button>
            )
          )}
        </div>

        <div className="text-center text-xs mt-[18px] min-h-[18px]" style={{ color: error ? '#e04444' : '#9b9b96' }}>
          {busy ? 'Verifying…' : error || 'Demo PIN for Maria Santos: 417417'}
        </div>
      </div>
    </PhoneFrame>
  )
}
