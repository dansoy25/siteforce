import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchProjects, fetchSites } from '../../lib/adminApi'
import { Pill } from '../ui'
import { AddProjectModal } from '../AddRecordModals'
import { avatarColor } from '../../lib/format'

const STATUS_KIND = { active: 'present', on_hold: 'late', completed: 'vacation' }
const STATUS_LABEL = { active: 'Active', on_hold: 'On hold', completed: 'Completed' }

// Small decorative overlapping avatar stack sized from the worker count.
function MemberStack({ seed, count }) {
  const n = Math.min(3, count || 0)
  return (
    <div className="flex items-center">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full border-2 border-white -ml-1.5 first:ml-0"
          style={{ background: avatarColor(seed + i) }}
        />
      ))}
      {count > n && (
        <div className="w-6 h-6 rounded-full border-2 border-white -ml-1.5 bg-[#3a3a36] text-white text-[10px] font-bold flex items-center justify-center">
          +{count - n}
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { navigate, flash, profile } = useAdmin()
  const [projects, setProjects] = useState([])
  const [sites, setSites] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = () => fetchProjects().then(setProjects).catch(() => setProjects([]))
  useEffect(() => { load(); fetchSites().then(setSites).catch(() => {}) }, [])

  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    on_hold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }
  const q = search.trim().toLowerCase()
  const shown = projects
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q))

  const Chip = ({ id, label }) => (
    <button
      onClick={() => setFilter(id)}
      className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border"
      style={
        filter === id
          ? { background: '#131312', color: '#fff', borderColor: '#131312' }
          : { background: '#fff', color: '#55554f', borderColor: '#eaeae7' }
      }
    >
      {label} · {counts[id] ?? 0}
    </button>
  )

  const barColor = (p) =>
    p.status === 'on_hold' ? '#e0982e' : p.status === 'completed' ? '#22c55e' : p.accent || '#2563eb'

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap items-center gap-[10px] mb-[18px]">
        <Chip id="all" label="All" />
        <Chip id="active" label="Active" />
        <Chip id="on_hold" label="On hold" />
        <Chip id="completed" label="Completed" />
        <div className="flex-1" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="⌕ Search projects…"
          className="hidden md:inline-flex border border-stroke rounded-xl px-[14px] py-2 text-[13px] outline-none focus:border-brand placeholder:text-faint w-[200px]"
        />
        <button
          onClick={() => setShowAdd(true)}
          className="border-none bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl"
        >
          + New project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px]">
        {shown.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate('projectDetail', { id: p.id })}
            className="text-left border-none bg-white rounded-[18px] p-5 shadow-[0_1px_3px_rgba(10,10,9,0.08)] hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-[14px]">
              <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center text-xl"
                   style={{ background: (p.accent || '#2563eb') + '22', color: p.accent }}>
                {p.icon}
              </div>
              <Pill kind={STATUS_KIND[p.status]}>{STATUS_LABEL[p.status]}</Pill>
            </div>
            <div className="text-base font-bold">{p.name}</div>
            <div className="text-[13px] text-muted mb-[14px]">{p.location}</div>
            <div className="h-[7px] bg-line rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: barColor(p) }} />
            </div>
            <div className="flex justify-between text-xs text-muted mb-3">
              <span>{p.progress}% complete</span>
              <span className="tnum">{p.status === 'completed' ? 'Completed' : `${p.worker_count} workers`}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-line">
              <MemberStack seed={p.id} count={p.worker_count} />
              <span className="text-xs text-faint tnum">{p.worker_count} workers</span>
            </div>
          </button>
        ))}

        {/* dashed "new project" placeholder */}
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-[18px] border-2 border-dashed border-[#c9d4ee] bg-brand-tint/40 flex flex-col items-center justify-center min-h-[220px] text-brand"
        >
          <div className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center text-2xl mb-2">+</div>
          <div className="text-sm font-semibold">New project</div>
        </button>
      </div>

      {showAdd && (
        <AddProjectModal
          profile={profile}
          sites={sites}
          flash={flash}
          onClose={() => setShowAdd(false)}
          onDone={load}
        />
      )}
    </div>
  )
}
