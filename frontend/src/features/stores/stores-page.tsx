import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { Download, Eye, FileSpreadsheet, MoreVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/button'
import { DataTable, type DataTableColumn } from '../../components/ui/data-table'
import { EventPopup, type EventPopupType } from '../../components/ui/event-popup'
import { createStore, deleteStore, getStores, importStores, updateStore, type Store, type StoreImportReport, type StoreImportRow, type StoreInput } from './stores-api'
import { StoreDetailPopup } from './store-detail-popup'

const emptyForm: StoreInput = { code: '', name: '', storeType: 'REG', address: '', ownerCompany: '' }

export function StoresPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [storeType, setStoreType] = useState<Store['storeType'] | 'ALL'>('ALL')
  const [form, setForm] = useState(emptyForm)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [pendingDeleteStore, setPendingDeleteStore] = useState<Store | null>(null)
  const [editing, setEditing] = useState(false)
  const [actionStoreId, setActionStoreId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<CSSProperties | null>(null)
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState<StoreImportReport | null>(null)
  const [popup, setPopup] = useState<{ type: EventPopupType; title: string; description?: string } | null>(null)
  const queryClient = useQueryClient()
  const stores = useQuery({
    queryKey: ['stores', search, storeType, page],
    queryFn: () => getStores(search, page, 10, storeType),
  })
  const createMutation = useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      setForm(emptyForm)
      setFormMessage('')
      setCreateFormOpen(false)
      setPopup({ type: 'success', title: 'Toko berhasil ditambahkan', description: 'Data toko sudah tersimpan di workspace.' })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal menambahkan toko', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: StoreInput }) => updateStore(id, input),
    onSuccess: (store) => {
      setSelectedStore(store)
      setEditing(false)
      setPopup({ type: 'success', title: 'Perubahan disimpan', description: 'Data toko berhasil diperbarui.' })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal memperbarui toko', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteStore,
    onSuccess: () => {
      setSelectedStore(null)
      setPendingDeleteStore(null)
      setPopup({ type: 'success', title: 'Toko dihapus', description: 'Data toko berhasil dihapus dari workspace.' })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal menghapus toko', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })

  async function importExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new Error('File Excel tidak memiliki sheet yang bisa dibaca.')

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const requiredColumns = ['code', 'name', 'storeType', 'address', 'ownerName', 'ownerCompany']
      const headers = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false })[0] ?? []
      const missingColumns = requiredColumns.filter((column) => !headers.includes(column))
      if (missingColumns.length > 0) throw new Error(`Kolom template tidak lengkap: ${missingColumns.join(', ')}.`)
      if (rows.length === 0) throw new Error('File Excel belum berisi data toko.')

      const storesToImport = rows.map((row, index): StoreImportRow => {
        const code = String(row.code).trim().toUpperCase()
        const name = String(row.name).trim()
        const storeType = String(row.storeType).trim().toUpperCase()
        if (!code || !name) throw new Error(`Baris ${index + 2}: code dan name wajib diisi.`)
        if (storeType !== 'REG' && storeType !== 'FRC') throw new Error(`Baris ${index + 2}: storeType harus REG atau FRC.`)
        return {
          rowNumber: index + 2,
          code,
          name,
          storeType,
          address: String(row.address).trim(),
          ownerName: String(row.ownerName).trim(),
          ownerCompany: String(row.ownerCompany).trim(),
        }
      })

      setPopup({ type: 'loading', title: 'Mengimpor data toko', description: `${storesToImport.length} baris sedang diproses.` })
      const result = await importStores(storesToImport)
      setImportReport(result)
      setPopup({
        type: 'success',
        title: 'Import selesai',
        description: `${result.summary.success} berhasil, ${result.summary.failed} gagal. Detail tersedia di panel import.`,
      })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    } catch (error) {
      setImportReport(null)
      setPopup({ type: 'error', title: 'Import gagal', description: error instanceof Error ? error.message : 'File Excel tidak dapat diproses.' })
    } finally {
      setImporting(false)
    }
  }

  async function downloadTemplate() {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet([
      { code: 'B032', name: 'CIKUTRA', storeType: 'REG', address: 'Alamat toko', ownerName: '', ownerCompany: 'PT Sumber Alfaria Trijaya Tbk.' },
    ], { header: ['code', 'name', 'storeType', 'address', 'ownerName', 'ownerCompany'] })
    worksheet['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 42 }, { wch: 24 }, { wch: 34 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Toko')
    XLSX.writeFile(workbook, 'template-import-toko.xlsx')
  }

  function requestDelete(store: Store) {
    setSelectedStore(null)
    setEditing(false)
    setPendingDeleteStore(store)
    setActionStoreId(null)
    setActionMenuPosition(null)
    setPopup({ type: 'confirm', title: 'Hapus toko ini?', description: `${store.name} akan dihapus dari workspace.` })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')
    setPopup({ type: 'loading', title: 'Menyimpan toko', description: 'Data toko sedang diproses.' })
    createMutation.mutate(form)
  }

  const storeColumns: DataTableColumn<Store>[] = [
    { key: 'store', header: 'Toko', render: (store) => <><strong>{store.name}</strong><small>{store.code}</small></> },
    { key: 'type', header: 'Tipe', render: (store) => <span className="store-type-badge">{store.storeType}</span> },
    { key: 'owner', header: 'Pemilik', render: (store) => store.ownerCompany ?? 'Belum diisi' },
    {
      key: 'actions',
      header: 'Aksi',
      render: (store) => (
        <div className="store-row-actions">
          <button
            type="button"
            className="store-actions-trigger"
            aria-label={`Buka aksi ${store.name}`}
            aria-haspopup="menu"
            aria-expanded={actionStoreId === store.id}
            onClick={(event) => {
              event.stopPropagation()
              if (actionStoreId === store.id) {
                setActionStoreId(null)
                setActionMenuPosition(null)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              const menuHeight = 128
              setActionStoreId(store.id)
              setActionMenuPosition({
                top: rect.bottom + 4 > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4,
                left: Math.max(8, Math.min(window.innerWidth - 168, rect.right - 160)),
              })
            }}
          >
            <MoreVertical size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <main className="dashboard-page">
      <section className="stores-content">
        <div className="stores-heading">
          <div><p className="eyebrow"><span /> MASTER DATA</p><h1>Data toko</h1><p>Kelola toko yang tersedia di workspace ini.</p></div>
          <span className="store-count">{stores.data?.pagination.total ?? 0} toko</span>
        </div>
        <div className="stores-layout">
          <section className="store-panel">
            <div className="panel-heading">
              <h2>Daftar toko</h2>
              <div className="store-list-filters">
                <input aria-label="Cari toko" placeholder="Cari kode atau nama..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
                <select aria-label="Filter tipe toko" value={storeType} onChange={(event) => { setStoreType(event.target.value as Store['storeType'] | 'ALL'); setPage(1) }}>
                  <option value="ALL">Semua tipe</option>
                  <option value="REG">REG</option>
                  <option value="FRC">FRC</option>
                </select>
              </div>
            </div>
            {stores.isLoading && <p className="panel-message">Memuat data toko...</p>}
            {stores.isError && <p className="panel-message error">Data toko gagal dimuat: {stores.error instanceof Error ? stores.error.message : 'Terjadi kesalahan pada server.'}</p>}
            {!stores.isLoading && !stores.isError && stores.data?.items.length === 0 && <p className="panel-message">Belum ada toko yang cocok.</p>}
            <DataTable
              columns={storeColumns}
              rows={stores.data?.items ?? []}
              getRowKey={(store) => store.id}
              ariaLabel="Daftar toko"
              onRowClick={(store) => { setSelectedStore(store); setEditing(false); setActionStoreId(null); setActionMenuPosition(null) }}
            />
            {stores.data && stores.data.pagination.totalPages > 1 && (
              <nav className="store-pagination" aria-label="Pagination daftar toko">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Sebelumnya</button>
                <span>Halaman {stores.data.pagination.page} dari {stores.data.pagination.totalPages}</span>
                <button type="button" disabled={page >= stores.data.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Berikutnya</button>
              </nav>
            )}
          </section>
          <section className={`store-panel add-store-panel mobile-create-panel${createFormOpen ? ' is-open' : ''}`}>
            <div className="mobile-create-heading"><h2>Tambah toko</h2><button type="button" className="mobile-create-close" onClick={() => setCreateFormOpen(false)} aria-label="Tutup form tambah toko"><X size={18} /></button></div>
            <form onSubmit={submit} className="store-form">
              <label>Kode toko<input required maxLength={30} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Contoh: B032" /></label>
              <label>Nama toko<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: CIKUTRA" /></label>
              <label>Tipe toko<select value={form.storeType} onChange={(event) => setForm({ ...form, storeType: event.target.value as StoreInput['storeType'] })}><option value="REG">REG</option><option value="FRC">FRC</option></select></label>
              <label>Perusahaan pemilik<input value={form.ownerCompany} onChange={(event) => setForm({ ...form, ownerCompany: event.target.value })} placeholder="Nama perusahaan" /></label>
              <label>Alamat<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} placeholder="Alamat toko" /></label>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Menyimpan...' : 'Simpan toko'}</Button>
              {formMessage && <p className="form-message" role="status">{formMessage}</p>}
            </form>
            <div className="store-import-divider"><span>atau kelola sekaligus</span></div>
            <div className="store-import-box">
              <div className="store-import-icon"><FileSpreadsheet size={18} /></div>
              <div><strong>Import dari Excel</strong><p>Gunakan template agar kolom sesuai database.</p></div>
              <div className="store-import-actions">
                <button type="button" className="store-secondary-button" onClick={downloadTemplate}><Download size={14} /> Download template</button>
                <label className="store-primary-button">
                  {importing ? 'Memproses...' : 'Pilih file Excel'}
                  <input type="file" accept=".xlsx,.xls" onChange={importExcel} disabled={importing} />
                </label>
              </div>
            </div>
            {importReport && (
              <div className="store-import-report" role="status" aria-live="polite">
                <h3>Hasil import terbaru</h3>
                <p>{importReport.summary.success} berhasil dari {importReport.summary.submitted} baris ({importReport.summary.failed} gagal).</p>
                <div className="store-import-report-list">
                  {importReport.results.map((result) => (
                    <div key={`${result.rowNumber}-${result.code}`} className={`store-import-report-item is-${result.status}`}>
                      <strong>Baris {result.rowNumber} · {result.code || '-'}</strong>
                      <span>{result.status === 'success' ? 'Berhasil' : 'Gagal'} — {result.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
      <button type="button" className={`mobile-create-fab${createFormOpen ? ' is-hidden' : ''}`} onClick={() => setCreateFormOpen(true)} aria-label="Tambah toko"><Plus size={22} /></button>
      {actionStoreId && actionMenuPosition && createPortal(
        <div className="store-actions-menu" role="menu" style={actionMenuPosition} onClick={(event) => event.stopPropagation()}>
          {(() => {
            const store = stores.data?.items.find((item) => item.id === actionStoreId)
            if (!store) return null
            return (
              <>
                <button type="button" role="menuitem" onClick={() => { setSelectedStore(store); setEditing(false); setActionStoreId(null); setActionMenuPosition(null) }}><Eye size={15} /> Lihat detail</button>
                <button type="button" role="menuitem" onClick={() => { setSelectedStore(store); setEditing(true); setActionStoreId(null); setActionMenuPosition(null) }}><Pencil size={15} /> Edit toko</button>
                <button type="button" role="menuitem" className="is-danger" onClick={() => requestDelete(store)}><Trash2 size={15} /> Hapus toko</button>
              </>
            )
          })()}
        </div>,
        document.body,
      )}
      <StoreDetailPopup key={selectedStore?.id ?? 'empty'} store={selectedStore} editing={editing} busy={updateMutation.isPending} onClose={() => { setSelectedStore(null); setEditing(false) }} onEdit={() => setEditing(true)} onSave={(input) => { if (selectedStore) { setPopup({ type: 'loading', title: 'Menyimpan perubahan', description: 'Data toko sedang diperbarui.' }); updateMutation.mutate({ id: selectedStore.id, input }) } }} onDelete={() => selectedStore && requestDelete(selectedStore)} />
      <EventPopup open={popup !== null} type={popup?.type ?? 'loading'} title={popup?.title ?? ''} description={popup?.description} onClose={() => { setPopup(null); setPendingDeleteStore(null) }} onConfirm={() => { if (pendingDeleteStore) { setPopup({ type: 'loading', title: 'Menghapus toko', description: 'Data toko sedang dihapus.' }); deleteMutation.mutate(pendingDeleteStore.id) } }} confirmLabel="Ya, hapus" />
    </main>
  )
}
