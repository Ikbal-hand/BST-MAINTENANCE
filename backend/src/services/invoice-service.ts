import type { Prisma } from '@prisma/client'
import { ConflictError, NotFoundError, ValidationError } from '../errors.js'
import { InvoiceRepository, type InvoiceCreateData, type InvoiceUpdateData } from '../repositories/invoice-repository.js'

export class InvoiceService {
  constructor(private readonly invoices: InvoiceRepository) {}

  async list(workspaceId: string, page: number, limit: number, search?: string) {
    const [items, total] = await this.invoices.list(workspaceId, page, limit, search)
    return {
      items: items.map((invoice) => this.toPublicInvoice(invoice)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async get(workspaceId: string, id: string) {
    const invoice = await this.invoices.findById(workspaceId, id)
    if (!invoice) throw new NotFoundError('Invoice tidak ditemukan')
    return this.toPublicInvoice(invoice)
  }

  async availableBaps(workspaceId: string, date: Date, storeId: string) {
    const dateStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const dateEnd = new Date(dateStart)
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1)
    return this.invoices.findAvailableBaps(workspaceId, dateStart, dateEnd, storeId)
  }

  async create(workspaceId: string, data: Omit<InvoiceCreateData, 'number' | 'storeId' | 'totalAmount'> & { storeId: string }) {
    if (!(await this.invoices.storeExists(workspaceId, data.storeId))) {
      throw new NotFoundError('Toko tidak ditemukan di workspace ini')
    }
    if (new Set(data.bapIds).size !== data.bapIds.length) {
      throw new ValidationError('BAP tidak boleh dipilih lebih dari satu kali')
    }

    const baps = await this.invoices.findBaps(workspaceId, data.bapIds)
    if (baps.length !== data.bapIds.length) {
      throw new NotFoundError('Satu atau beberapa BAP tidak ditemukan di workspace ini')
    }
    const dateKey = data.date.toISOString().slice(0, 10)
    const invalidBap = baps.find((bap) => bap.storeId !== data.storeId || bap.date.toISOString().slice(0, 10) !== dateKey)
    if (invalidBap) {
      throw new ValidationError('Semua BAP harus berasal dari toko dan tanggal invoice yang sama')
    }

    try {
      const invoice = await this.invoices.create(workspaceId, {
        ...data,
        number: baps.map((bap) => bap.number).join(', '),
        totalAmount: baps.reduce((total, bap) => total + bap.totalAmount, 0),
        amountWords: data.amountWords,
      })
      return this.toPublicInvoice(invoice)
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictError('Nomor invoice sudah digunakan di workspace ini')
      throw error
    }
  }

  async update(workspaceId: string, id: string, data: InvoiceUpdateData) {
    try {
      const invoice = await this.invoices.update(workspaceId, id, data)
      if (!invoice) throw new NotFoundError('Invoice tidak ditemukan')
      return {
        ...invoice,
        baps: invoice.invoiceBaps.map((relation) => relation.bap),
      }
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictError('Nomor invoice sudah digunakan di workspace ini')
      throw error
    }
  }

  async remove(workspaceId: string, id: string) {
    const result = await this.invoices.softDelete(workspaceId, id)
    if (result.count === 0) throw new NotFoundError('Invoice tidak ditemukan')
  }

  async sphPrintData(workspaceId: string, id: string) {
    const invoice = await this.get(workspaceId, id)
    const baps = invoice.baps
    const items = baps.flatMap((bap) =>
      bap.items.map((item) => ({
        bapId: bap.id,
        bapNumber: bap.number,
        bapTitle: bap.title,
        serviceName: item.serviceName,
        unit: item.unit,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        sortOrder: item.sortOrder,
      })),
    )

    const sph = {
      documentType: 'SPH' as const,
      invoiceNumber: invoice.number,
      invoiceDate: invoice.date,
      billTo: invoice.store.ownerCompany ?? invoice.store.ownerName ?? null,
      storeName: invoice.store.name,
      storeCode: invoice.store.code,
      purpose: invoice.purpose,
      totalAmount: invoice.totalAmount,
      amountWords: invoice.amountWords,
      details: baps.map((bap) => ({
        bapId: bap.id,
        number: bap.number,
        title: bap.title,
        description: bap.description,
      })),
      note: null,
      paymentInstructions: {
        bankAccount: '0548985555',
        bank: 'BCA',
        accountName: 'BERKARYA SATU TUJUAN CV',
      },
      signer: 'Muhamad Zidan Fauzan',
    }

    return {
      ...invoice,
      invoice,
      store: invoice.store,
      baps,
      items,
      sph,
      printData: {
        invoiceNumber: invoice.number,
        invoiceDate: invoice.date,
        purpose: invoice.purpose,
        totalAmount: invoice.totalAmount,
        amountWords: invoice.amountWords,
        store: invoice.store,
        baps,
      },
    }
  }

  async printData(workspaceId: string, id: string) {
    return this.sphPrintData(workspaceId, id)
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }

  private toPublicInvoice(invoice: Prisma.InvoiceGetPayload<{ include: { store: true; bap: true; invoiceBaps: { include: { bap: { include: { items: true } } } } } }>) {
    const { status: _status, invoiceBaps, ...publicInvoice } = invoice
    return {
      ...publicInvoice,
      baps: invoiceBaps.map((relation) => relation.bap),
    }
  }
}
