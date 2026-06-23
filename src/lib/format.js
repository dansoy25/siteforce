export const peso = (n) =>
  '$' +
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// Friendly alias; new code should prefer this name.
export const money = peso

// "2026-06-20T08:02:00+08:00" -> "8:02 AM" (in PH time)
export const timePH = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  })
}

// "2026-06-20" -> "Friday, June 20, 2026"
export const longDate = (d) => {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00+08:00') : d
  return date.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

// "2026-06-20" -> "Jun 20"
export const shortDate = (d) => {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00+08:00') : d
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

// "2026-06-20" -> "Friday"
export const weekday = (d) => {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00+08:00') : d
  return date.toLocaleDateString('en-PH', { weekday: 'long', timeZone: 'Asia/Manila' })
}

export const initials = (name = '') =>
  name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

// Stable avatar background color from a name.
const AVATAR_COLORS = ['#F25C1F', '#3B6FF0', '#842B12', '#1F9D6B', '#74746F', '#E0982E', '#9333EA']
export const avatarColor = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// Decimal hours -> "4:12"
export const hm = (hours) => {
  if (hours == null) return '0:00'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}
