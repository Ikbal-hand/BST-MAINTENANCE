import type { RequestHandler } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/auth-service.js'
import { config } from '../config.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string()
    .min(8)
    .max(72)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'Password baru maksimal 72 byte'),
})

export function createAuthController(service: AuthService) {
  return {
    login: (async (request, response) => {
      const body = loginSchema.parse(request.body)
      const result = await service.login(body.email, body.password, body.rememberMe, request.workspace)
      const persistentCookie = body.rememberMe
        ? `; Max-Age=${config.REMEMBER_ME_MAX_AGE_SECONDS}`
        : ''
      response.append(
        'Set-Cookie',
        `bst_access_token=${result.accessToken}; HttpOnly; Path=/; SameSite=Lax${persistentCookie}${config.NODE_ENV === 'production' ? '; Secure' : ''}`,
      )
      response.status(200).json({ data: { user: result.user } })
    }) satisfies RequestHandler,

    me: (async (request, response) => {
      const result = await service.me(request.auth!.userId)
      response.json({ data: result })
    }) satisfies RequestHandler,

    changePassword: (async (request, response) => {
      const body = changePasswordSchema.parse(request.body)
      await service.changePassword(request.auth!.userId, body.currentPassword, body.newPassword)
      response.append(
        'Set-Cookie',
        `bst_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${config.NODE_ENV === 'production' ? '; Secure' : ''}`,
      )
      response.status(200).json({ data: { changed: true } })
    }) satisfies RequestHandler,

    logout: ((_request, response) => {
      response.append('Set-Cookie', 'bst_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
      response.status(204).send()
    }) satisfies RequestHandler,
  }
}
