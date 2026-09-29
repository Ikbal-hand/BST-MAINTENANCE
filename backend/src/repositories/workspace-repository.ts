import type { PrismaClient } from '@prisma/client'

export class WorkspaceRepository {
  constructor(private readonly database: PrismaClient) {}

  listActiveBranches() {
    return this.database.workspace.findMany({
      where: { type: 'branch', isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, slug: true, name: true },
    })
  }
}
