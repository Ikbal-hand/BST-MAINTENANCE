import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, MoreVertical, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { ComboBox } from '../../components/ui/combo-box'
import { DataTable, type DataTableColumn } from '../../components/ui/data-table'
import { DatePicker } from '../../components/ui/date-picker'
import { EventPopup, type EventPopupType } from '../../components/ui/event-popup'
import { getSettings, type WorkspaceSettings } from '../settings/settings-api'
import { getStores } from '../stores/stores-api'
import { InvoiceDetailPopup } from './invoice-detail-popup'
import receiptBackground from '../../../../image/background kuetansi.png'
import {
  createInvoice,
  deleteInvoice,
  getAvailableBaps,
  getInvoices,
  updateInvoice,
  type Invoice,
  type InvoiceUpdateInput,
} from './invoices-api'

const today = () => new Date().toISOString().slice(0, 10)
const initialForm = { date: today(), storeId: '', purpose: '', amountWords: '' }
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 })
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

function InvoicePrint({
  invoice,
  documentType,
  settings,
}: {
  invoice: Invoice
  documentType: 'invoice' | 'sph'
  settings?: WorkspaceSettings
}) {
  const baps = (invoice.baps.length ? invoice.baps : invoice.bap ? [invoice.bap] : []).filter(
    (bap): bap is NonNullable<typeof bap> => Boolean(bap),
  )
  return (
    <div className="invoice-print">
      <header className="invoice-print-header">
        <div className="invoice-logo">
          {settings?.logoDataUrl ? <img src={settings.logoDataUrl} alt="Logo aplikasi" /> : <strong>BST</strong>}
          <span>CV. BERKARYA SATU TUJUAN</span>
        </div>
        <h1>{documentType === 'sph' ? 'SPH' : 'INVOICE'}</h1>
        <div className="invoice-company">
          <strong>CV. BERKARYA SATU TUJUAN</strong>
          <span>
            Kp. Cilamajang, RT/RW. 004/006, Kel. Cipawitra,
            <br />
            Kec. Mangkubumi, Kota Tasikmalaya, 46181
          </span>
          <span>No Telp. 081214245300</span>
        </div>
      </header>
      <div className="invoice-meta">
        <div className="invoice-bill-to">
          <strong>BILL TO</strong>
          <b>{invoice.store.ownerCompany ?? '—'}</b>
          <span>
            TOKO : {invoice.store.name}
            <br />
            KODE : {invoice.store.code}
          </span>
        </div>
        <div className="invoice-number">
          <strong>
            NO INVOICE
            <br />
            {invoice.number}
          </strong>
          <span>
            TANGGAL :
            <br />
            {formatDate(invoice.date)}
          </span>
        </div>
      </div>
      <h2>DETAIL PESANAN</h2>
      {baps.map((bap) => (
        <table className="invoice-table" key={bap.id}>
          <thead>
            <tr>
              <th>
                {bap.title}
                {bap.description ? ` ${bap.description}` : ''}
              </th>
              <th>UNIT</th>
              <th>HARGA SATUAN</th>
              <th>SUB TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {bap.items.map((item) => (
              <tr key={item.id ?? item.sortOrder}>
                <td>{item.serviceName}</td>
                <td>{item.unit}</td>
                <td>{currency.format(item.unitPrice)}</td>
                <td>{currency.format(item.subtotal)}</td>
              </tr>
            ))}
            <tr className="invoice-subtotal">
              <td colSpan={3}>TOTAL</td>
              <td>{currency.format(bap.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      ))}
      <div className="invoice-grand-total">
        <strong>TOTAL KESELURUHAN :</strong>
        <strong>{currency.format(invoice.totalAmount)}</strong>
      </div>
      <footer className="invoice-print-footer">
        <div>
          <strong>
            <u>Note :</u>
          </strong>
          <p>Silahkan transfer ke rekening:</p>
          <strong>
            {settings?.bankAccount ?? '0548985555'} ({settings?.bankName ?? 'BCA'})
            <br />
            a/n {settings?.bankAccountName ?? 'BERKARYA SATU TUJUAN CV'}
          </strong>
        </div>
        <div className="invoice-signature">
          <p>Hormat Kami,</p>
          <div className="invoice-signature-mark">
            {settings?.signatureDataUrl && <img src={settings.signatureDataUrl} alt="Tanda tangan admin" />}
            <strong>{settings?.signerName ?? 'Muhamad Zidan Fauzan'}</strong>
          </div>
          <span>(Service Admin)</span>
        </div>
      </footer>
      {documentType === 'invoice' && (
        <section className="receipt-print">
          <h2>KWITANSI</h2>
          <div className="receipt-ticket">
            <img className="receipt-ticket-background" src={receiptBackground} alt="" />
            <p className="receipt-field receipt-number">
              <span className="receipt-sr-only">Nomor kuitansi: </span>
              {invoice.number}
            </p>
            <p className="receipt-field receipt-recipient">
              <span className="receipt-sr-only">Telah diterima dari: </span>
              {invoice.store.ownerCompany ?? '—'}
            </p>
            <p className="receipt-field receipt-amount-words">
              <span className="receipt-sr-only">Uang sejumlah: </span>
              {invoice.amountWords ?? '—'}
            </p>
            <p className="receipt-field receipt-purpose">
              <span className="receipt-sr-only">Untuk pembayaran: </span>
              {invoice.purpose ?? baps[0]?.title ?? '—'}
            </p>
            <p className="receipt-cash">
              <span className="receipt-sr-only">Jumlah: </span>
              {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(invoice.totalAmount)}
            </p>
            <div className="receipt-signature-block">
              {settings?.signatureDataUrl && (
                <img className="receipt-signature" src={settings.signatureDataUrl} alt="Tanda tangan admin" />
              )}
              <p className="receipt-signer">{settings?.signerName ?? 'Muhamad Zidan Fauzan'}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(initialForm)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [selectedBapIds, setSelectedBapIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState(false)
  const [actionInvoiceId, setActionInvoiceId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<CSSProperties | null>(null)
  const [pendingDeleteInvoice, setPendingDeleteInvoice] = useState<Invoice | null>(null)
  const [popup, setPopup] = useState<{ type: EventPopupType; title: string; description?: string } | null>(null)
  const [printRequest, setPrintRequest] = useState<{ invoice: Invoice; documentType: 'invoice' | 'sph' } | null>(null)

  const queryClient = useQueryClient()
  const settings = useQuery({ queryKey: ['workspace-settings'], queryFn: getSettings })
  const invoices = useQuery({ queryKey: ['invoices', search], queryFn: () => getInvoices(search) })
  const stores = useQuery({ queryKey: ['stores', 'invoice-options'], queryFn: () => getStores('') })
  const availableBaps = useQuery({
    queryKey: ['invoice-baps', form.date, form.storeId],
    queryFn: () => getAvailableBaps(form.date, form.storeId),
    enabled: Boolean(form.date && form.storeId),
  })

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (invoice) => {
      setForm({ ...initialForm, date: today() })
      setSelectedBapIds([])
      setCreateFormOpen(false)
      setMessage('Invoice berhasil dibuat.')
      setPrintRequest({ invoice, documentType: 'invoice' })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Invoice gagal dibuat.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: InvoiceUpdateInput }) => updateInvoice(id, input),
    onSuccess: (invoice) => {
      setSelectedInvoice(invoice)
      setEditing(false)
      setPopup({ type: 'success', title: 'Perubahan disimpan', description: 'Data invoice berhasil diperbarui.' })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error) =>
      setPopup({
        type: 'error',
        title: 'Gagal memperbarui invoice',
        description: error instanceof Error ? error.message : 'Silakan coba lagi.',
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      setSelectedInvoice(null)
      setEditing(false)
      setPendingDeleteInvoice(null)
      setPopup({ type: 'success', title: 'Invoice dihapus', description: 'Data invoice berhasil dihapus.' })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error) =>
      setPopup({
        type: 'error',
        title: 'Gagal menghapus invoice',
        description: error instanceof Error ? error.message : 'Silakan coba lagi.',
      }),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    createMutation.mutate({ ...form, bapIds: selectedBapIds })
  }

  function requestDelete(invoice: Invoice) {
    setSelectedInvoice(null)
    setEditing(false)
    setActionInvoiceId(null)
    setActionMenuPosition(null)
    setPendingDeleteInvoice(invoice)
    setPopup({
      type: 'confirm',
      title: 'Hapus invoice ini?',
      description: `${invoice.number} akan dihapus dari workspace.`,
    })
  }

  const selectedBaps = availableBaps.data?.filter((bap) => selectedBapIds.includes(bap.id)) ?? []
  const total = selectedBaps.reduce((sum, bap) => sum + bap.totalAmount, 0)
  const storeOptions = stores.data?.items.map((store) => ({ value: store.id, label: store.name, description: `${store.code} · ${store.storeType}` })) ?? []

  const invoiceColumns: DataTableColumn<Invoice>[] = [
    {
      key: 'number',
      header: 'Nomor invoice',
      render: (invoice) => (
        <>
          <strong>{invoice.number}</strong>
          <small>{invoice.baps.length || (invoice.bap ? 1 : 0)} BAP</small>
        </>
      ),
    },
    {
      key: 'store',
      header: 'Toko',
      render: (invoice) => (
        <>
          <strong>{invoice.store.name}</strong>
          <small>{invoice.store.code}</small>
        </>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (invoice) => formatDate(invoice.date),
    },
    {
      key: 'total',
      header: 'Total',
      render: (invoice) => currency.format(invoice.totalAmount),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (invoice) => (
        <div className="store-row-actions">
          <button
            type="button"
            className="store-actions-trigger"
            aria-label={`Buka aksi ${invoice.number}`}
            aria-haspopup="menu"
            aria-expanded={actionInvoiceId === invoice.id}
            onClick={(event) => {
              event.stopPropagation()
              if (actionInvoiceId === invoice.id) {
                setActionInvoiceId(null)
                setActionMenuPosition(null)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              const menuHeight = 198
              setActionInvoiceId(invoice.id)
              setActionMenuPosition({
                top: rect.bottom + 4 > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4,
                left: Math.max(8, Math.min(window.innerWidth - 188, rect.right - 180)),
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
          <div>
            <p className="eyebrow">
              <span /> TRANSAKSI
            </p>
            <h1>Invoice</h1>
            <p>Pilih tanggal dan toko untuk menggabungkan BAP menjadi invoice.</p>
          </div>
          <span className="store-count">{invoices.data?.pagination.total ?? 0} invoice</span>
        </div>
        <div className="stores-layout invoice-layout">
          <section className="store-panel">
            <div className="panel-heading">
              <h2>Daftar invoice</h2>
              <input
                aria-label="Cari invoice"
                placeholder="Cari nomor atau toko..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {invoices.isLoading && <p className="panel-message">Memuat invoice...</p>}
            {invoices.isError && (
              <p className="panel-message error">
                Invoice gagal dimuat: {invoices.error instanceof Error ? invoices.error.message : 'Terjadi kesalahan pada server.'}
              </p>
            )}
            {!invoices.isLoading && !invoices.isError && invoices.data?.items.length === 0 && (
              <p className="panel-message">Belum ada invoice.</p>
            )}
            {!invoices.isLoading && !invoices.isError && invoices.data && invoices.data.items.length > 0 && (
              <DataTable
                columns={invoiceColumns}
                rows={invoices.data.items}
                getRowKey={(invoice) => invoice.id}
                className="invoice-table-list"
                ariaLabel="Daftar invoice"
                onRowClick={(invoice) => {
                  setSelectedInvoice(invoice)
                  setEditing(false)
                  setActionInvoiceId(null)
                  setActionMenuPosition(null)
                }}
              />
            )}
          </section>

          {actionInvoiceId &&
            actionMenuPosition &&
            createPortal(
              <div className="store-actions-menu" role="menu" style={actionMenuPosition}>
                {(() => {
                  const invoice = invoices.data?.items.find((item) => item.id === actionInvoiceId)
                  if (!invoice) return null
                  return (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setEditing(false)
                          setActionInvoiceId(null)
                          setActionMenuPosition(null)
                        }}
                      >
                        <Eye size={15} /> Lihat detail
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setEditing(true)
                          setActionInvoiceId(null)
                          setActionMenuPosition(null)
                        }}
                      >
                        <Pencil size={15} /> Edit invoice
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setPrintRequest({ invoice, documentType: 'invoice' })
                          setActionInvoiceId(null)
                          setActionMenuPosition(null)
                        }}
                      >
                        <Printer size={15} /> Cetak invoice
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setPrintRequest({ invoice, documentType: 'sph' })
                          setActionInvoiceId(null)
                          setActionMenuPosition(null)
                        }}
                      >
                        <Printer size={15} /> Cetak SPH
                      </button>
                      <button type="button" role="menuitem" className="is-danger" onClick={() => requestDelete(invoice)}>
                        <Trash2 size={15} /> Hapus invoice
                      </button>
                    </>
                  )
                })()}
              </div>,
              document.body,
            )}

          <InvoiceDetailPopup
            key={selectedInvoice?.id ?? 'empty'}
            invoice={selectedInvoice}
            editing={editing}
            busy={updateMutation.isPending}
            onClose={() => {
              setSelectedInvoice(null)
              setEditing(false)
            }}
            onEdit={() => setEditing(true)}
            onSave={(input) => {
              if (!selectedInvoice) return
              setPopup({ type: 'loading', title: 'Menyimpan perubahan', description: 'Data invoice sedang diperbarui.' })
              updateMutation.mutate({ id: selectedInvoice.id, input })
            }}
            onDelete={() => selectedInvoice && requestDelete(selectedInvoice)}
          />

          <EventPopup
            open={popup !== null}
            type={popup?.type ?? 'loading'}
            title={popup?.title ?? ''}
            description={popup?.description}
            onClose={() => {
              setPopup(null)
              setPendingDeleteInvoice(null)
            }}
            onConfirm={() => {
              if (!pendingDeleteInvoice) return
              setPopup({ type: 'loading', title: 'Menghapus invoice', description: 'Data invoice sedang dihapus.' })
              deleteMutation.mutate(pendingDeleteInvoice.id)
            }}
            confirmLabel="Ya, hapus"
          />

          <section className={`store-panel add-store-panel mobile-create-panel${createFormOpen ? ' is-open' : ''}`}>
            <div className="mobile-create-heading"><h2>Buat invoice</h2><button type="button" className="mobile-create-close" onClick={() => setCreateFormOpen(false)} aria-label="Tutup form buat invoice"><X size={18} /></button></div>
            <form onSubmit={submit} className="store-form">
              <div className="bap-form-grid">
                <label>
                  Tanggal
                  <DatePicker
                    value={form.date}
                    onChange={(date) => {
                      setForm({ ...form, date })
                      setSelectedBapIds([])
                    }}
                    ariaLabel="Tanggal invoice"
                  />
                </label>
                <label>
                  Toko
                  <ComboBox
                    value={form.storeId}
                    options={storeOptions}
                    onChange={(storeId) => {
                      setForm({ ...form, storeId })
                      setSelectedBapIds([])
                    }}
                    placeholder="Pilih toko"
                    searchPlaceholder="Cari kode atau nama toko..."
                    ariaLabel="Pilih toko untuk invoice"
                    disabled={stores.isLoading}
                  />
                </label>
              </div>
              <div className="available-baps">
                <strong>BAP pada tanggal tersebut</strong>
                {availableBaps.isLoading && <p className="panel-message">Memuat BAP...</p>}
                {availableBaps.data?.length === 0 && (
                  <p className="panel-message">Tidak ada BAP pada tanggal dan toko ini.</p>
                )}
                {availableBaps.data?.map((bap) => (
                  <label className="bap-choice" key={bap.id}>
                    <input
                      type="checkbox"
                      checked={selectedBapIds.includes(bap.id)}
                      onChange={(event) =>
                        setSelectedBapIds(
                          event.target.checked
                            ? [...selectedBapIds, bap.id]
                            : selectedBapIds.filter((id) => id !== bap.id),
                        )
                      }
                    />
                    <span>
                      <b>{bap.number}</b> · {bap.title}
                      <small>{currency.format(bap.totalAmount)}</small>
                    </span>
                  </label>
                ))}
              </div>
              <label>
                Untuk pembayaran
                <input
                  required
                  value={form.purpose}
                  onChange={(event) => setForm({ ...form, purpose: event.target.value })}
                  placeholder="Contoh: Perbaikan water boiler"
                />
              </label>
              <label>
                Terbilang
                <input
                  value={form.amountWords}
                  onChange={(event) => setForm({ ...form, amountWords: event.target.value })}
                  placeholder="Opsional"
                />
              </label>
              <div className="bap-total">
                Total <strong>{currency.format(total)}</strong>
              </div>
              <Button type="submit" disabled={createMutation.isPending || selectedBapIds.length === 0}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan invoice'}
              </Button>
              {message && <p className={`form-message${createMutation.isError ? ' error' : ''}`}>{message}</p>}
            </form>
          </section>
        </div>
      </section>
      <button type="button" className={`mobile-create-fab${createFormOpen ? ' is-hidden' : ''}`} onClick={() => setCreateFormOpen(true)} aria-label="Buat invoice"><Plus size={22} /></button>
      {printRequest
        ? createPortal(
        <div className="invoice-preview-backdrop">
          <div className="invoice-preview-actions">
            <Button type="button" onClick={() => window.print()}>
              <Printer size={16} /> Cetak {printRequest.documentType === 'sph' ? 'SPH' : 'Invoice'}
            </Button>
            <button type="button" onClick={() => setPrintRequest(null)}>
              Tutup
            </button>
          </div>
          <InvoicePrint
            invoice={printRequest.invoice}
            documentType={printRequest.documentType}
            settings={settings.data}
          />
        </div>,
        document.body,
      )
        : null}
    </main>
  )
}
