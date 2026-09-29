import { randomUUID } from 'node:crypto'
import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors.js'
import { logger } from '../logger.js'
import { DeveloperLogRepository } from '../repositories/developer-log-repository.js'
import { prisma } from '../db.js'

export const errorHandler: ErrorRequestHandler = async (error, request, response, _next) => {
  const isZodError = error instanceof ZodError
  const appError = error instanceof AppError ? error : undefined
  const statusCode = appError?.statusCode ?? (isZodError ? 400 : 500)
  const message = appError?.message ?? (isZodError ? 'Input tidak valid' : 'Terjadi kesalahan pada server')

  logger.error(
    {
      err: error,
      requestId: request.requestId,
      workspace: request.workspace,
      method: request.method,
      path: request.path,
      statusCode,
    },
    'request failed',
  )

  if (statusCode >= 500 && request.workspace.type === 'branch' && request.workspace.slug) {
    try {
      await new DeveloperLogRepository(prisma).createForBranch(request.workspace.slug, {
        eventId: `backend:${randomUUID()}`,
        source: 'backend',
        severity: statusCode >= 500 ? 'error' : 'warning',
        fingerprint: `${statusCode}:${request.method}:${request.path}:${appError?.code ?? 'INTERNAL_SERVER_ERROR'}`.slice(0, 128),
        message,
        stack: error instanceof Error ? error.stack?.slice(0, 10_000) : undefined,
        requestId: request.requestId,
        requestMethod: request.method,
        requestPath: request.path,
        pageUrl: request.path,
        metadata: {
          code: appError?.code ?? (isZodError ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR'),
          statusCode,
        },
        occurredAt: new Date(),
      })
    } catch (loggingError) {
      logger.error({ err: loggingError, requestId: request.requestId }, 'failed to persist backend error report')
    }
  }

  response.status(statusCode).json({
    error: {
      code: appError?.code ?? (isZodError ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR'),
      message,
      requestId: request.requestId,
    },
  })
}
