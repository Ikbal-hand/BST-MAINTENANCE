import assert from 'node:assert/strict'
import { test } from 'node:test'
import { StoreService, REG_STORE_OWNER } from '../src/services/store-service.js'
import type { StoreRepository } from '../src/repositories/store-repository.js'

function createMockRepository() {
  const stores: any[] = []
  return {
    stores,
    repo: {
      create: async (_workspaceId: string, data: any) => {
        const item = { id: 'store-' + (stores.length + 1), ...data }
        stores.push(item)
        return item
      },
      bulkCreate: async (_workspaceId: string, data: any[]) => {
        for (const item of data) {
          stores.push({ id: 'store-' + (stores.length + 1), ...item })
        }
        return { count: data.length }
      },
      findCodes: async (_workspaceId: string, codes: string[]) => {
        return stores.filter((s) => codes.includes(s.code)).map((s) => ({ code: s.code }))
      },
      findById: async (_workspaceId: string, id: string) => {
        return stores.find((s) => s.id === id) ?? null
      },
      update: async (_workspaceId: string, id: string, data: any) => {
        const store = stores.find((s) => s.id === id)
        if (!store) return { count: 0 }
        Object.assign(store, data)
        return { count: 1 }
      },
    } as unknown as StoreRepository,
  }
}

test('StoreService.create automatically sets owner to PT Sumber Alfaria Trijaya Tbk. for REG stores', async () => {
  const { repo } = createMockRepository()
  const service = new StoreService(repo)

  const regStore = await service.create('ws-1', {
    code: 'B001',
    name: 'Toko Reg 1',
    storeType: 'REG',
  })

  assert.equal(regStore.ownerCompany, REG_STORE_OWNER)
})

test('StoreService.create allows custom or null owner for FRC stores', async () => {
  const { repo } = createMockRepository()
  const service = new StoreService(repo)

  const frcWithOwner = await service.create('ws-1', {
    code: 'F001',
    name: 'Toko Franchise 1',
    storeType: 'FRC',
    ownerCompany: 'CV Mitra Sukses',
  })
  assert.equal(frcWithOwner.ownerCompany, 'CV Mitra Sukses')

  const frcWithoutOwner = await service.create('ws-1', {
    code: 'F002',
    name: 'Toko Franchise 2',
    storeType: 'FRC',
  })
  assert.equal(frcWithoutOwner.ownerCompany, null)
})

test('StoreService.update enforces REG owner when updated or switching to REG', async () => {
  const { repo } = createMockRepository()
  const service = new StoreService(repo)

  const store = await service.create('ws-1', {
    code: 'F003',
    name: 'Toko Awal FRC',
    storeType: 'FRC',
    ownerCompany: 'Pemilik Lama',
  })

  // Switch to REG
  const updatedToReg = await service.update('ws-1', store.id, {
    storeType: 'REG',
    ownerCompany: 'Upaya Ganti Pemilik',
  })

  assert.equal(updatedToReg?.storeType, 'REG')
  assert.equal(updatedToReg?.ownerCompany, REG_STORE_OWNER)
})

test('StoreService.importWithReport enforces REG owner and allows nullable for FRC', async () => {
  const { repo, stores } = createMockRepository()
  const service = new StoreService(repo)

  const report = await service.importWithReport('ws-1', [
    {
      rowNumber: 2,
      code: 'B010',
      name: 'Toko Reg Import',
      storeType: 'REG',
      ownerCompany: 'Nama Apapun',
    },
    {
      rowNumber: 3,
      code: 'F010',
      name: 'Toko FRC Import',
      storeType: 'FRC',
      ownerCompany: '',
    },
  ])

  assert.equal(report.summary.success, 2)
  const importedReg = stores.find((s) => s.code === 'B010')
  const importedFrc = stores.find((s) => s.code === 'F010')

  assert.equal(importedReg?.ownerCompany, REG_STORE_OWNER)
  assert.equal(importedFrc?.ownerCompany, null)
})
