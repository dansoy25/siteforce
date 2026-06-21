import { useEffect, useState } from 'react'
import { fetchEmployees } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { peso } from '../../lib/format'

export default function Employees() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchEmployees().then((list) => {
      setRows(list)
      setSelected(list[0] || null)
    }).catch(() => setRows([]))
  }, [])

  return (
    <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[18px]">
      <Card className="overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1.2fr_1fr_1fr] px-[22px] py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
          <div>Name</div><div>Role</div><div>Rate</div><div>Status</div>
        </div>
        {rows.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelected(e)}
            className="w-full text-left grid grid-cols-2 sm:grid-cols-[2fr_1.2fr_1fr_1fr] items-center px-[22px] py-[14px] border-b border-line last:border-0 text-sm gap-y-1"
            style={selected?.id === e.id ? { background: '#fff3ec' } : undefined}
          >
            <div className="flex items-center gap-[10px] col-span-2 sm:col-span-1">
              <Avatar name={e.full_name} size={34} />
              <div>
                <div className="font-semibold">{e.full_name}</div>
                <div className="text-xs text-faint tnum">{e.employee_code}</div>
              </div>
            </div>
            <div className="text-ink-soft">{e.position}</div>
            <div className="tnum text-ink-soft">{Number(e.daily_rate) > 0 ? `₱${Number(e.daily_rate)}` : '—'}</div>
            <div><Pill kind={e.today === 'on_leave' ? 'on_leave' : e.status} /></div>
          </button>
        ))}
      </Card>

      {selected && (
        <Card className="p-[22px] h-fit">
          <div className="flex flex-col items-center text-center mb-[18px]">
            <Avatar name={selected.full_name} size={72} />
            <div className="text-lg font-extrabold mt-3">{selected.full_name}</div>
            <div className="text-[13px] text-muted">{selected.position} · {selected.employee_code}</div>
          </div>
          <div className="bg-[#fafaf9] rounded-2xl p-4 mb-3.5">
            <Row label="Pay rate" value={Number(selected.daily_rate) > 0 ? `${peso(selected.daily_rate)} / day` : '—'} border />
            <Row label="Schedule" value={selected.schedule || '—'} border />
            <Row label="Site" value={selected.site?.name || '—'} />
          </div>
          <div className="flex justify-between items-center bg-green-tint rounded-[14px] px-4 py-3">
            <span className="text-[13px] text-[#15784f] font-semibold">Biometric enrolled</span>
            <span className="text-xs font-bold text-green">{selected.face_enrolled ? '✓ Face + PIN' : 'Pending'}</span>
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, border }) {
  return (
    <div className="flex justify-between py-[7px] text-[13px]" style={{ borderBottom: border ? '1px solid #efefec' : 'none' }}>
      <span className="text-muted">{label}</span>
      <span className="font-semibold tnum">{value}</span>
    </div>
  )
}
