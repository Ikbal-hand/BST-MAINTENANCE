import { SettingsRepository } from '../repositories/settings-repository.js'

const defaults = {
  signerName: 'Muhamad Zidan Fauzan',
  bankAccount: '0548985555',
  bankName: 'BCA',
  bankAccountName: 'BERKARYA SATU TUJUAN CV',
  transportPrice: 0,
  servicePrice: 0,
  primaryColor: '#1C6B4B',
}

export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  async get(workspaceId: string) {
    const settings = await this.settings.find(workspaceId)
    return { ...defaults, ...settings, workspaceId }
  }

  update(workspaceId: string, data: Parameters<SettingsRepository['upsert']>[1]) {
    return this.settings.upsert(workspaceId, data)
  }
}
