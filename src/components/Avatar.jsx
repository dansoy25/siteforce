import { initials, avatarColor } from '../lib/format'

// Shows the employee photo when `src` is set, otherwise a colored initials
// circle. Used across both the employee app and the web admin.
export default function Avatar({ name, src, size = 34, color, className = '' }) {
  const dim = { width: size, height: size }
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={'rounded-full object-cover shrink-0 bg-[#eaeae7] ' + className}
        style={dim}
        loading="lazy"
      />
    )
  }
  return (
    <div
      className={'rounded-full text-white flex items-center justify-center font-bold shrink-0 ' + className}
      style={{ ...dim, background: color || avatarColor(name), fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  )
}
