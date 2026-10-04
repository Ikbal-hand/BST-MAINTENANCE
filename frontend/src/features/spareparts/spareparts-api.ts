import { apiFetch } from '../../lib/api'

export interface Sparepart {
  id: string
  name: string
  price: number
}

export type SparepartInput = Omit<Sparepart, 'id'>

export async function getSpareparts(): Promise<Sparepart[]> {
  return apiFetch('/api/spareparts')
}

export async function createSparepart(data: SparepartInput): Promise<Sparepart> {
  return apiFetch('/api/spareparts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSparepart(data: { id: string } & SparepartInput): Promise<Sparepart> {
  const { id, ...payload } = data
  return apiFetch(`/api/spareparts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteSparepart(id: string): Promise<void> {
  return apiFetch(`/api/spareparts/${id}`, {
    method: 'DELETE',
  })
}
