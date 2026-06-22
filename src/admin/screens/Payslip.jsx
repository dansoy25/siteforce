import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { supabase } from '../../lib/supabase'
import { peso, shortDate } from '../../lib/format'

export default function Payslip() {
  const { flash } = useAdmin()
  const [slip, setSlip] = useState(null)

  useEffect(() => {
    supabase
      .from('payslips')
      .select('*, profile:profiles(full_name, employee_code, position, daily_rate)')
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSlip(data))
  }, [])

  if (!slip) return <div className="text-sm text-muted">Loading payslip…</div>

  const earnings = Array.isArray(slip.earnings) ? slip.earnings : []
  const deductions = Array.isArray(slip.deductions) ? slip.deductions : []
  const totalDed = deductions.reduce((s, d) => s + Number(d.amount || 0), 0)
  const year = new Date(slip.period_end + 'T00:00:00+08:00').getFullYear()

  const Line = ({ label, value, strong }) => (
    <div className={'flex justify-between py-[5px] text-[13px] ' + (strong ? 'font-bold border-t border-[#eaeae7] mt-1.5 pt-2' : '')}>
      <span className={strong ? '' : 'text-ink-soft'}>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-end gap-[10px] mb-4">
        <button onClick={() => flash('Payslip PDF downloaded')} className="border-none bg-orange text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          Download PDF
        </button>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[680px] bg-white shadow-[0_6px_16px_rgba(10,10,9,0.12)] p-7 sm:p-10 rounded-md">
          <div className="flex justify-between items-start pb-[18px] border-b-2 border-ink">
            <div className="flex gap-3 items-center">
              <div className="w-[42px] h-[42px] rounded-[11px] bg-orange flex items-center justify-center text-white text-xl font-extrabold">S</div>
              <div>
                <div className="text-[17px] font-extrabold">Jaway Services Inc.</div>
                <div className="text-xs text-muted">Brgy. Mandurriao, Iloilo City · TIN 004-217-880-000</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold tracking-wide uppercase text-orange">Payslip</div>
              <div className="text-xs text-muted tnum">{shortDate(slip.period_start)} – {shortDate(slip.period_end)}, {year}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-4 border-b border-[#eaeae7]">
            <Line label="Employee" value={slip.profile?.full_name} />
            <Line label="Employee ID" value={slip.profile?.employee_code} />
            <Line label="Position" value={slip.profile?.position} />
            <Line label="Pay rate" value={`${peso(slip.profile?.daily_rate)} / day`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 py-[18px]">
            <div>
              <div className="text-xs font-bold tracking-wide uppercase text-green mb-[10px]">Earnings</div>
              {earnings.map((e, i) => <Line key={i} label={e.label} value={peso(e.amount)} />)}
              <Line label="Gross pay" value={peso(slip.gross)} strong />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide uppercase text-red mb-[10px]">Deductions</div>
              {deductions.map((d, i) => <Line key={i} label={d.label} value={peso(d.amount)} />)}
              <Line label="Total" value={peso(totalDed)} strong />
            </div>
          </div>

          <div className="flex justify-between items-center bg-ink rounded-xl px-[22px] py-4">
            <div>
              <div className="text-xs text-white/60 tracking-wide uppercase">Net pay</div>
              <div className="text-xs text-white/45">Deposited to {slip.paid_to || 'bank'}</div>
            </div>
            <div className="text-[28px] font-extrabold tnum text-[#ff9963]">{peso(slip.net)}</div>
          </div>

          <div className="flex justify-between mt-4 pt-3.5 border-t border-[#eaeae7] text-[11px] text-faint">
            <div>System-generated · no signature required.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
