import { apiFetch } from '../../lib/api'
import type { Bap } from '../bap/bap-api'

export type InvoiceStatus = 'unpaid' | 'paid' | 'revision'

export interface Invoice {
  id: string
  number: string
  date: string
  purpose: string | null
  totalAmount: number
  amountWords: string | null
  status: InvoiceStatus
  store: { id: string; code: string; name: string; ownerCompany: string | null }
  bap: Bap | null
  baps: Bap[]
}

export interface InvoiceInput {
  date: string
  storeId: string
  bapIds: string[]
  purpose?: string
  amountWords?: string
}

export interface InvoiceUpdateInput {
  number?: string
  date?: string
  purpose?: string
  amountWords?: string
  status?: InvoiceStatus
}

export interface InvoiceList {
  items: Invoice[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export function getInvoices(search: string, status?: InvoiceStatus) {
  const params = new URLSearchParams({ page: '1', limit: '20' })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return apiFetch<InvoiceList>(`/api/invoices?${params}`)
}

export function createInvoice(input: InvoiceInput) {
  return apiFetch<Invoice>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getInvoice(id: string) {
  return apiFetch<Invoice>(`/api/invoices/${id}`)
}

export function updateInvoice(id: string, input: InvoiceUpdateInput) {
  return apiFetch<Invoice>(`/api/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteInvoice(id: string) {
  return apiFetch<void>(`/api/invoices/${id}`, { method: 'DELETE' })
}

export function getAvailableBaps(date: string, storeId: string) {
  const params = new URLSearchParams({ date, storeId })
  return apiFetch<Bap[]>(`/api/baps/available-for-invoice?${params}`)
}
