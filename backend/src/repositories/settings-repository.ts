import type { PrismaClient } from '@prisma/client'

export class SettingsRepository {
  constructor(private readonly database: PrismaClient) {}

  find(workspaceId: string) {
    return this.database.workspaceSettings.findUnique({ where: { workspaceId } })
  }

  upsert(workspaceId: string, data: {
    logoDataUrl?: string | null
    signerName?: string
    bankAccount?: string
    bankName?: string
    bankAccountName?: string
    transportPrice?: number
    servicePrice?: number
    signatureDataUrl?: string | null
    primaryColor?: string
  }) {
    return this.database.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    })
  }
}
