import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, Building2, FileText, LayoutDashboard, LogOut, Menu, Network, Receipt, Settings, Store, TriangleAlert, UsersRound, X, type LucideIcon } from 'lucide-react'
import { logout } from '../features/auth/auth-api'
import { useAuthStore } from '../stores/auth-store'
import { EventPopup, type EventPopupType } from '../components/ui/event-popup'
import bstLogo from '../../../image/Frame 5.png'

type NavigationItem = { label: string; path: string; icon: LucideIcon; end?: boolean }

const navigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, end: true },
  { label: 'Data Toko', path: '/app/stores', icon: Store },
  { label: 'BAP', path: '/app/bap', icon: FileText },
  { label: 'Invoice dan SPH', path: '/app/invoices', icon: Receipt },
  { label: 'Rekap', path: '/app/recaps', icon: BarChart3 },
]

const developerNavigation: NavigationItem[] = [
  { label: 'API Request Report', path: '/app/developer/api-requests', icon: Network },
  { label: 'Error Report', path: '/app/developer/errors', icon: TriangleAlert },
  { label: 'Manajemen User & Cabang', path: '/app/developer/users', icon: UsersRound },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const [popup, setPopup] = useState<{ type: EventPopupType; title: string; description?: string } | null>(null)
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const navigate = useNavigate()
  const isDeveloper = user?.role === 'developer'
  const activeNavigation = isDeveloper ? developerNavigation : navigation

  async function handleLogout() {
    setPopup({ type: 'loading', title: 'Keluar dari aplikasi', description: 'Sesi Anda sedang ditutup.' })
    try {
      await logout()
      clear()
      navigate('/login', { replace: true })
    } catch (error) {
      setPopup({
        type: 'error',
        title: 'Gagal keluar',
        description: error instanceof Error ? error.message : 'Sesi belum dapat ditutup. Silakan coba lagi.',
      })
    }
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" type="button" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu size={21} /></button>
      {open && <button className="sidebar-backdrop" type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
      <aside className={`app-sidebar${open ? ' is-open' : ''}`}>
        <div className="sidebar-brand-row">
          <NavLink className="brand" to="/app" onClick={() => setOpen(false)} aria-label="BST Invoice"><img className="sidebar-brand-logo" src={bstLogo} alt="BST Invoice" /></NavLink>
          <button className="sidebar-close" type="button" onClick={() => setOpen(false)} aria-label="Tutup menu"><X size={19} /></button>
        </div>
        <div className="workspace-switcher"><span className="workspace-icon"><Building2 size={15} /></span><span><small>WORKSPACE</small><strong>{user?.workspace.name ?? 'Workspace'}</strong></span></div>
        <nav className="sidebar-nav" aria-label="Menu aplikasi">
          <small className="sidebar-label">{isDeveloper ? 'ADMINISTRASI PUSAT' : 'MENU UTAMA'}</small>
          {activeNavigation.map((item) => {
            const Icon = item.icon
            return <NavLink className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} end={item.end} key={item.path} to={item.path} onClick={() => setOpen(false)}><Icon size={17} /><span>{item.label}</span></NavLink>
          })}
          {!isDeveloper && <>
            <small className="sidebar-label sidebar-label-settings">PENGATURAN</small>
            <NavLink className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} to="/app/settings" onClick={() => setOpen(false)}><Settings size={17} /><span>Pengaturan</span></NavLink>
          </>}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user"><span className="user-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? 'U'}</span><span><strong>{user?.name ?? 'User'}</strong><small>{user?.role === 'developer' ? 'Developer' : 'Admin Cabang'}</small></span></div>
          <button type="button" className="logout-button" onClick={() => setPopup({ type: 'confirm', title: 'Keluar dari aplikasi?', description: 'Anda perlu masuk kembali untuk mengakses workspace ini.', })} aria-label="Keluar"><LogOut size={17} /></button>
        </div>
      </aside>
      <div className="app-main"><Outlet /></div>
      <EventPopup
        open={popup !== null}
        type={popup?.type ?? 'loading'}
        title={popup?.title ?? ''}
        description={popup?.description}
        onClose={() => setPopup(null)}
        onConfirm={handleLogout}
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}