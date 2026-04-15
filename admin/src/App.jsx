import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Giris from './pages/Giris'
import Statistika from './pages/Statistika'
import Ustalar from './pages/Ustalar'
import Sifarisler from './pages/Sifarisler'
import Balanslar from './pages/Balanslar'
import Xidmetler from './pages/Xidmetler'

function PrivateLayout({ children }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/giris" replace />
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/giris" element={<Giris />} />
        <Route path="/" element={<PrivateLayout><Statistika /></PrivateLayout>} />
        <Route path="/ustalar" element={<PrivateLayout><Ustalar /></PrivateLayout>} />
        <Route path="/sifarisler" element={<PrivateLayout><Sifarisler /></PrivateLayout>} />
        <Route path="/balanslar" element={<PrivateLayout><Balanslar /></PrivateLayout>} />
        <Route path="/xidmetler" element={<PrivateLayout><Xidmetler /></PrivateLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
