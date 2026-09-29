import { apiFetch } from '../../lib/api'

export interface BapItem {
  id?: string
  serviceName: string
  unit: number
  unitPrice: number
  subtotal: number
  sortOrder: number
}

export interface Bap {
  id: string
  number: string
  storeId: string
  store: { id: string; code: string; name: string; storeType: 'REG' | 'FRC' }
  date: string
  title: string
  description: string | null
  status: string
  totalAmount: number
  amountWords: string | null
  items: BapItem[]
}

export interface BapInput {
  number: string
  storeId: string
  date: string
  title: string
  description?: string
  status?: 'draft' | 'submitted' | 'review' | 'approved' | 'cancelled'
  amountWords?: string
  items: Array<{
    serviceName: string
    unit: number
    unitPrice: number
    sortOrder: number
  }>
}

export interface BapList {
  items: Bap[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export function getBaps(search: string, page = 1, limit = 20, storeType: 'REG' | 'FRC' | 'ALL' = 'ALL') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search.trim()) params.set('search', search.trim())
  if (storeType !== 'ALL') params.set('storeType', storeType)
  return apiFetch<BapList>(`/api/baps?${params}`)
}

export function createBap(input: BapInput) {
  return apiFetch<Bap>('/api/baps', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getBap(id: string) {
  return apiFetch<Bap>(`/api/baps/${id}`)
}

export function updateBap(id: string, input: Partial<BapInput>) {
  return apiFetch<Bap>(`/api/baps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteBap(id: string) {
  return apiFetch<void>(`/api/baps/${id}`, { method: 'DELETE' })
}
