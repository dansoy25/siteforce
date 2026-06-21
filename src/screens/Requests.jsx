import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import { fetchLeaveRequests } from '../lib/api'
import { shortDate, longDate } from '../lib/format'

const STATUS = {
  pending: { bg: '#fcf1df', fg: '#e0982e', label: 'Pending' },
  approved: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Approved' },
  rejected: { bg: '#fce9e9', fg: '#e04444', label: 'Rejected' },
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span
      className="inline-flex items-center gap-[5px] text-xs font-semibold px-[10px] py-[5px] rounded-full"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  )
}

export default function Requests() {
  const { profile } = useAuth()
  const { navigate } = useShell()
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetchLeaveRequests(profile.id).then(setRows).catch(() => setRows([]))
  }, [profile.id])

  return (
    <div className="animate-fadeIn">
      <div className="px-[22px] pt-2 pb-2 flex items-center gap-[14px]">
        <button
          onClick={() => navigate('leave')}
          className="border-none bg-transparent text-[22px] text-ink-soft p-0"
        >
          ‹
        </button>
        <div className="text-xl font-extrabold">My requests</div>
      </div>

      <div className="px-[18px] py-[14px] flex flex-col gap-[14px]">
        {rows.map((r) => {
          const range =
            r.date_from === r.date_to
              ? shortDate(r.date_from)
              : `${shortDate(r.date_from)} – ${shortDate(r.date_to).replace(/^[A-Za-z]+ /, '')}`
          return (
            <div
              key={r.id}
              className="bg-white rounded-[20px] p-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.08)]"
              style={r.status === 'pending' ? { border: '1.5px solid #ffe2d2' } : undefined}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-[15px] font-bold">{r.leave_type?.name || 'Leave'}</div>
                  <div className="text-[13px] text-muted tnum">
                    {range} · {Number(r.days)} day{Number(r.days) > 1 ? 's' : ''}
                  </div>
                </div>
                <Badge status={r.status} />
              </div>

              {r.status === 'pending' && (
                <div className="text-xs text-faint">
                  Submitted {longDate(r.created_at?.slice(0, 10))} · awaiting approval
                </div>
              )}
              {r.status === 'approved' && r.reviewer_name && (
                <div className="text-xs text-faint">Approved by {r.reviewer_name}</div>
              )}
              {r.status === 'rejected' && r.decision_note && (
                <div className="bg-[#fce9e9] rounded-xl px-3 py-[10px] text-xs text-[#842b12] mt-1">
                  “{r.decision_note}”{r.reviewer_name ? ` — ${r.reviewer_name}` : ''}
                </div>
              )}
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="text-center text-sm text-muted py-10">No leave requests yet.</div>
        )}
      </div>
    </div>
  )
}
