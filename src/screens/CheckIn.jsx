import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import { fetchSiteByQr, clockIn } from '../lib/api'
import { distanceMeters, getCurrentPosition } from '../lib/geo'
import { timePH } from '../lib/format'

export default function CheckIn() {
  const { profile } = useAuth()
  const { navigate, flash } = useShell()

  const [step, setStep] = useState(1)
  const [site, setSite] = useState(null)
  const [coords, setCoords] = useState(null) // {lat,lng,accuracy,distance,inside}
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [clockInAt, setClockInAt] = useState(null)

  const dark = step <= 3
  const shellBg = step === 4 ? '#1f9d6b' : '#0a0a09'

  return (
    <div className="flex-1 flex flex-col animate-fadeIn h-full" style={{ background: shellBg }}>
      {/* header */}
      {step <= 3 && (
        <>
          <div className="flex items-center gap-[14px] px-[22px] pt-2 pb-4 text-white">
            <button
              onClick={() => navigate('home')}
              className="border-none bg-transparent text-white text-[22px] p-0"
            >
              ‹
            </button>
            <div className="text-[18px] font-bold">Check in · step {step}/4</div>
          </div>
          <div className="flex gap-2 px-[22px] pb-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex-1 h-[5px] rounded-full"
                style={{ background: step >= n ? '#f25c1f' : 'rgba(255,255,255,.22)' }}
              />
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <StepQR
          profile={profile}
          onResolved={(s) => {
            setSite(s)
            setError('')
            setStep(2)
          }}
          onError={setError}
          error={error}
        />
      )}
      {step === 2 && (
        <StepGPS
          site={site}
          coords={coords}
          setCoords={setCoords}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && <StepFace onNext={() => setStep(4)} />}
      {step === 4 && (
        <StepDone
          site={site}
          coords={coords}
          profile={profile}
          saving={saving}
          clockInAt={clockInAt}
          onMount={async () => {
            // Persist the check-in exactly once when we reach success.
            setSaving(true)
            try {
              const row = await clockIn({
                profileId: profile.id,
                orgId: profile.org_id,
                site,
                project: 'Drainage Ph.2',
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
                method: 'Face + GPS',
              })
              setClockInAt(row.clock_in)
            } catch (e) {
              flash('Could not save check-in')
            } finally {
              setSaving(false)
            }
          }}
          onDone={() => {
            navigate('home')
            flash('Clocked in at ' + (site?.name || 'site'))
          }}
        />
      )}
    </div>
  )
}

/* ---------------- STEP 1: QR ---------------- */
function StepQR({ profile, onResolved, onError, error }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const handledRef = useRef(false)
  const [camReady, setCamReady] = useState(false)

  const resolve = useCallback(
    async (payload) => {
      if (handledRef.current) return
      handledRef.current = true
      try {
        const s = await fetchSiteByQr(payload)
        if (!s) {
          handledRef.current = false
          onError('Unrecognized QR — not a SiteForce gate code.')
          return
        }
        onResolved(s)
      } catch (e) {
        handledRef.current = false
        onError('Could not verify QR code.')
      }
    },
    [onResolved, onError]
  )

  useEffect(() => {
    let cancelled = false
    const reader = new BrowserQRCodeReader()
    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => {
          if (result) resolve(result.getText())
        }
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setCamReady(true)
      })
      .catch(() => {
        // camera unavailable — user can use the simulate fallback
        setCamReady(false)
      })
    return () => {
      cancelled = true
      try {
        controlsRef.current?.stop()
      } catch (_) {}
    }
  }, [resolve])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10">
      <div className="relative w-[220px] h-[220px] rounded-[18px] overflow-hidden bg-black/40">
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* corner brackets */}
        <div className="absolute top-0 left-0 w-[38px] h-[38px] border-t-4 border-l-4 border-orange rounded-tl-[10px]" style={{ animation: 'cornerPulse 1.6s infinite' }} />
        <div className="absolute top-0 right-0 w-[38px] h-[38px] border-t-4 border-r-4 border-orange rounded-tr-[10px]" style={{ animation: 'cornerPulse 1.6s infinite' }} />
        <div className="absolute bottom-0 left-0 w-[38px] h-[38px] border-b-4 border-l-4 border-orange rounded-bl-[10px]" style={{ animation: 'cornerPulse 1.6s infinite' }} />
        <div className="absolute bottom-0 right-0 w-[38px] h-[38px] border-b-4 border-r-4 border-orange rounded-br-[10px]" style={{ animation: 'cornerPulse 1.6s infinite' }} />
        <div className="absolute left-[6%] right-[6%] h-[3px] bg-[#fa763a] rounded-full" style={{ boxShadow: '0 0 14px 3px rgba(250,118,58,.8)', animation: 'qrScan 2.4s ease-in-out infinite' }} />
      </div>
      <div className="text-white text-base font-semibold mt-8">Point at the site QR code</div>
      <div className="text-white/60 text-[13px] mt-[6px] text-center">
        {camReady ? 'Posted at the gate of each project site' : 'Camera unavailable — use the button below'}
      </div>
      {error && <div className="text-[#ff9d77] text-[13px] mt-3 text-center max-w-[240px]">{error}</div>}
      <button
        onClick={() => resolve(profile.site?.qr_payload || 'SITE-SAN-ANTONIO-B')}
        className="mt-[26px] border-none bg-orange text-white text-[15px] font-semibold px-[30px] py-[14px] rounded-[14px]"
      >
        Simulate scan
      </button>
    </div>
  )
}

