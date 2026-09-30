import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth-store'
import { DashboardPage } from '../../pages/dashboard-page'

export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'initializing') {
    return <div className="auth-loading" role="status">Memulihkan sesi...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function BranchWorkspaceRoute() {
  const user = useAuthStore((state) => state.user)
  return user?.workspace.type === 'branch' && user.role !== 'developer'
    ? <Outlet />
    : <Navigate to="/app" replace />
}

export function DeveloperWorkspaceRoute() {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'developer' ? <Outlet /> : <Navigate to="/app" replace />
}

export function WorkspaceHomeRoute() {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'developer'
    ? <Navigate to="/app/developer/users" replace />
    : <DashboardPage />
}
