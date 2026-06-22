import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui'
import BrandLogo from '../components/BrandLogo'
import Toast from '../components/Toast'
import NotificationBell from './NotificationBell'

import Dashboard from './screens/Dashboard'
import Attendance from './screens/Attendance'
import Projects from './screens/Projects'
import ProjectDetail from './screens/ProjectDetail'
import Inventory from './screens/Inventory'
import Payroll from './screens/Payroll'
import Payslip from './screens/Payslip'
import Leave from './screens/Leave'
import Employees from './screens/Employees'
import Settings from './screens/Settings'

const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

const TITLES = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  projects: 'Projects',
  projectDetail: 'Project detail',
  inventory: 'Inventory',
  payroll: 'Payroll',
  payslip: 'Payslips',
  leave: 'Leave management',
  employees: 'Employees',
  settings: 'Settings',
}

function NavIcon({ name, color }) {
  const c = { width: 19, height: 19, fill: 'none', stroke: color, strokeWidth: 2 }
  switch (name) {
    case 'dashboard':
      return (<svg {...c}><rect x="2" y="2" width="6" height="6" rx="1.5" /><rect x="11" y="2" width="6" height="6" rx="1.5" /><rect x="2" y="11" width="6" height="6" rx="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" /></svg>)
    case 'attendance':
      return (<svg {...c}><circle cx="9.5" cy="9.5" r="7.5" /><path d="M9.5 5v5l3 2" /></svg>)
    case 'projects':
      return (<svg {...c}><path d="M2 6.5h15M2 6.5v9a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-9M6 6.5v-3h7v3" /></svg>)
    case 'inventory':
      return (<svg {...c}><path d="M3 6l6.5-3.5L16 6v7l-6.5 3.5L3 13z" /><path d="M3 6l6.5 3.5L16 6M9.5 9.5v7" /></svg>)
    case 'payroll':
      return (<svg {...c}><rect x="2" y="3" width="15" height="13" rx="2" /><path d="M2 7.5h15M6 12h3" /></svg>)
    case 'payslip':
      return (<svg {...c}><rect x="3" y="2" width="13" height="15" rx="2" /><path d="M6 6h7M6 9.5h7M6 13h4" /></svg>)
    case 'leave':
      return (<svg {...c}><rect x="2" y="4" width="15" height="13" rx="2" /><path d="M2 8h15M6.5 2v4M12.5 2v4" /></svg>)
    case 'employees':
      return (<svg {...c}><circle cx="9.5" cy="6.5" r="3.5" /><path d="M3 17c0-3.5 3-5.5 6.5-5.5S16 13.5 16 17" /></svg>)
    case 'settings':
      return (<svg {...c}><circle cx="9.5" cy="9.5" r="3" /><path d="M9.5 1.5v3M9.5 14.5v3M1.5 9.5h3M14.5 9.5h3" /></svg>)
    default:
      return null
  }
}

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'projects', label: 'Projects', match: ['projects', 'projectDetail'] },
  { key: 'inventory', label: 'Inventory' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'payslip', label: 'Payslips' },
  { key: 'leave', label: 'Leave' },
  { key: 'employees', label: 'Employees' },
]

export default function AdminShell() {
  const { profile, signOut } = useAuth()
  const [screen, setScreen] = useState('dashboard')
  const [params, setParams] = useState({})
  const [toast, setToast] = useState('')
  const [drawer, setDrawer] = useState(false)
  const toastTimer = useRef(null)

  const navigate = useCallback((next, p = {}) => {
    setParams(p)
    setScreen(next)
    setDrawer(false)
  }, [])

  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  const render = () => {
    switch (screen) {
      case 'dashboard': return <Dashboard />
      case 'attendance': return <Attendance />
      case 'projects': return <Projects />
      case 'projectDetail': return <ProjectDetail />
      case 'inventory': return <Inventory />
      case 'payroll': return <Payroll />
      case 'payslip': return <Payslip />
      case 'leave': return <Leave />
      case 'employees': return <Employees />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  const ORANGE = '#f25c1f'
  const MUTED = '#55554f'

  const SidebarItem = ({ item }) => {
    const active = (item.match || [item.key]).includes(screen)
    const color = active ? ORANGE : MUTED
    return (
      <button
        onClick={() => navigate(item.key)}
        className="w-full border-none text-left flex items-center gap-[11px] px-3 py-[11px] rounded-[11px] text-sm font-semibold mb-[3px]"
        style={{ background: active ? '#fff3ec' : 'transparent', color }}
      >
        <NavIcon name={item.key} color={color} />
        {item.label}
      </button>
    )
  }

  const Sidebar = () => (
    <div className="w-[236px] bg-white border-r border-[#eaeae7] flex flex-col px-4 py-[22px] h-full shrink-0">
      <div className="flex items-center gap-[10px] px-2 pb-6">
        <BrandLogo
          imgClass="h-10 w-auto object-contain shrink-0"
          fallback={<div className="w-9 h-9 rounded-[11px] bg-orange flex items-center justify-center text-white text-lg font-extrabold shrink-0">J</div>}
        />
        <div className="leading-tight min-w-0">
          <div className="text-[14px] font-extrabold leading-tight">Jaway Construction Services Inc.</div>
          <div className="text-[10px] text-faint truncate">by TingSync</div>
        </div>
      </div>
      {NAV.map((item) => <SidebarItem key={item.key} item={item} />)}
      <div className="flex-1" />
      <SidebarItem item={{ key: 'settings', label: 'Settings' }} />
      <div className="flex items-center gap-[10px] px-2 py-3 mt-2 border-t border-line">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={34} color="#842b12" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{profile.full_name}</div>
          <div className="text-[11px] text-faint truncate">{profile.position}</div>
        </div>
      </div>
      <button
        onClick={signOut}
        className="mt-1 w-full border border-[#fce9e9] bg-[#fce9e9] text-red text-sm font-semibold py-[10px] rounded-[11px] flex items-center justify-center gap-2 hover:brightness-95 transition"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        Log out
      </button>
    </div>
  )

  const ctx = { screen, params, navigate, flash, profile }

  return (
    <AdminContext.Provider value={ctx}>
      <div className="h-[100dvh] w-full bg-[#f4f4f2] flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block"><Sidebar /></div>

        {/* Mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute left-0 top-0 bottom-0"><Sidebar /></div>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b border-[#eaeae7] flex items-center px-4 sm:px-6 gap-4 shrink-0">
            <button
              onClick={() => setDrawer(true)}
              className="lg:hidden border-none bg-[#f4f4f2] w-9 h-9 rounded-[10px] flex items-center justify-center"
              aria-label="Menu"
            >
              <svg width="18" height="18" fill="none" stroke="#131312" strokeWidth="2"><path d="M2 4h14M2 9h14M2 14h14" /></svg>
            </button>
            <div className="text-[19px] font-extrabold">{TITLES[screen]}</div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-[10px] border-[1.5px] border-stroke rounded-[11px] px-[13px] py-2 w-[240px] text-faint text-[13px]">
              ⌕ Search…
            </div>
            <NotificationBell />
            <Avatar name={profile.full_name} src={profile.avatar_url} size={38} color="#842b12" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">{render()}</div>
        </div>

        <Toast message={toast} />
      </div>
    </AdminContext.Provider>
  )
}
