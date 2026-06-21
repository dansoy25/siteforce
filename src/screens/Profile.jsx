import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShell } from '../Shell'
import { updateProfile, uploadAvatar } from '../lib/api'
import { initials, peso } from '../lib/format'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth()
  const { flash } = useShell()
  const [notif, setNotif] = useState(profile.notifications_enabled)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function onPickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await uploadAvatar(profile.id, file)
      await refreshProfile()
      flash('Photo updated')
    } catch (err) {
      flash('Could not upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function toggleNotif() {
    const next = !notif
    setNotif(next)
    try {
      await updateProfile(profile.id, { notifications_enabled: next })
      await refreshProfile()
      flash(next ? 'Notifications on' : 'Notifications off')
    } catch (e) {
      setNotif(!next)
      flash('Could not update setting')
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="px-[22px] pt-[14px] pb-[22px] flex flex-col items-center">
        <button onClick={() => fileRef.current?.click()} className="relative border-none bg-transparent p-0 rounded-full group shadow-[0_8px_20px_rgba(242,92,31,0.3)]" title="Change photo">
          {profile.avatar_url ? (
            <Avatar name={profile.full_name} src={profile.avatar_url} size={84} />
          ) : (
            <div className="w-[84px] h-[84px] rounded-full bg-orange text-white flex items-center justify-center text-[30px] font-extrabold">
              {initials(profile.full_name)}
            </div>
          )}
          <span className="absolute inset-0 rounded-full bg-black/40 text-white text-[11px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            {uploading ? '…' : 'Change'}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-[12px] text-orange font-semibold mt-2 border-none bg-transparent">
          {uploading ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Add photo'}
        </button>
        <div className="text-xl font-extrabold mt-[10px]">{profile.full_name}</div>
        <div className="text-[13px] text-muted">
          {profile.position} · {profile.employee_code}
        </div>
        <div className="flex gap-2 mt-[10px]">
          <span className="inline-flex items-center gap-[5px] bg-green-tint text-green text-xs font-semibold px-[11px] py-[5px] rounded-full capitalize">
            {profile.status}
          </span>
          <span className="inline-flex items-center gap-[5px] bg-[#f4f4f2] text-ink-soft text-xs font-semibold px-[11px] py-[5px] rounded-full tnum">
            {peso(profile.daily_rate)}/day
          </span>
        </div>
      </div>

      <div className="px-[18px] flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.08)] overflow-hidden">
          <Row label="Phone" value={profile.phone || '—'} border tnum />
          <Row label="Site" value={profile.site?.name || '—'} border />
          <Row label="Schedule" value={profile.schedule || '—'} />
        </div>

        <div className="bg-white rounded-[18px] shadow-[0_1px_3px_rgba(10,10,9,0.08)] overflow-hidden">
          <div className="px-4 py-[14px] flex justify-between items-center border-b border-line">
            <span className="text-sm text-ink-soft">Face enrolled</span>
            {profile.face_enrolled ? (
              <span className="inline-flex items-center gap-[5px] bg-green-tint text-green text-xs font-semibold px-[10px] py-1 rounded-full">
                ✓ Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-[5px] bg-[#f4f4f2] text-muted text-xs font-semibold px-[10px] py-1 rounded-full">
                Not set
              </span>
            )}
          </div>
          <div className="px-4 py-[14px] flex justify-between items-center">
            <span className="text-sm text-ink-soft">Notifications</span>
            <button
              onClick={toggleNotif}
              className="w-[42px] h-[26px] rounded-full relative transition-colors"
              style={{ background: notif ? '#f25c1f' : '#dcdcd8' }}
              aria-pressed={notif}
            >
              <span
                className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
                style={{ right: notif ? '3px' : '19px' }}
              />
            </button>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full border-[1.5px] border-[#fce9e9] bg-[#fce9e9] text-red text-[15px] font-semibold py-[14px] rounded-[14px] mt-[2px]"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, border, tnum }) {
  return (
    <div
      className="px-4 py-[14px] flex justify-between items-center"
      style={{ borderBottom: border ? '1px solid #f4f4f2' : 'none' }}
    >
      <span className="text-sm text-ink-soft">{label}</span>
      <span className={'text-sm font-semibold' + (tnum ? ' tnum' : '')}>{value}</span>
    </div>
  )
}
