import { apiFetch } from '../../lib/api'

export interface Store {
  id: string
  code: string
  name: string
  storeType: 'REG' | 'FRC'
  address: string | null
  ownerName: string | null
  ownerCompany: string | null
}

export interface StoreInput {
  code: string
  name: string
  storeType: 'REG' | 'FRC'
  address?: string
  ownerName?: string
  ownerCompany?: string
}

export interface StoreList {
  items: Store[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface StoreImportRow extends StoreInput {
  rowNumber: number
}

export interface StoreImportReport {
  summary: {
    submitted: number
    success: number
    failed: number
  }
  results: Array<{
    rowNumber: number
    code: string
    name: string
    status: 'success' | 'failed'
    note: string
  }>
}

export function getStores(search: string, page = 1, limit = 20, storeType: Store['storeType'] | 'ALL' = 'ALL') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search.trim()) params.set('search', search.trim())
  if (storeType !== 'ALL') params.set('storeType', storeType)
  return apiFetch<StoreList>(`/api/stores?${params}`)
}

export function createStore(input: StoreInput) {
  return apiFetch<Store>('/api/stores', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function importStores(stores: StoreImportRow[]) {
  return apiFetch<StoreImportReport>('/api/stores/import', {
    method: 'POST',
    body: JSON.stringify({ stores }),
  })
}

export function updateStore(id: string, input: Partial<StoreInput>) {
  return apiFetch<Store>(`/api/stores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteStore(id: string) {
  return apiFetch<void>(`/api/stores/${id}`, { method: 'DELETE' })
}
