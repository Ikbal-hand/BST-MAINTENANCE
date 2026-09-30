import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors.js'
import { logger } from '../logger.js'

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
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

  response.status(statusCode).json({
    error: {
      code: appError?.code ?? (isZodError ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR'),
      message,
      requestId: request.requestId,
    },
  })
}
