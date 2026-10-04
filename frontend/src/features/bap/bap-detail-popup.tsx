import { useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { ComboBox } from '../../components/ui/combo-box'
import { DatePicker } from '../../components/ui/date-picker'
import type { Sparepart } from '../spareparts/spareparts-api'
import type { Store } from '../stores/stores-api'
import type { Bap, BapInput } from './bap-api'

interface BapDetailPopupProps {
  bap: Bap | null
  spareparts: Sparepart[]
  stores: Store[]
  storesLoading: boolean
  editing: boolean
  busy: boolean
  onClose: () => void
  onEdit: () => void
  onSave: (input: BapInput) => void
  onDelete: () => void
}

const toInput = (bap: Bap): BapInput => ({
  number: bap.number,
  storeId: bap.storeId,
  date: bap.date.slice(0, 10),
  title: bap.title,
  description: bap.description ?? '',
  status: bap.status === 'deleted' ? 'draft' : bap.status as BapInput['status'],
  amountWords: bap.amountWords ?? '',
  items: bap.items.map(({ serviceName, unit, unitPrice, sortOrder }) => ({ serviceName, unit, unitPrice, sortOrder })),
})

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function BapDetailPopup({ bap, spareparts, stores, storesLoading, editing, busy, onClose, onEdit, onSave, onDelete }: BapDetailPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<BapInput>(() => bap ? toInput(bap) : {
    number: '', storeId: '', date: '', title: '', description: '', items: [],
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (bap && !dialog.open) dialog.showModal()
    if (!bap && dialog.open) dialog.close()
  }, [bap])

  const sparepartOptions = useMemo(() => spareparts.map((sparepart) => ({
    value: sparepart.name,
    label: sparepart.name,
    description: currency.format(sparepart.price),
  })), [spareparts])
  const storeOptions = useMemo(() => stores.map((store) => ({
    value: store.id,
    label: store.name,
    description: `${store.code} · ${store.storeType}`,
  })), [stores])
  const total = form.items.reduce((sum, item) => sum + item.unit * item.unitPrice, 0)
  const updateForm = (patch: Partial<BapInput>) => setForm((current) => ({ ...current, ...patch }))
  const updateItem = (index: number, patch: Partial<BapInput['items'][number]>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }))
  }

  if (!bap) return null

  return (
    <dialog ref={dialogRef} className={`store-detail-dialog${editing ? ' bap-edit-dialog' : ''}`} aria-labelledby="bap-detail-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClose={onClose}>
      <div className="store-detail-content">
        <button className="store-detail-close" type="button" onClick={onClose} aria-label="Tutup detail BAP"><X size={19} /></button>
        <p className="eyebrow"><span /> DETAIL BAP</p>
        <div className="store-detail-heading">
          <div className="store-badge">BA</div>
          <div><h2 id="bap-detail-title">{bap.number}</h2><p>{bap.store.code} · {bap.store.name} · {bap.store.storeType}</p></div>
        </div>
        {editing ? (
          <form className="store-form" onSubmit={(event) => { event.preventDefault(); onSave(form) }}>
            <div className="bap-form-grid">
              <label>Nomor BAP<input required value={form.number} onChange={(event) => updateForm({ number: event.target.value })} placeholder="Contoh: BAP/001/IX/2026" /></label>
              <label>Tanggal<DatePicker value={form.date} onChange={(date) => updateForm({ date })} ariaLabel="Tanggal BAP" /></label>
            </div>
            <label>Toko<ComboBox value={form.storeId} options={storeOptions} onChange={(storeId) => updateForm({ storeId })} placeholder="Pilih toko" searchPlaceholder="Cari kode atau nama toko..." ariaLabel="Pilih toko untuk BAP" disabled={storesLoading} /></label>
            <label>Judul pekerjaan<input required value={form.title} onChange={(event) => updateForm({ title: event.target.value })} placeholder="Contoh: Perbaikan instalasi listrik" /></label>
            <label>Deskripsi<textarea value={form.description} onChange={(event) => updateForm({ description: event.target.value })} rows={2} placeholder="Keterangan pekerjaan" /></label>
            <div className="bap-items-heading">
              <strong>Detail pekerjaan</strong>
              <button type="button" className="inline-action" onClick={() => setForm((current) => ({
                ...current,
                items: [...current.items, { serviceName: '', unit: 1, unitPrice: 0, sortOrder: current.items.length }],
              }))}>
                <Plus size={14} /> Tambah item
              </button>
            </div>
            {form.items.map((item, index) => (
              <div className="bap-item-form" key={index}>
                <ComboBox
                  value={item.serviceName}
                  options={sparepartOptions}
                  onChange={(serviceName) => {
                    const sparepart = spareparts.find((option) => option.name === serviceName)
                    updateItem(index, { serviceName, ...(sparepart ? { unitPrice: sparepart.price } : {}) })
                  }}
                  placeholder="Nama pekerjaan"
                  searchPlaceholder="Cari atau masukkan nama pekerjaan..."
                  ariaLabel={`Nama pekerjaan ${index + 1}`}
                  allowCustomValue
                />
                <input required aria-label={`Jumlah ${index + 1}`} type="number" min="1" value={item.unit} onChange={(event) => updateItem(index, { unit: Number(event.target.value) })} />
                <input required aria-label={`Harga ${index + 1}`} type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })} />
                <button
                  type="button"
                  className="remove-item"
                  disabled={form.items.length === 1}
                  onClick={() => setForm((current) => ({
                    ...current,
                    items: current.items
                      .filter((_, itemIndex) => itemIndex !== index)
                      .map((currentItem, itemIndex) => ({ ...currentItem, sortOrder: itemIndex })),
                  }))}
                  aria-label={`Hapus detail pekerjaan ${index + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div className="bap-total">Total <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}</strong></div>
            <div className="store-detail-actions"><Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan perubahan'}</Button><Button type="button" variant="ghost" onClick={onClose}>Batal</Button></div>
          </form>
        ) : (
          <>
            <dl className="store-detail-list">
              <div><dt>Toko</dt><dd>{bap.store.code} · {bap.store.name}</dd></div>
              <div><dt>Tanggal</dt><dd>{new Date(bap.date).toLocaleDateString('id-ID')}</dd></div>
              <div><dt>Judul</dt><dd>{bap.title}</dd></div>
              <div><dt>Status</dt><dd>{bap.status}</dd></div>
              <div><dt>Deskripsi</dt><dd>{bap.description || 'Belum diisi'}</dd></div>
              <div><dt>Total</dt><dd>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(bap.totalAmount)}</dd></div>
            </dl>
            <div className="store-detail-actions"><Button type="button" onClick={onEdit}><Pencil size={14} /> Edit BAP</Button><Button type="button" variant="outline" onClick={onDelete}><Trash2 size={14} /> Hapus</Button></div>
          </>
        )}
      </div>
    </dialog>
  )
}
