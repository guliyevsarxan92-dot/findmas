import { useEffect, useState } from 'react'
import api from '../api'

const STATUS_BADGE = {
  true: <span className="badge badge-green">Təsdiqlənib</span>,
  false: <span className="badge badge-yellow">Gözləyir</span>,
}

export default function Ustalar() {
  const [ustalar, setUstalar] = useState([])
  const [filtr, setFiltr] = useState('false') // 'false' = tesdiqsizler
  const [yuklenir, setYuklenir] = useState(true)
  const [xeta, setXeta] = useState('')

  async function yukle(f) {
    setYuklenir(true)
    try {
      const param = f === 'hamisi' ? '' : `?tesdiqlendi=${f}`
      const { data } = await api.get(`/admin/ustalar${param}`)
      setUstalar(data.ustalar)
    } catch {
      setXeta('Yükləmə xətası')
    } finally {
      setYuklenir(false)
    }
  }

  useEffect(() => { yukle(filtr) }, [filtr])

  async function tesdiqlə(id) {
    await api.put(`/admin/usta/${id}/tesdiqlə`)
    yukle(filtr)
  }

  async function blokla(id) {
    if (!confirm('Bu ustanı bloklamaq istəyirsiniz?')) return
    await api.put(`/admin/usta/${id}/blokla`)
    yukle(filtr)
  }

  return (
    <>
      <h1>Ustalar</h1>
      {xeta && <div className="alert alert-red">{xeta}</div>}

      <div className="filter-row">
        <select value={filtr} onChange={e => setFiltr(e.target.value)}>
          <option value="false">Təsdiq gözləyənlər</option>
          <option value="true">Təsdiqlənənlər</option>
          <option value="hamisi">Hamısı</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          Ustalar siyahısı
          <span style={{ fontSize: 13, color: '#64748b' }}>{ustalar.length} nəfər</span>
        </div>
        {yuklenir ? (
          <div className="loading">Yüklənir...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>Kateqoriya</th>
                <th>Reytinq</th>
                <th>Status</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {ustalar.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>Usta tapılmadı</td></tr>
              )}
              {ustalar.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {u.foto
                        ? <img src={u.foto} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#64748b' }}>{u.ad[0]}</div>
                      }
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.ad} {u.soyad}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.telefon}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.kateqoriya}</td>
                  <td>⭐ {u.orta_reytinq || '—'} ({u.tamamlanan_sifaris})</td>
                  <td>{STATUS_BADGE[u.tesdiqlendi]}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {!u.tesdiqlendi && (
                      <button className="btn btn-green" onClick={() => tesdiqlə(u.id)}>Təsdiqlə</button>
                    )}
                    <button className="btn btn-red" onClick={() => blokla(u.id)}>Blokla</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
