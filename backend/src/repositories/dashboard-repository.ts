import type { Prisma, PrismaClient } from '@prisma/client'

export class DashboardRepository {
  constructor(private readonly database: PrismaClient) {}

  countActiveStores(workspaceId: string) {
    return this.database.store.count({
      where: {
        workspaceId,
        isActive: true,
      },
    })
  }

  findMonthlyInvoices(workspaceId: string, startDate: Date, endDate: Date) {
    const where: Prisma.InvoiceWhereInput = {
      workspaceId,
      status: { not: 'deleted' },
      date: { gte: startDate, lt: endDate },
    }

    return this.database.invoice.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        store: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })
  }
}
