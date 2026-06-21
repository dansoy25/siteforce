// Renders content full-screen on real phones, and inside a centered device
// mock-up on larger screens. `bg` sets the shell background for the active screen.
export default function PhoneFrame({ children, bg = '#fafaf9' }) {
  return (
    <div className="min-h-[100dvh] w-full flex items-stretch md:items-center justify-center bg-page md:py-8">
      <div className="relative w-full h-[100dvh] md:h-[844px] md:max-h-[calc(100dvh-4rem)] md:w-[392px] overflow-hidden md:rounded-[48px] md:border-[11px] md:border-ink md:shadow-[0_22px_60px_rgba(10,10,9,0.30)]">
        <div
          className="w-full h-full overflow-hidden flex flex-col md:rounded-[38px]"
          style={{ background: bg }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
