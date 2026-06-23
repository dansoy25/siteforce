import { useRef, useState } from 'react'
import Modal, { Field, inputCls } from './Modal'
import Avatar from '../components/Avatar'
import { createEmployee, createProject, createInventoryItem } from '../lib/adminApi'
import { logActivity, uploadAvatar } from '../lib/api'

/* ----------------------- Add Employee ----------------------- */
export function AddEmployeeModal({ profile, sites, onClose, onDone, flash }) {
  const [f, setF] = useState({
    full_name: '', email: '', position: '', daily_rate: '', site_id: '',
    schedule: 'Mon–Sat · 8–5', phone: '', is_admin: false,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null) // { pin, employee_code, email }
  const [photo, setPhoto] = useState(null) // File
  const [photoPreview, setPhotoPreview] = useState('')
  const fileRef = useRef(null)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function pickPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function submit() {
    if (busy) return
    if (!f.full_name.trim() || !f.email.trim()) { setErr('Full name and email are required.'); return }
    setBusy(true); setErr('')
    try {
      const res = await createEmployee({
        full_name: f.full_name, email: f.email, position: f.position,
        daily_rate: f.daily_rate, site_id: f.site_id || null, schedule: f.schedule,
        phone: f.phone, is_admin: f.is_admin,
      })
      if (photo && res?.id) {
        try { await uploadAvatar(res.id, photo) } catch (_) {}
      }
      setResult(res)
      logActivity({ orgId: profile.org_id, actorId: profile.id, actorName: profile.full_name,
        type: 'employee_added', message: `${profile.full_name} added employee ${f.full_name}` })
      onDone?.()
    } catch (e) {
      setErr(e.message || 'Could not create employee.')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <Modal title="Employee created" subtitle="Share these credentials securely — the PIN is shown only once." onClose={onClose}
        footer={<button onClick={onClose} className="w-full bg-orange text-white text-sm font-semibold py-[11px] rounded-xl border-none">Done</button>}>
        <div className="bg-green-tint rounded-xl p-4 text-center mb-3">
          <div className="text-sm text-[#15784f] font-semibold mb-1">{f.full_name} can now sign in</div>
          <div className="text-xs text-muted">{result.email} · {result.employee_code}</div>
        </div>
        <div className="flex items-center justify-between bg-[#fafaf9] rounded-xl px-4 py-3">
          <span className="text-sm text-ink-soft">6-digit PIN</span>
          <span className="text-2xl font-extrabold tnum tracking-widest">{result.pin}</span>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Add employee" subtitle="Creates a login account + a 6-digit PIN." onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-stroke bg-white text-ink-soft text-sm font-semibold py-[11px] rounded-xl">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 border-none bg-orange text-white text-sm font-semibold py-[11px] rounded-xl disabled:opacity-60">{busy ? 'Creating…' : 'Create employee'}</button>
        </div>
      }>
      <div className="flex items-center gap-3 mb-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="border-none bg-transparent p-0 rounded-full" title="Add photo">
          <Avatar name={f.full_name || '?'} src={photoPreview} size={56} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] text-orange font-semibold border-none bg-transparent">
          {photo ? 'Change photo' : 'Add photo (optional)'}
        </button>
      </div>
      <Field label="Full name"><input className={inputCls} value={f.full_name} onChange={set('full_name')} placeholder="Juan dela Cruz" /></Field>
      <Field label="Email"><input className={inputCls} type="email" value={f.email} onChange={set('email')} placeholder="juan@company.ph" autoCapitalize="none" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position"><input className={inputCls} value={f.position} onChange={set('position')} placeholder="Mason" /></Field>
        <Field label="Daily rate ($)"><input className={inputCls} type="number" value={f.daily_rate} onChange={set('daily_rate')} placeholder="720" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Site">
          <select className={inputCls} value={f.site_id} onChange={set('site_id')}>
            <option value="">— none —</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Phone"><input className={inputCls} value={f.phone} onChange={set('phone')} placeholder="0917…" /></Field>
      </div>
      <Field label="Schedule"><input className={inputCls} value={f.schedule} onChange={set('schedule')} /></Field>
      <label className="flex items-center gap-2 text-sm mt-1">
        <input type="checkbox" checked={f.is_admin} onChange={set('is_admin')} className="accent-orange w-4 h-4" />
        Grant admin (web console) access
      </label>
      {err && <div className="text-[13px] text-red mt-3">{err}</div>}
    </Modal>
  )
}

