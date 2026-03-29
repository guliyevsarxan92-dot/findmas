import { useEffect, useState } from 'react'
import api from '../api'

const KARTLAR = [
  { key: 'cem_istifadeci', label: 'İstifadəçi' },
  { key: 'cem_usta', label: 'Usta' },
  { key: 'tesdiqsiz_usta', label: 'Təsdiq gözləyir' },
  { key: 'bugun_sifaris', label: 'Bu gün sifariş' },
  { key: 'cem_tamamlandi', label: 'Tamamlanan' },
]

export default function Statistika() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/statistika').then(r => setData(r.data)).catch(() => {})
  }, [])

  if (!data) return <div className="loading">Yüklənir...</div>

  return (
    <>
      <h1>Statistika</h1>
      <div className="stat-grid">
        {KARTLAR.map(k => (
          <div className="stat-card" key={k.key}>
            <div className="label">{k.label}</div>
            <div className="value">{data[k.key] ?? '—'}</div>
          </div>
        ))}
      </div>
    </>
  )
}
