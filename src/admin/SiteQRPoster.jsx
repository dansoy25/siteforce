import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

// A4-ish poster for a single site that includes a big QR (encoding the
// sites.qr_payload — the same value the mobile check-in expects), the site's
// name and address, and step-by-step instructions for the worker. Printable
// with the browser's print dialog.
export default function SiteQRPoster({ site }) {
  const canvasRef = useRef(null)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!site?.qr_payload) return
    QRCode.toCanvas(canvasRef.current, site.qr_payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 380,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(console.error)
    QRCode.toDataURL(site.qr_payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 800,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setDataUrl)
  }, [site?.qr_payload])

  if (!site) return null

  function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${site.name.replace(/\s+/g, '-').toLowerCase()}-gate-qr.png`
    a.click()
  }

  return (
    <div id="qr-poster-printable" className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(10,10,9,0.08)] p-8 print:shadow-none print:p-12 max-w-[680px] mx-auto">
      {/* On-screen toolbar (hidden on print) */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <button
          onClick={download}
          className="border-[1.5px] border-stroke bg-white text-ink-soft text-sm font-semibold px-4 py-2 rounded-xl"
        >
          ⤓ Download PNG
        </button>
        <button
          onClick={() => window.print()}
          className="border-none bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl"
        >
          🖨 Print poster
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-5 mb-7">
        <div className="flex items-center gap-3">
          <img src={import.meta.env.BASE_URL + 'logo.png'} alt="" className="h-14 w-auto" />
          <div>
            <div className="text-lg font-extrabold leading-tight">Jaway Construction Services Inc.</div>
            <div className="text-xs text-muted">Worker check-in gate</div>
          </div>
        </div>
        <div className="text-right text-[11px] font-bold tracking-wide uppercase text-brand">Site QR</div>
      </div>

      {/* QR + side info */}
      <div className="flex flex-col md:flex-row gap-7 items-center md:items-start">
        <div className="rounded-2xl border-[3px] border-ink p-3 bg-white shrink-0">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="text-[11px] uppercase font-bold text-muted tracking-wide">Site</div>
          <div className="text-[28px] font-extrabold leading-tight">{site.name}</div>
          {site.address && <div className="text-sm text-ink-soft mt-1">{site.address}</div>}
          <div className="mt-6 inline-block border border-stroke rounded-xl px-4 py-3 text-left">
            <div className="text-[11px] uppercase font-bold text-muted tracking-wide mb-1">How to check in</div>
            <ol className="text-sm leading-relaxed list-decimal pl-5">
              <li>Open the Jaway app on your phone.</li>
              <li>Tap <span className="font-semibold">Clock in</span>.</li>
              <li>Point your camera at this QR code.</li>
              <li>Confirm your location & verify your face.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-5 border-t border-stroke text-[11px] text-faint flex justify-between">
        <div>Geofence radius: <span className="tnum">{site.radius_m} m</span></div>
        <div className="tnum">{site.qr_payload}</div>
      </div>
    </div>
  )
}
