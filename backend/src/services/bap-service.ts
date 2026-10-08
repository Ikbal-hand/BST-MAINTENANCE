import { ConflictError, NotFoundError } from '../errors.js'
import { BapRepository, type BapData } from '../repositories/bap-repository.js'

import { SparepartRepository } from '../repositories/sparepart-repository.js'

export class BapService {
  constructor(private readonly baps: BapRepository, private readonly spareparts?: SparepartRepository) {}

  async list(workspaceId: string, page: number, limit: number, search?: string, status?: string, storeType?: string) {
    const [items, total] = await this.baps.list(workspaceId, page, limit, search, status, storeType)
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async get(workspaceId: string, id: string) {
    const bap = await this.baps.findById(workspaceId, id)
    if (!bap) throw new NotFoundError('BAP tidak ditemukan')
    return bap
  }

  private async processSpareparts(workspaceId: string, items?: { serviceName: string; unitPrice: number }[]) {
    if (!this.spareparts || !items) return
    for (const item of items) {
      if (item.serviceName && item.serviceName !== 'Transport' && item.serviceName !== 'Jasa Service') {
        const existing = await this.spareparts.findByName(workspaceId, item.serviceName)
        if (!existing) {
          await this.spareparts.create({ workspaceId, name: item.serviceName, price: item.unitPrice })
        }
      }
    }
  }

  async create(workspaceId: string, data: BapData) {
    await this.ensureStore(workspaceId, data.storeId)
    await this.processSpareparts(workspaceId, data.items)
    try {
      return await this.baps.create(workspaceId, data)
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictError('Nomor BAP sudah digunakan di workspace ini')
      throw error
    }
  }

  async update(workspaceId: string, id: string, data: Parameters<BapRepository['update']>[2]) {
    if (data.storeId) await this.ensureStore(workspaceId, data.storeId)
    await this.processSpareparts(workspaceId, data.items)
    try {
      const bap = await this.baps.update(workspaceId, id, data)
      if (!bap) throw new NotFoundError('BAP tidak ditemukan')
      return bap
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictError('Nomor BAP sudah digunakan di workspace ini')
      throw error
    }
  }

  async remove(workspaceId: string, id: string) {
    try {
      const result = await this.baps.hardDelete(workspaceId, id)
      if (result.count === 0) throw new NotFoundError('BAP tidak ditemukan')
    } catch (error) {
      if (error instanceof Error && error.message === 'BAP_LINKED_TO_INVOICE') {
        throw new ConflictError('BAP tidak bisa dihapus karena masih terhubung dengan invoice')
      }
      throw error
    }
  }

  private async ensureStore(workspaceId: string, storeId: string) {
    if (!(await this.baps.storeExists(workspaceId, storeId))) {
      throw new NotFoundError('Toko tidak ditemukan di workspace ini')
    }
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
