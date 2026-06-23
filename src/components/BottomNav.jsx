const ORANGE = '#2563eb'
const MUTED = '#9b9b96'

function Icon({ name, color }) {
  const common = { width: 24, height: 24, fill: 'none', stroke: color, strokeWidth: 2 }
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
      )
    case 'attendance':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'leave':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'payslips':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      )
    default:
      return null
  }
}

const ITEMS = [
  { key: 'home', label: 'Home', match: ['home'] },
  { key: 'attendance', label: 'Attendance', match: ['attendance'] },
  { key: 'leave', label: 'Leave', match: ['leave', 'requests'] },
  { key: 'payslips', label: 'Payslips', match: ['payslips', 'payslipDetail'] },
  { key: 'profile', label: 'Profile', match: ['profile'] },
]

export default function BottomNav({ screen, onNavigate }) {
  return (
    <div className="flex justify-around items-center px-2 pt-[10px] pb-[22px] bg-white border-t border-line shrink-0">
      {ITEMS.map((item) => {
        const active = item.match.includes(screen)
        const color = active ? ORANGE : MUTED
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="border-none bg-transparent flex flex-col items-center gap-[3px]"
            style={{ color }}
          >
            <Icon name={item.key} color={color} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
