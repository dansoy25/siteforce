import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import {
  fetchOpenAttendance,
  fetchAttendance,
  fetchLeaveBalances,
  fetchAnnouncements,
  fetchNotifications,
  clockOut,
  logActivity,
} from '../lib/api'
import { initials, longDate, timePH, hm } from '../lib/format'
import Avatar from '../components/Avatar'

const ACTIVITY_ICON = {
  login: '🔓', logout: '🔒', clock_in: '🟢', clock_out: '⏹',
  leave_request: '📅', leave_approved: '✅', leave_rejected: '⛔',
}
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Home() {
  const { profile } = useAuth()
  const { navigate, flash } = useShell()

  const [open, setOpen] = useState(null)
  const [weekHours, setWeekHours] = useState(0)
  const [leaveLeft, setLeaveLeft] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  const [activity, setActivity] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    const [openRow, history, balances, anns, acts] = await Promise.all([
      fetchOpenAttendance(profile.id),
      fetchAttendance(profile.id, 14),
      fetchLeaveBalances(profile.id),
      fetchAnnouncements(),
      fetchNotifications(6),
    ])
    setOpen(openRow)
    setActivity(acts)

    // hours this week (Mon..now)
    const now = new Date()
    const day = (now.getDay() + 6) % 7 // Mon = 0
    const monday = new Date(now)
    monday.setDate(now.getDate() - day)
    monday.setHours(0, 0, 0, 0)
    const wk = history
      .filter((r) => new Date(r.work_date + 'T00:00:00+08:00') >= monday)
      .reduce((s, r) => s + Number(r.hours || 0), 0)
    let total = wk
    if (openRow?.clock_in) {
      total += (Date.now() - new Date(openRow.clock_in).getTime()) / 3600000
    }
    setWeekHours(Math.round(total * 10) / 10)

    setLeaveLeft(balances.reduce((s, b) => s + Number(b.balance || 0), 0))
    setAnnouncements(anns)
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  const clockedIn = !!open
  const hoursSoFar = open?.clock_in
    ? hm((Date.now() - new Date(open.clock_in).getTime()) / 3600000)
    : '0:00'

  async function onClockAction() {
    if (busy) return
    if (clockedIn) {
      setBusy(true)
      try {
        await clockOut(open.id, open.clock_in)
        logActivity({
          orgId: profile.org_id,
          actorId: profile.id,
          actorName: profile.full_name,
          type: 'clock_out',
          message: `${profile.full_name} clocked out`,
        })
        flash('Clocked out at ' + timePH(new Date().toISOString()))
        await load()
      } catch (e) {
        flash('Could not clock out')
      } finally {
        setBusy(false)
      }
    } else {
      navigate('checkin')
    }
  }

  return (
    <div className="flex flex-col animate-fadeIn">
      {/* orange header */}
      <div className="bg-orange px-6 pt-[6px] pb-[26px] text-white">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-85">Good morning</div>
            <div className="text-[22px] font-extrabold tracking-tight">
              {profile.full_name}
            </div>
          </div>
          {profile.avatar_url ? (
            <Avatar name={profile.full_name} src={profile.avatar_url} size={44} />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {initials(profile.full_name)}
            </div>
          )}
        </div>
        <div className="text-[13px] opacity-85 mt-[2px] tnum">{longDate(new Date())}</div>
      </div>

      <div className="px-[18px] pb-[18px] -mt-4 flex flex-col gap-[14px]">
        {/* clock card */}
        <div className="bg-white rounded-[20px] p-[18px] shadow-[0_6px_16px_rgba(10,10,9,0.10)]">
          <div className="flex justify-between items-center mb-[14px]">
            <span className="text-xs font-semibold tracking-wide uppercase text-faint">Today</span>
            <span
              className="inline-flex items-center gap-[6px] text-xs font-semibold px-[11px] py-[5px] rounded-full"
              style={{
                background: clockedIn ? '#e7f6ef' : '#f4f4f2',
                color: clockedIn ? '#1f9d6b' : '#74746f',
              }}
            >
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ background: clockedIn ? '#1f9d6b' : '#74746f' }}
              />
              {clockedIn ? 'Clocked in' : 'Clocked out'}
            </span>
          </div>
          <div className="flex gap-[18px] mb-[14px]">
            <div>
              <div className="text-[28px] font-extrabold tnum">{hoursSoFar}</div>
              <div className="text-xs text-muted">hours so far</div>
            </div>
            <div className="border-l border-[#eaeae7] pl-[18px]">
              <div className="text-[15px] font-bold">
                {open?.site?.name || profile.site?.name || '—'}
              </div>
              <div className="text-xs text-muted tnum">
                {clockedIn ? 'In at ' + timePH(open.clock_in) : 'Not clocked in'}
              </div>
            </div>
          </div>
          <button
            onClick={onClockAction}
            disabled={busy}
            className="w-full border-none text-white text-base font-semibold py-[15px] rounded-[14px] disabled:opacity-60"
            style={{ background: clockedIn ? '#131312' : '#f25c1f' }}
          >
            {busy ? '…' : clockedIn ? 'Clock out' : 'Clock in'}
          </button>
        </div>

        {/* stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_3px_rgba(10,10,9,0.08)]">
            <div className="text-2xl font-extrabold tnum">{weekHours.toFixed(1)}</div>
            <div className="text-xs text-muted">hours this week</div>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_3px_rgba(10,10,9,0.08)]">
            <div className="text-2xl font-extrabold tnum">{leaveLeft}</div>
            <div className="text-xs text-muted">leave days left</div>
          </div>
        </div>

        {/* announcements */}
        <div>
          <div className="text-sm font-bold mb-[10px]">Announcements</div>
          <div className="flex flex-col gap-[10px]">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-[14px] shadow-[0_1px_3px_rgba(10,10,9,0.08)] flex gap-3 items-start"
              >
                <div
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: (a.accent || '#f25c1f') + '22', color: a.accent || '#f25c1f' }}
                >
                  {a.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-muted">{a.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* your recent activity */}
        {activity.length > 0 && (
          <div>
            <div className="text-sm font-bold mb-[10px]">Your recent activity</div>
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(10,10,9,0.08)] overflow-hidden">
              {activity.map((n, i) => (
                <div
                  key={n.id}
                  className={'flex items-center gap-3 px-[14px] py-[11px] ' + (i < activity.length - 1 ? 'border-b border-line' : '')}
                >
                  <span className="text-base">{ACTIVITY_ICON[n.type] || '•'}</span>
                  <div className="flex-1 text-[13px]">{n.message}</div>
                  <div className="text-[11px] text-faint tnum whitespace-nowrap">{timeAgo(n.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
