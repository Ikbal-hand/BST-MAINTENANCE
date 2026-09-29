import { apiFetch } from '../lib/api'

export interface DashboardSummary {
  period: {
    month: number
    year: number
    from: string
    to: string
  }
  totalStores: number
  monthlyInvoiceCount: number
  monthlyInvoiceTotal: number
  topStore: {
    storeId: string
    code: string
    name: string
    invoiceCount: number
    invoiceTotal: number
  } | null
}

export function getDashboardSummary() {
  return apiFetch<DashboardSummary>('/api/dashboard/summary')
}