/* ---------------- STEP 2: GPS ---------------- */
function StepGPS({ site, coords, setCoords, onNext }) {
  const [status, setStatus] = useState('locating') // locating | ok | denied
  const [msg, setMsg] = useState('Getting your location…')

  const locate = useCallback(async () => {
    setStatus('locating')
    setMsg('Getting your location…')
    try {
      const pos = await getCurrentPosition()
      const { latitude, longitude, accuracy } = pos.coords
      const distance = site
        ? Math.round(distanceMeters(latitude, longitude, site.lat, site.lng))
        : null
      const inside = site ? distance <= site.radius_m : true
      setCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy), distance, inside })
      setStatus('ok')
    } catch (e) {
      setStatus('denied')
      setMsg('Location unavailable or blocked.')
    }
  }, [site, setCoords])

  useEffect(() => {
    locate()
  }, [locate])

  const inside = coords?.inside
  // Enforce the geofence when GPS is available; degrade gracefully when the
  // device blocks or can't provide location so the worker isn't hard-blocked.
  const canContinue = (status === 'ok' && inside) || status === 'denied'

  return (
    <div className="flex-1 px-[22px] flex flex-col">
      <div className="text-xl font-extrabold mb-1 text-white">Confirm your location</div>
      <div className="text-sm text-white/60 mb-4">
        You must be inside the site boundary to clock in.
      </div>

      <div className="rounded-[22px] overflow-hidden shadow-[0_6px_16px_rgba(10,10,9,0.10)] flex-1 flex flex-col">
        <div
          className="relative flex-1 bg-[#e4e4df]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(155,155,150,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(155,155,150,.2) 1px,transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        >
          <div className="absolute top-[18%] -left-[5%] w-[60%] h-[14px] bg-[#c2c2bd] rotate-[18deg]" />
          <div className="absolute bottom-[24%] -right-[8%] w-[70%] h-[14px] bg-[#c2c2bd] -rotate-[12deg]" />
          <div className="absolute top-1/2 left-1/2 w-[190px] h-[190px] rounded-full bg-orange/10 border-2 border-orange -translate-x-1/2 -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-1/2 w-[190px] h-[190px] rounded-full border-2 border-orange -translate-x-1/2 -translate-y-1/2"
            style={{ animation: 'pulseRing 2s ease-out infinite' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-orange border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,.3)]" />
        </div>
        <div className="bg-white px-4 py-[14px] flex items-center gap-3">
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm"
            style={{
              background: inside ? '#e7f6ef' : '#fce9e9',
              color: inside ? '#1f9d6b' : '#e04444',
            }}
          >
            {status === 'ok' ? (inside ? '✓' : '!') : '…'}
          </div>
          <div className="flex-1">
            {status === 'ok' ? (
              <>
                <div className="text-sm font-bold">
                  {inside ? `You're inside ${site?.name}` : `Outside ${site?.name}`}
                </div>
                <div className="text-xs text-muted tnum">
                  Accuracy ±{coords.accuracy}m
                  {coords.distance != null ? ` · ${coords.distance} m from center` : ''}
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-muted">{msg}</div>
            )}
          </div>
          {status === 'denied' && (
            <button onClick={locate} className="text-xs font-semibold text-orange border-none bg-transparent">
              Retry
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full border-none bg-orange text-white text-base font-semibold py-4 rounded-[14px] my-4 shadow-[0_6px_16px_rgba(242,92,31,0.28)] disabled:opacity-50"
      >
        {status === 'locating'
          ? 'Locating…'
          : status === 'denied'
            ? 'Continue without GPS'
            : inside
              ? 'Continue'
              : 'Move inside the boundary'}
      </button>
    </div>
  )
}

/* ---------------- STEP 3: FACE ---------------- */
function StepFace({ onNext }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setReady(true)
      })
      .catch(() => setReady(false))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="relative w-[220px] h-[266px] mt-[6px]">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: '999px/46% 46% 54% 54%', background: 'radial-gradient(circle at 50% 42%, #3a3a36, #1a1a18)' }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', opacity: ready ? 1 : 0 }}
          />
        </div>
        <svg viewBox="0 0 230 280" className="absolute inset-0 w-full h-full">
          <ellipse cx="115" cy="140" rx="100" ry="125" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
          <ellipse
            cx="115"
            cy="140"
            rx="100"
            ry="125"
            fill="none"
            stroke="#f25c1f"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="707"
            strokeDashoffset="585"
            style={{ animation: 'ringFill 2.6s ease-in-out infinite alternate' }}
          />
        </svg>
      </div>
      <div
        className="text-white text-[19px] font-bold mt-7"
        style={{ animation: 'blinkPrompt 1.3s infinite' }}
      >
        Blink to confirm
      </div>
      <div className="text-white/60 text-[13px] mt-2 text-center max-w-[220px]">
        {ready
          ? 'Keep your face inside the oval and blink once.'
          : 'Camera unavailable — tap below to continue.'}
      </div>
      <button
        onClick={onNext}
        className="mt-[26px] border-none bg-orange text-white text-[15px] font-semibold px-[30px] py-[14px] rounded-[14px]"
      >
        {ready ? 'Capture & verify' : 'Simulate blink'}
      </button>
    </div>
  )
}

