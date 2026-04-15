import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Giris() {
  const nav = useNavigate()
  const [form, setForm] = useState({ telefon: '', sifre: '' })
  const [xeta, setXeta] = useState('')
  const [yuklenir, setYuklenir] = useState(false)
  const [goster, setGoster] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

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
    <div style={s.page}>
      {/* Background gradient blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={s.logoText}>Findmas</span>
        </div>

        <h1 style={s.title}>Admin Panel</h1>
        <p style={s.subtitle}>Hesabınıza daxil olun</p>

        {xeta && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="#EF4444"/>
            </svg>
            {xeta}
          </div>
        )}

        <form onSubmit={submit} style={s.form}>
          {/* Telefon */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Telefon nömrəsi</label>
            <div style={s.inputWrap}>
              <svg style={s.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.22 6.22l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                style={s.input}
                type="tel"
                placeholder="+994501234567"
                value={form.telefon}
                onChange={e => set('telefon', e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Şifrə */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Şifrə</label>
            <div style={s.inputWrap}>
              <svg style={s.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#64748B" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                style={s.input}
                type={goster ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.sifre}
                onChange={e => set('sifre', e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" style={s.eyeBtn} onClick={() => setGoster(g => !g)}>
                {goster ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748B" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="#64748B" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button style={{ ...s.submitBtn, ...(yuklenir ? s.submitBtnDisabled : {}) }} type="submit" disabled={yuklenir}>
            {yuklenir ? (
              <span style={s.spinner} />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10 17 15 12 10 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="15" y1="12" x2="3" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Daxil ol
              </>
            )}
          </button>
        </form>

        <p style={s.footer}>Findmas Admin © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0F1421',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', top: '-120px', right: '-80px',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-100px', left: '-60px',
    width: '320px', height: '320px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    background: '#1A2135',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '28px',
  },
  logoIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px',
  },
  title: {
    fontSize: '22px', fontWeight: '700', color: '#FFFFFF',
    marginBottom: '6px', lineHeight: 1.3,
  },
  subtitle: {
    fontSize: '14px', color: '#64748B', marginBottom: '24px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#EF4444',
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0px' },
  fieldWrap: { marginBottom: '16px' },
  label: {
    display: 'block', fontSize: '13px', fontWeight: '500',
    color: '#94A3B8', marginBottom: '8px',
  },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: '#0F1421',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '0 14px',
    transition: 'border-color 0.15s',
  },
  inputIcon: { flexShrink: 0, marginRight: '10px' },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#FFFFFF',
    padding: '13px 0',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: '100%', padding: '14px',
    background: '#22C55E',
    color: '#FFFFFF',
    border: 'none', borderRadius: '12px',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.15s',
    boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
  },
  submitBtnDisabled: {
    opacity: 0.6, cursor: 'not-allowed',
  },
  spinner: {
    width: '18px', height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    textAlign: 'center', fontSize: '12px',
    color: '#334155', marginTop: '28px',
  },
}
