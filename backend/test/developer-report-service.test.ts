import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DeveloperReportRepository } from '../src/repositories/developer-report-repository.js'
import type { DeveloperLogRepository } from '../src/repositories/developer-log-repository.js'
import { DeveloperReportService } from '../src/services/developer-report-service.js'

test('returns successful and failed request counts for each active branch', async () => {
  const repository: Pick<DeveloperReportRepository, 'listActiveBranches' | 'countRequestsByBranch'> = {
    listActiveBranches: async () => [
      { id: 'workspace-bandung', slug: 'bandung', name: 'Bandung' },
      { id: 'workspace-jakarta', slug: 'jakarta', name: 'Jakarta' },
    ],
    countRequestsByBranch: async () => [
      { workspaceId: 'workspace-bandung', isSuccess: true, _count: { _all: 18 } },
      { workspaceId: 'workspace-bandung', isSuccess: false, _count: { _all: 3 } },
      { workspaceId: 'workspace-jakarta', isSuccess: true, _count: { _all: 7 } },
    ],
  }

  const emptyLogs: Pick<DeveloperLogRepository, 'list' | 'countByStatus' | 'updateStatus'> = {
    list: async () => [],
    countByStatus: async () => ({ total: 0, new: 0, acknowledged: 0, resolved: 0 }),
    updateStatus: async (id, status) => ({ id, status }),
  }
  const report = await new DeveloperReportService(repository, emptyLogs).apiRequests(30)

  assert.equal(report.days, 30)
  assert.equal(report.successful, 25)
  assert.equal(report.failed, 3)
  assert.equal(report.total, 28)
  assert.deepEqual(report.branches, [
    { slug: 'bandung', name: 'Bandung', successful: 18, failed: 3, total: 21 },
    { slug: 'jakarta', name: 'Jakarta', successful: 7, failed: 0, total: 7 },
  ])
})

test('returns status totals and normalized event metadata for branch error reports', async () => {
  const repository: Pick<DeveloperReportRepository, 'listActiveBranches' | 'countRequestsByBranch'> = {
    listActiveBranches: async () => [],
    countRequestsByBranch: async () => [],
  }
  const logs: Pick<DeveloperLogRepository, 'list' | 'countByStatus' | 'updateStatus'> = {
    list: async () => [{
      id: 'error-id',
      eventId: 'event-id',
      source: 'frontend',
      severity: 'error',
      status: 'new',
      fingerprint: 'f00ba4',
      message: 'Request failed',
      stack: null,
      requestId: 'request-id',
      requestMethod: 'POST',
      requestPath: '/api/invoices',
      pageUrl: '/app/invoices',
      metadataJson: '{"statusCode":500}',
      occurredAt: new Date('2026-09-30T00:00:00.000Z'),
      receivedAt: new Date('2026-09-30T00:00:01.000Z'),
      workspace: { slug: 'bandung', name: 'Bandung' },
    }],
    countByStatus: async () => ({ total: 4, new: 2, acknowledged: 1, resolved: 1 }),
    updateStatus: async (id, status) => ({ id, status }),
  }

  const service = new DeveloperReportService(repository, logs)
  const report = await service.errorReports({ days: 7, status: 'new', branchSlug: 'bandung' })

  assert.deepEqual(report.summary, { total: 4, new: 2, acknowledged: 1, resolved: 1 })
  assert.deepEqual(report.logs[0].metadata, { statusCode: 500 })
  assert.equal('metadataJson' in report.logs[0], false)
  assert.deepEqual(await service.updateErrorStatus('error-id', 'resolved'), {
    id: 'error-id',
    status: 'resolved',
  })
})

test('does not hide malformed stored error metadata behind a failed report', async () => {
  const repository: Pick<DeveloperReportRepository, 'listActiveBranches' | 'countRequestsByBranch'> = {
    listActiveBranches: async () => [],
    countRequestsByBranch: async () => [],
  }
  const logs: Pick<DeveloperLogRepository, 'list' | 'countByStatus' | 'updateStatus'> = {
    list: async () => [{
      id: 'bad-metadata',
      eventId: 'event-id',
      source: 'backend',
      severity: 'error',
      status: 'new',
      fingerprint: 'error',
      message: 'Unhandled exception',
      stack: null,
      requestId: null,
      requestMethod: null,
      requestPath: null,
      pageUrl: null,
      metadataJson: '{',
      occurredAt: new Date(),
      receivedAt: new Date(),
      workspace: null,
    }],
    countByStatus: async () => ({ total: 1, new: 1, acknowledged: 0, resolved: 0 }),
    updateStatus: async (id, status) => ({ id, status }),
  }

  const report = await new DeveloperReportService(repository, logs).errorReports({ days: 30 })
  assert.equal(report.logs[0].metadata, null)
})
