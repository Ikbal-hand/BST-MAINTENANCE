import type { RequestHandler } from 'express'
import { z } from 'zod'
import { InvoiceService } from '../services/invoice-service.js'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
})

const invoiceSchema = z.object({
  date: z.coerce.date(),
  storeId: z.string().trim().min(1),
  bapIds: z.array(z.string().trim().min(1)).min(1).max(100),
  purpose: z.string().trim().max(2000).optional(),
  amountWords: z.string().trim().max(255).optional(),
})

const invoiceUpdateSchema = z.object({
  number: z.string().trim().min(1).max(255).optional(),
  date: z.coerce.date().optional(),
  purpose: z.string().trim().max(2000).optional(),
  amountWords: z.string().trim().max(255).optional(),
})

const availableBapsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date harus berformat YYYY-MM-DD').transform((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('date tidak valid')
    return date
  }),
  storeId: z.string().trim().min(1),
})

const idSchema = z.string().trim().min(1)

export function createInvoiceController(service: InvoiceService) {
  return {
    list: (async (request, response) => {
      const query = querySchema.parse(request.query)
      const result = await service.list(request.auth!.workspaceId, query.page, query.limit, query.search)
      response.json({ data: result })
    }) satisfies RequestHandler,

    get: (async (request, response) => {
      const result = await service.get(request.auth!.workspaceId, idSchema.parse(request.params.id))
      response.json({ data: result })
    }) satisfies RequestHandler,

    printData: (async (request, response) => {
      const result = await service.printData(request.auth!.workspaceId, idSchema.parse(request.params.id))
      response.json({ data: result })
    }) satisfies RequestHandler,

    sphPrintData: (async (request, response) => {
      const result = await service.sphPrintData(request.auth!.workspaceId, idSchema.parse(request.params.id))
      response.json({ data: result })
    }) satisfies RequestHandler,

    availableBaps: (async (request, response) => {
      const query = availableBapsSchema.parse(request.query)
      const result = await service.availableBaps(request.auth!.workspaceId, query.date, query.storeId)
      response.json({ data: result })
    }) satisfies RequestHandler,

    create: (async (request, response) => {
      const data = invoiceSchema.parse(request.body)
      const result = await service.create(request.auth!.workspaceId, {
        ...data,
        createdById: request.auth!.userId,
      })
      response.status(201).json({ data: result })
    }) satisfies RequestHandler,

    update: (async (request, response) => {
      const data = invoiceUpdateSchema.parse(request.body)
      const result = await service.update(request.auth!.workspaceId, idSchema.parse(request.params.id), data)
      response.json({ data: result })
    }) satisfies RequestHandler,

    remove: (async (request, response) => {
      await service.remove(request.auth!.workspaceId, idSchema.parse(request.params.id))
      response.status(204).send()
    }) satisfies RequestHandler,
  }
}
