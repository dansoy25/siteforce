// Fake iOS-style status bar. `fg` is the foreground color, `bg` an optional band.
// When `onLogout` is provided, a small always-visible logout button is shown.
export default function StatusBar({ fg = '#131312', bg, onLogout }) {
  return (
    <div
      className="flex justify-between items-center px-[26px] pt-[14px] pb-[6px] text-sm font-semibold shrink-0"
      style={{ color: fg, background: bg }}
    >
      <span className="tnum">9:41</span>
      <div className="flex items-center gap-3">
        <span style={{ letterSpacing: '2px' }}>●●● ▮</span>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="border-none bg-transparent p-0 flex items-center"
            style={{ color: fg }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
