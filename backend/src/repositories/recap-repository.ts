import type { Prisma, PrismaClient } from '@prisma/client'

export class RecapRepository {
  constructor(private readonly database: PrismaClient) {}

  findInvoices(workspaceId: string, dateStart: Date, dateEnd: Date, storeType?: string) {
    const where: Prisma.InvoiceWhereInput = {
      workspaceId,
      status: { not: 'deleted' },
      date: { gte: dateStart, lt: dateEnd },
      ...(storeType ? { store: { is: { storeType } } } : {}),
    }

    return this.database.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        date: true,
        purpose: true,
        totalAmount: true,
        store: { select: { id: true, code: true, name: true, storeType: true } },
        bap: {
          select: {
            title: true,
            description: true,
            items: { select: { serviceName: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
        invoiceBaps: {
          select: {
            bap: {
              select: {
                title: true,
                description: true,
                items: { select: { serviceName: true }, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })
  }
}
