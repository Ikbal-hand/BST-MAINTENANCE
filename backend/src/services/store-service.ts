import { ConflictError, NotFoundError } from '../errors.js'
import { StoreRepository } from '../repositories/store-repository.js'

export const REG_STORE_OWNER = 'PT Sumber Alfaria Trijaya Tbk.'

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
      const isReg = data.storeType.toUpperCase() === 'REG'
      const payload = {
        ...data,
        ownerCompany: isReg ? REG_STORE_OWNER : (data.ownerCompany?.trim() || null),
      }
      return await this.stores.create(workspaceId, payload)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictError('Kode toko sudah digunakan di workspace ini')
      }
      throw error
    }
  }

  async bulkCreate(workspaceId: string, data: Parameters<StoreRepository['bulkCreate']>[1]) {
    const payload = data.map((item) => {
      const isReg = item.storeType.toUpperCase() === 'REG'
      return {
        ...item,
        ownerCompany: isReg ? REG_STORE_OWNER : (item.ownerCompany?.trim() || null),
      }
    })
    return this.stores.bulkCreate(workspaceId, payload)
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

      const isReg = row.storeType.toUpperCase() === 'REG'
      pendingRows.push({
        ...row,
        ownerCompany: isReg ? REG_STORE_OWNER : (row.ownerCompany?.trim() || null),
      })
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
    let ownerCompany = data.ownerCompany !== undefined ? (data.ownerCompany?.trim() || null) : undefined
    if (data.storeType) {
      if (data.storeType.toUpperCase() === 'REG') {
        ownerCompany = REG_STORE_OWNER
      }
    } else if (data.ownerCompany !== undefined) {
      const existing = await this.stores.findById(workspaceId, id)
      if (existing?.storeType.toUpperCase() === 'REG') {
        ownerCompany = REG_STORE_OWNER
      }
    }

    const payload = {
      ...data,
      ...(ownerCompany !== undefined ? { ownerCompany } : {}),
    }

    const result = await this.stores.update(workspaceId, id, payload)
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
