import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchDashboard } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { peso, shortDate } from '../../lib/format'

// Pastel color-coded stat tile, per Figma. Uses a soft tinted background and
// a small icon pill in the same hue.
function Stat({ icon, tint, dot, value, label, badge }) {
  return (
    <div
      className="rounded-[20px] p-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.06)] relative overflow-hidden"
      style={{ background: tint }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white/70 text-sm"
          style={{ color: dot }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70"
            style={{ color: dot }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-[30px] font-extrabold tnum leading-none mb-1" style={{ color: '#0f172a' }}>{value}</div>
      <div className="text-[13px] font-semibold" style={{ color: dot }}>{label}</div>
    </div>
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
        <button onClick={() => navigate('payroll')} className="border-none bg-brand text-white text-sm font-semibold px-[18px] py-[10px] rounded-xl">
          Run payroll
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-4">
        <Stat
          icon="✓"
          tint="#dcf2e6"
          dot="#166534"
          value={d.present}
          label="Present today"
          badge={d.employeeCount > 0 ? `${Math.round((d.present / d.employeeCount) * 1000) / 10}%` : null}
        />
        <Stat icon="◷" tint="#fde8c1" dot="#92400e" value={d.late} label="Late arrivals" />
        <Stat icon="○" tint="#fbd5db" dot="#9f1239" value={d.absent} label="Absent" />
        <Stat icon="⊙" tint="#dde2fb" dot="#312e81" value={d.onLeave} label="On leave" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[14px] mb-[14px]">
        <Card className="p-5">
          <div className="text-[15px] font-bold mb-4">Attendance trend · 7 days</div>
          <div className="flex items-end gap-[14px] h-[150px]">
            {d.trend.map((t, i) => (
              <div key={t.date} className="flex-1 rounded-t-lg" style={{
                height: `${Math.max(6, (t.count / maxTrend) * 100)}%`,
                background: i === d.trend.length - 1 ? '#a5b4fc' : '#2563eb',
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

        <div className="bg-ink rounded-[18px] p-5 text-white relative" style={{ boxShadow: '0 0 0 2px #22c55e' }}>
          <div className="text-xs tracking-wide uppercase text-white/60">Next payroll run</div>
          <div className="text-xl font-extrabold mt-1.5 mb-0.5">
            {d.run ? `${shortDate(d.run.period_start)} – ${shortDate(d.run.period_end)}, 2026` : '—'}
          </div>
          <div className="text-[13px] text-white/60">{d.run?.status === 'locked' ? 'Locked' : 'Draft — ready to run'}</div>
          <div className="h-px bg-white/10 my-4" />
          <div className="flex justify-between py-[5px] text-sm">
            <span className="text-white/70">Est. gross</span>
            <span className="tnum">{peso(d.run?.gross || 0)}</span>
          </div>
          <div className="flex justify-between py-[5px] text-sm">
            <span className="text-white/70">Est. deductions</span>
            <span className="tnum">{peso(d.run?.deductions || 0)}</span>
          </div>
          <div className="flex justify-between py-[5px] text-sm font-semibold">
            <span className="text-white">Est. net</span>
            <span className="tnum text-[#22c55e]">{peso(d.run?.net || 0)}</span>
          </div>
          <button onClick={() => navigate('payroll')} className="w-full border-none bg-brand text-white text-sm font-semibold py-3 rounded-xl mt-3.5">
            Start run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        <Card className="p-[18px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-[15px] font-bold">
              Pending leave approvals
              {d.pendingCount > 0 && (
                <span className="bg-brand text-white text-[11px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center">
                  {d.pendingCount}
                </span>
              )}
            </div>
            <button onClick={() => navigate('leave')} className="border-none bg-transparent text-brand text-[13px] font-semibold">
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
              <button onClick={() => navigate('leave')} title="Approve" className="border-none w-8 h-8 rounded-lg bg-green-tint text-green text-base">✓</button>
              <button onClick={() => navigate('leave')} title="Reject" className="border-none w-8 h-8 rounded-lg bg-red-tint text-red text-base">✕</button>
            </div>
          ))}
        </Card>

        <Card className="p-[18px]">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[15px] font-bold">Recent activity</div>
          </div>
          <div className="text-sm text-muted">See the bell 🔔 in the top bar for the live activity feed.</div>
        </Card>
      </div>
    </div>
  )
}
