import type { RequestHandler } from 'express'
import { NotFoundError } from '../errors.js'

export const notFound: RequestHandler = (request, _response, next) => {
  next(new NotFoundError(`Route ${request.method} ${request.path} tidak ditemukan`))
}
