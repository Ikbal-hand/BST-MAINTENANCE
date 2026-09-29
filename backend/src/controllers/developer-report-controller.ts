import type { RequestHandler } from 'express'
import { z } from 'zod'
import { NotFoundError } from '../errors.js'
import { DeveloperReportService } from '../services/developer-report-service.js'

const daysSchema = z.enum(['7', '30', '90']).default('30')

const requestReportQuerySchema = z.object({
  days: daysSchema,
})

const errorReportQuerySchema = z.object({
  days: daysSchema,
  status: z.enum(['all', 'new', 'acknowledged', 'resolved']).default('all'),
  branch: z.string().max(64).optional(),
})

const errorStatusSchema = z.object({
  status: z.enum(['new', 'acknowledged', 'resolved']),
})

export function createDeveloperReportController(service: DeveloperReportService) {
  return {
    apiRequests: (async (request, response) => {
      const query = requestReportQuerySchema.parse(request.query)
      const report = await service.apiRequests(Number(query.days))
      response.json({ data: report })
    }) satisfies RequestHandler,

    errors: (async (request, response) => {
      const query = errorReportQuerySchema.parse(request.query)
      const report = await service.errorReports({
        days: Number(query.days),
        status: query.status === 'all' ? undefined : query.status,
        branchSlug: query.branch || undefined,
      })
      response.json({ data: report })
    }) satisfies RequestHandler,

    updateErrorStatus: (async (request, response) => {
      const { status } = errorStatusSchema.parse(request.body)
      const id = z.string().min(1).parse(request.params.id)
      try {
        const updated = await service.updateErrorStatus(id, status)
        response.json({ data: updated })
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2025'
        ) {
          throw new NotFoundError('Laporan error tidak ditemukan')
        }
        throw error
      }
    }) satisfies RequestHandler,
  }
}
