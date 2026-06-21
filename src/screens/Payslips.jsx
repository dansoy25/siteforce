import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import { fetchPayslips } from '../lib/api'
import { peso, shortDate } from '../lib/format'

function periodLabel(p) {
  const a = shortDate(p.period_start)
  const b = shortDate(p.period_end)
  const year = new Date(p.period_end + 'T00:00:00+08:00').getFullYear()
  return `${a} – ${b.replace(/^[A-Za-z]+ /, (m) => (a.startsWith(b.split(' ')[0]) ? '' : m))}, ${year}`
}

export default function Payslips() {
  const { profile } = useAuth()
  const { navigate } = useShell()
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetchPayslips(profile.id).then(setRows).catch(() => setRows([]))
  }, [profile.id])

  const latest = rows[0]

  return (
    <div className="animate-fadeIn">
      <div className="px-[22px] pt-2 pb-[14px]">
        <div className="text-[22px] font-extrabold tracking-tight">Payslips</div>
      </div>

      {latest && (
        <div className="px-[18px] pb-[14px]">
          <div className="rounded-[20px] p-[18px] text-white shadow-[0_8px_20px_rgba(242,92,31,0.3)] bg-gradient-to-br from-orange to-orange-dark">
            <div className="text-xs opacity-85 tracking-wide uppercase">Latest net pay</div>
            <div className="text-[32px] font-extrabold my-1 tnum">{peso(latest.net)}</div>
            <div className="text-[13px] opacity-85 tnum">
              {periodLabel(latest)} · {latest.status === 'paid' ? 'Paid' : 'Pending'}
            </div>
          </div>
        </div>
      )}

      <div className="px-[18px] flex flex-col gap-[10px] pb-4">
        {rows.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate('payslipDetail', { id: p.id })}
            className="text-left border-none bg-white rounded-2xl px-4 py-[15px] shadow-[0_1px_3px_rgba(10,10,9,0.08)] flex justify-between items-center"
          >
            <div>
              <div className="text-sm font-bold">{periodLabel(p)}</div>
              <div className="text-xs text-muted">Net pay · tap to view</div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold tnum">{peso(p.net)}</div>
              <span className="text-[11px] text-green font-semibold">
                ● {p.status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="text-center text-sm text-muted py-10">No payslips yet.</div>
        )}
      </div>
    </div>
  )
}
