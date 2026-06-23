import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchPayrollRun, lockPayrollRun, updatePayrollPeriod } from '../../lib/adminApi'
import { logActivity } from '../../lib/api'
import { Card, Avatar } from '../ui'
import { peso, longDate } from '../../lib/format'

function Step({ n, label, state }) {
  const bg = state === 'done' ? '#1f9d6b' : state === 'active' ? '#2563eb' : '#eaeae7'
  const fg = state === 'todo' ? '#74746f' : '#fff'
  return (
    <div className="flex items-center gap-[10px] shrink-0">
      <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: bg, color: fg }}>
        {state === 'done' ? '✓' : n}
      </div>
      <span className="text-sm font-semibold whitespace-nowrap" style={{ color: state === 'todo' ? '#9b9b96' : '#131312' }}>{label}</span>
    </div>
  )
}

// Default the picker to the second half of the current month.
function defaultRange() {
  const today = new Date()
  const y = today.getFullYear(), m = today.getMonth()
  const from = new Date(y, m, 16)
  const to = new Date(y, m + 1, 0) // last day of current month
  const iso = (d) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

export default function Payroll() {
  const { navigate, flash, profile } = useAdmin()
  const [data, setData] = useState(null)
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [savingDates, setSavingDates] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    fetchPayrollRun().then((d) => {
      setData(d)
      setLocked(d.run?.status === 'locked')
      const def = defaultRange()
      setFrom(d.run?.period_start || def.from)
      setTo(d.run?.period_end || def.to)
    }).catch(console.error)
  }, [])

  if (!data) return <div className="text-sm text-muted">Computing payroll…</div>
  const step = locked ? 4 : 3

  async function saveDates() {
    if (!data.run || savingDates || locked) return
    if (!from || !to || from > to) { flash('Pick a valid date range'); return }
    setSavingDates(true)
    try {
      await updatePayrollPeriod(data.run.id, from, to)
      flash('Pay period updated')
    } catch (e) {
      flash('Could not update period')
    } finally {
      setSavingDates(false)
    }
  }

  async function lock() {
    if (busy || !data.run) return
    if (!from || !to || from > to) { flash('Pick a valid date range first'); return }
    setBusy(true)
    try {
      await lockPayrollRun(data.run.id, { from, to })
      logActivity({
        orgId: profile.org_id,
        actorId: profile.id,
        actorName: profile.full_name,
        type: 'payroll_locked',
        message: `${profile.full_name} locked the payroll run (${from} → ${to})`,
      })
      setLocked(true)
      flash('Payroll run approved & locked')
    } catch (e) {
      flash('Could not lock run')
    } finally {
      setBusy(false)
    }
  }

  const line = (a) => <div className="flex-1 h-[2px] mx-[14px]" style={{ background: a }} />

  return (
    <div className="animate-fadeIn" id="payroll-printable">
      {/* Header (visible only when printing) */}
      <div className="hidden print:block mb-4">
        <div className="flex items-center gap-3">
          <img src={import.meta.env.BASE_URL + 'logo.png'} alt="" className="h-12 w-auto" />
          <div>
            <div className="text-lg font-extrabold">Jaway Construction Services Inc.</div>
            <div className="text-xs text-muted">Brgy. Mandurriao, Iloilo City</div>
          </div>
        </div>
        <div className="mt-2 text-sm font-bold">
          Payroll Run · {from && to ? `${longDate(from)} – ${longDate(to)}` : '—'}
        </div>
      </div>

      {/* On-screen toolbar */}
      <div className="print:hidden flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-[11px] uppercase font-bold text-muted tracking-wide block mb-1">Pay period — From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={locked}
            className="border-[1.5px] border-stroke rounded-[10px] px-3 py-[8px] text-sm tnum outline-none focus:border-brand disabled:bg-line"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase font-bold text-muted tracking-wide block mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={locked}
            className="border-[1.5px] border-stroke rounded-[10px] px-3 py-[8px] text-sm tnum outline-none focus:border-brand disabled:bg-line"
          />
        </div>
        {!locked && (
          <button
            onClick={saveDates}
            disabled={savingDates}
            className="border-[1.5px] border-stroke bg-white text-ink-soft text-sm font-semibold px-4 py-[8px] rounded-[10px] disabled:opacity-60"
          >
            {savingDates ? 'Saving…' : 'Save dates'}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="border-[1.5px] border-stroke bg-white text-ink-soft text-sm font-semibold px-4 py-[8px] rounded-[10px] inline-flex items-center gap-2"
          title="Print or Save as PDF"
        >
          🖨 Print / Download PDF
        </button>
      </div>

      {/* Selected period banner (also visible when printing) */}
      <div className="mb-4 px-4 py-3 rounded-[14px] bg-brand-tint text-[#842b12] text-sm font-semibold flex items-center gap-2">
        <span>📅</span>
        Pay period: <span className="tnum">{from && to ? `${longDate(from)} – ${longDate(to)}` : 'Pick a date range'}</span>
      </div>

      {/* stepper */}
      <Card className="flex items-center px-[22px] py-[14px] mb-[18px] overflow-x-auto print:hidden">
        <Step n={1} label="Pay period" state="done" />
        {line('#1f9d6b')}
        <Step n={2} label="Auto-compute" state="done" />
        {line(step >= 4 ? '#1f9d6b' : '#2563eb')}
        <Step n={3} label="Review" state={step >= 4 ? 'done' : 'active'} />
        {line('#eaeae7')}
        <Step n={4} label="Lock" state={locked ? 'done' : 'todo'} />
      </Card>

      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[14px]">
        <Card className="p-4"><div className="text-xs text-muted">Employees</div><div className="text-[22px] font-extrabold tnum">{data.count}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Gross pay</div><div className="text-[22px] font-extrabold tnum">{peso(data.totals.gross)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Deductions</div><div className="text-[22px] font-extrabold tnum text-red">{peso(data.totals.statutory)}</div></Card>
        <div className="bg-ink rounded-[16px] p-4 print:bg-white print:border print:border-line"><div className="text-xs text-white/60 print:text-muted">Net payout</div><div className="text-[22px] font-extrabold tnum text-[#ff9963] print:text-ink">{peso(data.totals.net)}</div></div>
      </div>

      <div className="flex items-center gap-3 bg-blue-tint rounded-[14px] px-4 py-3 mb-[14px] print:hidden">
        <span className="text-blue text-base">ⓘ</span>
        <span className="text-[13px] text-[#1b3a8f] flex-1">
          Computed automatically from attendance — regular + OT hours, late/undertime deducted, statutory contributions applied.
        </span>
      </div>

      <Card className="overflow-hidden mb-4">
        <div className="hidden md:grid print:grid grid-cols-[1.8fr_0.9fr_0.8fr_1fr_1fr_1fr] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
          <div>Employee</div><div>Reg.h</div><div>OT</div><div>Gross</div><div>Statutory</div><div>Net</div>
        </div>
        {data.rows.map((r) => (
          <div key={r.id} className="grid grid-cols-2 md:grid-cols-[1.8fr_0.9fr_0.8fr_1fr_1fr_1fr] print:grid-cols-[1.8fr_0.9fr_0.8fr_1fr_1fr_1fr] items-center px-5 py-[13px] border-b border-line last:border-0 text-sm gap-y-1">
            <div className="flex items-center gap-[10px] col-span-2 md:col-span-1 print:col-span-1">
              <Avatar name={r.full_name} src={r.avatar_url} size={30} />
              <span className="font-semibold">{r.full_name}</span>
            </div>
            <div className="tnum hidden md:block print:block">{r.regH.toFixed(1)}</div>
            <div className="tnum hidden md:block print:block">{r.otH.toFixed(1)}</div>
            <div className="tnum font-semibold">{peso(r.gross)}</div>
            <div className="tnum text-red">− {peso(r.statutory)}</div>
            <div className="tnum font-bold">{peso(r.net)}</div>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap justify-end gap-[10px] print:hidden">
        {locked ? (
          <>
            <div className="flex items-center gap-[10px] bg-green-tint text-[#15784f] rounded-xl px-[18px] py-3 text-sm font-semibold">
              🔒 Run locked — {data.count} payslips ready to generate
            </div>
            <button onClick={() => navigate('payslip')} className="border-none bg-brand text-white text-sm font-semibold px-5 py-3 rounded-xl">
              Generate payslips →
            </button>
          </>
        ) : (
          <button onClick={lock} disabled={busy} className="border-none bg-brand text-white text-sm font-semibold px-[22px] py-3 rounded-xl shadow-[0_6px_16px_rgba(37,99,235,0.28)] disabled:opacity-60">
            {busy ? 'Locking…' : 'Approve & lock run'}
          </button>
        )}
      </div>

      {/* Signature lines for printing */}
      <div className="hidden print:flex print:mt-12 gap-12 px-5 text-sm">
        <div className="flex-1 border-t-2 border-ink pt-2 text-center">
          <div className="font-semibold">Prepared by</div>
          <div className="text-muted text-xs">{profile.full_name}</div>
        </div>
        <div className="flex-1 border-t-2 border-ink pt-2 text-center">
          <div className="font-semibold">Approved by</div>
          <div className="text-muted text-xs">_________________________</div>
        </div>
      </div>
    </div>
  )
}
