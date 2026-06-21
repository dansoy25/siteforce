import { useEffect, useState, useCallback } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchLeaveQueue, decideLeave } from '../../lib/adminApi'
import { logActivity } from '../../lib/api'
import { Card, Avatar, Pill } from '../ui'
import { shortDate } from '../../lib/format'

export default function Leave() {
  const { flash, profile } = useAdmin()
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => {
    fetchLeaveQueue().then(setRows).catch(() => setRows([]))
  }, [])
  useEffect(() => { load() }, [load])

  const pending = rows.filter((r) => r.status === 'pending')

  async function decide(id, decision) {
    setBusy(id)
    try {
      const req = rows.find((r) => r.id === id)
      await decideLeave(id, decision, profile.full_name, decision === 'rejected' ? 'Reviewed by admin.' : null)
      logActivity({
        orgId: profile.org_id,
        actorId: profile.id,
        actorName: profile.full_name,
        type: decision === 'approved' ? 'leave_approved' : 'leave_rejected',
        message: `${profile.full_name} ${decision} ${req?.profile?.full_name || 'a worker'}'s leave`,
      })
      flash(decision === 'approved' ? 'Leave approved' : 'Leave rejected')
      load()
    } catch (e) {
      flash('Action failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[18px]">
      {/* queue */}
      <div className="flex flex-col gap-[14px]">
        <div className="text-[15px] font-bold">Approval queue {pending.length > 0 && <span className="text-muted font-semibold">· {pending.length}</span>}</div>

        {pending.length === 0 && (
          <Card className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-tint text-green flex items-center justify-center text-2xl mx-auto mb-3.5">✓</div>
            <div className="text-base font-bold">All caught up</div>
            <div className="text-[13px] text-muted mt-1">No pending leave requests to review.</div>
          </Card>
        )}

        {pending.map((r) => (
          <Card key={r.id} className="p-[18px]">
            <div className="flex gap-3 items-center mb-3">
              <Avatar name={r.profile?.full_name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold truncate">{r.profile?.full_name}</div>
                <div className="text-[13px] text-muted truncate">{r.profile?.position} · {r.profile?.site?.name}</div>
              </div>
              <Pill kind={r.leave_type?.name?.toLowerCase().includes('sick') ? 'sick' : r.leave_type?.name?.toLowerCase().includes('emerg') ? 'emergency' : 'vacation'}>
                {r.leave_type?.name?.replace(' leave', '')}
              </Pill>
            </div>
            <div className="flex gap-5 py-3 border-y border-line mb-3">
              <div><div className="text-[11px] text-faint">Dates</div><div className="text-sm font-semibold tnum">{shortDate(r.date_from)} – {shortDate(r.date_to).replace(/^\w+ /, '')}</div></div>
              <div><div className="text-[11px] text-faint">Days</div><div className="text-sm font-semibold tnum">{Number(r.days)}</div></div>
            </div>
            {r.reason && <div className="text-[13px] text-ink-soft mb-3.5">“{r.reason}”</div>}
            <div className="flex gap-[10px] justify-end">
              <button onClick={() => decide(r.id, 'rejected')} disabled={busy === r.id}
                      className="border-[1.5px] border-[#fce9e9] bg-[#fce9e9] text-red text-[13px] font-semibold px-4 py-[9px] rounded-[11px] disabled:opacity-60">
                Reject
              </button>
              <button onClick={() => decide(r.id, 'approved')} disabled={busy === r.id}
                      className="border-none bg-green text-white text-[13px] font-semibold px-[18px] py-[9px] rounded-[11px] disabled:opacity-60">
                Approve
              </button>
            </div>
          </Card>
        ))}

        {/* recent decisions */}
        {rows.filter((r) => r.status !== 'pending').length > 0 && (
          <>
            <div className="text-[15px] font-bold mt-2">Recently decided</div>
            {rows.filter((r) => r.status !== 'pending').slice(0, 5).map((r) => (
              <Card key={r.id} className="p-4 flex items-center gap-3">
                <Avatar name={r.profile?.full_name} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{r.profile?.full_name} · {r.leave_type?.name?.replace(' leave', '')}</div>
                  <div className="text-xs text-faint tnum">{shortDate(r.date_from)} – {shortDate(r.date_to).replace(/^\w+ /, '')}</div>
                </div>
                <Pill kind={r.status} />
              </Card>
            ))}
          </>
        )}
      </div>

      {/* calendar */}
      <Card className="p-[18px] h-fit">
        <div className="text-[15px] font-bold mb-3.5">Team calendar · June</div>
        <div className="grid grid-cols-7 gap-[5px] text-[11px] text-faint text-center mb-1.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-[5px] text-xs text-center text-ink-soft">
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1
            const leaveDay = [24, 25, 26].includes(day)
            return (
              <div key={day} className="py-[7px] rounded-lg" style={leaveDay ? { background: '#e8eefe', color: '#3b6ff0' } : undefined}>
                {day}
              </div>
            )
          })}
        </div>
        <div className="flex gap-[14px] mt-3">
          <span className="inline-flex items-center gap-[5px] text-[11px] text-muted"><span className="w-2 h-2 rounded-full bg-blue" />Vacation</span>
          <span className="inline-flex items-center gap-[5px] text-[11px] text-muted"><span className="w-2 h-2 rounded-full bg-red" />Sick</span>
        </div>
      </Card>
    </div>
  )
}
