import { DashboardRepository } from '../repositories/dashboard-repository.js'

type StoreSummary = {
  storeId: string
  code: string
  name: string
  invoiceCount: number
  invoiceTotal: number
}

export class DashboardService {
  constructor(private readonly dashboards: DashboardRepository) {}

  async getCurrentMonthSummary(workspaceId: string, now = new Date()) {
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    const [totalStores, invoices] = await Promise.all([
      this.dashboards.countActiveStores(workspaceId),
      this.dashboards.findMonthlyInvoices(workspaceId, startDate, endDate),
    ])

    const byStore = new Map<string, StoreSummary>()
    for (const invoice of invoices) {
      const current = byStore.get(invoice.store.id) ?? {
        storeId: invoice.store.id,
        code: invoice.store.code,
        name: invoice.store.name,
        invoiceCount: 0,
        invoiceTotal: 0,
      }
      current.invoiceCount += 1
      current.invoiceTotal += invoice.totalAmount
      byStore.set(invoice.store.id, current)
    }

    const topStore = [...byStore.values()].sort((left, right) => {
      if (right.invoiceCount !== left.invoiceCount) return right.invoiceCount - left.invoiceCount
      if (right.invoiceTotal !== left.invoiceTotal) return right.invoiceTotal - left.invoiceTotal
      return left.name.localeCompare(right.name, 'id')
    })[0] ?? null

    return {
      period: {
        month: startDate.getUTCMonth() + 1,
        year: startDate.getUTCFullYear(),
        from: startDate.toISOString().slice(0, 10),
        to: new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 0)).toISOString().slice(0, 10),
      },
      totalStores,
      monthlyInvoiceCount: invoices.length,
      monthlyInvoiceTotal: invoices.reduce((total, invoice) => total + invoice.totalAmount, 0),
      topStore,
    }
  }
}
