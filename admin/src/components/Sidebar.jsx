import { NavLink, useNavigate } from 'react-router-dom'

const LINKLER = [
  { to: '/', label: '📊 Statistika' },
  { to: '/ustalar', label: '🔧 Ustalar' },
  { to: '/sifarisler', label: '📋 Sifarişlər' },
]

export default function Sidebar() {
  const nav = useNavigate()

  function cixis() {
    localStorage.removeItem('admin_token')
    nav('/giris')
  }

  return (
    <div className="sidebar">
      <div className="logo">⚡ Usta Çağır</div>
      {LINKLER.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          {l.label}
        </NavLink>
      ))}
      <div style={{ marginTop: 'auto', padding: '20px 20px 0' }}>
        <button className="btn btn-red" style={{ width: '100%' }} onClick={cixis}>Çıxış</button>
      </div>
    </div>
  )
}
