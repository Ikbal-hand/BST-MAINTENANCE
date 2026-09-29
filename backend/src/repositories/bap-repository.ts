import type { Prisma, PrismaClient } from '@prisma/client'

const bapInclude = {
  store: true,
  items: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.BapInclude

export type BapItemInput = {
  serviceName: string
  unit: number
  unitPrice: number
  subtotal?: number
  sortOrder: number
}

export type BapData = {
  number: string
  storeId: string
  date: Date
  title: string
  description?: string
  status?: string
  amountWords?: string
  totalAmount: number
  createdById: string
  items: BapItemInput[]
}

export class BapRepository {
  constructor(private readonly database: PrismaClient) {}

  list(workspaceId: string, page: number, limit: number, search?: string, status?: string, storeType?: string) {
    const where: Prisma.BapWhereInput = {
      workspaceId,
      status: { not: 'deleted' },
      ...(status ? { status } : {}),
      ...(storeType ? { store: { is: { storeType } } } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search } },
              { title: { contains: search } },
              { store: { is: { code: { contains: search } } } },
              { store: { is: { name: { contains: search } } } },
            ],
          }
        : {}),
    }

    return Promise.all([
      this.database.bap.findMany({
        where,
        include: bapInclude,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.database.bap.count({ where }),
    ])
  }

  findById(workspaceId: string, id: string) {
    return this.database.bap.findFirst({
      where: { id, workspaceId, status: { not: 'deleted' } },
      include: bapInclude,
    })
  }

  storeExists(workspaceId: string, storeId: string) {
    return this.database.store.findFirst({
      where: { id: storeId, workspaceId, isActive: true },
      select: { id: true },
    })
  }

  create(workspaceId: string, data: BapData) {
    const { items, ...bap } = data
    return this.database.bap.create({
      data: {
        ...bap,
        workspaceId,
        items: { create: items.map((item) => ({ ...item, subtotal: item.subtotal ?? item.unit * item.unitPrice })) },
      },
      include: bapInclude,
    })
  }

  async update(workspaceId: string, id: string, data: Partial<Omit<BapData, 'createdById' | 'items'>> & { items?: BapItemInput[] }) {
    const { items, ...bap } = data
    return this.database.$transaction(async (transaction) => {
      const result = await transaction.bap.updateMany({
        where: { id, workspaceId, status: { not: 'deleted' } },
        data: bap,
      })
      if (result.count === 0) return null

      if (items) {
        await transaction.bapItem.deleteMany({ where: { bapId: id } })
        await transaction.bapItem.createMany({
          data: items.map((item) => ({
            ...item,
            subtotal: item.subtotal ?? item.unit * item.unitPrice,
            bapId: id,
          })),
        })
      }

      return transaction.bap.findFirst({
        where: { id, workspaceId, status: { not: 'deleted' } },
        include: bapInclude,
      })
    })
  }

  softDelete(workspaceId: string, id: string) {
    return this.database.bap.updateMany({
      where: { id, workspaceId, status: { not: 'deleted' } },
      data: { status: 'deleted' },
    })
  }
}
