import { Component, type ReactNode } from 'react'

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

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-fallback" role="alert">
          <h1>Terjadi gangguan pada aplikasi.</h1>
          <p>Muat ulang halaman untuk mencoba kembali.</p>
          <button type="button" onClick={() => window.location.reload()}>Muat ulang halaman</button>
        </main>
      )
    }

    return this.props.children
  }
}
