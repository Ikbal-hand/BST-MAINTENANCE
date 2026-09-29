import jwt from 'jsonwebtoken'
import { parseCookie } from 'cookie'
import type { RequestHandler } from 'express'
import { config } from '../config.js'
import { canAccessWorkspace } from '../domain.js'
import { ForbiddenError, UnauthorizedError } from '../errors.js'
import { prisma } from '../db.js'

type AccessToken = {
  sub: string
  workspaceId: string
  workspaceSlug: string
  workspaceType: 'central' | 'branch'
  role: string
  passwordVersion?: number
}

export const authenticate: RequestHandler = async (request, _response, next) => {
  const header = request.header('authorization')
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const cookieToken = request.header('cookie') ? parseCookie(request.header('cookie')!).bst_access_token : undefined
  const token = bearerToken ?? cookieToken
  if (!token) {
    return next(new UnauthorizedError())
  }

  let payload: AccessToken
  try {
    payload = jwt.verify(token, config.JWT_SECRET) as AccessToken
  } catch {
    return next(new UnauthorizedError('Token tidak valid atau sudah kedaluwarsa'))
  }
  if (
    !payload.sub ||
    !payload.workspaceId ||
    !payload.workspaceSlug ||
    !['central', 'branch'].includes(payload.workspaceType) ||
    !payload.role
  ) {
    return next(new UnauthorizedError('Token tidak valid'))
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      workspaceId: true,
      role: true,
      passwordVersion: true,
      isActive: true,
      workspace: { select: { slug: true, type: true, isActive: true } },
    },
  })
  if (
    !user?.isActive ||
    !user.workspace.isActive ||
    user.workspaceId !== payload.workspaceId ||
    user.workspace.slug !== payload.workspaceSlug ||
    user.workspace.type !== payload.workspaceType ||
    user.role !== payload.role ||
    user.passwordVersion !== (payload.passwordVersion ?? 0)
  ) {
    return next(new UnauthorizedError('Akun sudah tidak aktif atau aksesnya berubah. Silakan masuk kembali.'))
  }
  if (!['central', 'branch'].includes(user.workspace.type)) {
    return next(new UnauthorizedError('Workspace akun tidak valid'))
  }
  request.auth = {
    userId: payload.sub,
    workspaceId: user.workspaceId,
    workspaceSlug: user.workspace.slug,
    workspaceType: user.workspace.type as 'central' | 'branch',
    role: user.role,
  }
  return next()
}

export function requireRoles(...roles: string[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(new ForbiddenError())
    }
    return next()
  }
}

export const requireWorkspaceAccess: RequestHandler = (request, _response, next) => {
  if (!request.auth) return next(new UnauthorizedError())
  if (!canAccessWorkspace(request.workspace, {
    slug: request.auth.workspaceSlug,
    type: request.auth.workspaceType,
    role: request.auth.role,
  })) {
    return next(new ForbiddenError('User tidak dapat mengakses workspace ini'))
  }
  next()
}

export const requireBranchWorkspace: RequestHandler = (request, _response, next) => {
  if (!request.auth) return next(new UnauthorizedError())
  if (
    request.auth.workspaceType !== 'branch' ||
    request.auth.role === 'developer' ||
    request.workspace.type !== 'branch'
  ) {
    return next(new ForbiddenError('Fitur ini hanya tersedia untuk workspace cabang'))
  }
  if (request.workspace.slug !== request.auth.workspaceSlug) {
    return next(new ForbiddenError('User tidak dapat mengakses workspace ini'))
  }
  next()
}
