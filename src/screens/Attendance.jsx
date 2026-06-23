import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAttendance } from '../lib/api'
import { weekday, shortDate, timePH } from '../lib/format'

const STATUS = {
  present: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Present' },
  late: { bg: '#fcf1df', fg: '#e0982e', label: 'Late' },
  ongoing: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Present' },
  absent: { bg: '#fce9e9', fg: '#e04444', label: 'Absent' },
}

function MiniMap() {
  return (
    <div
      className="w-[50px] h-[50px] rounded-[12px] bg-[#e4e4df] relative shrink-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(155,155,150,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(155,155,150,.25) 1px,transparent 1px)',
        backgroundSize: '11px 11px',
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand border-2 border-white" />
    </div>
  )
}

function isToday(d) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  return d === today
}

export default function Attendance() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetchAttendance(profile.id, 30).then(setRows).catch(() => setRows([]))
  }, [profile.id])

  return (
    <div className="animate-fadeIn">
      <div className="px-[22px] pt-2 pb-[14px]">
        <div className="text-[22px] font-extrabold tracking-tight">Attendance</div>
      </div>
      <div className="px-[18px] pb-[14px] flex flex-col gap-4">
        {rows.map((r) => {
          const st = STATUS[r.status] || STATUS.present
          const label = isToday(r.work_date)
            ? `Today · ${shortDate(r.work_date)}`
            : `${weekday(r.work_date)} · ${shortDate(r.work_date)}`
          const times = r.clock_out
            ? `${timePH(r.clock_in)} — ${timePH(r.clock_out)} · ${Number(r.hours).toFixed(1)} h`
            : `${timePH(r.clock_in)} — ongoing${r.hours ? ` · ${Number(r.hours).toFixed(1)} h` : ''}`
          return (
            <div key={r.id}>
              <div className="text-xs font-semibold tracking-wide uppercase text-faint mx-1 mb-2">
                {label}
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-[0_1px_3px_rgba(10,10,9,0.08)] flex gap-3 items-center">
                <MiniMap />
                <div className="flex-1">
                  <div className="text-[15px] font-bold">{r.site?.name || r.project || 'Site'}</div>
                  <div className="text-[13px] text-muted tnum">{times}</div>
                </div>
                <span
                  className="inline-flex items-center gap-[5px] text-xs font-semibold px-[10px] py-[5px] rounded-full"
                  style={{ background: st.bg, color: st.fg }}
                >
                  {st.label}
                </span>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="text-center text-sm text-muted py-10">No attendance records yet.</div>
        )}
      </div>
    </div>
  )
}
