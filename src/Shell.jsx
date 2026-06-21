import { createContext, useContext, useState, useCallback, useRef } from 'react'
import PhoneFrame from './components/PhoneFrame'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'

import Home from './screens/Home'
import CheckIn from './screens/CheckIn'
import Attendance from './screens/Attendance'
import Leave from './screens/Leave'
import Requests from './screens/Requests'
import Payslips from './screens/Payslips'
import PayslipDetail from './screens/PayslipDetail'
import Profile from './screens/Profile'

const ShellContext = createContext(null)
export const useShell = () => useContext(ShellContext)

const NAV_SCREENS = [
  'home',
  'attendance',
  'leave',
  'requests',
  'payslips',
  'payslipDetail',
  'profile',
]

export default function Shell() {
  const [screen, setScreen] = useState('home')
  const [params, setParams] = useState({})
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const navigate = useCallback((next, p = {}) => {
    setParams(p)
    setScreen(next)
  }, [])

  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  // Per-screen shell background.
  const inCheckin = screen === 'checkin'
  const shellBg = '#fafaf9'

  const ctx = { screen, params, navigate, flash }

  const render = () => {
    switch (screen) {
      case 'home':
        return <Home />
      case 'checkin':
        return <CheckIn onShellBg={() => {}} />
      case 'attendance':
        return <Attendance />
      case 'leave':
        return <Leave />
      case 'requests':
        return <Requests />
      case 'payslips':
        return <Payslips />
      case 'payslipDetail':
        return <PayslipDetail />
      case 'profile':
        return <Profile />
      default:
        return <Home />
    }
  }

  // Check-in manages its own dark/green background internally, so we let it paint
  // full-bleed by giving the shell a neutral dark base while in that flow.
  if (inCheckin) {
    return (
      <ShellContext.Provider value={ctx}>
        <PhoneFrame bg="#0a0a09">
          <CheckIn />
          <Toast message={toast} />
        </PhoneFrame>
      </ShellContext.Provider>
    )
  }

  return (
    <ShellContext.Provider value={ctx}>
      <PhoneFrame bg={shellBg}>
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">{render()}</div>
        {NAV_SCREENS.includes(screen) && (
          <BottomNav screen={screen} onNavigate={(k) => navigate(k)} />
        )}
        <Toast message={toast} />
      </PhoneFrame>
    </ShellContext.Provider>
  )
}
