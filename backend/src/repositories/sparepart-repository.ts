import { PrismaClient, Prisma, Sparepart } from '@prisma/client'

export class SparepartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.SparepartUncheckedCreateInput): Promise<Sparepart> {
    return this.prisma.sparepart.create({ data })
  }

  async findMany(workspaceId: string): Promise<Sparepart[]> {
    return this.prisma.sparepart.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    })
  }

  async findByName(workspaceId: string, name: string): Promise<Sparepart | null> {
    return this.prisma.sparepart.findFirst({
      where: { workspaceId, name },
    })
  }

  async update(id: string, data: Prisma.SparepartUncheckedUpdateInput): Promise<Sparepart> {
    return this.prisma.sparepart.update({ where: { id }, data })
  }

  async delete(id: string): Promise<Sparepart> {
    return this.prisma.sparepart.delete({ where: { id } })
  }
}
