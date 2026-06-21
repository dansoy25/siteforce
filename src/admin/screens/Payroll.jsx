import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchPayrollRun, lockPayrollRun } from '../../lib/adminApi'
import { logActivity } from '../../lib/api'
import { Card, Avatar } from '../ui'
import { peso } from '../../lib/format'

function Step({ n, label, state }) {
  // state: 'done' | 'active' | 'todo'
  const bg = state === 'done' ? '#1f9d6b' : state === 'active' ? '#f25c1f' : '#eaeae7'
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

export default function Payroll() {
  const { navigate, flash, profile } = useAdmin()
  const [data, setData] = useState(null)
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchPayrollRun().then((d) => {
      setData(d)
      setLocked(d.run?.status === 'locked')
    }).catch(console.error)
  }, [])

  if (!data) return <div className="text-sm text-muted">Computing payroll…</div>
  const step = locked ? 4 : 3

  async function lock() {
    if (busy || !data.run) return
    setBusy(true)
    try {
      await lockPayrollRun(data.run.id)
      logActivity({
        orgId: profile.org_id,
        actorId: profile.id,
        actorName: profile.full_name,
        type: 'payroll_locked',
        message: `${profile.full_name} locked the payroll run`,
      })
      setLocked(true)
      flash('Payroll run approved & locked')
    } catch (e) {
      flash('Could not lock run')
    } finally {
      setBusy(false)
    }
  }

  const line = (a, b) => <div className="flex-1 h-[2px] mx-[14px]" style={{ background: a }} />

  return (
    <div className="animate-fadeIn">
      {/* stepper */}
      <Card className="flex items-center px-[22px] py-[14px] mb-[18px] overflow-x-auto">
        <Step n={1} label="Pay period" state="done" />
        {line('#1f9d6b')}
        <Step n={2} label="Auto-compute" state="done" />
        {line(step >= 4 ? '#1f9d6b' : '#f25c1f')}
        <Step n={3} label="Review" state={step >= 4 ? 'done' : 'active'} />
        {line('#eaeae7')}
        <Step n={4} label="Lock" state={locked ? 'done' : 'todo'} />
      </Card>

      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[14px]">
        <Card className="p-4"><div className="text-xs text-muted">Employees</div><div className="text-[22px] font-extrabold tnum">{data.count}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Gross pay</div><div className="text-[22px] font-extrabold tnum">{peso(data.totals.gross)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted">Deductions</div><div className="text-[22px] font-extrabold tnum text-red">{peso(data.totals.statutory)}</div></Card>
        <div className="bg-ink rounded-[16px] p-4"><div className="text-xs text-white/60">Net payout</div><div className="text-[22px] font-extrabold tnum text-[#ff9963]">{peso(data.totals.net)}</div></div>
      </div>

      <div className="flex items-center gap-3 bg-blue-tint rounded-[14px] px-4 py-3 mb-[14px]">
        <span className="text-blue text-base">ⓘ</span>
        <span className="text-[13px] text-[#1b3a8f] flex-1">
          Computed automatically from attendance — regular + OT hours, late/undertime deducted, SSS · PhilHealth · Pag-IBIG · tax applied.
        </span>
      </div>

      <Card className="overflow-hidden mb-4">
        <div className="hidden md:grid grid-cols-[1.8fr_0.9fr_0.8fr_1fr_1fr_1fr] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
          <div>Employee</div><div>Reg.h</div><div>OT</div><div>Gross</div><div>Statutory</div><div>Net</div>
        </div>
        {data.rows.map((r) => (
          <div key={r.id} className="grid grid-cols-2 md:grid-cols-[1.8fr_0.9fr_0.8fr_1fr_1fr_1fr] items-center px-5 py-[13px] border-b border-line last:border-0 text-sm gap-y-1">
            <div className="flex items-center gap-[10px] col-span-2 md:col-span-1">
              <Avatar name={r.full_name} src={r.avatar_url} size={30} />
              <span className="font-semibold">{r.full_name}</span>
            </div>
            <div className="tnum hidden md:block">{r.regH.toFixed(1)}</div>
            <div className="tnum hidden md:block">{r.otH.toFixed(1)}</div>
            <div className="tnum font-semibold">{peso(r.gross)}</div>
            <div className="tnum text-red">− {peso(r.statutory)}</div>
            <div className="tnum font-bold">{peso(r.net)}</div>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap justify-end gap-[10px]">
        {locked ? (
          <>
            <div className="flex items-center gap-[10px] bg-green-tint text-[#15784f] rounded-xl px-[18px] py-3 text-sm font-semibold">
              🔒 Run locked — {data.count} payslips ready to generate
            </div>
            <button onClick={() => navigate('payslip')} className="border-none bg-orange text-white text-sm font-semibold px-5 py-3 rounded-xl">
              Generate payslips →
            </button>
          </>
        ) : (
          <button onClick={lock} disabled={busy} className="border-none bg-orange text-white text-sm font-semibold px-[22px] py-3 rounded-xl shadow-[0_6px_16px_rgba(242,92,31,0.28)] disabled:opacity-60">
            {busy ? 'Locking…' : 'Approve & lock run'}
          </button>
        )}
      </div>
    </div>
  )
}
