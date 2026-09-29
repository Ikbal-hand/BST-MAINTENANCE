import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'
import { resolveWorkspace } from '../domain.js'

export const requestContext: RequestHandler = (request, response, next) => {
  request.requestId = request.header('x-request-id')?.trim() || randomUUID()
  request.workspace = resolveWorkspace(request.hostname)
  response.setHeader('x-request-id', request.requestId)
  next()
}
