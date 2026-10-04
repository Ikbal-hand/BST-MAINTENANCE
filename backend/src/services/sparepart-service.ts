import { SparepartRepository } from '../repositories/sparepart-repository.js'
import { AppError } from '../errors.js'

export class SparepartService {
  constructor(private readonly repo: SparepartRepository) {}

  async create(workspaceId: string, data: { name: string; price: number }) {
    const existing = await this.repo.findByName(workspaceId, data.name)
    if (existing) {
      throw new AppError(400, 'Sparepart with this name already exists')
    }
    return this.repo.create({ ...data, workspaceId })
  }

  async list(workspaceId: string) {
    return this.repo.findMany(workspaceId)
  }

  async update(workspaceId: string, id: string, data: { name: string; price: number }) {
    return this.repo.update(id, data)
  }

  async remove(workspaceId: string, id: string) {
    return this.repo.delete(id)
  }
}
