import { apiFetch } from '../../lib/api'

export interface WorkspaceSettings {
  workspaceId: string
  logoDataUrl: string | null
  signerName: string
  bankAccount: string
  bankName: string
  bankAccountName: string
  transportPrice: number
  servicePrice: number
  signatureDataUrl: string | null
  primaryColor: string
}

export function getSettings() {
  return apiFetch<WorkspaceSettings>('/api/settings')
}

export function updateSettings(input: Omit<WorkspaceSettings, 'workspaceId'>) {
  return apiFetch<WorkspaceSettings>('/api/settings', { method: 'PATCH', body: JSON.stringify(input) })
}
