import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Giris() {
  const nav = useNavigate()
  const [form, setForm] = useState({ telefon: '', sifre: '' })
  const [xeta, setXeta] = useState('')
  const [yuklenir, setYuklenir] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setXeta('')
    setYuklenir(true)
    try {
      const { data } = await api.post('/admin/giris', form)
      localStorage.setItem('admin_token', data.token)
      nav('/')
    } catch (err) {
      setXeta(err.response?.data?.xeta || 'Xəta baş verdi')
    } finally {
      setYuklenir(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h2>Admin Giriş</h2>
        {xeta && <div className="alert alert-red">{xeta}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Telefon</label>
            <input
              type="text"
              placeholder="+994501234567"
              value={form.telefon}
              onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Şifrə</label>
            <input
              type="password"
              value={form.sifre}
              onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-blue" style={{ width: '100%' }} disabled={yuklenir}>
            {yuklenir ? 'Giriş edilir...' : 'Daxil ol'}
          </button>
        </form>
      </div>
    </div>
  )
}
