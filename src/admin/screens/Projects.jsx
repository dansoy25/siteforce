import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchProjects } from '../../lib/adminApi'
import { Card, Pill } from '../ui'

const STATUS_KIND = { active: 'present', on_hold: 'late', completed: 'vacation' }
const STATUS_LABEL = { active: 'Active', on_hold: 'On hold', completed: 'Completed' }

export default function Projects() {
  const { navigate } = useAdmin()
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }
  const shown = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

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

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap gap-[10px] mb-[18px]">
        <Chip id="all" label="All" />
        <Chip id="active" label="Active" />
        <Chip id="completed" label="Completed" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px]">
        {shown.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate('projectDetail', { id: p.id })}
            className="text-left border-none bg-white rounded-[18px] p-5 shadow-[0_1px_3px_rgba(10,10,9,0.08)] hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-[14px]">
              <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-xl"
                   style={{ background: (p.accent || '#2563eb') + '22', color: p.accent }}>
                {p.icon}
              </div>
              <Pill kind={STATUS_KIND[p.status]}>{STATUS_LABEL[p.status]}</Pill>
            </div>
            <div className="text-base font-bold">{p.name}</div>
            <div className="text-[13px] text-muted mb-[14px]">{p.location}</div>
            <div className="h-[7px] bg-line rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.status === 'on_hold' ? '#e0982e' : '#2563eb' }} />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{p.progress}% complete</span>
              <span className="tnum">{p.worker_count} workers</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
