import type { RequestHandler } from 'express'
import { z } from 'zod'
import { StoreService } from '../services/store-service.js'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  storeType: z.enum(['REG', 'FRC']).optional(),
})

const storeSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(150),
  storeType: z.enum(['REG', 'FRC']),
  address: z.string().trim().max(500).optional(),
  ownerName: z.string().trim().max(150).optional(),
  ownerCompany: z.string().trim().max(150).optional(),
})

const importStoreSchema = storeSchema.extend({
  rowNumber: z.number().int().min(2),
})

const importSchema = z.object({
  stores: z.array(importStoreSchema).min(1).max(5000),
})

const idSchema = z.string().min(1)

export function createStoreController(service: StoreService) {
  return {
    list: (async (request, response) => {
      const query = querySchema.parse(request.query)
      const workspaceId = await service.ensureWorkspace(request.auth?.workspaceId)
      const result = await service.list(workspaceId, query.page, query.limit, query.search, query.storeType)
      response.json({ data: result })
    }) satisfies RequestHandler,

    create: (async (request, response) => {
      const workspaceId = await service.ensureWorkspace(request.auth?.workspaceId)
      const result = await service.create(workspaceId, storeSchema.parse(request.body))
      response.status(201).json({ data: result })
    }) satisfies RequestHandler,

    import: (async (request, response) => {
      const workspaceId = await service.ensureWorkspace(request.auth?.workspaceId)
      const { stores } = importSchema.parse(request.body)
      const result = await service.importWithReport(workspaceId, stores)
      response.status(201).json({ data: result })
    }) satisfies RequestHandler,

    update: (async (request, response) => {
      const workspaceId = await service.ensureWorkspace(request.auth?.workspaceId)
      const result = await service.update(workspaceId, idSchema.parse(request.params.id), storeSchema.partial().parse(request.body))
      response.json({ data: result })
    }) satisfies RequestHandler,

    remove: (async (request, response) => {
      const workspaceId = await service.ensureWorkspace(request.auth?.workspaceId)
      await service.deactivate(workspaceId, idSchema.parse(request.params.id))
      response.status(204).send()
    }) satisfies RequestHandler,
  }
}
