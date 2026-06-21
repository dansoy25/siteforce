export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed bottom-[30px] left-1/2 z-[100] flex items-center gap-3 bg-ink text-white rounded-[14px] px-[18px] py-[14px] shadow-[0_18px_44px_rgba(10,10,9,0.28)] animate-toastIn">
      <div className="w-[26px] h-[26px] rounded-full bg-green flex items-center justify-center text-sm text-white">
        ✓
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
