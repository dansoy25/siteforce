import { useEffect, useState } from 'react'
import { fetchTodayAttendance, fetchSites } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { timePH } from '../../lib/format'

export default function Attendance() {
  const [tab, setTab] = useState('board')
  const [rows, setRows] = useState([])
  const [sites, setSites] = useState([])

  useEffect(() => {
    fetchTodayAttendance().then(setRows).catch(() => setRows([]))
    fetchSites().then(setSites).catch(() => setSites([]))
  }, [])

  const bySite = {}
  rows.forEach((r) => {
    const name = r.site?.name || 'Unassigned'
    ;(bySite[name] = bySite[name] || []).push(r)
  })

  const Tab = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      className="border-none px-[14px] py-[7px] rounded-lg text-[13px] font-semibold"
      style={{ background: tab === id ? '#131312' : 'transparent', color: tab === id ? '#fff' : '#74746f' }}
    >
      {children}
    </button>
  )

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap items-center gap-[10px] mb-4">
        <div className="inline-flex bg-white border border-[#eaeae7] rounded-xl p-1 gap-1">
          <Tab id="board">Board</Tab>
          <Tab id="table">Table</Tab>
          <Tab id="map">Map</Tab>
        </div>
        <div className="flex-1" />
        <span className="inline-flex items-center gap-2 bg-white border-[1.5px] border-stroke rounded-xl px-[14px] py-[9px] text-[13px] text-ink-soft">
          Site: All ▾
        </span>
      </div>

      {tab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px]">
          {Object.entries(bySite).map(([site, people]) => {
            const late = people.filter((p) => p.status === 'late').length
            return (
              <Card key={site} className="p-[18px]">
                <div className="flex justify-between items-center mb-[14px]">
                  <div className="text-[15px] font-bold">{site}</div>
                  <Pill kind={late ? 'late' : 'present'}>{late ? `${late} late` : `${people.length} present`}</Pill>
                </div>
                <div className="flex flex-col gap-[10px]">
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center gap-[10px]">
                      <Avatar name={p.profile?.full_name} size={30} />
                      <div className="flex-1 text-[13px] font-semibold">{p.profile?.full_name}</div>
                      <span className="tnum text-xs" style={{ color: p.status === 'late' ? '#e0982e' : '#74746f' }}>
                        {timePH(p.clock_in)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
          {rows.length === 0 && <div className="text-sm text-muted">No one clocked in today yet.</div>}
        </div>
      )}

      {tab === 'table' && (
        <Card className="overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1.4fr_1.2fr_1fr_1fr] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
            <div>Employee</div><div>Site</div><div>Time in/out</div><div>Hours</div><div>Status</div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-2 sm:grid-cols-[2fr_1.4fr_1.2fr_1fr_1fr] items-center px-5 py-[13px] border-b border-line text-sm gap-y-1">
              <div className="flex items-center gap-[10px] col-span-2 sm:col-span-1">
                <Avatar name={r.profile?.full_name} size={30} />
                <span className="font-semibold">{r.profile?.full_name}</span>
              </div>
              <div className="text-ink-soft">{r.site?.name || '—'}</div>
              <div className="tnum text-ink-soft">{timePH(r.clock_in)} · {r.clock_out ? timePH(r.clock_out) : '—'}</div>
              <div className="tnum font-semibold">{r.hours ? Number(r.hours).toFixed(1) : ((Date.now() - new Date(r.clock_in)) / 3600000).toFixed(1)}</div>
              <div><Pill kind={r.status} /></div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted p-6">No records today.</div>}
        </Card>
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
              const palette = ['#1f9d6b', '#f25c1f', '#e0982e']
              const pos = [{ top: '30%', left: '24%' }, { top: '50%', left: '54%' }, { top: '18%', left: '64%' }][i % 3]
              const color = palette[i % 3]
              const count = rows.filter((r) => r.site?.name === s.name).length
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
              const palette = ['#1f9d6b', '#f25c1f', '#e0982e']
              const count = rows.filter((r) => r.site?.name === s.name).length
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
