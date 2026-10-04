import type { RequestHandler } from 'express'
import { z } from 'zod'
import { SparepartService } from '../services/sparepart-service.js'
import { AppError } from '../errors.js'

const schema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0).default(0),
})

const idSchema = z.string().min(1)

export function createSparepartController(service: SparepartService) {
  const getWorkspaceId = (auth?: { workspaceId?: string }) => {
    if (!auth?.workspaceId) throw new AppError(401, 'Unauthorized')
    return auth.workspaceId
  }

  return {
    create: (async (request, response) => {
      const workspaceId = getWorkspaceId(request.auth)
      const body = schema.parse(request.body)
      const item = await service.create(workspaceId, body)
      response.status(201).json({ data: item })
    }) satisfies RequestHandler,

    list: (async (request, response) => {
      const workspaceId = getWorkspaceId(request.auth)
      const items = await service.list(workspaceId)
      response.json({ data: items })
    }) satisfies RequestHandler,

    update: (async (request, response) => {
      const workspaceId = getWorkspaceId(request.auth)
      const body = schema.parse(request.body)
      const id = idSchema.parse(request.params.id)
      const item = await service.update(workspaceId, id, body)
      response.json({ data: item })
    }) satisfies RequestHandler,

    remove: (async (request, response) => {
      const workspaceId = getWorkspaceId(request.auth)
      const id = idSchema.parse(request.params.id)
      await service.remove(workspaceId, id)
      response.status(204).end()
    }) satisfies RequestHandler,
  }
}
