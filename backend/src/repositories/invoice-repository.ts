import type { Prisma, PrismaClient } from '@prisma/client'

const invoiceInclude = {
  store: true,
  bap: true,
  invoiceBaps: {
    include: {
      bap: {
        include: {
          items: { orderBy: { sortOrder: 'asc' as const } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.InvoiceInclude

export type InvoiceCreateData = {
  number: string
  date: Date
  bapIds: string[]
  purpose?: string
  amountWords?: string
  createdById: string
  storeId: string
  totalAmount: number
}

export type InvoiceUpdateData = Partial<Pick<InvoiceCreateData, 'number' | 'date' | 'purpose' | 'amountWords'>> & {
  status?: 'unpaid' | 'paid' | 'revision'
}

export class InvoiceRepository {
  constructor(private readonly database: PrismaClient) {}

  list(workspaceId: string, page: number, limit: number, search?: string, status?: 'unpaid' | 'paid' | 'revision') {
    const where: Prisma.InvoiceWhereInput = {
      workspaceId,
      status: status
        ? { in: status === 'unpaid' ? ['unpaid', 'draft'] : [status] }
        : { not: 'deleted' },
      ...(search
        ? {
            OR: [
              { number: { contains: search } },
              { purpose: { contains: search } },
              { store: { is: { code: { contains: search } } } },
              { store: { is: { name: { contains: search } } } },
              { bap: { is: { number: { contains: search } } } },
              { invoiceBaps: { some: { bap: { number: { contains: search } } } } },
            ],
          }
        : {}),
    }

    return Promise.all([
      this.database.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.database.invoice.count({ where }),
    ])
  }

  findById(workspaceId: string, id: string) {
    return this.database.invoice.findFirst({
      where: { id, workspaceId, status: { not: 'deleted' } },
      include: invoiceInclude,
    })
  }

  findAvailableBaps(workspaceId: string, dateStart: Date, dateEnd: Date, storeId: string) {
    return this.database.bap.findMany({
      where: {
        workspaceId,
        storeId,
        status: { not: 'deleted' },
        date: { gte: dateStart, lt: dateEnd },
        store: { isActive: true },
      },
      include: {
        store: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })
  }

  findBaps(workspaceId: string, bapIds: string[]) {
    return this.database.bap.findMany({
      where: { id: { in: bapIds }, workspaceId, status: { not: 'deleted' } },
      select: { id: true, number: true, storeId: true, date: true, totalAmount: true, amountWords: true },
    })
  }

  storeExists(workspaceId: string, storeId: string) {
    return this.database.store.findFirst({
      where: { id: storeId, workspaceId, isActive: true },
      select: { id: true },
    })
  }

  create(workspaceId: string, data: InvoiceCreateData) {
    const { bapIds, ...invoice } = data
    return this.database.invoice.create({
      data: {
        ...invoice,
        workspaceId,
        invoiceBaps: { create: bapIds.map((bapId) => ({ bapId })) },
      },
      include: invoiceInclude,
    })
  }

  async update(workspaceId: string, id: string, data: InvoiceUpdateData) {
    return this.database.$transaction(async (transaction) => {
      const result = await transaction.invoice.updateMany({
        where: { id, workspaceId, status: { not: 'deleted' } },
        data,
      })

      if (result.count === 0) return null

      return transaction.invoice.findFirst({
        where: { id, workspaceId, status: { not: 'deleted' } },
        include: invoiceInclude,
      })
    })
  }

  softDelete(workspaceId: string, id: string) {
    return this.database.invoice.updateMany({
      where: { id, workspaceId, status: { not: 'deleted' } },
      data: { status: 'deleted' },
    })
  }
}