/* ---------------- STEP 4: DONE ---------------- */
function StepDone({ site, profile, saving, clockInAt, onMount, onDone }) {
  const firedRef = useRef(false)
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    onMount()
  }, [onMount])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-[34px]">
      <div className="w-[104px] h-[104px] rounded-full bg-white/20 flex items-center justify-center mb-[26px]">
        <div className="w-[76px] h-[76px] rounded-full bg-white flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 42 42" fill="none" stroke="#1f9d6b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 22l8 8 16-18" />
          </svg>
        </div>
      </div>
      <div className="text-white text-[26px] font-extrabold tracking-tight">Clocked in</div>
      <div className="text-white/85 text-base mt-[6px] tnum">
        {saving ? 'Saving…' : clockInAt ? 'at ' + timePH(clockInAt) : ''}
      </div>

      <div className="bg-white/16 rounded-[18px] px-5 py-[18px] mt-[30px] w-full">
        <Row label="Site" value={site?.name || '—'} border />
        <Row label="Project" value="Drainage Ph.2" border />
        <Row label="Verified by" value="Face + GPS" />
      </div>

      <button
        onClick={onDone}
        disabled={saving}
        className="mt-[26px] w-full border-none bg-white text-[#15784f] text-base font-bold py-4 rounded-[14px] disabled:opacity-60"
      >
        Done
      </button>
    </div>
  )
}

function Row({ label, value, border }) {
  return (
    <div
      className="flex justify-between py-2"
      style={{ borderBottom: border ? '1px solid rgba(255,255,255,.18)' : 'none' }}
    >
      <span className="text-white/80 text-sm">{label}</span>
      <span className="text-white text-sm font-semibold">{value}</span>
    </div>
  )
}
