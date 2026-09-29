import { ConflictError, NotFoundError } from '../errors.js'
import { StoreRepository } from '../repositories/store-repository.js'

type ImportStoreRow = Parameters<StoreRepository['create']>[1] & { rowNumber: number }
type ImportResult = {
  rowNumber: number
  code: string
  name: string
  status: 'success' | 'failed'
  note: string
}

export class StoreService {
  constructor(private readonly stores: StoreRepository) {}

  async list(workspaceId: string, page: number, limit: number, search?: string, storeType?: string) {
    const [items, total] = await this.stores.list(workspaceId, page, limit, search, storeType)
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async ensureWorkspace(workspaceId: string | undefined): Promise<string> {
    if (!workspaceId) throw new NotFoundError('Workspace tidak ditemukan')
    return workspaceId
  }

  async create(workspaceId: string, data: Parameters<StoreRepository['create']>[1]) {
    try {
      return await this.stores.create(workspaceId, data)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictError('Kode toko sudah digunakan di workspace ini')
      }
      throw error
    }
  }

  async bulkCreate(workspaceId: string, data: Parameters<StoreRepository['bulkCreate']>[1]) {
    return this.stores.bulkCreate(workspaceId, data)
  }

  async importWithReport(workspaceId: string, rows: ImportStoreRow[]) {
    const uniqueCodes = [...new Set(rows.map((row) => row.code))]
    const existingBefore = await this.stores.findCodes(workspaceId, uniqueCodes)
    const existingCodeSet = new Set(existingBefore.map((item) => item.code))
    const firstSeenRows = new Map<string, number>()
    const pendingRows: ImportStoreRow[] = []
    const results: ImportResult[] = []

    for (const row of rows) {
      const duplicatedAt = firstSeenRows.get(row.code)
      if (duplicatedAt) {
        results.push({
          rowNumber: row.rowNumber,
          code: row.code,
          name: row.name,
          status: 'failed',
          note: `Kode duplikat di file (sudah muncul di baris ${duplicatedAt}).`,
        })
        continue
      }

      firstSeenRows.set(row.code, row.rowNumber)
      if (existingCodeSet.has(row.code)) {
        results.push({
          rowNumber: row.rowNumber,
          code: row.code,
          name: row.name,
          status: 'failed',
          note: 'Kode sudah terdaftar di database workspace ini.',
        })
        continue
      }

      pendingRows.push(row)
    }

    if (pendingRows.length > 0) {
      await this.stores.bulkCreate(
        workspaceId,
        pendingRows.map(({ rowNumber: _rowNumber, ...store }) => store),
      )

      const saved = await this.stores.findCodes(workspaceId, pendingRows.map((row) => row.code))
      const savedCodeSet = new Set(saved.map((item) => item.code))
      for (const row of pendingRows) {
        results.push({
          rowNumber: row.rowNumber,
          code: row.code,
          name: row.name,
          status: savedCodeSet.has(row.code) ? 'success' : 'failed',
          note: savedCodeSet.has(row.code)
            ? 'Data berhasil disimpan.'
            : 'Data gagal disimpan. Coba import ulang baris ini.',
        })
      }
    }

    const orderedResults = [...results].sort((a, b) => a.rowNumber - b.rowNumber)
    const successCount = orderedResults.filter((item) => item.status === 'success').length
    const failedCount = orderedResults.length - successCount

    return {
      summary: {
        submitted: orderedResults.length,
        success: successCount,
        failed: failedCount,
      },
      results: orderedResults,
    }
  }

  async update(workspaceId: string, id: string, data: Parameters<StoreRepository['update']>[2]) {
    const result = await this.stores.update(workspaceId, id, data)
    if (result.count === 0) throw new NotFoundError('Toko tidak ditemukan')
    return this.stores.findById(workspaceId, id)
  }

  async deactivate(workspaceId: string, id: string) {
    const result = await this.stores.deactivate(workspaceId, id)
    if (result.count === 0) throw new NotFoundError('Toko tidak ditemukan')
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
