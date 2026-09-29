import { RecapRepository } from '../repositories/recap-repository.js'

export class RecapService {
  constructor(private readonly recaps: RecapRepository) {}

  async summarize(workspaceId: string, from: Date, to: Date, storeType?: string) {
    const dateStart = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
    const dateEnd = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1))
    const invoices = await this.recaps.findInvoices(workspaceId, dateStart, dateEnd, storeType)

    const byStore = new Map<string, {
      storeId: string
      code: string
      name: string
      invoiceCount: number
      invoiceTotal: number
    }>()

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

    return {
      period: { from: dateStart.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      summary: {
        invoiceCount: invoices.length,
        invoiceTotal: invoices.reduce((total, invoice) => total + invoice.totalAmount, 0),
      },
      invoices,
      stores: [...byStore.values()].sort((a, b) => a.name.localeCompare(b.name, 'id')),
    }
  }
}
