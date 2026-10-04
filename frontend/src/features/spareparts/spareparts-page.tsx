import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { Eye, MoreVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/button'
import { DataTable, type DataTableColumn } from '../../components/ui/data-table'
import { EventPopup, type EventPopupType } from '../../components/ui/event-popup'
import {
  createSparepart,
  deleteSparepart,
  getSpareparts,
  updateSparepart,
  type Sparepart,
  type SparepartInput,
} from './spareparts-api'
import { SparepartDetailPopup } from './sparepart-detail-popup'

const emptyForm: SparepartInput = { name: '', price: 0 }

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export default function SparepartsPage() {
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<SparepartInput>(emptyForm)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [selectedSparepart, setSelectedSparepart] = useState<Sparepart | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Sparepart | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<SparepartInput>(emptyForm)
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<CSSProperties | null>(null)
  const [popup, setPopup] = useState<{ type: EventPopupType; title: string; description?: string } | null>(null)
  const queryClient = useQueryClient()

  const spareparts = useQuery({
    queryKey: ['spareparts'],
    queryFn: getSpareparts,
  })

  const createMutation = useMutation({
    mutationFn: createSparepart,
    onSuccess: () => {
      setForm(emptyForm)
      setFormMessage('')
      setCreateFormOpen(false)
      setPopup({ type: 'success', title: 'Sparepart berhasil ditambahkan', description: 'Data sparepart sudah tersimpan di workspace.' })
      queryClient.invalidateQueries({ queryKey: ['spareparts'] })
    },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal menambahkan sparepart', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SparepartInput }) => updateSparepart({ id, ...input }),
    onSuccess: (updated) => {
      setSelectedSparepart(updated)
      setEditing(false)
      setPopup({ type: 'success', title: 'Perubahan disimpan', description: 'Data sparepart berhasil diperbarui.' })
      queryClient.invalidateQueries({ queryKey: ['spareparts'] })
    },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal memperbarui sparepart', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSparepart,
    onSuccess: () => {
      setSelectedSparepart(null)
      setPendingDelete(null)
      setPopup({ type: 'success', title: 'Sparepart dihapus', description: 'Data sparepart berhasil dihapus dari workspace.' })
      queryClient.invalidateQueries({ queryKey: ['spareparts'] })
    },
    onError: (error) => setPopup({ type: 'error', title: 'Gagal menghapus sparepart', description: error instanceof Error ? error.message : 'Silakan coba lagi.' }),
  })

  function requestDelete(item: Sparepart) {
    setSelectedSparepart(null)
    setEditing(false)
    setPendingDelete(item)
    setActionId(null)
    setActionMenuPosition(null)
    setPopup({ type: 'confirm', title: 'Hapus sparepart ini?', description: `${item.name} akan dihapus dari workspace.` })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')
    setPopup({ type: 'loading', title: 'Menyimpan sparepart', description: 'Data sparepart sedang diproses.' })
    createMutation.mutate(form)
  }

  function openDetail(item: Sparepart) {
    setSelectedSparepart(item)
    setEditForm({ name: item.name, price: item.price })
    setEditing(false)
    setActionId(null)
    setActionMenuPosition(null)
  }

  function openEdit(item: Sparepart) {
    setSelectedSparepart(item)
    setEditForm({ name: item.name, price: item.price })
    setEditing(true)
    setActionId(null)
    setActionMenuPosition(null)
  }

  function saveEdit() {
    if (!selectedSparepart) return
    setPopup({ type: 'loading', title: 'Menyimpan perubahan', description: 'Data sparepart sedang diperbarui.' })
    updateMutation.mutate({ id: selectedSparepart.id, input: editForm })
  }

  const filtered = (spareparts.data ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Sparepart>[] = [
    {
      key: 'name',
      header: 'Nama Sparepart',
      render: (item) => <><strong>{item.name}</strong></>,
    },
    {
      key: 'price',
      header: 'Harga',
      render: (item) => currency.format(item.price),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="store-row-actions">
          <button
            type="button"
            className="store-actions-trigger"
            aria-label={`Buka aksi ${item.name}`}
            aria-haspopup="menu"
            aria-expanded={actionId === item.id}
            onClick={(event) => {
              event.stopPropagation()
              if (actionId === item.id) {
                setActionId(null)
                setActionMenuPosition(null)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              const menuHeight = 128
              setActionId(item.id)
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
    <main className="dashboard-page" onClick={() => { setActionId(null); setActionMenuPosition(null) }}>
      <section className="stores-content">
        <div className="stores-heading">
          <div>
            <p className="eyebrow"><span /> OPERASI</p>
            <h1>Sparepart</h1>
            <p>Kelola sparepart yang tersedia di workspace ini.</p>
          </div>
          <span className="store-count">{filtered.length} sparepart</span>
        </div>
        <div className="stores-layout">
          {/* Left panel — list */}
          <section className="store-panel">
            <div className="panel-heading">
              <h2>Daftar sparepart</h2>
              <div className="store-list-filters">
                <input
                  aria-label="Cari sparepart"
                  placeholder="Cari nama..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            {spareparts.isLoading && <p className="panel-message">Memuat data sparepart...</p>}
            {spareparts.isError && (
              <p className="panel-message error">
                Data sparepart gagal dimuat: {spareparts.error instanceof Error ? spareparts.error.message : 'Terjadi kesalahan pada server.'}
              </p>
            )}
            {!spareparts.isLoading && !spareparts.isError && filtered.length === 0 && (
              <p className="panel-message">Belum ada sparepart yang cocok.</p>
            )}
            <DataTable
              columns={columns}
              rows={filtered}
              getRowKey={(item) => item.id}
              ariaLabel="Daftar sparepart"
              onRowClick={openDetail}
            />
          </section>

          <section className={`store-panel add-store-panel mobile-create-panel${createFormOpen ? ' is-open' : ''}`}>
            <div className="mobile-create-heading">
              <h2>Tambah sparepart</h2>
              <button type="button" className="mobile-create-close" onClick={() => setCreateFormOpen(false)} aria-label="Tutup form tambah sparepart">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="store-form">
              <label>
                Nama Sparepart
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Contoh: Oli mesin"
                />
              </label>
              <label>
                Harga (Rp)
                <input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: parseInt(event.target.value) || 0 })}
                  placeholder="0"
                />
              </label>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan sparepart'}
              </Button>
              {formMessage && <p className="form-message" role="status">{formMessage}</p>}
            </form>
          </section>
        </div>
      </section>

      <SparepartDetailPopup
        sparepart={selectedSparepart}
        editing={editing}
        editForm={editForm}
        busy={updateMutation.isPending}
        onClose={() => { setSelectedSparepart(null); setEditing(false) }}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onEditFormChange={setEditForm}
        onSave={saveEdit}
        onDelete={() => { if (selectedSparepart) requestDelete(selectedSparepart) }}
      />

      {/* Mobile FAB */}
      <button
        type="button"
        className={`mobile-create-fab${createFormOpen ? ' is-hidden' : ''}`}
        onClick={() => { setSelectedSparepart(null); setCreateFormOpen(true) }}
        aria-label="Tambah sparepart"
      >
        <Plus size={22} />
      </button>

      {/* Action menu portal */}
      {actionId && actionMenuPosition && createPortal(
        <div
          className="store-actions-menu"
          role="menu"
          style={actionMenuPosition}
          onClick={(event) => event.stopPropagation()}
        >
          {(() => {
            const item = spareparts.data?.find((s) => s.id === actionId)
            if (!item) return null
            return (
              <>
                <button type="button" role="menuitem" onClick={() => openDetail(item)}>
                  <Eye size={15} /> Lihat detail
                </button>
                <button type="button" role="menuitem" onClick={() => openEdit(item)}>
                  <Pencil size={15} /> Edit sparepart
                </button>
                <button type="button" role="menuitem" className="is-danger" onClick={() => requestDelete(item)}>
                  <Trash2 size={15} /> Hapus sparepart
                </button>
              </>
            )
          })()}
        </div>,
        document.body,
      )}

      <EventPopup
        open={popup !== null}
        type={popup?.type ?? 'loading'}
        title={popup?.title ?? ''}
        description={popup?.description}
        onClose={() => { setPopup(null); setPendingDelete(null) }}
        onConfirm={() => {
          if (pendingDelete) {
            setPopup({ type: 'loading', title: 'Menghapus sparepart', description: 'Data sparepart sedang dihapus.' })
            deleteMutation.mutate(pendingDelete.id)
          }
        }}
        confirmLabel="Ya, hapus"
      />
    </main>
  )
}
