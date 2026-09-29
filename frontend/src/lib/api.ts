import { appConfig } from '../config'
import { reportFrontendError } from './developer-error-reporter'

export class ApiError extends Error {
  readonly status: number
  readonly requestId?: string

  constructor(
    message: string,
    status: number,
    requestId?: string,
  ) {
    super(message)
    this.status = status
    this.requestId = requestId
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${appConfig.apiUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch (error) {
    reportFrontendError({
      error: error instanceof Error ? error : String(error),
      severity: 'error',
      requestMethod: options.method ?? 'GET',
      requestPath: path,
      metadata: { kind: 'network_error' },
    })
    throw error
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { code?: string; message?: string; requestId?: string } }
    | null

  if (!response.ok) {
    if (response.status !== 401 && !(response.status >= 500 && payload?.error?.requestId)) {
      reportFrontendError({
        error: payload?.error?.message ?? `Permintaan gagal dengan status ${response.status}`,
        severity: response.status >= 500 ? 'error' : 'warning',
        requestId: payload?.error?.requestId ?? response.headers.get('x-request-id') ?? undefined,
        requestMethod: options.method ?? 'GET',
        requestPath: path,
        metadata: {
          kind: 'api_error',
          statusCode: response.status,
          errorCode: payload?.error?.code,
        },
      })
    }
    throw new ApiError(
      payload?.error?.message ?? 'Terjadi kesalahan pada server',
      response.status,
      payload?.error?.requestId,
    )
  }

  return payload?.data as T
}
