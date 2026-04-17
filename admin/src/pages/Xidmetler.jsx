import { useEffect, useState } from 'react'
import api from '../api'

const BOSH_FORM = { key: '', ad: '', altbaslik: '', ikon: 'construct', ikon_lib: 'Ionicons', rang: '#3b82f6', qiymet: '', sira: 0, aktiv: true }

export default function Xidmetler() {
  const [siyahi, setSiyahi] = useState([])
  const [yuklenir, setYuklenir] = useState(true)
  const [xeta, setXeta] = useState('')
  const [ugur, setUgur] = useState('')

  const [modal, setModal] = useState(false)
  const [redaktə, setRedakte] = useState(null) // null = yeni, id = redaktə
  const [form, setForm] = useState(BOSH_FORM)
  const [gondermede, setGondermede] = useState(false)

  async function yukle() {
    setYuklenir(true)
    try {
      const { data } = await api.get('/xidmetler?hamisi=1')
      setSiyahi(data.xidmetler)
    } catch {
      setXeta('Yükləmə xətası')
    } finally {
      setYuklenir(false)
    }
  }

  useEffect(() => { yukle() }, [])

  function yeniAc() {
    setForm(BOSH_FORM)
    setRedakte(null)
    setModal(true)
  }

  function redakteAc(x) {
    setForm({
      key: x.key,
      ad: x.ad,
      altbaslik: x.altbaslik || '',
      ikon: x.ikon,
      ikon_lib: x.ikon_lib || 'Ionicons',
      rang: x.rang || '#3b82f6',
      qiymet: x.qiymet ?? '',
      sira: x.sira ?? 0,
      aktiv: x.aktiv,
    })
    setRedakte(x.id)
    setModal(true)
  }

  function bagla() {
    setModal(false)
    setRedakte(null)
    setForm(BOSH_FORM)
  }

  async function gondər() {
    if (!form.ad.trim() || !form.key.trim()) {
      setXeta('Ad və key mütləqdir')
      setTimeout(() => setXeta(''), 3000)
      return
    }
    setGondermede(true)
    try {
      const payload = {
        ...form,
        qiymet: form.qiymet === '' ? 0 : Number(form.qiymet),
        sira: Number(form.sira),
      }
      if (redaktə) {
        await api.put(`/admin/xidmet/${redaktə}`, payload)
      } else {
        await api.post('/admin/xidmet', payload)
      }
      setUgur(redaktə ? 'Xidmət yeniləndi' : 'Xidmət əlavə edildi')
      setTimeout(() => setUgur(''), 3000)
      bagla()
      yukle()
    } catch (err) {
      setXeta(err.response?.data?.xeta || 'Xəta baş verdi')
      setTimeout(() => setXeta(''), 3000)
    } finally {
      setGondermede(false)
    }
  }

  async function sil(id, ad) {
    if (!confirm(`"${ad}" xidmətini silmək istəyirsiniz?`)) return
    try {
      await api.delete(`/admin/xidmet/${id}`)
      setUgur('Silindi')
      setTimeout(() => setUgur(''), 3000)
      yukle()
    } catch {
      setXeta('Silmə xətası')
      setTimeout(() => setXeta(''), 3000)
    }
  }

  function inp(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  return (
    <>
      <h1>Xidmətlər</h1>
      {xeta && <div className="alert alert-red">{xeta}</div>}
      {ugur && <div className="alert alert-green">{ugur}</div>}

      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-blue" onClick={yeniAc}>+ Yeni xidmət</button>
      </div>

      <div className="card">
        <div className="card-header">
          Xidmətlər siyahısı
          <span style={{ fontSize: 13, color: '#64748b' }}>{siyahi.length} xidmət</span>
        </div>
        {yuklenir ? (
          <div className="loading">Yüklənir...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sıra</th>
                <th>Ad</th>
                <th>Key</th>
                <th>Qiymət</th>
                <th>İkon</th>
                <th>Status</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {siyahi.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>Xidmət tapılmadı</td></tr>
              )}
              {siyahi.map(x => (
                <tr key={x.id}>
                  <td style={{ color: '#64748b' }}>{x.sira}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: x.rang || '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#fff'
                      }}>
                        {x.ad[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{x.ad}</div>
                        {x.altbaslik && <div style={{ fontSize: 12, color: '#94a3b8' }}>{x.altbaslik}</div>}
                      </div>
                    </div>
                  </td>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{x.key}</code></td>
                  <td style={{ color: '#475569', fontWeight: 500 }}>
                    {x.qiymet ? `${x.qiymet} ₼` : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{x.ikon}</td>
                  <td>
                    <span className={`badge ${x.aktiv ? 'badge-green' : 'badge-gray'}`}>
                      {x.aktiv ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-blue" onClick={() => redakteAc(x)}>Düzəliş</button>
                      <button className="btn btn-red" onClick={() => sil(x.id, x.ad)}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>{redaktə ? 'Xidməti Düzəlt' : 'Yeni Xidmət'}</h2>

            <div className="form-group">
              <label>Ad *</label>
              <input value={form.ad} onChange={e => inp('ad', e.target.value)} placeholder="Santexnik" />
            </div>
            <div className="form-group">
              <label>Key (unikal, ingilis) *</label>
              <input value={form.key} onChange={e => inp('key', e.target.value.toLowerCase().replace(/\s/g, '_'))} placeholder="santexnik" />
            </div>
            <div className="form-group">
              <label>Alt başlıq</label>
              <input value={form.altbaslik} onChange={e => inp('altbaslik', e.target.value)} placeholder="Su, boru işləri" />
            </div>
            <div className="form-group">
              <label>Qiymət (₼)</label>
              <input type="number" value={form.qiymet} onChange={e => inp('qiymet', e.target.value)} placeholder="50" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>İkon adı (Ionicons)</label>
                <input value={form.ikon} onChange={e => inp('ikon', e.target.value)} placeholder="construct-outline" />
              </div>
              <div className="form-group">
                <label>Rəng</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.rang} onChange={e => inp('rang', e.target.value)}
                    style={{ width: 42, height: 36, border: 'none', padding: 0, cursor: 'pointer' }} />
                  <input value={form.rang} onChange={e => inp('rang', e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Sıra nömrəsi</label>
                <input type="number" value={form.sira} onChange={e => inp('sira', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.aktiv ? 'true' : 'false'} onChange={e => inp('aktiv', e.target.value === 'true')}>
                  <option value="true">Aktiv</option>
                  <option value="false">Deaktiv</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-green" onClick={gondər} disabled={gondermede} style={{ flex: 1 }}>
                {gondermede ? 'Saxlanır...' : 'Saxla'}
              </button>
              <button className="btn btn-gray" onClick={bagla} style={{ flex: 1 }}>Ləğv et</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
