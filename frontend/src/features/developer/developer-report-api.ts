import { apiFetch } from '../../lib/api'

export interface ApiRequestBranchReport {
  slug: string
  name: string
  successful: number
  failed: number
  total: number
}

export interface ApiRequestReport {
  days: number
  since: string
  total: number
  successful: number
  failed: number
  branches: ApiRequestBranchReport[]
}

export type DeveloperLogStatus = 'new' | 'acknowledged' | 'resolved'

export interface DeveloperErrorReport {
  id: string
  eventId: string
  source: 'frontend' | 'backend' | string
  severity: 'fatal' | 'error' | 'warning' | 'info' | string
  status: DeveloperLogStatus
  fingerprint: string
  message: string
  stack: string | null
  requestId: string | null
  requestMethod: string | null
  requestPath: string | null
  pageUrl: string | null
  occurredAt: string
  receivedAt: string
  metadata: Record<string, unknown> | null
  workspace: { slug: string; name: string } | null
}

export interface DeveloperErrorReportResponse {
  days: number
  since: string
  summary: {
    total: number
    new: number
    acknowledged: number
    resolved: number
  }
  logs: DeveloperErrorReport[]
}

export interface DeveloperBranchUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  hasPassword: boolean
  workspace: {
    id: string
    slug: string
    name: string
    isActive: boolean
    contactPhone: string | null
    counts: { stores: number; baps: number; invoices: number }
  }
}

export interface NewPasswordResetResponse {
  userId: string
  newPassword: string
}

export interface BranchCreateInput {
  name: string
  slug: string
  contactPhone: string
  adminName: string
  adminEmail: string
}

export interface BranchCreateResponse {
  workspace: {
    id: string
    name: string
    slug: string
    domain: string
    contactPhone: string
    isActive: boolean
  }
  admin: {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
  }
  newPassword: string
}

export function getApiRequestReport(days: number) {
  return apiFetch<ApiRequestReport>(`/api/developer/reports/api-requests?days=${days}`)
}

export function getDeveloperBranchUsers() {
  return apiFetch<DeveloperBranchUser[]>('/api/developer/users')
}

export function resetDeveloperBranchUserPassword(id: string) {
  return apiFetch<NewPasswordResetResponse>(`/api/developer/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
  })
}

export function moveDeveloperBranchUser(id: string, workspaceId: string) {
  return apiFetch<{ userId: string; workspaceId: string }>(`/api/developer/users/${encodeURIComponent(id)}/branch`, {
    method: 'PATCH',
    body: JSON.stringify({ workspaceId }),
  })
}

export function setDeveloperBranchUserActive(id: string, isActive: boolean) {
  return apiFetch<{ userId: string; isActive: boolean }>(`/api/developer/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export function setDeveloperBranchActive(id: string, isActive: boolean) {
  return apiFetch<{ branchId: string; isActive: boolean }>(`/api/developer/branches/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export function deleteDeveloperBranch(id: string) {
  return apiFetch<{ branchId: string; deleted: true }>(`/api/developer/branches/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function createDeveloperBranch(input: BranchCreateInput) {
  return apiFetch<BranchCreateResponse>('/api/developer/branches', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getDeveloperErrorReport(input: {
  days: number
  status: DeveloperLogStatus | 'all'
  branch?: string
}) {
  const query = new URLSearchParams({ days: String(input.days), status: input.status })
  if (input.branch) query.set('branch', input.branch)
  return apiFetch<DeveloperErrorReportResponse>(`/api/developer/reports/errors?${query}`)
}

export function updateDeveloperErrorStatus(id: string, status: DeveloperLogStatus) {
  return apiFetch<{ id: string; status: DeveloperLogStatus }>(`/api/developer/reports/errors/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
