import type { PrismaClient } from '@prisma/client'

export type DeveloperLogStatus = 'new' | 'acknowledged' | 'resolved'
export type DeveloperLogSeverity = 'fatal' | 'error' | 'warning' | 'info'

export interface DeveloperLogInput {
  eventId: string
  source: 'frontend' | 'backend'
  severity: DeveloperLogSeverity
  fingerprint: string
  message: string
  stack?: string
  requestId?: string
  requestMethod?: string
  requestPath?: string
  pageUrl?: string
  metadata?: Record<string, unknown>
  occurredAt: Date
}

export class DeveloperLogRepository {
  constructor(private readonly database: PrismaClient) {}

  async createForBranch(slug: string, input: DeveloperLogInput) {
    const workspace = await this.database.workspace.findFirst({
      where: { slug, type: 'branch', isActive: true },
      select: { id: true },
    })

    if (!workspace) return null

    return this.database.developerLog.upsert({
      where: { eventId: input.eventId },
      create: {
        ...this.toDatabaseInput(input),
        workspaceId: workspace.id,
      },
      update: {},
      select: { id: true, eventId: true, receivedAt: true },
    })
  }

  createForWorkspace(workspaceId: string | null, input: DeveloperLogInput) {
    return this.database.developerLog.upsert({
      where: { eventId: input.eventId },
      create: {
        ...this.toDatabaseInput(input),
        workspaceId,
      },
      update: {},
      select: { id: true, eventId: true, receivedAt: true },
    })
  }

  list(input: {
    since: Date
    status?: DeveloperLogStatus
    branchSlug?: string
    take: number
  }) {
    return this.database.developerLog.findMany({
      where: {
        receivedAt: { gte: input.since },
        workspace: { type: 'branch' },
        ...(input.status ? { status: input.status } : {}),
        ...(input.branchSlug ? { workspace: { slug: input.branchSlug, type: 'branch' } } : {}),
      },
      orderBy: { receivedAt: 'desc' },
      take: input.take,
      select: {
        id: true,
        eventId: true,
        source: true,
        severity: true,
        status: true,
        fingerprint: true,
        message: true,
        stack: true,
        requestId: true,
        requestMethod: true,
        requestPath: true,
        pageUrl: true,
        metadataJson: true,
        occurredAt: true,
        receivedAt: true,
        workspace: { select: { slug: true, name: true } },
      },
    })
  }

  async countByStatus(since: Date) {
    const groups = await this.database.developerLog.groupBy({
      by: ['status'],
      where: { receivedAt: { gte: since }, workspace: { type: 'branch' } },
      _count: { _all: true },
    })

    return {
      total: groups.reduce((sum, group) => sum + group._count._all, 0),
      new: groups.find((group) => group.status === 'new')?._count._all ?? 0,
      acknowledged: groups.find((group) => group.status === 'acknowledged')?._count._all ?? 0,
      resolved: groups.find((group) => group.status === 'resolved')?._count._all ?? 0,
    }
  }

  updateStatus(id: string, status: DeveloperLogStatus) {
    return this.database.developerLog.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    })
  }

  private toDatabaseInput(input: DeveloperLogInput) {
    return {
      eventId: input.eventId,
      source: input.source,
      severity: input.severity,
      fingerprint: input.fingerprint,
      message: input.message,
      stack: input.stack,
      requestId: input.requestId,
      requestMethod: input.requestMethod,
      requestPath: input.requestPath,
      pageUrl: input.pageUrl,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined,
      occurredAt: input.occurredAt,
    }
  }
}
