import type { RequestHandler } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { UnauthorizedError } from '../errors.js'
import { config } from '../config.js'
import { DeveloperLogRepository } from '../repositories/developer-log-repository.js'

const logSchema = z.object({
  eventId: z.string().min(1).max(100),
  source: z.enum(['frontend', 'backend']),
  severity: z.enum(['fatal', 'error', 'warning', 'info']),
  fingerprint: z.string().min(1).max(128),
  message: z.string().min(1).max(2000),
  stack: z.string().max(10000).optional(),
  requestId: z.string().max(100).optional(),
  requestMethod: z.string().max(10).optional(),
  requestPath: z.string().max(500).optional(),
  pageUrl: z.string().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.coerce.date(),
})

export const createDeveloperLog: RequestHandler = async (request, response) => {
  if (request.header('x-developer-log-token') !== config.DEVELOPER_LOG_TOKEN) {
    throw new UnauthorizedError('Developer log token tidak valid')
  }

  const payload = logSchema.parse(request.body)
  const event = await new DeveloperLogRepository(prisma).createForWorkspace(
    request.workspace.slug
      ? (await prisma.workspace.findUnique({ where: { slug: request.workspace.slug } }))?.id ?? null
      : null,
    payload,
  )

  response.status(202).json({ data: event })
}

export const createFrontendDeveloperLog: RequestHandler = async (request, response) => {
  if (request.workspace.type !== 'branch' || !request.workspace.slug) {
    throw new UnauthorizedError('Laporan frontend hanya diterima dari domain cabang')
  }

  const payload = logSchema.parse(request.body)
  if (payload.source !== 'frontend') {
    throw new UnauthorizedError('Sumber laporan tidak valid')
  }

  let pagePath: string | undefined
  if (payload.pageUrl) {
    try {
      pagePath = new URL(payload.pageUrl).pathname.slice(0, 500)
    } catch {
      pagePath = undefined
    }
  }

  const event = await new DeveloperLogRepository(prisma).createForBranch(request.workspace.slug, {
    ...payload,
    pageUrl: pagePath,
    requestPath: payload.requestPath?.split('?')[0].slice(0, 500),
  })
  if (!event) throw new UnauthorizedError('Workspace cabang tidak aktif')
  response.status(202).json({ data: event })
}
