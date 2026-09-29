import type { PrismaClient } from '@prisma/client'

export class StoreRepository {
  constructor(private readonly database: PrismaClient) {}

  list(workspaceId: string, page: number, limit: number, search?: string, storeType?: string) {
    const where = {
      workspaceId,
      isActive: true,
      ...(storeType ? { storeType } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    }

    return Promise.all([
      this.database.store.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.database.store.count({ where }),
    ])
  }

  findById(workspaceId: string, id: string) {
    return this.database.store.findFirst({ where: { id, workspaceId } })
  }

  findCodes(workspaceId: string, codes: string[]) {
    return this.database.store.findMany({
      where: {
        workspaceId,
        code: { in: codes },
      },
      select: { code: true },
    })
  }

  create(workspaceId: string, data: {
    code: string
    name: string
    storeType: string
    address?: string
    ownerName?: string
    ownerCompany?: string
  }) {
    return this.database.store.create({ data: { ...data, workspaceId } })
  }

  bulkCreate(workspaceId: string, data: Array<{
    code: string
    name: string
    storeType: string
    address?: string
    ownerName?: string
    ownerCompany?: string
  }>) {
    return this.database.store.createMany({
      data: data.map((store) => ({ ...store, workspaceId })),
      skipDuplicates: true,
    })
  }

  update(workspaceId: string, id: string, data: {
    code?: string
    name?: string
    storeType?: string
    address?: string
    ownerName?: string
    ownerCompany?: string
  }) {
    return this.database.store.updateMany({
      where: { id, workspaceId, isActive: true },
      data,
    })
  }

  deactivate(workspaceId: string, id: string) {
    return this.database.store.updateMany({
      where: { id, workspaceId, isActive: true },
      data: { isActive: false },
    })
  }
}
