import type { RequestHandler } from 'express'
import { z } from 'zod'
import { SettingsService } from '../services/settings-service.js'

const imageSchema = z.string().refine((value) => value.startsWith('data:image/png;base64,'), 'File harus berupa PNG').nullable().optional()
const updateSchema = z.object({
  logoDataUrl: imageSchema,
  signerName: z.string().trim().min(1).max(150),
  bankAccount: z.string().trim().min(1).max(100),
  bankName: z.string().trim().min(1).max(100),
  bankAccountName: z.string().trim().min(1).max(150),
  transportPrice: z.coerce.number().int().min(0).max(100000000).optional(),
  servicePrice: z.coerce.number().int().min(0).max(100000000).optional(),
  signatureDataUrl: imageSchema,
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus berformat HEX'),
})

export function createSettingsController(service: SettingsService) {
  return {
    get: (async (request, response) => {
      response.json({ data: await service.get(request.auth!.workspaceId) })
    }) satisfies RequestHandler,
    update: (async (request, response) => {
      response.json({ data: await service.update(request.auth!.workspaceId, updateSchema.parse(request.body)) })
    }) satisfies RequestHandler,
  }
}
