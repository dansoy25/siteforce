import { useEffect, useRef, useState } from 'react'
import { fetchNotifications } from '../lib/api'
import { Avatar } from './ui'

const ICON = {
  login: '🔓', logout: '🔒', clock_in: '🟢', clock_out: '⏹',
  leave_request: '📅', leave_approved: '✅', leave_rejected: '⛔', payroll_locked: '🔒',
}

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [seenAt, setSeenAt] = useState(() => Number(localStorage.getItem('sf_notif_seen') || 0))
  const ref = useRef(null)

  const load = () =>
    fetchNotifications(25)
      .then(setItems)
      .catch(() => setItems([]))

  useEffect(() => {
    load()
    const t = setInterval(load, 20000) // light polling
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const unread = items.filter((n) => new Date(n.created_at).getTime() > seenAt).length

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      const now = Date.now()
      setSeenAt(now)
      localStorage.setItem('sf_notif_seen', String(now))
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="w-[38px] h-[38px] rounded-[11px] bg-[#f4f4f2] flex items-center justify-center relative hover:bg-[#eaeae7]"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] bg-white rounded-2xl shadow-[0_18px_44px_rgba(10,10,9,0.18)] border border-line z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="text-sm font-bold">Activity</span>
            <span className="text-[11px] text-faint">{items.length} recent</span>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted">No activity yet.</div>
            )}
            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-[11px] border-b border-line last:border-0">
                <div className="mt-0.5">
                  <Avatar name={n.actor_name || '—'} src={n.actor?.avatar_url} size={30} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-snug">
                    <span className="mr-1">{ICON[n.type] || '•'}</span>
                    {n.message}
                  </div>
                  <div className="text-[11px] text-faint tnum mt-0.5">{timeAgo(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
