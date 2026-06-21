import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import { fetchLeaveBalances, fetchLeaveTypes, submitLeave, logActivity } from '../lib/api'

function daysBetween(from, to) {
  if (!from || !to) return 1
  const a = new Date(from)
  const b = new Date(to)
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

export default function Leave() {
  const { profile } = useAuth()
  const { navigate, flash } = useShell()

  const [balances, setBalances] = useState([])
  const [types, setTypes] = useState([])
  const [typeId, setTypeId] = useState('')
  const [from, setFrom] = useState('2026-06-24')
  const [to, setTo] = useState('2026-06-26')
  const [reason, setReason] = useState('Family matter in the province…')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchLeaveBalances(profile.id).then(setBalances).catch(() => {})
    fetchLeaveTypes().then((t) => {
      setTypes(t)
      if (t.length) setTypeId(t.find((x) => x.code === 'vacation')?.id || t[0].id)
    })
  }, [profile.id])

  async function onSubmit() {
    if (busy || !typeId) return
    setBusy(true)
    try {
      await submitLeave({
        profileId: profile.id,
        orgId: profile.org_id,
        leaveTypeId: typeId,
        from,
        to,
        days: daysBetween(from, to),
        reason,
      })
      logActivity({
        orgId: profile.org_id,
        actorId: profile.id,
        actorName: profile.full_name,
        type: 'leave_request',
        message: `${profile.full_name} requested leave`,
      })
      flash('Leave request submitted')
      navigate('requests')
    } catch (e) {
      flash('Could not submit request')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="px-[22px] pt-2 pb-[14px] flex justify-between items-center">
        <div className="text-[22px] font-extrabold tracking-tight">Leave</div>
        <button
          onClick={() => navigate('requests')}
          className="border-none bg-[#f4f4f2] text-ink-soft text-[13px] font-semibold px-[14px] py-2 rounded-full"
        >
          My requests
        </button>
      </div>

      <div className="px-[18px] pb-[14px] flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-[10px]">
          {balances.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl px-3 py-[14px] shadow-[0_1px_3px_rgba(10,10,9,0.08)]"
            >
              <div
                className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[13px] mb-[10px]"
                style={{ background: (b.leave_type?.color || '#3b6ff0') + '22', color: b.leave_type?.color }}
              >
                {b.leave_type?.icon}
              </div>
              <div className="text-[22px] font-extrabold tnum">{Number(b.balance)}</div>
              <div className="text-[11px] text-muted">{b.leave_type?.name?.replace(' leave', '')}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[20px] p-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.08)]">
          <div className="text-[15px] font-bold mb-[14px]">Request leave</div>

          <label className="text-xs font-semibold text-ink-soft mb-[6px] block">Type</label>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="w-full border-[1.5px] border-stroke rounded-xl px-[14px] py-[11px] text-sm mb-3 bg-white outline-none focus:border-orange appearance-none"
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="flex gap-[10px] mb-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-ink-soft mb-[6px] block">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border-[1.5px] border-stroke rounded-xl px-3 py-[11px] text-sm tnum outline-none focus:border-orange"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-ink-soft mb-[6px] block">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border-[1.5px] border-stroke rounded-xl px-3 py-[11px] text-sm tnum outline-none focus:border-orange"
              />
            </div>
          </div>

          <label className="text-xs font-semibold text-ink-soft mb-[6px] block">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full border-[1.5px] border-stroke rounded-xl px-[14px] py-[11px] text-sm mb-[14px] outline-none focus:border-orange resize-none"
          />

          <button
            onClick={onSubmit}
            disabled={busy}
            className="w-full border-none bg-orange text-white text-[15px] font-semibold py-[14px] rounded-[13px] shadow-[0_6px_16px_rgba(242,92,31,0.28)] disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  )
}
