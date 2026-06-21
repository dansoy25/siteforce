import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchSites, updateSiteRadius, fetchOrgSettings, fetchRoles, fetchOrganization, updateCompanyCode } from '../../lib/adminApi'
import { Card } from '../ui'
import { peso } from '../../lib/format'
import { AddEmployeeModal, AddProjectModal, AddInventoryModal } from '../AddRecordModals'

export default function Settings() {
  const { flash, profile } = useAdmin()
  const [tab, setTab] = useState('manage')
  const [modal, setModal] = useState(null) // 'employee' | 'project' | 'inventory'
  const [sites, setSites] = useState([])
  const [siteId, setSiteId] = useState('')
  const [radius, setRadius] = useState(120)
  const [settings, setSettings] = useState(null)
  const [roles, setRoles] = useState([])
  const [org, setOrg] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [codeBusy, setCodeBusy] = useState(false)

  useEffect(() => {
    fetchSites().then((s) => {
      setSites(s)
      if (s[0]) { setSiteId(s[0].id); setRadius(s[0].radius_m) }
    })
    fetchOrgSettings().then(setSettings)
    fetchRoles().then(setRoles)
    fetchOrganization().then((o) => { setOrg(o); setCode(o?.code || '') })
  }, [])

  async function saveCode() {
    if (codeBusy || !org) return
    setCodeBusy(true)
    try {
      const updated = await updateCompanyCode(org.id, code)
      setOrg((o) => ({ ...o, code: updated.code }))
      setCode(updated.code)
      flash('Company code updated')
    } catch (e) {
      flash(e.message || 'Could not update company code')
    } finally {
      setCodeBusy(false)
    }
  }

  const site = sites.find((s) => s.id === siteId)

  function onPickSite(id) {
    setSiteId(id)
    const s = sites.find((x) => x.id === id)
    if (s) setRadius(s.radius_m)
  }

  async function saveRadius() {
    if (busy || !siteId) return
    setBusy(true)
    try {
      await updateSiteRadius(siteId, radius)
      setSites((prev) => prev.map((s) => (s.id === siteId ? { ...s, radius_m: radius } : s)))
      flash('Geofence radius saved')
    } catch (e) {
      flash('Could not save')
    } finally {
      setBusy(false)
    }
  }

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)} className="border-none px-4 py-2 rounded-[7px] text-[13px] font-semibold"
            style={{ background: tab === id ? '#fff' : 'transparent', color: '#131312' }}>
      {label}
    </button>
  )

  const Toggle = ({ on }) => (
    <div className="w-[42px] h-6 rounded-full relative" style={{ background: on ? '#f25c1f' : '#dcdcd8' }}>
      <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white" style={{ right: on ? '3px' : '21px' }} />
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <div className="inline-flex bg-[#f4f4f2] rounded-[10px] p-[3px] gap-[3px] mb-4 flex-wrap">
        <Tab id="manage" label="Manage" />
        <Tab id="company" label="Company" />
        <Tab id="geofence" label="Geofence" />
        <Tab id="pay" label="Pay rules" />
        <Tab id="roles" label="Roles" />
      </div>

      {tab === 'manage' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] max-w-[760px]">
          <ManageCard icon="👷" title="Add employee" desc="Create a login account + 6-digit PIN for a new worker or admin." onClick={() => setModal('employee')} />
          <ManageCard icon="🏗" title="Add project" desc="Register a new project site with status and progress." onClick={() => setModal('project')} />
          <ManageCard icon="📦" title="Add inventory" desc="Add a stock item; status is computed from reorder level." onClick={() => setModal('inventory')} />
        </div>
      )}

      {tab === 'company' && (
        <Card className="p-[18px] max-w-[520px]">
          <div className="text-[15px] font-bold mb-1">Company code</div>
          <div className="text-[13px] text-muted mb-4">
            Workers and admins must enter this code to sign in. Changing it means
            everyone uses the new code on their next login.
          </div>
          <label className="text-xs font-semibold text-ink-soft mb-1.5 block">Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              spellCheck={false}
              className="flex-1 border-[1.5px] border-stroke rounded-[12px] px-3 py-[10px] text-sm font-semibold tnum uppercase outline-none focus:border-orange"
            />
            <button
              onClick={saveCode}
              disabled={codeBusy || !code.trim() || code.trim() === org?.code}
              className="border-none bg-orange text-white text-sm font-semibold px-4 py-[10px] rounded-[12px] disabled:opacity-50"
            >
              {codeBusy ? 'Saving…' : 'Save'}
            </button>
          </div>
          {org && (
            <div className="text-xs text-faint mt-2">
              Organization: <span className="font-semibold text-ink-soft">{org.name}</span>
            </div>
          )}
        </Card>
      )}

      {tab === 'geofence' && (
        <Card className="overflow-hidden flex flex-col" >
          <div className="px-5 py-4 border-b border-line flex flex-wrap items-center gap-3 justify-between">
            <span className="text-[15px] font-bold">Geofence zone editor</span>
            <select value={siteId} onChange={(e) => onPickSite(e.target.value)}
                    className="border-[1.5px] border-stroke rounded-[10px] px-3 py-2 text-sm outline-none focus:border-orange">
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="relative h-[420px] bg-[#e4e4df]"
               style={{
                 backgroundImage: 'linear-gradient(rgba(155,155,150,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(155,155,150,.2) 1px,transparent 1px)',
                 backgroundSize: '38px 38px',
               }}>
            <div className="absolute top-1/2 left-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
                 style={{ width: radius * 1.8, height: radius * 1.8, maxWidth: 360, maxHeight: 360, background: 'rgba(242,92,31,.12)', border: '2px solid #f25c1f' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange border-[3px] border-white" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink text-white text-[11px] font-semibold px-[9px] py-[5px] rounded-lg tnum">
              radius {radius} m
            </div>
          </div>
          <div className="px-5 py-4 border-t border-line flex flex-wrap items-center gap-4">
            <span className="text-[13px] text-ink-soft">Radius</span>
            <input type="range" min="40" max="300" step="10" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 min-w-[160px] accent-orange" />
            <span className="tnum text-sm font-semibold w-[60px]">{radius} m</span>
            <button onClick={saveRadius} disabled={busy} className="border-none bg-orange text-white text-sm font-semibold px-4 py-2 rounded-[10px] disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Card>
      )}

      {tab === 'pay' && settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-[18px]">
            <div className="text-[15px] font-bold mb-3.5">Pay rules</div>
            <PayRow label="Base rate (default)" value={peso(settings.base_rate)} />
            <PayRow label="OT multiplier" value={`${Number(settings.ot_multiplier)}×`} />
            <PayRow label="Meal allowance / day" value={peso(settings.meal_allowance)} last />
          </Card>
          <Card className="p-[18px]">
            <div className="text-[15px] font-bold mb-3">Statutory deductions</div>
            {[['SSS', settings.sss], ['PhilHealth', settings.philhealth], ['Pag-IBIG', settings.pagibig], ['Withholding tax', settings.withholding]].map(([name, on], i, arr) => (
              <div key={name} className={'flex justify-between items-center py-2 ' + (i < arr.length - 1 ? 'border-b border-line' : '')}>
                <span className="text-sm">{name}</span>
                <Toggle on={on} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'roles' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
            <div>Role</div><div>Permissions</div><div>Members</div>
          </div>
          {roles.map((r) => (
            <div key={r.id} className="grid grid-cols-[2fr_2fr_1fr] items-center px-5 py-[14px] border-b border-line last:border-0 text-sm">
              <div className="font-semibold">{r.name}</div>
              <div className="text-ink-soft">{r.permissions}</div>
              <div className="tnum">{r.member_count}</div>
            </div>
          ))}
        </Card>
      )}

      {modal === 'employee' && (
        <AddEmployeeModal profile={profile} sites={sites} flash={flash} onClose={() => setModal(null)} onDone={() => {}} />
      )}
      {modal === 'project' && (
        <AddProjectModal profile={profile} sites={sites} flash={flash} onClose={() => setModal(null)} onDone={() => {}} />
      )}
      {modal === 'inventory' && (
        <AddInventoryModal profile={profile} flash={flash} onClose={() => setModal(null)} onDone={() => {}} />
      )}
    </div>
  )
}

function ManageCard({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-[18px] p-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.08)] hover:shadow-md transition border-none"
    >
      <div className="w-[42px] h-[42px] rounded-xl bg-orange-tint text-orange flex items-center justify-center text-xl mb-3">{icon}</div>
      <div className="text-[15px] font-bold mb-1">{title}</div>
      <div className="text-[13px] text-muted leading-snug">{desc}</div>
      <div className="text-[13px] text-orange font-semibold mt-3">+ Open</div>
    </button>
  )
}

function PayRow({ label, value, last }) {
  return (
    <div className={'flex justify-between items-center py-[9px] ' + (last ? '' : 'border-b border-line')}>
      <span className="text-sm text-ink-soft">{label}</span>
      <div className="border-[1.5px] border-stroke rounded-[10px] px-3 py-[7px] text-sm font-semibold tnum">{value}</div>
    </div>
  )
}