/* ----------------------- Add Project ----------------------- */
export function AddProjectModal({ profile, sites, onClose, onDone, flash }) {
  const [f, setF] = useState({ name: '', location: '', site_id: '', status: 'active', progress: '0', worker_count: '0', icon: '🏗' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function submit() {
    if (busy) return
    if (!f.name.trim()) { setErr('Project name is required.'); return }
    setBusy(true); setErr('')
    try {
      await createProject(profile.org_id, f)
      logActivity({ orgId: profile.org_id, actorId: profile.id, actorName: profile.full_name,
        type: 'project_added', message: `${profile.full_name} added project ${f.name}` })
      flash?.('Project added')
      onDone?.(); onClose?.()
    } catch (e) { setErr(e.message || 'Could not add project.') } finally { setBusy(false) }
  }

  return (
    <Modal title="Add project" onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-stroke bg-white text-ink-soft text-sm font-semibold py-[11px] rounded-xl">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 border-none bg-orange text-white text-sm font-semibold py-[11px] rounded-xl disabled:opacity-60">{busy ? 'Adding…' : 'Add project'}</button>
        </div>
      }>
      <Field label="Project name"><input className={inputCls} value={f.name} onChange={set('name')} placeholder="San Antonio Drainage Ph.2" /></Field>
      <Field label="Location"><input className={inputCls} value={f.location} onChange={set('location')} placeholder="Site B · Zone 4 · Iloilo" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Site">
          <select className={inputCls} value={f.site_id} onChange={set('site_id')}>
            <option value="">— none —</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={f.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Progress %"><input className={inputCls} type="number" min="0" max="100" value={f.progress} onChange={set('progress')} /></Field>
        <Field label="Workers"><input className={inputCls} type="number" min="0" value={f.worker_count} onChange={set('worker_count')} /></Field>
        <Field label="Icon"><input className={inputCls} value={f.icon} onChange={set('icon')} maxLength={2} /></Field>
      </div>
      {err && <div className="text-[13px] text-red mt-1">{err}</div>}
    </Modal>
  )
}

/* ----------------------- Add Inventory ----------------------- */
export function AddInventoryModal({ profile, onClose, onDone, flash }) {
  const [f, setF] = useState({ name: '', sku: '', icon: '📦', stock: '', capacity: '', unit: 'pcs', location: '', reorder_level: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function submit() {
    if (busy) return
    if (!f.name.trim()) { setErr('Item name is required.'); return }
    setBusy(true); setErr('')
    try {
      await createInventoryItem(profile.org_id, f)
      logActivity({ orgId: profile.org_id, actorId: profile.id, actorName: profile.full_name,
        type: 'inventory_added', message: `${profile.full_name} added inventory ${f.name}` })
      flash?.('Inventory item added')
      onDone?.(); onClose?.()
    } catch (e) { setErr(e.message || 'Could not add item.') } finally { setBusy(false) }
  }

  return (
    <Modal title="Add inventory item" subtitle="Status is set automatically from stock vs reorder level." onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-stroke bg-white text-ink-soft text-sm font-semibold py-[11px] rounded-xl">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 border-none bg-orange text-white text-sm font-semibold py-[11px] rounded-xl disabled:opacity-60">{busy ? 'Adding…' : 'Add item'}</button>
        </div>
      }>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Item name"><input className={inputCls} value={f.name} onChange={set('name')} placeholder="Cement (40kg)" /></Field>
        <Field label="Icon"><input className={inputCls + ' w-[64px] text-center'} value={f.icon} onChange={set('icon')} maxLength={2} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU"><input className={inputCls} value={f.sku} onChange={set('sku')} placeholder="SKU-CM-040" /></Field>
        <Field label="Location"><input className={inputCls} value={f.location} onChange={set('location')} placeholder="Main Warehouse" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock"><input className={inputCls} type="number" value={f.stock} onChange={set('stock')} placeholder="820" /></Field>
        <Field label="Unit"><input className={inputCls} value={f.unit} onChange={set('unit')} placeholder="bags" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Capacity (for bar)"><input className={inputCls} type="number" value={f.capacity} onChange={set('capacity')} placeholder="1000" /></Field>
        <Field label="Reorder level"><input className={inputCls} type="number" value={f.reorder_level} onChange={set('reorder_level')} placeholder="200" /></Field>
      </div>
      {err && <div className="text-[13px] text-red mt-1">{err}</div>}
    </Modal>
  )
}
