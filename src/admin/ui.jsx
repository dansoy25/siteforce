import { initials, avatarColor } from '../lib/format'

export function Avatar({ name, size = 34, color }) {
  return (
    <div
      className="rounded-full text-white flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: color || avatarColor(name),
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </div>
  )
}

const STATUS = {
  present: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Present' },
  ongoing: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Present' },
  late: { bg: '#fcf1df', fg: '#e0982e', label: 'Late' },
  absent: { bg: '#f4f4f2', fg: '#9b9b96', label: 'Absent' },
  on_leave: { bg: '#e8eefe', fg: '#3b6ff0', label: 'On leave' },
  active: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Active' },
  inactive: { bg: '#f4f4f2', fg: '#9b9b96', label: 'Inactive' },
  in_stock: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'In stock' },
  low: { bg: '#fcf1df', fg: '#e0982e', label: 'Low stock' },
  critical: { bg: '#fce9e9', fg: '#e04444', label: 'Critical' },
  pending: { bg: '#fcf1df', fg: '#e0982e', label: 'Pending' },
  approved: { bg: '#e7f6ef', fg: '#1f9d6b', label: 'Approved' },
  rejected: { bg: '#fce9e9', fg: '#e04444', label: 'Rejected' },
  vacation: { bg: '#e8eefe', fg: '#3b6ff0', label: 'Vacation' },
  sick: { bg: '#fce9e9', fg: '#e04444', label: 'Sick' },
  emergency: { bg: '#fcf1df', fg: '#e0982e', label: 'Emergency' },
}

export function Pill({ kind, children }) {
  const s = STATUS[kind] || { bg: '#f4f4f2', fg: '#55554f', label: children }
  return (
    <span
      className="inline-flex items-center gap-[5px] text-xs font-semibold px-[10px] py-[4px] rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {children || s.label}
    </span>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={'bg-white rounded-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.08)] ' + className}>
      {children}
    </div>
  )
}
