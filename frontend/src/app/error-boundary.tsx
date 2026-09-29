import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportFrontendError } from '../lib/developer-error-reporter'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportFrontendError({
      error,
      severity: 'fatal',
      metadata: { type: 'react.error-boundary', componentStack: info.componentStack?.slice(0, 8000) },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-fallback" role="alert">
          <h1>Terjadi gangguan pada aplikasi.</h1>
          <p>Laporan error telah dikirim. Muat ulang halaman untuk mencoba kembali.</p>
          <button type="button" onClick={() => window.location.reload()}>Muat ulang halaman</button>
        </main>
      )
    }

    return this.props.children
  }
}
