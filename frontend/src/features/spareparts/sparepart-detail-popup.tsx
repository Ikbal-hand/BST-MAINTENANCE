import { useEffect, useRef } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { Sparepart, SparepartInput } from './spareparts-api'

interface SparepartDetailPopupProps {
  sparepart: Sparepart | null
  editing: boolean
  editForm: SparepartInput
  busy: boolean
  onClose: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onEditFormChange: (input: SparepartInput) => void
  onSave: () => void
  onDelete: () => void
}

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function SparepartDetailPopup({
  sparepart,
  editing,
  editForm,
  busy,
  onClose,
  onEdit,
  onCancelEdit,
  onEditFormChange,
  onSave,
  onDelete,
}: SparepartDetailPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (sparepart && !dialog.open) dialog.showModal()
    if (!sparepart && dialog.open) dialog.close()
  }, [sparepart])

  if (!sparepart) return null

  return (
    <dialog
      ref={dialogRef}
      className="store-detail-dialog"
      aria-labelledby="sparepart-detail-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClose={onClose}
    >
      <div className="store-detail-content">
        <button className="store-detail-close" type="button" onClick={onClose} aria-label="Tutup detail sparepart">
          <X size={19} />
        </button>
        <p className="eyebrow"><span /> {editing ? 'EDIT SPAREPART' : 'DETAIL SPAREPART'}</p>
        <div className="store-detail-heading">
          <div className="store-badge">SP</div>
          <div>
            <h2 id="sparepart-detail-title">{editing ? 'Edit Sparepart' : sparepart.name}</h2>
            <p>{editing ? 'Perbarui informasi sparepart' : 'Informasi sparepart'}</p>
          </div>
        </div>
        {editing ? (
          <form className="store-form" onSubmit={(event) => { event.preventDefault(); onSave() }}>
            <label>
              Nama Sparepart
              <input
                required
                value={editForm.name}
                onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                placeholder="Nama sparepart"
              />
            </label>
            <label>
              Harga (Rp)
              <input
                required
                type="number"
                min="0"
                value={editForm.price}
                onChange={(event) => onEditFormChange({ ...editForm, price: Number.parseInt(event.target.value, 10) || 0 })}
              />
            </label>
            <div className="store-detail-actions">
              <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan perubahan'}</Button>
              <Button type="button" variant="ghost" onClick={onCancelEdit}>Batal</Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="store-detail-list">
              <div><dt>Nama sparepart</dt><dd>{sparepart.name}</dd></div>
              <div><dt>Harga</dt><dd>{currency.format(sparepart.price)}</dd></div>
            </dl>
            <div className="store-detail-actions">
              <Button type="button" onClick={onEdit}><Pencil size={14} /> Edit sparepart</Button>
              <Button type="button" variant="outline" onClick={onDelete}><Trash2 size={14} /> Hapus</Button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
