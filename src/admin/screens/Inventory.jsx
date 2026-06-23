import { useEffect, useState } from 'react'
import { useAdmin } from '../AdminShell'
import { fetchInventory } from '../../lib/adminApi'
import { Card, Pill } from '../ui'
import { AddInventoryModal } from '../AddRecordModals'

const BAR_COLOR = { in_stock: '#1f9d6b', low: '#e0982e', critical: '#e04444' }

export default function Inventory() {
  const { flash, profile } = useAdmin()
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const load = () => fetchInventory().then(setItems).catch(() => setItems([]))
  useEffect(() => { load() }, [])

  const lowOrCritical = items.filter((i) => i.status === 'low' || i.status === 'critical')
  const shown =
    tab === 'all' ? items : tab === 'low' ? items.filter((i) => i.status === 'low') : items.filter((i) => i.status === 'critical')

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className="border-none px-[13px] py-[6px] rounded-[7px] text-[13px] font-semibold"
      style={{ background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#131312' : '#74746f' }}
    >
      {label}
    </button>
  )

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-end gap-[10px] mb-4">
        <button className="border border-stroke bg-white text-ink-soft text-sm font-semibold px-4 py-2 rounded-xl">Stock in / out</button>
        <button onClick={() => setShowAdd(true)} className="border-none bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl">+ Add item</button>
      </div>

      {lowOrCritical.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-tint rounded-[14px] px-4 py-3 mb-4">
          <span className="text-amber text-base">⚠</span>
          <span className="text-[13px] text-[#842b12] flex-1">
            {lowOrCritical.length} item{lowOrCritical.length > 1 ? 's' : ''} below reorder level — {lowOrCritical.map((i) => i.name).join(', ')}.
          </span>
          <span className="text-[13px] font-semibold text-brand whitespace-nowrap">Reorder →</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-line">
          <div className="inline-flex bg-[#f4f4f2] rounded-[10px] p-[3px] gap-[3px]">
            <Tab id="all" label="All items" />
            <Tab id="low" label="Low stock" />
            <Tab id="out" label="Out" />
          </div>
          <div className="flex-1" />
          <span className="hidden md:inline-flex items-center gap-2 border border-stroke rounded-[10px] px-[14px] py-[7px] text-[13px] text-faint">⌕ Search SKU</span>
        </div>
        <div className="hidden sm:grid grid-cols-[2.2fr_1.2fr_1.3fr_1.4fr_1fr] px-5 py-[13px] bg-[#fafaf9] text-[11px] font-semibold tracking-wide uppercase text-muted border-b border-[#eaeae7]">
          <div>Item</div><div>SKU</div><div>Stock level</div><div>Location</div><div>Status</div>
        </div>
        {shown.map((it) => (
          <div key={it.id} className="grid grid-cols-2 sm:grid-cols-[2.2fr_1.2fr_1.3fr_1.4fr_1fr] items-center px-5 py-[13px] border-b border-line last:border-0 text-sm gap-y-2"
               style={it.status !== 'in_stock' ? { background: '#fffbf8' } : undefined}>
            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f4f4f2] flex items-center justify-center text-lg">{it.icon}</div>
              <span className="font-semibold">{it.name}</span>
            </div>
            <div className="tnum text-faint hidden sm:block">{it.sku}</div>
            <div>
              <div className="h-[6px] w-[120px] max-w-full bg-line rounded-full overflow-hidden mb-[5px]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (it.stock / it.capacity) * 100)}%`, background: BAR_COLOR[it.status] }} />
              </div>
              <span className="tnum text-xs text-ink-soft">{Number(it.stock)} {it.unit}</span>
            </div>
            <div className="text-ink-soft hidden sm:block">{it.location}</div>
            <div><Pill kind={it.status} /></div>
          </div>
        ))}
        {shown.length === 0 && <div className="p-6 text-sm text-muted">No items in this view.</div>}
      </Card>

      {showAdd && (
        <AddInventoryModal profile={profile} flash={flash} onClose={() => setShowAdd(false)} onDone={load} />
      )}
    </div>
  )
}
