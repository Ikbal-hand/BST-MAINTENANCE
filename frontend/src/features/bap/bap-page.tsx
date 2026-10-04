import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, MoreVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { ComboBox } from '../../components/ui/combo-box'
import { DataTable, type DataTableColumn } from '../../components/ui/data-table'
import { DatePicker } from '../../components/ui/date-picker'
import { getSettings, type WorkspaceSettings } from '../settings/settings-api'
import { getAllStores } from '../stores/stores-api'
import { createBap, deleteBap, getBaps, updateBap, type Bap, type BapInput } from './bap-api'
import { getSpareparts } from '../spareparts/spareparts-api'
import { EventPopup, type EventPopupType } from '../../components/ui/event-popup'
import { BapDetailPopup } from './bap-detail-popup'

type FormItem = BapInput['items'][number]

const newItem = (sortOrder: number): FormItem => ({ serviceName: '', unit: 1, unitPrice: 0, sortOrder })

const defaultServiceItems = (transportPrice: number, servicePrice: number): FormItem[] => ([
  { serviceName: 'Transport', unit: 1, unitPrice: transportPrice, sortOrder: 0 },
  { serviceName: 'Jasa Service', unit: 1, unitPrice: servicePrice, sortOrder: 1 },
])

const initialForm = (transportPrice = 0, servicePrice = 0): BapInput => ({
  number: '',
  storeId: '',
  date: new Date().toISOString().slice(0, 10),
  title: '',
  description: '',
  items: defaultServiceItems(transportPrice, servicePrice),
})

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function BapPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [storeType, setStoreType] = useState<'REG' | 'FRC' | 'ALL'>('ALL')
  const [selectedBap, setSelectedBap] = useState<Bap | null>(null)
  const [editing, setEditing] = useState(false)
  const [actionBapId, setActionBapId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<CSSProperties | null>(null)
  const [pendingDeleteBap, setPendingDeleteBap] = useState<Bap | null>(null)
  const [popup, setPopup] = useState<{ type: EventPopupType; title: string; description?: string } | null>(null)
  const queryClient = useQueryClient()
  const cachedSettings = queryClient.getQueryData<WorkspaceSettings>(['workspace-settings'])
  const [form, setForm] = useState(() => initialForm(cachedSettings?.transportPrice ?? 0, cachedSettings?.servicePrice ?? 0))
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [message, setMessage] = useState('')
  const settings = useQuery({ queryKey: ['workspace-settings'], queryFn: getSettings })
  const baps = useQuery({ queryKey: ['baps', search, storeType, page], queryFn: () => getBaps(search, page, 10, storeType) })
  const stores = useQuery({ queryKey: ['stores', 'bap-options'], queryFn: getAllStores })
  const spareparts = useQuery({ queryKey: ['spareparts'], queryFn: getSpareparts })
  const createMutation = useMutation({
    mutationFn: createBap,
    onSuccess: () => {
      setForm(initialForm(settings.data?.transportPrice ?? 0, settings.data?.servicePrice ?? 0))
      setCreateFormOpen(false)
      setMessage('BAP berhasil dibuat.')
      queryClient.invalidateQueries({ queryKey: ['baps'] })
      queryClient.invalidateQueries({ queryKey: ['spareparts'] })
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'BAP gagal dibuat.'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BapInput }) => updateBap(id, input),
    onSuccess: () => { setSelectedBap(null); setEditing(false); setPopup({ type: 'success', title: 'Perubahan disimpan', description: 'Data BAP berhasil diperbarui.' }); queryClient.invalidateQueries({ queryKey: ['baps'] }); queryClient.invalidateQueries({ queryKey: ['spareparts'] }) },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal memperbarui BAP', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteBap,
    onSuccess: () => { setSelectedBap(null); setPendingDeleteBap(null); setPopup({ type: 'success', title: 'BAP dihapus', description: 'Data BAP berhasil dihapus.' }); queryClient.invalidateQueries({ queryKey: ['baps'] }) },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal menghapus BAP', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })

  function updateItem(index: number, patch: Partial<FormItem>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const normalizedItems = form.items.map((item, index) => ({ ...item, sortOrder: index }))
    createMutation.mutate({ ...form, items: normalizedItems })
  }

  function requestDelete(bap: Bap) {
    setSelectedBap(null)
    setEditing(false)
    setPendingDeleteBap(bap)
    setActionBapId(null)
    setActionMenuPosition(null)
    setPopup({ type: 'confirm', title: 'Hapus BAP ini?', description: `${bap.number} akan dihapus dari workspace.` })
  }

  const total = form.items.reduce((sum, item) => sum + item.unit * item.unitPrice, 0)
  const storeOptions = useMemo(
    () => stores.data?.map((store) => ({ value: store.id, label: store.name, description: `${store.code} · ${store.storeType}` })) ?? [],
    [stores.data],
  )
  const sparepartOptions = useMemo(() => spareparts.data?.map((sparepart) => ({
    value: sparepart.name,
    label: sparepart.name,
    description: currency.format(sparepart.price),
  })) ?? [], [spareparts.data])

  function updateWorkItem(index: number, serviceName: string) {
    const sparepart = spareparts.data?.find((item) => item.name === serviceName)
    updateItem(index, { serviceName, ...(sparepart ? { unitPrice: sparepart.price } : {}) })
  }

  const bapColumns: DataTableColumn<Bap>[] = [
    { key: 'number', header: 'Nomor BAP', render: (bap) => <><strong>{bap.number}</strong><small>{bap.title}</small></> },
    { key: 'store', header: 'Toko', render: (bap) => <><strong>{bap.store.name}</strong><small>{bap.store.code} · {bap.store.storeType}</small></> },
    { key: 'date', header: 'Tanggal', render: (bap) => new Date(bap.date).toLocaleDateString('id-ID') },
    { key: 'total', header: 'Total', render: (bap) => currency.format(bap.totalAmount) },
    {
      key: 'actions',
      header: 'Aksi',
      render: (bap) => (
        <div className="store-row-actions">
          <button type="button" className="store-actions-trigger" aria-label={`Buka aksi ${bap.number}`} aria-haspopup="menu" aria-expanded={actionBapId === bap.id} onClick={(event) => {
            event.stopPropagation()
            if (actionBapId === bap.id) { setActionBapId(null); setActionMenuPosition(null); return }
            const rect = event.currentTarget.getBoundingClientRect()
            const menuHeight = 128
            setActionBapId(bap.id)
            setActionMenuPosition({ top: rect.bottom + 4 > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4, left: Math.max(8, Math.min(window.innerWidth - 168, rect.right - 160)) })
          }}><MoreVertical size={17} /></button>
        </div>
      ),
    },
  ]

  return (
    <main className="dashboard-page">
      <section className="stores-content">
        <div className="stores-heading">
          <div><p className="eyebrow"><span /> TRANSAKSI</p><h1>Data BAP</h1><p>Kelola berita acara pekerjaan dan detail biaya per toko.</p></div>
          <span className="store-count">{baps.data?.pagination.total ?? 0} BAP</span>
        </div>
        <div className="stores-layout bap-layout">
          <section className="store-panel">
            <div className="panel-heading">
              <h2>Daftar BAP</h2>
              <div className="store-list-filters">
                <input aria-label="Cari BAP" placeholder="Cari nomor, toko..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
                <select aria-label="Filter tipe toko pada BAP" value={storeType} onChange={(event) => { setStoreType(event.target.value as 'REG' | 'FRC' | 'ALL'); setPage(1) }}>
                  <option value="ALL">Semua tipe</option>
                  <option value="REG">REG</option>
                  <option value="FRC">FRC</option>
                </select>
              </div>
            </div>
            {baps.isLoading && <p className="panel-message">Memuat BAP...</p>}
            {baps.isError && <p className="panel-message error">BAP gagal dimuat: {baps.error instanceof Error ? baps.error.message : 'Terjadi kesalahan pada server.'}</p>}
            {!baps.isLoading && !baps.isError && baps.data?.items.length === 0 && <p className="panel-message">Belum ada BAP.</p>}
            <DataTable
              columns={bapColumns}
              rows={baps.data?.items ?? []}
              getRowKey={(bap) => bap.id}
              className="bap-table"
              ariaLabel="Daftar BAP"
              onRowClick={(bap) => { setSelectedBap(bap); setEditing(false); setActionBapId(null); setActionMenuPosition(null) }}
            />
            {baps.data && baps.data.pagination.totalPages > 1 && (
              <nav className="store-pagination" aria-label="Pagination daftar BAP">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Sebelumnya</button>
                <span>Halaman {baps.data.pagination.page} dari {baps.data.pagination.totalPages}</span>
                <button type="button" disabled={page >= baps.data.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Berikutnya</button>
              </nav>
            )}
          </section>
          {actionBapId && actionMenuPosition && createPortal(
            <div className="store-actions-menu" role="menu" style={actionMenuPosition} onClick={(event) => event.stopPropagation()}>
              {(() => {
                const bap = baps.data?.items.find((item) => item.id === actionBapId)
                if (!bap) return null
                return <>
                  <button type="button" role="menuitem" onClick={() => { setSelectedBap(bap); setEditing(false); setActionBapId(null); setActionMenuPosition(null) }}><Eye size={15} /> Lihat detail</button>
                  <button type="button" role="menuitem" onClick={() => { setSelectedBap(bap); setEditing(true); setActionBapId(null); setActionMenuPosition(null) }}><Pencil size={15} /> Edit BAP</button>
                  <button type="button" role="menuitem" className="is-danger" onClick={() => requestDelete(bap)}><Trash2 size={15} /> Hapus BAP</button>
                </>
              })()}
            </div>,
            document.body,
          )}
          <BapDetailPopup key={selectedBap?.id ?? 'empty'} bap={selectedBap} spareparts={spareparts.data ?? []} stores={stores.data ?? []} storesLoading={stores.isLoading} busy={updateMutation.isPending} editing={editing} onClose={() => { setSelectedBap(null); setEditing(false) }} onEdit={() => setEditing(true)} onSave={(input) => { if (selectedBap) { setPopup({ type: 'loading', title: 'Menyimpan perubahan', description: 'Data BAP sedang diperbarui.' }); updateMutation.mutate({ id: selectedBap.id, input }) } }} onDelete={() => selectedBap && requestDelete(selectedBap)} />
          <EventPopup open={popup !== null} type={popup?.type ?? 'loading'} title={popup?.title ?? ''} description={popup?.description} onClose={() => { setPopup(null); setPendingDeleteBap(null) }} onConfirm={() => { if (pendingDeleteBap) { setPopup({ type: 'loading', title: 'Menghapus BAP', description: 'Data BAP sedang dihapus.' }); deleteMutation.mutate(pendingDeleteBap.id) } }} confirmLabel="Ya, hapus" />
          <section className={`store-panel add-store-panel mobile-create-panel${createFormOpen ? ' is-open' : ''}`}>
            <div className="mobile-create-heading"><h2>Buat BAP</h2><button type="button" className="mobile-create-close" onClick={() => setCreateFormOpen(false)} aria-label="Tutup form buat BAP"><X size={18} /></button></div>
            <form onSubmit={submit} className="store-form">
              <div className="bap-form-grid">
                <label>Nomor BAP<input required value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} placeholder="Contoh: BAP/001/IX/2026" /></label>
                <label>Tanggal<DatePicker value={form.date} onChange={(date) => setForm({ ...form, date })} ariaLabel="Tanggal BAP" /></label>
              </div>
              <label>Toko<ComboBox value={form.storeId} options={storeOptions} onChange={(storeId) => setForm({ ...form, storeId })} placeholder="Pilih toko" searchPlaceholder="Cari kode atau nama toko..." ariaLabel="Pilih toko untuk BAP" disabled={stores.isLoading} /></label>
              <label>Judul pekerjaan<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Perbaikan instalasi listrik" /></label>
              <label>Deskripsi<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} placeholder="Keterangan pekerjaan" /></label>
              <div className="bap-items-heading"><strong>Detail pekerjaan</strong><button type="button" className="inline-action" onClick={() => setForm({ ...form, items: [...form.items, newItem(form.items.length)] })}><Plus size={14} /> Tambah item</button></div>
              {form.items.map((item, index) => (
                <div className="bap-item-form" key={index}>
                  <ComboBox
                    value={item.serviceName}
                    options={sparepartOptions}
                    onChange={(serviceName) => updateWorkItem(index, serviceName)}
                    placeholder="Nama pekerjaan"
                    searchPlaceholder="Cari atau masukkan nama pekerjaan..."
                    ariaLabel={`Nama pekerjaan ${index + 1}`}
                    allowCustomValue
                  />
                  <input required aria-label={`Jumlah ${index + 1}`} type="number" min="1" value={item.unit} onChange={(event) => updateItem(index, { unit: Number(event.target.value) })} />
                  <input required aria-label={`Harga ${index + 1}`} type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })} />
                  <button type="button" className="remove-item" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index).map((currentItem, currentIndex) => ({ ...currentItem, sortOrder: currentIndex })) })} aria-label="Hapus item"><Trash2 size={15} /></button>
                </div>
              ))}
              <div className="bap-total">Total <strong>{currency.format(total)}</strong></div>
              <Button type="submit" disabled={createMutation.isPending || stores.isLoading}>{createMutation.isPending ? 'Menyimpan...' : 'Simpan BAP'}</Button>
              {message && <p className={`form-message${createMutation.isError ? ' error' : ''}`} role="status">{message}</p>}
            </form>
          </section>
        </div>
      </section>
      <button type="button" className={`mobile-create-fab${createFormOpen ? ' is-hidden' : ''}`} onClick={() => setCreateFormOpen(true)} aria-label="Buat BAP"><Plus size={22} /></button>
    </main>
  )
}
