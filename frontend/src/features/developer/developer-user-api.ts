import { apiFetch } from '../../lib/api'

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
