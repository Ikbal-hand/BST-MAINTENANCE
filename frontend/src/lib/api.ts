import { appConfig } from '../config'

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
  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { code?: string; message?: string; requestId?: string } }
    | null

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? 'Terjadi kesalahan pada server',
      response.status,
      payload?.error?.requestId,
    )
  }

  return payload?.data as T
}
