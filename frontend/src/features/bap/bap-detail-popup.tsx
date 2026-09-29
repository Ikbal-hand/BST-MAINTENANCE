import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { Bap, BapInput } from './bap-api'

interface BapDetailPopupProps {
  bap: Bap | null
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

export function BapDetailPopup({ bap, editing, busy, onClose, onEdit, onSave, onDelete }: BapDetailPopupProps) {
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

  if (!bap) return null
  const total = form.items.reduce((sum, item) => sum + item.unit * item.unitPrice, 0)

  return (
    <dialog ref={dialogRef} className="store-detail-dialog" aria-labelledby="bap-detail-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClose={onClose}>
      <div className="store-detail-content">
        <button className="store-detail-close" type="button" onClick={onClose} aria-label="Tutup detail BAP"><X size={19} /></button>
        <p className="eyebrow"><span /> DETAIL BAP</p>
        <div className="store-detail-heading">
          <div className="store-badge">BA</div>
          <div><h2 id="bap-detail-title">{bap.number}</h2><p>{bap.store.code} · {bap.store.name} · {bap.store.storeType}</p></div>
        </div>
        {editing ? (
          <form className="store-form" onSubmit={(event) => { event.preventDefault(); onSave(form) }}>
            <label>Nomor BAP<input required value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} /></label>
            <label>Tanggal<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
            <label>Judul pekerjaan<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Status<select value={form.status ?? 'draft'} onChange={(event) => setForm({ ...form, status: event.target.value as BapInput['status'] })}><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="review">Review</option><option value="approved">Approved</option><option value="cancelled">Cancelled</option></select></label>
            <label>Deskripsi<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="bap-items-heading"><strong>Detail pekerjaan</strong></div>
            {form.items.map((item, index) => (
              <div className="bap-item-form" key={index}>
                <input required aria-label={`Nama pekerjaan ${index + 1}`} value={item.serviceName} onChange={(event) => setForm({ ...form, items: form.items.map((current, itemIndex) => itemIndex === index ? { ...current, serviceName: event.target.value } : current) })} />
                <input required aria-label={`Jumlah ${index + 1}`} type="number" min="1" value={item.unit} onChange={(event) => setForm({ ...form, items: form.items.map((current, itemIndex) => itemIndex === index ? { ...current, unit: Number(event.target.value) } : current) })} />
                <input required aria-label={`Harga ${index + 1}`} type="number" min="0" value={item.unitPrice} onChange={(event) => setForm({ ...form, items: form.items.map((current, itemIndex) => itemIndex === index ? { ...current, unitPrice: Number(event.target.value) } : current) })} />
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
