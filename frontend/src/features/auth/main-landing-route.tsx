import { useEffect } from 'react'
import { LandingPage } from '../../pages/landing-page'
import { getMainLandingUrl, resolveCurrentWorkspace } from '../../config'

export function MainLandingRoute() {
  const workspace = resolveCurrentWorkspace()

  useEffect(() => {
    if (workspace.type === 'branch') {
      window.location.replace(getMainLandingUrl())
    }
  }, [workspace.type])

  if (workspace.type === 'branch') {
    return <main className="auth-loading" role="status">Mengalihkan ke halaman utama...</main>
  }

  return <LandingPage />
}
