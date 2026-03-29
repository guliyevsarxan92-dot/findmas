import { useEffect, useState } from 'react'
import api from '../api'

const STATUS_LABEL = {
  gozlenilir: { text: 'Gözlənilir', cls: 'badge-yellow' },
  qebul_edildi: { text: 'Qəbul edildi', cls: 'badge-blue' },
  yolda: { text: 'Yolda', cls: 'badge-blue' },
  baslandi: { text: 'Başlandı', cls: 'badge-blue' },
  tamamlandi: { text: 'Tamamlandı', cls: 'badge-green' },
  odendi: { text: 'Ödənildi', cls: 'badge-green' },
  legv_edildi: { text: 'Ləğv edildi', cls: 'badge-red' },
  redd_edildi: { text: 'Rədd edildi', cls: 'badge-red' },
}

function tarihFormat(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Sifarisler() {
  const [sifarisler, setSifarisler] = useState([])
  const [cem, setCem] = useState(0)
  const [filtr, setFiltr] = useState('')
  const [sehife, setSehife] = useState(1)
  const [yuklenir, setYuklenir] = useState(true)

  useEffect(() => {
    setYuklenir(true)
    const param = new URLSearchParams({ sehife })
    if (filtr) param.set('status', filtr)
    api.get(`/admin/sifarisler?${param}`).then(r => {
      setSifarisler(r.data.sifarisler)
      setCem(r.data.cem)
    }).finally(() => setYuklenir(false))
  }, [filtr, sehife])

  const STATUSLAR = ['', ...Object.keys(STATUS_LABEL)]

  return (
    <>
      <h1>Sifarişlər</h1>
      <div className="filter-row">
        <select value={filtr} onChange={e => { setFiltr(e.target.value); setSehife(1) }}>
          <option value="">Bütün statuslar</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.text}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: '#64748b' }}>Cəmi: {cem}</span>
      </div>

      <div className="card">
        {yuklenir ? <div className="loading">Yüklənir...</div> : (
          <table>
            <thead>
              <tr>
                <th>Tarix</th>
                <th>İstifadəçi</th>
                <th>Usta</th>
                <th>Kateqoriya</th>
                <th>Ünvan</th>
                <th>Məbləğ</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sifarisler.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>Sifariş yoxdur</td></tr>
              )}
              {sifarisler.map(s => {
                const st = STATUS_LABEL[s.status] || { text: s.status, cls: 'badge-gray' }
                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: 12 }}>{tarihFormat(s.yaradildi)}</td>
                    <td>{s.istifadeci ? `${s.istifadeci.ad} ${s.istifadeci.soyad}` : '—'}</td>
                    <td>{s.usta ? `${s.usta.ad} ${s.usta.soyad}` : '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.kateqoriya}</td>
                    <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.unvan_metn}</td>
                    <td>{s.məbleg ? `${s.məbleg} ₼` : '—'}</td>
                    <td><span className={`badge ${st.cls}`}>{st.text}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {/* Səhifələmə */}
        <div style={{ display: 'flex', gap: 8, padding: 16, justifyContent: 'flex-end' }}>
          <button className="btn btn-gray" disabled={sehife === 1} onClick={() => setSehife(s => s - 1)}>← Əvvəl</button>
          <span style={{ padding: '7px 14px', fontSize: 13 }}>Səh. {sehife}</span>
          <button className="btn btn-gray" disabled={sifarisler.length < 20} onClick={() => setSehife(s => s + 1)}>Sonra →</button>
        </div>
      </div>
    </>
  )
}
