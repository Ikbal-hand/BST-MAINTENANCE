import type { PrismaClient } from '@prisma/client'
import { isSuccessfulApiStatus } from '../domain.js'

export class DeveloperReportRepository {
  constructor(private readonly database: PrismaClient) {}

  listActiveBranches() {
    return this.database.workspace.findMany({
      where: { type: 'branch', isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, slug: true, name: true },
    })
  }

  countRequestsByBranch(workspaceIds: string[], since: Date) {
    if (workspaceIds.length === 0) return Promise.resolve([])

    return this.database.apiRequestLog.groupBy({
      by: ['workspaceId', 'isSuccess'],
      where: {
        workspaceId: { in: workspaceIds },
        createdAt: { gte: since },
      },
      _count: { _all: true },
    })
  }

  async recordRequest(input: {
    requestId: string
    slug: string
    branchDomain: string
    method: string
    path: string
    statusCode: number
    durationMs: number
  }) {
    const workspace = await this.database.workspace.findFirst({
      where: {
        slug: input.slug,
        type: 'branch',
        domain: `${input.slug}.${input.branchDomain}`,
        isActive: true,
      },
      select: { id: true },
    })

    if (!workspace) return

    await this.database.apiRequestLog.create({
      data: {
        requestId: input.requestId,
        workspaceId: workspace.id,
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
        isSuccess: isSuccessfulApiStatus(input.statusCode),
        durationMs: input.durationMs,
      },
    })
  }
}
