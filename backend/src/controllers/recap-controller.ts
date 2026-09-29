import type { RequestHandler } from 'express'
import { z } from 'zod'
import { RecapService } from '../services/recap-service.js'
import { ValidationError } from '../errors.js'

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((value) => new Date(`${value}T00:00:00.000Z`)),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((value) => new Date(`${value}T00:00:00.000Z`)),
  storeType: z.enum(['REG', 'FRC']).optional(),
})

export function createRecapController(service: RecapService) {
  return {
    summary: (async (request, response) => {
      const query = querySchema.parse(request.query)
      if (query.from > query.to) throw new ValidationError('Periode awal tidak boleh setelah periode akhir')
      const result = await service.summarize(request.auth!.workspaceId, query.from, query.to, query.storeType)
      response.json({ data: result })
    }) satisfies RequestHandler,
  }
}
