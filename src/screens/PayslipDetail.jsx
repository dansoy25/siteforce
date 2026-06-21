import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import { fetchPayslips } from '../lib/api'
import { peso, shortDate } from '../lib/format'

export default function PayslipDetail() {
  const { profile } = useAuth()
  const { params, navigate, flash } = useShell()
  const [slip, setSlip] = useState(null)

  useEffect(() => {
    fetchPayslips(profile.id).then((rows) => {
      setSlip(rows.find((r) => r.id === params.id) || rows[0] || null)
    })
  }, [profile.id, params.id])

  if (!slip) {
    return <div className="p-8 text-center text-sm text-muted">Loading payslip…</div>
  }

  const earnings = Array.isArray(slip.earnings) ? slip.earnings : []
  const deductions = Array.isArray(slip.deductions) ? slip.deductions : []
  const totalDed = deductions.reduce((s, d) => s + Number(d.amount || 0), 0)
  const year = new Date(slip.period_end + 'T00:00:00+08:00').getFullYear()

  return (
    <div className="animate-fadeIn">
      <div className="px-[22px] pt-2 pb-[14px] flex items-center gap-[14px]">
        <button
          onClick={() => navigate('payslips')}
          className="border-none bg-transparent text-[22px] text-ink-soft p-0"
        >
          ‹
        </button>
        <div>
          <div className="text-[18px] font-extrabold">
            {shortDate(slip.period_start)} – {shortDate(slip.period_end)}, {year}
          </div>
          <div className="text-xs text-muted">Payslip · {profile.employee_code}</div>
        </div>
      </div>

      <div className="px-[18px] pb-[18px] flex flex-col gap-3">
        {/* Earnings */}
        <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_3px_rgba(10,10,9,0.08)]">
          <div className="text-xs font-semibold tracking-wide uppercase text-green mb-[10px]">
            Earnings
          </div>
          {earnings.map((e, i) => (
            <div key={i} className="flex justify-between py-[6px] text-sm">
              <span className="text-ink-soft">{e.label}</span>
              <span className="tnum font-semibold">{peso(e.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-[6px] border-t border-line text-sm">
            <span className="font-semibold">Gross pay</span>
            <span className="tnum font-bold">{peso(slip.gross)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white rounded-[18px] p-4 shadow-[0_1px_3px_rgba(10,10,9,0.08)]">
          <div className="text-xs font-semibold tracking-wide uppercase text-red mb-[10px]">
            Deductions
          </div>
          {deductions.map((d, i) => (
            <div key={i} className="flex justify-between py-[5px] text-sm">
              <span className="text-ink-soft">{d.label}</span>
              <span className="tnum">− {peso(d.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-[6px] border-t border-line text-sm">
            <span className="font-semibold">Total deductions</span>
            <span className="tnum font-bold text-red">− {peso(totalDed)}</span>
          </div>
        </div>

        {/* Net */}
        <div className="bg-ink rounded-[18px] p-[18px] flex justify-between items-center">
          <div>
            <div className="text-xs text-white/70 tracking-wide uppercase">Net pay</div>
            <div className="text-xs text-white/50 mt-[2px]">
              Deposited to {slip.paid_to || 'bank'}
            </div>
          </div>
          <div className="text-[28px] font-extrabold tnum text-[#ff9963]">{peso(slip.net)}</div>
        </div>

        <div className="flex gap-[10px]">
          <button
            onClick={() => flash('Payslip link copied')}
            className="flex-1 border-[1.5px] border-stroke bg-white text-ink-soft text-[15px] font-semibold py-[13px] rounded-[13px]"
          >
            Share
          </button>
          <button
            onClick={() => flash('Payslip PDF downloaded')}
            className="flex-1 border-none bg-orange text-white text-[15px] font-semibold py-[13px] rounded-[13px]"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}
