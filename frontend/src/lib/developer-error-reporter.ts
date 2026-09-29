import { appConfig } from '../config'

type ErrorReport = {
  message: string
  source: 'frontend'
  severity: 'fatal' | 'error' | 'warning'
  fingerprint: string
  stack?: string
  requestId?: string
  requestMethod?: string
  requestPath?: string
  pageUrl: string
  metadata?: Record<string, unknown>
  occurredAt: string
}

function fingerprint(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function makeEventId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function reportFrontendError(input: {
  error: Error | string
  severity?: ErrorReport['severity']
  requestId?: string
  requestMethod?: string
  requestPath?: string
  metadata?: Record<string, unknown>
}) {
  const message = (typeof input.error === 'string' ? input.error : input.error.message)
    .slice(0, 2000)
  const stack = typeof input.error === 'string' ? undefined : input.error.stack?.slice(0, 10_000)
  const method = input.requestMethod?.slice(0, 10)
  const path = input.requestPath?.split('?')[0].slice(0, 500)
  const event: ErrorReport = {
    source: 'frontend',
    severity: input.severity ?? 'error',
    fingerprint: fingerprint(`${method ?? ''}:${path ?? ''}:${message}`),
    message,
    stack,
    requestId: input.requestId?.slice(0, 100),
    requestMethod: method,
    requestPath: path,
    pageUrl: window.location.href.split('?')[0].slice(0, 2000),
    metadata: input.metadata,
    occurredAt: new Date().toISOString(),
  }

  void fetch(`${appConfig.apiUrl}/api/developer-logs/client`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, eventId: makeEventId() }),
  }).then((response) => {
    if (!response.ok) {
      console.error('Gagal mengirim laporan error ke server', response.status)
    }
  }).catch((error: unknown) => {
    console.error('Gagal mengirim laporan error ke server', error)
  })
}

export function installGlobalErrorReporting() {
  const handleError = (event: ErrorEvent) => {
    reportFrontendError({
      error: event.error instanceof Error ? event.error : event.message || 'Terjadi error di browser',
      severity: 'fatal',
      metadata: { type: 'window.error', filename: event.filename, line: event.lineno, column: event.colno },
    })
  }

  const handleRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error
      ? event.reason
      : String(event.reason ?? 'Promise ditolak tanpa detail')
    reportFrontendError({ error, severity: 'error', metadata: { type: 'unhandledrejection' } })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)
  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleRejection)
  }
}
