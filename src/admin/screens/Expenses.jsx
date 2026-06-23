import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchExpenses, fetchProjects, createExpense, deleteExpense } from '../../lib/adminApi'
import { logActivity } from '../../lib/api'
import { Card } from '../ui'
import Modal, { Field, inputCls } from '../Modal'
import { peso, shortDate } from '../../lib/format'

const CATEGORIES = [
  { id: 'materials',     label: 'Materials',     icon: '🧱', color: '#dcf2e6', dark: '#166534' },
  { id: 'fuel',          label: 'Fuel',          icon: '⛽', color: '#fde8c1', dark: '#92400e' },
  { id: 'labor',         label: 'Labor',         icon: '👷', color: '#fbd5db', dark: '#9f1239' },
  { id: 'equipment',     label: 'Equipment',     icon: '🛠', color: '#dde2fb', dark: '#312e81' },
  { id: 'subcontractor', label: 'Subcontractor', icon: '📋', color: '#e0f2fe', dark: '#075985' },
  { id: 'other',         label: 'Other',         icon: '💵', color: '#f3f4f6', dark: '#374151' },
]
const catInfo = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[5]

export default function Expenses() {
  const { profile, flash } = useAdmin()
  const [rows, setRows] = useState([])
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = (pid) =>
    fetchExpenses(pid ? { projectId: pid } : {})
      .then((r) => { setRows(r); setLoading(false) })
      .catch(() => { setRows([]); setLoading(false) })

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => {})
    load('')
  }, [])

  useEffect(() => { setLoading(true); load(projectId) }, [projectId])

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0)
  const byCat = {}
  rows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount || 0) })

  return (
    <div className="animate-fadeIn">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="border-[1.5px] border-stroke rounded-[10px] px-3 py-[8px] text-sm bg-white outline-none focus:border-brand"
        >
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowAdd(true)}
          className="border-none bg-brand text-white text-sm font-semibold px-4 py-[10px] rounded-xl inline-flex items-center gap-2"
        >
          + Add expense
        </button>
      </div>

      {/* total + breakdown tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-4">
        <Card className="p-[18px]">
          <div className="text-xs text-muted uppercase tracking-wide font-semibold">Total spent</div>
          <div className="text-[28px] font-extrabold tnum">{peso(total)}</div>
          <div className="text-xs text-muted">{rows.length} entries</div>
        </Card>
        {Object.entries(byCat).slice(0, 3).map(([cat, amt]) => {
          const ci = catInfo(cat)
          return (
            <div key={cat} className="rounded-[18px] p-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.06)]" style={{ background: ci.color }}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white/70 mb-3">{ci.icon}</div>
              <div className="text-xl font-extrabold tnum">{peso(amt)}</div>
              <div className="text-[12px] font-semibold" style={{ color: ci.dark }}>{ci.label}</div>
            </div>
          )
        })}
      </div>

      {/* table */}
      <Card className="overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1.4fr_1.6fr_1.4fr_1fr_0.8fr_36px] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
          <div>Date</div><div>Description</div><div>Project</div><div>Category</div><div className="text-right">Amount</div><div></div>
        </div>
        {loading && <div className="p-6 text-sm text-muted">Loading…</div>}
        {!loading && rows.length === 0 && <div className="p-6 text-sm text-muted">No expenses yet.</div>}
        {rows.map((r) => {
          const ci = catInfo(r.category)
          return (
            <div key={r.id} className="grid grid-cols-2 sm:grid-cols-[1.4fr_1.6fr_1.4fr_1fr_1fr_36px] items-center px-5 py-[13px] border-b border-line last:border-0 text-sm gap-y-1">
              <div className="tnum text-ink-soft">{shortDate(r.spent_on)}</div>
              <div className="font-semibold truncate">{r.description || r.vendor || '—'}{r.vendor && r.description ? <span className="text-faint font-normal"> · {r.vendor}</span> : null}</div>
              <div className="text-ink-soft hidden sm:block truncate">{r.project?.name || <span className="text-faint">No project</span>}</div>
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: ci.color, color: ci.dark }}>
                  {ci.icon} {ci.label}
                </span>
              </div>
              <div className="tnum font-bold sm:text-right">{peso(r.amount)}</div>
              <button
                onClick={async () => {
                  if (!confirm('Delete this expense?')) return
                  await deleteExpense(r.id)
                  load(projectId)
                  flash('Expense removed')
                }}
                className="border-none bg-transparent text-faint text-base hover:text-red hidden sm:block"
                title="Delete"
              >
                ✕
              </button>
            </div>
          )
        })}
      </Card>

      {showAdd && (
        <AddExpenseModal
          profile={profile}
          projects={projects}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(projectId); flash('Expense added') }}
        />
      )}
    </div>
  )
}

function AddExpenseModal({ profile, projects, onClose, onSaved }) {
  const today = new Date().toLocaleDateString('en-CA')
  const [f, setF] = useState({
    project_id: '', category: 'materials', vendor: '', amount: '', spent_on: today, description: '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function submit() {
    if (busy) return
    if (!f.amount || Number(f.amount) <= 0) { setErr('Amount is required'); return }
    setBusy(true); setErr('')
    try {
      await createExpense(profile.org_id, f, profile.id)
      logActivity({
        orgId: profile.org_id, actorId: profile.id, actorName: profile.full_name,
        type: 'expense_added', message: `${profile.full_name} logged ${f.category} expense $${Number(f.amount).toLocaleString()}`,
      })
      onSaved()
    } catch (e) { setErr(e.message || 'Could not save expense') } finally { setBusy(false) }
  }

  return (
    <Modal title="Add expense" subtitle="Track project costs across categories." onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-stroke bg-white text-ink-soft text-sm font-semibold py-[11px] rounded-xl">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 border-none bg-brand text-white text-sm font-semibold py-[11px] rounded-xl disabled:opacity-60">
            {busy ? 'Saving…' : 'Add expense'}
          </button>
        </div>
      }>
      <Field label="Project">
        <select className={inputCls} value={f.project_id} onChange={set('project_id')}>
          <option value="">— No project —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Category">
        <select className={inputCls} value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ($)"><input className={inputCls} type="number" step="0.01" value={f.amount} onChange={set('amount')} placeholder="0.00" /></Field>
        <Field label="Date"><input className={inputCls} type="date" value={f.spent_on} onChange={set('spent_on')} /></Field>
      </div>
      <Field label="Vendor"><input className={inputCls} value={f.vendor} onChange={set('vendor')} placeholder="e.g. Iloilo Hardware Co." /></Field>
      <Field label="Description"><textarea className={inputCls} rows={2} value={f.description} onChange={set('description')} placeholder="What was bought/paid for…" /></Field>
      {err && <div className="text-[13px] text-red mt-1">{err}</div>}
    </Modal>
  )
}
