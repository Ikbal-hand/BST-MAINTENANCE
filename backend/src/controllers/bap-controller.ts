import type { RequestHandler } from 'express'
import { z } from 'zod'
import { BapService } from '../services/bap-service.js'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['draft', 'submitted', 'review', 'approved', 'cancelled']).optional(),
  storeType: z.enum(['REG', 'FRC']).optional(),
})

const itemSchema = z.object({
  serviceName: z.string().trim().min(1).max(255),
  unit: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().int().nonnegative(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

const bapSchema = z.object({
  number: z.string().trim().min(1).max(50),
  storeId: z.string().trim().min(1),
  date: z.coerce.date(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['draft', 'submitted', 'review', 'approved', 'cancelled']).default('draft'),
  amountWords: z.string().trim().max(255).optional(),
  items: z.array(itemSchema).min(1).max(100),
})

const updateSchema = bapSchema.partial()
const idSchema = z.string().trim().min(1)

function withTotal<T extends { items?: Array<{ unit: number; unitPrice: number }> }>(data: T) {
  return {
    ...data,
    ...(data.items ? { items: data.items.map((item) => ({ ...item, subtotal: item.unit * item.unitPrice })) } : {}),
    ...(data.items ? { totalAmount: data.items.reduce((total, item) => total + item.unit * item.unitPrice, 0) } : {}),
  }
}

export function createBapController(service: BapService) {
  return {
    list: (async (request, response) => {
      const query = querySchema.parse(request.query)
      const workspaceId = request.auth!.workspaceId
      const result = await service.list(workspaceId, query.page, query.limit, query.search, query.status, query.storeType)
      response.json({ data: result })
    }) satisfies RequestHandler,

    get: (async (request, response) => {
      const result = await service.get(request.auth!.workspaceId, idSchema.parse(request.params.id))
      response.json({ data: result })
    }) satisfies RequestHandler,

    create: (async (request, response) => {
      const data = bapSchema.parse(request.body)
      const prepared = withTotal(data)
      const result = await service.create(request.auth!.workspaceId, {
        ...prepared,
        createdById: request.auth!.userId,
        totalAmount: prepared.totalAmount!,
      })
      response.status(201).json({ data: result })
    }) satisfies RequestHandler,

    update: (async (request, response) => {
      const data = updateSchema.parse(request.body)
      const result = await service.update(request.auth!.workspaceId, idSchema.parse(request.params.id), withTotal(data))
      response.json({ data: result })
    }) satisfies RequestHandler,

    remove: (async (request, response) => {
      await service.remove(request.auth!.workspaceId, idSchema.parse(request.params.id))
      response.status(204).send()
    }) satisfies RequestHandler,
  }
}
