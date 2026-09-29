import type { RequestHandler } from 'express'
import { z } from 'zod'
import { DeveloperUserService } from '../services/developer-user-service.js'

const slugSchema = z.string()
  .trim()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung')
  .refine((slug) => !['central', 'www', 'api', 'login', 'app'].includes(slug), 'Slug tersebut tidak dapat digunakan')

const createBranchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
  contactPhone: z.string()
    .trim()
    .min(8)
    .max(32)
    .regex(/^[+0-9(). -]+$/)
    .refine((phone) => (phone.match(/\d/g)?.length ?? 0) >= 8, 'Nomor kontak harus memiliki minimal 8 digit'),
  adminName: z.string().trim().min(2).max(100),
  adminEmail: z.string().trim().email().max(191),
})

const moveUserSchema = z.object({
  workspaceId: z.string().min(1),
})

const activeUserSchema = z.object({
  isActive: z.boolean(),
})

export function createDeveloperUserController(service: DeveloperUserService) {
  return {
    listBranchUsers: (async (_request, response) => {
      const users = await service.listBranchUsers()
      response.json({ data: users })
    }) satisfies RequestHandler,

    resetBranchUserPassword: (async (request, response) => {
      const id = z.string().min(1).parse(request.params.id)
      const result = await service.resetBranchUserPassword(id)
      response.json({ data: result })
    }) satisfies RequestHandler,

    moveBranchUser: (async (request, response) => {
      const id = z.string().min(1).parse(request.params.id)
      const { workspaceId } = moveUserSchema.parse(request.body)
      const result = await service.moveBranchUser(id, workspaceId)
      response.json({ data: result })
    }) satisfies RequestHandler,

    setBranchUserActive: (async (request, response) => {
      const id = z.string().min(1).parse(request.params.id)
      const { isActive } = activeUserSchema.parse(request.body)
      const result = await service.setBranchUserActive(id, isActive)
      response.json({ data: result })
    }) satisfies RequestHandler,

    setBranchActive: (async (request, response) => {
      const id = z.string().min(1).parse(request.params.id)
      const { isActive } = activeUserSchema.parse(request.body)
      const result = await service.setBranchActive(id, isActive)
      response.json({ data: result })
    }) satisfies RequestHandler,

    deleteBranch: (async (request, response) => {
      const id = z.string().min(1).parse(request.params.id)
      const result = await service.deleteBranch(id)
      response.json({ data: result })
    }) satisfies RequestHandler,

    createBranch: (async (request, response) => {
      const input = createBranchSchema.parse(request.body)
      const result = await service.createBranch(input)
      response.status(201).json({ data: result })
    }) satisfies RequestHandler,
  }
}
