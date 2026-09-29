import { apiFetch } from '../../lib/api'
import type { AuthUser } from '../../stores/auth-store'

interface LoginResponse {
  user: AuthUser
}

export function login(email: string, password: string, rememberMe: boolean) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe }),
  })
}

export function getCurrentUser() {
  return apiFetch<AuthUser>('/api/auth/me')
}

export function logout() {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ changed: boolean }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}
