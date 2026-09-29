import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import type { Store, StoreInput } from './stores-api'
import { Button } from '../../components/ui/button'

interface StoreDetailPopupProps {
  store: Store | null
  editing: boolean
  busy: boolean
  onClose: () => void
  onEdit: () => void
  onSave: (input: StoreInput) => void
  onDelete: () => void
}

export function StoreDetailPopup({ store, editing, busy, onClose, onEdit, onSave, onDelete }: StoreDetailPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<StoreInput>(() => store ? {
    code: store.code,
    name: store.name,
    storeType: store.storeType,
    address: store.address ?? '',
    ownerName: store.ownerName ?? '',
    ownerCompany: store.ownerCompany ?? '',
  } : { code: '', name: '', storeType: 'REG', address: '', ownerName: '', ownerCompany: '' })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (store && !dialog.open) dialog.showModal()
    if (!store && dialog.open) dialog.close()
  }, [store])

  if (!store) return null

  return (
    <dialog ref={dialogRef} className="store-detail-dialog" aria-labelledby="store-detail-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClose={onClose}>
      <div className="store-detail-content">
        <button className="store-detail-close" type="button" onClick={onClose} aria-label="Tutup detail toko"><X size={19} /></button>
        <p className="eyebrow"><span /> DETAIL TOKO</p>
        <div className="store-detail-heading">
          <div className="store-badge">{store.code.slice(0, 2)}</div>
          <div><h2 id="store-detail-title">{store.name}</h2><p>{store.code} · {store.storeType}</p></div>
        </div>
        {editing ? (
          <form className="store-form store-detail-form" onSubmit={(event) => { event.preventDefault(); onSave(form) }}>
            <label>Kode toko<input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></label>
            <label>Nama toko<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Tipe toko<select value={form.storeType} onChange={(event) => setForm({ ...form, storeType: event.target.value as StoreInput['storeType'] })}><option value="REG">REG</option><option value="FRC">FRC</option></select></label>
            <label>Perusahaan pemilik<input value={form.ownerCompany} onChange={(event) => setForm({ ...form, ownerCompany: event.target.value })} /></label>
            <label>Alamat<textarea rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            <div className="store-detail-actions"><Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan perubahan'}</Button><Button type="button" variant="ghost" onClick={onClose}>Batal</Button></div>
          </form>
        ) : (
          <>
            <dl className="store-detail-list">
              <div><dt>Tipe toko</dt><dd>{store.storeType}</dd></div>
              <div><dt>Perusahaan pemilik</dt><dd>{store.ownerCompany ?? 'Belum diisi'}</dd></div>
              <div><dt>Nama pemilik</dt><dd>{store.ownerName ?? 'Belum diisi'}</dd></div>
              <div><dt>Alamat</dt><dd>{store.address ?? 'Belum diisi'}</dd></div>
            </dl>
            <div className="store-detail-actions"><Button type="button" onClick={onEdit}><Pencil size={14} /> Edit toko</Button><Button type="button" variant="outline" onClick={onDelete}><Trash2 size={14} /> Hapus</Button></div>
          </>
        )}
      </div>
    </dialog>
  )
}
