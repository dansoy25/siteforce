import { useEffect, useState } from 'react'
import { fetchTodayAttendance, fetchSites, fetchEmployees } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { timePH } from '../../lib/format'

export default function Attendance() {
  const [tab, setTab] = useState('board')
  const [att, setAtt] = useState([])
  const [employees, setEmployees] = useState([])
  const [sites, setSites] = useState([])

  useEffect(() => {
    fetchTodayAttendance().then(setAtt).catch(() => setAtt([]))
    fetchEmployees().then(setEmployees).catch(() => setEmployees([]))
    fetchSites().then(setSites).catch(() => setSites([]))
  }, [])

  // Merge the roster (gives today's status for everyone) with today's clock rows.
  const attByProfile = {}
  att.forEach((a) => { attByProfile[a.profile_id] = a })
  const rows = employees
    .filter((e) => !e.is_admin)
    .map((e) => {
      const a = attByProfile[e.id]
      const elapsed = a?.clock_in && !a?.clock_out ? (Date.now() - new Date(a.clock_in)) / 3600000 : null
      const hours = a?.hours != null ? Number(a.hours) : elapsed != null ? Math.round(elapsed * 10) / 10 : 0
      const flag = a && !a.clock_out && elapsed != null && elapsed > 8.5 ? 'No clock-out' : null
      return {
        id: e.id,
        name: e.full_name,
        position: e.position,
        avatar_url: e.avatar_url,
        site: a?.site?.name || e.site?.name || null,
        clockIn: a?.clock_in || null,
        clockOut: a?.clock_out || null,
        hours,
        status: e.today,
        flag,
      }
    })
    .sort((a, b) => (b.clockIn ? 1 : 0) - (a.clockIn ? 1 : 0))

  const exceptions = rows.filter((r) => r.flag).length

  const Tab = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      className="border-none px-[16px] py-[7px] rounded-[8px] text-[13px] font-semibold transition-colors"
      style={{ background: tab === id ? '#131312' : 'transparent', color: tab === id ? '#fff' : '#74746f' }}
    >
      {children}
    </button>
  )

  return (
    <div className="animate-fadeIn">
      {/* header row: live pill + export (title is in the topbar) */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-2 bg-green-tint text-green text-xs font-semibold px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Live
        </span>
        <button className="inline-flex items-center gap-2 border border-stroke bg-white text-ink-soft text-sm font-semibold px-4 py-2 rounded-xl">
          ↓ Export
        </button>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-[10px] mb-4">
        <div className="inline-flex bg-white border border-[#eaeae7] rounded-[12px] p-1 gap-1">
          <Tab id="board">Board</Tab>
          <Tab id="map">Map</Tab>
        </div>
        <div className="flex-1" />
        <span className="inline-flex items-center gap-2 bg-white border border-stroke rounded-[10px] px-[14px] py-[8px] text-[13px] text-ink-soft">Site: All ▾</span>
        <span className="inline-flex items-center gap-2 bg-white border border-stroke rounded-[10px] px-[14px] py-[8px] text-[13px] text-ink-soft">Status ▾</span>
        <span className="hidden md:inline-flex items-center gap-2 bg-white border border-stroke rounded-[10px] px-[14px] py-[8px] text-[13px] text-faint w-[150px]">⌕ Search</span>
      </div>

      {tab === 'board' && (
        <>
          {/* exceptions banner */}
          {exceptions > 0 && (
            <div className="flex items-center gap-3 bg-amber-tint rounded-[14px] px-4 py-3 mb-4">
              <span className="text-amber text-base">⚠</span>
              <span className="text-[13px] text-[#842b12] flex-1">
                {exceptions} exception{exceptions > 1 ? 's' : ''} flagged — missing clock-out / geofence mismatches.
              </span>
              <span className="text-[13px] font-semibold text-brand">Review →</span>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1.3fr_1.2fr_0.8fr_1fr_1fr] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
              <div>Employee</div><div>Site</div><div>Time in / out</div><div>Hours</div><div>Status</div><div>Flag</div>
            </div>
            {rows.map((r) => {
              const highlight = !!r.flag
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-2 md:grid-cols-[2fr_1.3fr_1.2fr_0.8fr_1fr_1fr] items-center px-5 py-[13px] border-b border-line last:border-0 text-sm gap-y-1"
                  style={highlight ? { background: '#eef2ff' } : undefined}
                >
                  <div className="flex items-center gap-[10px] col-span-2 md:col-span-1">
                    <Avatar name={r.name} src={r.avatar_url} size={34} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-xs text-faint truncate">{r.position}</div>
                    </div>
                  </div>
                  <div className="text-ink-soft">{r.site || <span className="text-faint">—</span>}</div>
                  <div className="tnum text-ink-soft">
                    {r.clockIn ? timePH(r.clockIn) : '—'} · {r.clockOut ? timePH(r.clockOut) : '—'}
                  </div>
                  <div className="tnum font-semibold">{r.hours.toFixed(1)}</div>
                  <div><Pill kind={r.status} /></div>
                  <div>
                    {r.flag
                      ? <span className="inline-flex items-center text-xs font-semibold px-[10px] py-[4px] rounded-full bg-red-tint text-red">{r.flag}</span>
                      : <span className="text-faint">—</span>}
                  </div>
                </div>
              )
            })}
            {rows.length === 0 && <div className="p-6 text-sm text-muted">No employees yet.</div>}
            <div className="flex justify-between items-center px-5 py-3 text-[13px] text-muted">
              <div>Showing {rows.length} · updated {timePH(new Date().toISOString())}</div>
              <div className="flex gap-1">
                <span className="w-7 h-7 rounded-lg border border-stroke flex items-center justify-center">‹</span>
                <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center font-semibold">1</span>
                <span className="w-7 h-7 rounded-lg border border-stroke flex items-center justify-center">›</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'map' && (
        <Card className="overflow-hidden h-[560px] flex flex-col">
          <div
            className="relative flex-1 bg-[#e4e4df]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(155,155,150,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(155,155,150,.2) 1px,transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          >
            {sites.map((s, i) => {
              const palette = ['#1f9d6b', '#2563eb', '#e0982e']
              const pos = [{ top: '30%', left: '24%' }, { top: '50%', left: '54%' }, { top: '18%', left: '64%' }][i % 3]
              const color = palette[i % 3]
              const count = att.filter((r) => r.site?.name === s.name).length
              return (
                <div key={s.id}>
                  <div className="absolute rounded-full" style={{ ...pos, width: 120, height: 120, background: color + '24', border: `2px solid ${color}` }} />
                  <div className="absolute rounded-full border-[3px] border-white" style={{ top: `calc(${pos.top} + 52px)`, left: `calc(${pos.left} + 52px)`, width: 14, height: 14, background: color }} title={`${s.name}: ${count} in`} />
                </div>
              )
            })}
          </div>
          <div className="px-[18px] py-[14px] flex flex-wrap gap-[18px]">
            {sites.map((s, i) => {
              const palette = ['#1f9d6b', '#2563eb', '#e0982e']
              const count = att.filter((r) => r.site?.name === s.name).length
              return (
                <span key={s.id} className="inline-flex items-center gap-[6px] text-[13px] text-ink-soft">
                  <span className="w-[9px] h-[9px] rounded-full" style={{ background: palette[i % 3] }} />
                  {s.name} · {count} in
                </span>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
