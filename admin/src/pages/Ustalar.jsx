import { useEffect, useState } from 'react'
import api from '../api'

const STATUS_BADGE = {
  true: <span className="badge badge-green">Təsdiqlənib</span>,
  false: <span className="badge badge-yellow">Gözləyir</span>,
}

export default function Ustalar() {
  const [ustalar, setUstalar] = useState([])
  const [filtr, setFiltr] = useState('hamisi')
  const [yuklenir, setYuklenir] = useState(true)
  const [xeta, setXeta] = useState('')

  // Blok modal
  const [blokModal, setBlokModal] = useState(null) // usta obj
  const [blokMuddet, setBlokMuddet] = useState('10')
  const [blokSebeb, setBlokSebeb] = useState('')

  // Sənəd baxış modal
  const [senedModal, setSenedModal] = useState(null)

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
    await api.put(`/admin/usta/${id}/tesdiql`)
    yukle(filtr)
  }

  async function bloklaGonder() {
    if (!blokModal) return
    try {
      await api.put(`/admin/usta/${blokModal.id}/blokla`, {
        muddet: parseInt(blokMuddet),
        sebeb: blokSebeb || undefined,
      })
      setBlokModal(null)
      setBlokSebeb('')
      setBlokMuddet('10')
      yukle(filtr)
    } catch (err) {
      alert(err.response?.data?.xeta || 'Xəta')
    }
  }

  async function blokAc(id) {
    if (!confirm('Bloku açmaq istəyirsiniz?')) return
    await api.put(`/admin/usta/${id}/blok-ac`)
    yukle(filtr)
  }

  return (
    <>
      <h1>Ustalar</h1>
      {xeta && <div className="alert alert-red">{xeta}</div>}

      <div className="filter-row">
        <select value={filtr} onChange={e => setFiltr(e.target.value)}>
          <option value="hamisi">Hamısı</option>
          <option value="false">Təsdiq gözləyənlər</option>
          <option value="true">Təsdiqlənənlər</option>
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
                <th>Sənədlər</th>
                <th>Reytinq</th>
                <th>Balans</th>
                <th>Status</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {ustalar.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8' }}>Usta tapılmadı</td></tr>
              )}
              {ustalar.map(u => (
                <tr key={u.id} style={u.bloklanib ? { opacity: 0.6, background: '#fef2f2' } : {}}>
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
                  <td style={{ textTransform: 'capitalize' }}>
                    {(u.kateqoriyalar && u.kateqoriyalar.length > 0)
                      ? u.kateqoriyalar.map((k, i) => {
                          const aktiv = (u.aktiv_kateqoriyalar || []).includes(k);
                          return <span key={k} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 12, marginRight: 4, background: aktiv ? '#dcfce7' : '#f1f5f9', color: aktiv ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>{k}</span>;
                        })
                      : u.kateqoriya || '—'}
                  </td>
                  <td>
                    {(u.vesiqe_on || u.lisenziya) ? (
                      <button className="btn btn-sm" onClick={() => setSenedModal(u)} style={{ fontSize: 12, padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        Bax ({[u.vesiqe_on && 'Vəsiqə', u.lisenziya && 'Lisenziya'].filter(Boolean).join(', ')})
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Yoxdur</span>
                    )}
                  </td>
                  <td>⭐ {u.orta_reytinq || '—'} ({u.tamamlanan_sifaris})</td>
                  <td style={{ fontWeight: 600, color: parseFloat(u.balans) < 0 ? '#ef4444' : '#16a34a' }}>
                    {parseFloat(u.balans || 0).toFixed(2)} ₼
                  </td>
                  <td>
                    {u.bloklanib ? (
                      <span className="badge badge-red">
                        Bloklu {u.blok_bitis ? `(${new Date(u.blok_bitis).toLocaleDateString('az')}-dək)` : '(Həmişəlik)'}
                      </span>
                    ) : STATUS_BADGE[u.tesdiqlendi]}
                  </td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!u.tesdiqlendi && !u.bloklanib && (
                      <button className="btn btn-green" onClick={() => tesdiqlə(u.id)}>Təsdiqlə</button>
                    )}
                    {u.bloklanib ? (
                      <button className="btn btn-blue" onClick={() => blokAc(u.id)}>Bloku aç</button>
                    ) : (
                      <button className="btn btn-red" onClick={() => { setBlokModal(u); setBlokMuddet('10'); setBlokSebeb(''); }}>Blokla</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Blok Modal ── */}
      {blokModal && (
        <div className="modal-overlay" onClick={() => setBlokModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Ustanı blokla</h3>
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              <strong>{blokModal.ad} {blokModal.soyad}</strong> — {blokModal.telefon}
            </p>

            <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Blok müddəti</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { val: '10', label: '10 gün' },
                { val: '30', label: '30 gün' },
                { val: '90', label: '90 gün' },
                { val: '0', label: 'Həmişəlik' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setBlokMuddet(opt.val)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: blokMuddet === opt.val ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    background: blokMuddet === opt.val ? '#fef2f2' : '#fff',
                    color: blokMuddet === opt.val ? '#dc2626' : '#334155',
                    fontWeight: blokMuddet === opt.val ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Səbəb (istəyə bağlı)</label>
            <textarea
              value={blokSebeb}
              onChange={e => setBlokSebeb(e.target.value)}
              placeholder="Blok səbəbi..."
              rows={3}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', resize: 'vertical', marginBottom: 20 }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setBlokModal(null)} style={{ background: '#e2e8f0', color: '#334155' }}>Ləğv et</button>
              <button className="btn btn-red" onClick={bloklaGonder}>Blokla</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sənəd Modal ── */}
      {senedModal && (
        <div className="modal-overlay" onClick={() => setSenedModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>{senedModal.ad} {senedModal.soyad} — Sənədlər</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {senedModal.vesiqe_on && (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Şəxsiyyət vəsiqəsi (ön hissə)</p>
                  <img src={senedModal.vesiqe_on} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </div>
              )}
              {senedModal.lisenziya && (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Lisenziya / Sertifikat</p>
                  <img src={senedModal.lisenziya} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </div>
              )}
              {!senedModal.vesiqe_on && !senedModal.lisenziya && (
                <p style={{ color: '#94a3b8' }}>Sənəd yüklənməyib</p>
              )}
            </div>
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn" onClick={() => setSenedModal(null)} style={{ background: '#e2e8f0', color: '#334155' }}>Bağla</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
