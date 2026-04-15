import { useEffect, useState } from 'react'
import api from '../api'

const STATUS_BADGE = {
  gozlenir: <span className="badge badge-yellow">Gözləyir</span>,
  tesdiq:   <span className="badge badge-green">Təsdiqlənib</span>,
  redd:     <span className="badge badge-red">Rədd edilib</span>,
}

export default function Balanslar() {
  const [sorqular, setSorqular] = useState([])
  const [filtr, setFiltr] = useState('gozlenir')
  const [yuklenir, setYuklenir] = useState(true)
  const [xeta, setXeta] = useState('')
  const [ugur, setUgur] = useState('')

  const [kart, setKart] = useState('')
  const [kartEdit, setKartEdit] = useState(false)
  const [kartYeni, setKartYeni] = useState('')
  const [kartYuklenir, setKartYuklenir] = useState(false)

  async function yukle() {
    setYuklenir(true)
    try {
      const { data } = await api.get(`/admin/balans-sorqular?status=${filtr}`)
      setSorqular(data.sorqular)
    } catch {
      setXeta('Yükləmə xətası')
    } finally {
      setYuklenir(false)
    }
  }

  async function kartYukle() {
    try {
      const { data } = await api.get('/admin/balans-kart')
      setKart(data.kart || '')
      setKartYeni(data.kart || '')
    } catch {}
  }

  useEffect(() => { yukle() }, [filtr])
  useEffect(() => { kartYukle() }, [])

  async function tesdiq(id) {
    try {
      await api.put(`/admin/balans-sorgu/${id}/tesdiq`)
      setUgur('Balans artırıldı')
      setTimeout(() => setUgur(''), 3000)
      yukle()
    } catch (err) {
      setXeta(err.response?.data?.xeta || 'Xəta baş verdi')
      setTimeout(() => setXeta(''), 3000)
    }
  }

  async function redd(id) {
    const qeyd = prompt('Rədd səbəbi (istəyə bağlı):') ?? ''
    try {
      await api.put(`/admin/balans-sorgu/${id}/redd`, { qeyd })
      setUgur('Rədd edildi')
      setTimeout(() => setUgur(''), 3000)
      yukle()
    } catch {
      setXeta('Xəta baş verdi')
      setTimeout(() => setXeta(''), 3000)
    }
  }

  async function kartSaxla() {
    setKartYuklenir(true)
    try {
      await api.put('/admin/balans-kart', { kart: kartYeni })
      setKart(kartYeni)
      setKartEdit(false)
      setUgur('Kart yeniləndi')
      setTimeout(() => setUgur(''), 3000)
    } catch {
      setXeta('Kart yeniləmə xətası')
      setTimeout(() => setXeta(''), 3000)
    } finally {
      setKartYuklenir(false)
    }
  }

  return (
    <>
      <h1>Balans Sorğuları</h1>
      {xeta && <div className="alert alert-red">{xeta}</div>}
      {ugur && <div className="alert alert-green">{ugur}</div>}

      {/* Ödəniş kartı */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          Ödəniş Kartı (Ustalar bu karta pul köçürür)
          {!kartEdit && (
            <button className="btn btn-blue" onClick={() => setKartEdit(true)}>Dəyiş</button>
          )}
        </div>
        <div style={{ padding: '16px 20px' }}>
          {kartEdit ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', maxWidth: 400 }}>
              <input
                value={kartYeni}
                onChange={e => setKartYeni(e.target.value)}
                placeholder="XXXX XXXX XXXX XXXX"
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
              />
              <button className="btn btn-green" onClick={kartSaxla} disabled={kartYuklenir}>
                {kartYuklenir ? '...' : 'Saxla'}
              </button>
              <button className="btn btn-gray" onClick={() => { setKartEdit(false); setKartYeni(kart) }}>Ləğv</button>
            </div>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 2, color: kart ? '#1e293b' : '#94a3b8' }}>
              {kart || 'Kart əlavə edilməyib'}
            </div>
          )}
        </div>
      </div>

      {/* Sorğular */}
      <div className="filter-row">
        <select value={filtr} onChange={e => setFiltr(e.target.value)}>
          <option value="gozlenir">Gözləyənlər</option>
          <option value="tesdiq">Təsdiqlənənlər</option>
          <option value="redd">Rədd edilənlər</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          Balans artırma sorğuları
          <span style={{ fontSize: 13, color: '#64748b' }}>{sorqular.length} sorğu</span>
        </div>
        {yuklenir ? (
          <div className="loading">Yüklənir...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Usta</th>
                <th>Məbləğ</th>
                <th>Kart №</th>
                <th>Qəbz</th>
                <th>Tarix</th>
                <th>Status</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {sorqular.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>Sorğu tapılmadı</td></tr>
              )}
              {sorqular.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.usta?.ad} {s.usta?.soyad}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.usta?.telefon}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#16a34a' }}>{s.məbleg} ₼</td>
                  <td style={{ fontFamily: 'monospace' }}>{s.kart_nomre}</td>
                  <td>
                    {s.qebz ? (
                      <a href={s.qebz} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: 13 }}>
                        Qəbzə bax
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(s.yaradildi).toLocaleDateString('az-AZ')}
                  </td>
                  <td>{STATUS_BADGE[s.status]}</td>
                  <td>
                    {s.status === 'gozlenir' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-green" onClick={() => tesdiq(s.id)}>Təsdiqlə</button>
                        <button className="btn btn-red" onClick={() => redd(s.id)}>Rədd et</button>
                      </div>
                    )}
                    {s.status === 'redd' && s.admin_qeyd && (
                      <span style={{ fontSize: 12, color: '#64748b' }}>{s.admin_qeyd}</span>
                    )}
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
