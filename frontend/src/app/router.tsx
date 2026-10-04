import { createBrowserRouter, Navigate } from 'react-router-dom'
import { BranchWorkspaceRoute, DeveloperWorkspaceRoute, ProtectedRoute, WorkspaceHomeRoute } from '../features/auth/protected-route'
import { LoginPage } from '../features/auth/login-page'
import { MainLandingRoute } from '../features/auth/main-landing-route'
import { StoresPage } from '../features/stores/stores-page'
import { BapPage } from '../features/bap/bap-page'
import { InvoicesPage } from '../features/invoices/invoices-page'
import { AppLayout } from './app-layout'
import { RecapsPage } from '../features/recaps/recaps-page'
import { SettingsPage } from '../features/settings/settings-page'
import SparepartsPage from '../features/spareparts/spareparts-page'
import { DeveloperUsersPage } from '../features/developer/developer-users-page'
import { DocumentTitleLayout } from './document-title-layout'

export const router = createBrowserRouter([
  {
    element: <DocumentTitleLayout />,
    children: [
      { path: '/', element: <MainLandingRoute /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [{
          element: <AppLayout />,
          children: [
            { path: '/app', element: <WorkspaceHomeRoute /> },
            {
              element: <BranchWorkspaceRoute />,
              children: [
                { path: '/app/stores', element: <StoresPage /> },
                { path: '/app/bap', element: <BapPage /> },
                { path: '/app/invoices', element: <InvoicesPage /> },
                { path: '/app/recaps', element: <RecapsPage /> },
                { path: '/app/settings', element: <SettingsPage /> },
                { path: '/app/spareparts', element: <SparepartsPage /> },
              ],
            },
            {
              element: <DeveloperWorkspaceRoute />,
              children: [
                { path: '/app/developer/api-requests', element: <Navigate to="/app/developer/users" replace /> },
                { path: '/app/developer/errors', element: <Navigate to="/app/developer/users" replace /> },
                { path: '/app/developer/users', element: <DeveloperUsersPage /> },
                { path: '/app/developer/login-users', element: <Navigate to="/app/developer/users" replace /> },
                { path: '/app/developer/branch-override', element: <Navigate to="/app/developer/users" replace /> },
                { path: '/app/developer/new-branch', element: <Navigate to="/app/developer/users" replace /> },
              ],
            },
          ],
        }],
      },
    ],
  },
])
