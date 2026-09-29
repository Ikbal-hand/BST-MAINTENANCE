import type { RequestHandler } from 'express'
import { DashboardService } from '../services/dashboard-service.js'

export function createDashboardController(service: DashboardService) {
  return {
    summary: (async (request, response) => {
      const result = await service.getCurrentMonthSummary(request.auth!.workspaceId)
      response.json({ data: result })
    }) satisfies RequestHandler,
  }
}
