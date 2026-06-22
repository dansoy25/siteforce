import { useState } from 'react'

// Renders the Jaway Construction Services logo (public/logo.png). Until that
// file is added it falls back to the orange "J" mark, so nothing breaks.
export default function BrandLogo({ imgClass = '', fallback = null }) {
  const [ok, setOk] = useState(true)
  const src = import.meta.env.BASE_URL + 'logo.png'
  if (ok) {
    return (
      <img
        src={src}
        alt="Jaway Construction Services Inc."
        className={imgClass}
        onError={() => setOk(false)}
      />
    )
  }
  return fallback
}
