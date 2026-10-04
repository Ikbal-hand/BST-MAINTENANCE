import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { Invoice, InvoiceUpdateInput } from './invoices-api'

interface InvoiceDetailPopupProps {
  invoice: Invoice | null
  editing: boolean
  busy: boolean
  onClose: () => void
  onEdit: () => void
  onSave: (input: InvoiceUpdateInput) => void
  onDelete: () => void
}

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 })

const toInput = (invoice: Invoice): InvoiceUpdateInput => ({
  number: invoice.number,
  date: invoice.date.slice(0, 10),
  purpose: invoice.purpose ?? '',
  amountWords: invoice.amountWords ?? '',
})

export function InvoiceDetailPopup({
  invoice,
  editing,
  busy,
  onClose,
  onEdit,
  onSave,
  onDelete,
}: InvoiceDetailPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<InvoiceUpdateInput>(() => (invoice ? toInput(invoice) : {}))

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (invoice && !dialog.open) dialog.showModal()
    if (!invoice && dialog.open) dialog.close()
  }, [invoice])

  if (!invoice) return null

  const baps = invoice.baps.length ? invoice.baps : invoice.bap ? [invoice.bap] : []

  return (
    <dialog
      ref={dialogRef}
      className="store-detail-dialog"
      aria-labelledby="invoice-detail-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
      <div className="store-detail-content">
        <button className="store-detail-close" type="button" onClick={onClose} aria-label="Tutup detail invoice">
          <X size={19} />
        </button>
        <p className="eyebrow">
          <span /> DETAIL INVOICE
        </p>
        <div className="store-detail-heading">
          <div className="store-badge">IV</div>
          <div>
            <h2 id="invoice-detail-title">{invoice.number}</h2>
            <p>
              {invoice.store.code} · {invoice.store.name}
            </p>
          </div>
        </div>
        {editing ? (
          <form
            className="store-form store-detail-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSave(form)
            }}
          >
            <label>
              Nomor invoice
              <input
                required
                value={form.number ?? ''}
                onChange={(event) => setForm({ ...form, number: event.target.value })}
              />
            </label>
            <label>
              Tanggal
              <input
                required
                type="date"
                value={form.date ?? ''}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
            <label>
              Untuk pembayaran
              <input
                value={form.purpose ?? ''}
                onChange={(event) => setForm({ ...form, purpose: event.target.value })}
                placeholder="Contoh: Perbaikan water boiler"
              />
            </label>
            <label>
              Terbilang
              <textarea
                rows={3}
                value={form.amountWords ?? ''}
                onChange={(event) => setForm({ ...form, amountWords: event.target.value })}
              />
            </label>
            <div className="store-detail-actions">
              <Button type="submit" disabled={busy}>
                {busy ? 'Menyimpan...' : 'Simpan perubahan'}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Batal
              </Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="store-detail-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`invoice-status-badge is-${invoice.status}`}>
                    {invoice.status === 'paid'
                      ? 'Lunas'
                      : invoice.status === 'revision'
                        ? 'Perlu Revisi'
                        : 'Belum dibayar'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Toko</dt>
                <dd>
                  {invoice.store.code} · {invoice.store.name}
                </dd>
              </div>
              <div>
                <dt>Tanggal</dt>
                <dd>{new Date(invoice.date).toLocaleDateString('id-ID')}</dd>
              </div>
              <div>
                <dt>Untuk pembayaran</dt>
                <dd>{invoice.purpose || 'Belum diisi'}</dd>
              </div>
              <div>
                <dt>Terbilang</dt>
                <dd>{invoice.amountWords || 'Belum diisi'}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{currency.format(invoice.totalAmount)}</dd>
              </div>
              <div>
                <dt>Daftar BAP</dt>
                <dd>{baps.length ? baps.map((bap) => bap.number).join(', ') : 'Tidak ada BAP'}</dd>
              </div>
            </dl>
            <div className="store-detail-actions">
              <Button
                type="button"
                onClick={() => {
                  setForm(toInput(invoice))
                  onEdit()
                }}
              >
                <Pencil size={14} /> Edit invoice
              </Button>
              <Button type="button" variant="outline" onClick={onDelete}>
                <Trash2 size={14} /> Hapus
              </Button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
