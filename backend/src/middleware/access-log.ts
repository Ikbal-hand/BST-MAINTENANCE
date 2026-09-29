import type { RequestHandler } from 'express'
import { logger } from '../logger.js'

export const accessLog: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint()
  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    logger.info(
      {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        workspace: request.workspace,
      },
      'request completed',
    )
  })
  next()
}
