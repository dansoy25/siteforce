import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchProject } from '../../lib/adminApi'
import { Card, Avatar, Pill } from '../ui'
import { peso } from '../../lib/format'

function StatBox({ value, label }) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-extrabold tnum">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  )
}

export default function ProjectDetail() {
  const { params, navigate } = useAdmin()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (params.id) fetchProject(params.id).then(setData).catch(console.error)
  }, [params.id])

  if (!data) return <div className="text-sm text-muted">Loading project…</div>
  const { project, members, inventory } = data
  const present = members.filter((m) => m.today === 'present' || m.today === 'ongoing').length
  const avgAtt = members.length ? Math.round((present / members.length) * 100) : 0

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('projects')} className="border-none bg-transparent text-muted text-[13px] font-semibold mb-[14px]">
        ‹ Back to projects
      </button>
      <div className="flex items-center gap-3 mb-[18px]">
        <div className="text-[22px] font-extrabold">{project.name}</div>
        <Pill kind={project.status === 'active' ? 'present' : project.status === 'on_hold' ? 'late' : 'vacation'}>
          {project.status === 'active' ? 'Active' : project.status === 'on_hold' ? 'On hold' : 'Completed'}
        </Pill>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-4">
        <StatBox value={members.length} label="Members" />
        <StatBox value={`${avgAtt}%`} label="Today attendance" />
        <StatBox value={`${project.progress}%`} label="Progress" />
        <StatBox value={inventory.length} label="Inventory items" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[14px]">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-line text-[15px] font-bold">Assigned members</div>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0">
              <Avatar name={m.full_name} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.full_name}</div>
                <div className="text-xs text-faint tnum">{m.position} · {peso(m.daily_rate)}/day</div>
              </div>
              <Pill kind={m.today} />
            </div>
          ))}
          {members.length === 0 && <div className="p-5 text-sm text-muted">No members assigned.</div>}
        </Card>

        <Card className="p-[18px] h-fit">
          <div className="text-[15px] font-bold mb-[14px]">Allocated inventory</div>
          {inventory.map((it, i) => (
            <div key={it.id} className={'flex justify-between py-[7px] text-[13px] ' + (i < inventory.length - 1 ? 'border-b border-line' : '')}>
              <span className="text-ink-soft">{it.name}</span>
              <span className="tnum font-semibold">{Number(it.stock)} {it.unit}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
