import { DeveloperReportRepository } from '../repositories/developer-report-repository.js'
import {
  type DeveloperLogStatus,
  type DeveloperLogRepository,
} from '../repositories/developer-log-repository.js'

export class DeveloperReportService {
  constructor(
    private readonly reports: Pick<DeveloperReportRepository, 'listActiveBranches' | 'countRequestsByBranch'>,
    private readonly logs: Pick<
      DeveloperLogRepository,
      'list' | 'countByStatus' | 'updateStatus'
    >,
  ) {}

  async apiRequests(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const branches = await this.reports.listActiveBranches()
    const counts = await this.reports.countRequestsByBranch(
      branches.map((branch) => branch.id),
      since,
    )

    const report = branches.map((branch) => {
      const branchCounts = counts.filter((count) => count.workspaceId === branch.id)
      const successful = branchCounts.find((count) => count.isSuccess)?._count._all ?? 0
      const failed = branchCounts.find((count) => !count.isSuccess)?._count._all ?? 0

      return {
        slug: branch.slug,
        name: branch.name,
        successful,
        failed,
        total: successful + failed,
      }
    })

    return {
      days,
      since: since.toISOString(),
      total: report.reduce((sum, branch) => sum + branch.total, 0),
      successful: report.reduce((sum, branch) => sum + branch.successful, 0),
      failed: report.reduce((sum, branch) => sum + branch.failed, 0),
      branches: report,
    }
  }

  async errorReports(input: { days: number; status?: DeveloperLogStatus; branchSlug?: string }) {
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
    const [summary, logs] = await Promise.all([
      this.logs.countByStatus(since),
      this.logs.list({ ...input, since, take: 100 }),
    ])

    return {
      days: input.days,
      since: since.toISOString(),
      summary,
      logs: logs.map(({ metadataJson, ...log }) => ({
        ...log,
        metadata: this.parseMetadata(metadataJson),
      })),
    }
  }

  updateErrorStatus(id: string, status: DeveloperLogStatus) {
    return this.logs.updateStatus(id, status)
  }

  private parseMetadata(value: string | null): Record<string, unknown> | null {
    if (!value) return null
    try {
      const metadata: unknown = JSON.parse(value)
      return this.isRecord(metadata) ? metadata : null
    } catch {
      return null
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }
}
