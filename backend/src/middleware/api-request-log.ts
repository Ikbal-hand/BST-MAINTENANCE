import type { PrismaClient } from '@prisma/client'
import type { RequestHandler } from 'express'
import { logger } from '../logger.js'
import { DeveloperReportRepository } from '../repositories/developer-report-repository.js'

export function createApiRequestLog(database: PrismaClient): RequestHandler {
  const reports = new DeveloperReportRepository(database)

  return (request, response, next) => {
    const path = request.path
    const shouldLog = request.method !== 'OPTIONS'
      && request.originalUrl.startsWith('/api/')
      && !path.startsWith('/api/developer/reports/')

    if (!shouldLog) {
      next()
      return
    }

    const startedAt = process.hrtime.bigint()
    response.on('finish', () => {
      if (request.workspace.type !== 'branch' || !request.workspace.slug) return

      const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000)
      void reports.recordRequest({
        requestId: request.requestId.slice(0, 128),
        slug: request.workspace.slug,
        branchDomain: process.env.BRANCH_DOMAIN ?? process.env.APP_DOMAIN ?? 'bst-maintenance.local',
        method: request.method,
        path,
        statusCode: response.statusCode,
        durationMs,
      }).catch((error: unknown) => {
        logger.error({ err: error, requestId: request.requestId }, 'failed to record API request report')
      })
    })

    next()
  }
}
