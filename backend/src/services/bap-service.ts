import { ConflictError, NotFoundError } from '../errors.js'
import { BapRepository, type BapData } from '../repositories/bap-repository.js'

export class BapService {
  constructor(private readonly baps: BapRepository) {}

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

  async create(workspaceId: string, data: BapData) {
    await this.ensureStore(workspaceId, data.storeId)
    try {
      return await this.baps.create(workspaceId, data)
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictError('Nomor BAP sudah digunakan di workspace ini')
      throw error
    }
  }

  async update(workspaceId: string, id: string, data: Parameters<BapRepository['update']>[2]) {
    if (data.storeId) await this.ensureStore(workspaceId, data.storeId)
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
    const result = await this.baps.softDelete(workspaceId, id)
    if (result.count === 0) throw new NotFoundError('BAP tidak ditemukan')
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
