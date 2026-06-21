// Fake iOS-style status bar. `fg` is the foreground color, `bg` an optional band.
export default function StatusBar({ fg = '#131312', bg }) {
  return (
    <div
      className="flex justify-between items-center px-[26px] pt-[14px] pb-[6px] text-sm font-semibold shrink-0"
      style={{ color: fg, background: bg }}
    >
      <span className="tnum">9:41</span>
      <span style={{ letterSpacing: '2px' }}>●●● ▮</span>
    </div>
  )
}
