import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from './auth-api'
import { useAuthStore } from '../../stores/auth-store'
import { appConfig, getMainLandingUrl, resolveCurrentWorkspace } from '../../config'
import bstLogo from '../../../../image/Frame 5.png'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app'
  const notice = (location.state as { message?: string } | null)?.message
  const workspace = resolveCurrentWorkspace()
  const mainLandingUrl = getMainLandingUrl()
  const workspaceDescription = workspace.type === 'central'
    ? 'Pusat · akses developer'
    : workspace.type === 'branch'
      ? `Cabang ${workspace.slug[0].toUpperCase()}${workspace.slug.slice(1)}`
      : `Workspace lokal · ${appConfig.appDomain}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      const result = await login(email, password, rememberMe)
      setUser(result.user)
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login gagal')
    }
  }

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-top" />
      <div className="login-decoration login-decoration-bottom" />
      <header className="login-header">
        <a className="brand" href={mainLandingUrl} aria-label="Kembali ke BST Invoice">
          <img className="brand-logo" src={bstLogo} alt="BST Invoice" />
        </a>
        <a className="back-link" href={mainLandingUrl}>← Kembali ke beranda</a>
      </header>
      <main className="login-main">
        <section className="login-card" aria-labelledby="login-title">
          <p className="eyebrow login-eyebrow"><span /> WORKSPACE LOGIN</p>
          <h1 id="login-title">Masuk ke akun Anda.</h1>
          <p className="login-intro">{workspaceDescription} · {window.location.hostname}</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@perusahaan.com" autoComplete="email" required />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" autoComplete="current-password" required />
            <label className="login-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Ingat saya di perangkat ini</span>
            </label>
            <button className="login-button" type="submit">Masuk ke aplikasi <span aria-hidden="true">↗</span></button>
            {notice && <p className="login-message login-message-success" role="status">{notice}</p>}
            {error && <p className="login-message" role="alert">{error}</p>}
          </form>
        </section>
      </main>
      <footer className="login-footer">
        <span>© 2026 BST Invoice · v{appConfig.appVersion}</span>
        <span>Secure workspace for better work.</span>
      </footer>
    </div>
  )
}
