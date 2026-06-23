import { useEffect, useRef, useState } from 'react'
import { fetchEmployees } from '../../lib/adminApi'
import { uploadAvatar } from '../../lib/api'
import { Card, Avatar, Pill } from '../ui'
import { peso } from '../../lib/format'

export default function Employees() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = () =>
    fetchEmployees().then((list) => {
      setRows(list)
      setSelected((cur) => list.find((x) => x.id === cur?.id) || list[0] || null)
    }).catch(() => setRows([]))

  useEffect(() => { load() }, [])

  async function onPickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selected) return
    setUploading(true)
    try {
      const url = await uploadAvatar(selected.id, file)
      setSelected((s) => ({ ...s, avatar_url: url }))
      setRows((rs) => rs.map((r) => (r.id === selected.id ? { ...r, avatar_url: url } : r)))
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[18px]">
      <Card className="overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1.2fr_1fr_1fr] px-[22px] py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
          <div>Name</div><div>Role</div><div>Rate</div><div>Status</div>
        </div>
        {rows.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelected(e)}
            className="w-full text-left grid grid-cols-2 sm:grid-cols-[2fr_1.2fr_1fr_1fr] items-center px-[22px] py-[14px] border-b border-line last:border-0 text-sm gap-y-1"
            style={selected?.id === e.id ? { background: '#fff3ec' } : undefined}
          >
            <div className="flex items-center gap-[10px] col-span-2 sm:col-span-1">
              <Avatar name={e.full_name} src={e.avatar_url} size={34} />
              <div>
                <div className="font-semibold">{e.full_name}</div>
                <div className="text-xs text-faint tnum">{e.employee_code}</div>
              </div>
            </div>
            <div className="text-ink-soft">{e.position}</div>
            <div className="tnum text-ink-soft">{Number(e.daily_rate) > 0 ? `$${Number(e.daily_rate)}` : '—'}</div>
            <div><Pill kind={e.today === 'on_leave' ? 'on_leave' : e.status} /></div>
          </button>
        ))}
      </Card>

      {selected && (
        <Card className="p-[22px] h-fit">
          <div className="flex flex-col items-center text-center mb-[18px]">
            <button onClick={() => fileRef.current?.click()} className="relative border-none bg-transparent p-0 rounded-full group" title="Change photo">
              <Avatar name={selected.full_name} src={selected.avatar_url} size={72} />
              <span className="absolute inset-0 rounded-full bg-black/40 text-white text-[11px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                {uploading ? '…' : 'Change'}
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            <div className="text-lg font-extrabold mt-3">{selected.full_name}</div>
            <div className="text-[13px] text-muted">{selected.position} · {selected.employee_code}</div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-[12px] text-orange font-semibold mt-1 border-none bg-transparent">
              {uploading ? 'Uploading…' : selected.avatar_url ? 'Change photo' : 'Add photo'}
            </button>
          </div>
          <div className="bg-[#fafaf9] rounded-2xl p-4 mb-3.5">
            <Row label="Pay rate" value={Number(selected.daily_rate) > 0 ? `${peso(selected.daily_rate)} / day` : '—'} border />
            <Row label="Schedule" value={selected.schedule || '—'} border />
            <Row label="Site" value={selected.site?.name || '—'} />
          </div>
          <div className="flex justify-between items-center bg-green-tint rounded-[14px] px-4 py-3">
            <span className="text-[13px] text-[#15784f] font-semibold">Biometric enrolled</span>
            <span className="text-xs font-bold text-green">{selected.face_enrolled ? '✓ Face + PIN' : 'Pending'}</span>
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, border }) {
  return (
    <div className="flex justify-between py-[7px] text-[13px]" style={{ borderBottom: border ? '1px solid #efefec' : 'none' }}>
      <span className="text-muted">{label}</span>
      <span className="font-semibold tnum">{value}</span>
    </div>
  )
}
