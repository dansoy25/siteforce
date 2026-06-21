import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchDashboard } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { peso, shortDate } from '../../lib/format'

function Stat({ icon, bg, fg, value, label }) {
  return (
    <Card className="p-[18px]">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3" style={{ background: bg, color: fg }}>
        {icon}
      </div>
      <div className="text-[28px] font-extrabold tnum">{value}</div>
      <div className="text-[13px] text-muted">{label}</div>
    </Card>
  )
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const { navigate, profile } = useAdmin()
  const [d, setD] = useState(null)

  useEffect(() => {
    fetchDashboard().then(setD).catch(console.error)
  }, [])

  if (!d) return <div className="text-sm text-muted">Loading dashboard…</div>

  const maxTrend = Math.max(1, ...d.trend.map((t) => t.count))
  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <div>
          <div className="text-[17px] font-bold">Good morning, {firstName} 👋</div>
          <div className="text-[13px] text-muted tnum">
            {d.employeeCount} employees · {d.pendingCount} pending approvals
          </div>
        </div>
        <button onClick={() => navigate('payroll')} className="border-none bg-orange text-white text-sm font-semibold px-[18px] py-[10px] rounded-xl">
          Run payroll
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-4">
        <Stat icon="✓" bg="#e7f6ef" fg="#1f9d6b" value={d.present} label="Present today" />
        <Stat icon="◷" bg="#fcf1df" fg="#e0982e" value={d.late} label="Late arrivals" />
        <Stat icon="○" bg="#fce9e9" fg="#e04444" value={d.absent} label="Absent" />
        <Stat icon="⊙" bg="#e8eefe" fg="#3b6ff0" value={d.onLeave} label="On leave" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[14px] mb-[14px]">
        <Card className="p-5">
          <div className="text-[15px] font-bold mb-4">Attendance trend · 7 days</div>
          <div className="flex items-end gap-[14px] h-[150px]">
            {d.trend.map((t, i) => (
              <div key={t.date} className="flex-1 rounded-t-lg" style={{
                height: `${Math.max(6, (t.count / maxTrend) * 100)}%`,
                background: i === d.trend.length - 1 ? '#ffbe99' : '#f25c1f',
              }} title={`${t.count} on ${t.date}`} />
            ))}
          </div>
          <div className="flex gap-[14px] mt-2">
            {d.trend.map((t) => (
              <div key={t.date} className="flex-1 text-center text-[11px] text-faint">
                {DOW[new Date(t.date + 'T00:00:00+08:00').getDay()]}
              </div>
            ))}
          </div>
        </Card>

        <div className="bg-ink rounded-[18px] p-5 text-white">
          <div className="text-xs tracking-wide uppercase text-white/60">Next payroll run</div>
          <div className="text-xl font-extrabold mt-1.5 mb-0.5">
            {d.run ? `${shortDate(d.run.period_start)} – ${shortDate(d.run.period_end)}, 2026` : '—'}
          </div>
          <div className="text-[13px] text-white/60">{d.run?.status === 'locked' ? 'Locked' : 'Draft — ready to run'}</div>
          <div className="h-px bg-white/10 my-4" />
          <div className="flex justify-between py-[5px] text-sm">
            <span className="text-white/70">Est. net</span>
            <span className="tnum font-extrabold text-[#ff9963]">{peso(d.run?.net || 0)}</span>
          </div>
          <button onClick={() => navigate('payroll')} className="w-full border-none bg-orange text-white text-sm font-semibold py-3 rounded-xl mt-3.5">
            Start run
          </button>
        </div>
      </div>

      <Card className="p-[18px]">
        <div className="flex justify-between items-center mb-3">
          <div className="text-[15px] font-bold">Pending leave approvals</div>
          <button onClick={() => navigate('leave')} className="border-none bg-transparent text-orange text-[13px] font-semibold">
            View all →
          </button>
        </div>
        {d.pending.length === 0 && <div className="text-sm text-muted py-4">No pending requests 🎉</div>}
        {d.pending.map((l, i) => (
          <div key={l.id} className={'flex items-center gap-3 py-[9px] ' + (i < d.pending.length - 1 ? 'border-b border-line' : '')}>
            <Avatar name={l.profile?.full_name} src={l.profile?.avatar_url} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{l.profile?.full_name} · {l.leave_type?.name?.replace(' leave', '')}</div>
              <div className="text-xs text-faint tnum">
                {shortDate(l.date_from)}{l.date_from !== l.date_to ? `–${shortDate(l.date_to).replace(/^\w+ /, '')}` : ''} · {Number(l.days)} day{Number(l.days) > 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={() => navigate('leave')} className="border-none bg-[#f4f4f2] text-ink-soft text-xs font-semibold px-3 py-1.5 rounded-full">
              Review
            </button>
          </div>
        ))}
      </Card>
    </div>
  )
}
