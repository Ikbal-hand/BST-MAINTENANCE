import { apiFetch } from '../../lib/api'

export interface RecapSummary {
  period: { from: string; to: string }
  summary: { invoiceCount: number; invoiceTotal: number }
  invoices: Array<{ id: string; number: string; date: string; totalAmount: number; store: { id: string; code: string; name: string; storeType: string } }>
  stores: Array<{
    storeId: string
    code: string
    name: string
    invoiceCount: number
    invoiceTotal: number
  }>
}

export function getRecapSummary(from: string, to: string, storeType?: string) {
  const params = new URLSearchParams({ from, to })
  if (storeType) params.set('storeType', storeType)
  return apiFetch<RecapSummary>(`/api/recaps/summary?${params}`)
}
