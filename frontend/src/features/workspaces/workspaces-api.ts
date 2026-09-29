import { apiFetch } from '../../lib/api'

export interface BranchWorkspace {
  id: string
  slug: string
  name: string
}

export function getActiveBranches() {
  return apiFetch<BranchWorkspace[]>('/api/workspaces/branches')
}
