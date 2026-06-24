import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchProject } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { peso } from '../../lib/format'

function StatBox({ value, label }) {
  return (
    <Card className="p-[18px]">
      <div className="text-[24px] font-extrabold tnum leading-none mb-1.5">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  )
}

export default function ProjectDetail() {
  const { params, navigate, flash } = useAdmin()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (params.id) fetchProject(params.id).then(setData).catch(console.error)
  }, [params.id])

  if (!data) return <div className="text-sm text-muted">Loading project…</div>
  const { project, members, inventory } = data
  const present = members.filter((m) => m.today === 'present' || m.today === 'ongoing').length
  const avgAtt = members.length ? Math.round((present / members.length) * 100) : 0

  // A 3-phase timeline derived from progress (matches the Figma pattern).
  const phases = [
    { label: 'Site prep done', sub: 'Completed', state: 'done' },
    { label: 'Construction — in progress', sub: `Now · ${project.progress}%`, state: 'active' },
    { label: 'Finishing & handover', sub: 'Upcoming', state: 'todo' },
  ]
  const phaseColor = { done: '#1f9d6b', active: '#2563eb', todo: '#c2c2bd' }

  return (
    <div className="animate-fadeIn">
      {/* breadcrumb + edit */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('projects')} className="border-none bg-transparent text-brand text-[15px] font-semibold">
            Projects /
          </button>
          <span className="text-[20px] font-extrabold">{project.name}</span>
          <Pill kind={project.status === 'active' ? 'present' : project.status === 'on_hold' ? 'late' : 'vacation'}>
            {project.status === 'active' ? 'Active' : project.status === 'on_hold' ? 'On hold' : 'Completed'}
          </Pill>
        </div>
        <button onClick={() => flash('Project editing coming soon')} className="border border-stroke bg-white text-ink-soft text-sm font-semibold px-4 py-2 rounded-xl">Edit</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-4">
        <StatBox value={members.length} label="Assigned members" />
        <StatBox value={`${avgAtt}%`} label="Avg attendance" />
        <StatBox value={`${project.progress}%`} label="Progress" />
        <StatBox value={inventory.length} label="Inventory items" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[14px] items-start">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex justify-between items-center">
            <span className="text-[15px] font-bold">Assigned members</span>
            <button onClick={() => navigate('employees')} className="border-none bg-transparent text-brand text-[13px] font-semibold">Manage</button>
          </div>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0">
              <Avatar name={m.full_name} src={m.avatar_url} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.full_name}</div>
                <div className="text-xs text-faint tnum">{m.position} · {peso(m.daily_rate)}/day</div>
              </div>
              <Pill kind={m.today} />
            </div>
          ))}
          {members.length === 0 && <div className="p-5 text-sm text-muted">No members assigned.</div>}
        </Card>

        <div className="flex flex-col gap-[14px]">
          <Card className="p-[18px]">
            <div className="text-[15px] font-bold mb-[14px]">Allocated inventory</div>
            {inventory.map((it, i) => (
              <div key={it.id} className={'flex justify-between py-[7px] text-[13px] ' + (i < inventory.length - 1 ? 'border-b border-line' : '')}>
                <span className="text-ink-soft">{it.name}</span>
                <span className="tnum font-semibold">{Number(it.stock)} {it.unit}</span>
              </div>
            ))}
            {inventory.length === 0 && <div className="text-sm text-muted">No inventory allocated.</div>}
          </Card>

          <Card className="p-[18px]">
            <div className="text-[15px] font-bold mb-4">Timeline</div>
            <div className="flex flex-col">
              {phases.map((p, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full mt-1" style={{ background: phaseColor[p.state] }} />
                    {i < phases.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: '#eaeae7' }} />}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm font-semibold" style={{ color: p.state === 'active' ? '#2563eb' : p.state === 'todo' ? '#9b9b96' : '#131312' }}>
                      {p.label}
                    </div>
                    <div className="text-xs text-faint">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
