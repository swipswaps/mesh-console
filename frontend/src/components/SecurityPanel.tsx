import { useEffect, useState } from 'react'

interface InventoryItem {
  path: string
  mode?: string
  mtime_utc?: string
  present?: boolean
}

const BASE = import.meta.env.DEV
  ? 'http://127.0.0.1:5180'
  : `${window.location.protocol}//${window.location.hostname}:5180`

export default function SecurityPanel() {
  const [items, setItems] = useState<InventoryItem[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`${BASE}/api/security/secrets-inventory`, { signal: AbortSignal.timeout(4000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive) setItems(Array.isArray(data?.items) ? data.items : null)
      })
      .catch(() => {
        if (alive) setItems(null)
      })
    return () => {
      alive = false
    }
  }, [])

  if (items === null) return null
  return (
    <section className="security">
      <h2>Secrets inventory (names + modes only)</h2>
      <ul>
        {items.map((it) => (
          <li key={it.path}>
            {it.path} — {it.present === false ? 'absent' : `${it.mode} · ${it.mtime_utc}`}
          </li>
        ))}
      </ul>
    </section>
  )
}
