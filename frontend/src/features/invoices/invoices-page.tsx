import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Eye, MoreVertical, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { ComboBox } from '../../components/ui/combo-box'
import { DataTable, type DataTableColumn } from '../../components/ui/data-table'
import { DatePicker } from '../../components/ui/date-picker'
import { EventPopup, type EventPopupType } from '../../components/ui/event-popup'
import { getSettings, type WorkspaceSettings } from '../settings/settings-api'
import { getAllStores } from '../stores/stores-api'
import { InvoiceDetailPopup } from './invoice-detail-popup'
import {
  createInvoice,
  deleteInvoice,
  getAvailableBaps,
  getInvoices,
  updateInvoice,
  type Invoice,
  type InvoiceStatus,
  type InvoiceUpdateInput,
} from './invoices-api'

const today = () => new Date().toISOString().slice(0, 10)
const initialForm = { date: today(), storeId: '', purpose: '', amountWords: '' }
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 })
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
const invoiceStatuses: Array<{ value: InvoiceStatus; label: string }> = [
  { value: 'unpaid', label: 'Belum dibayar' },
  { value: 'paid', label: 'Lunas' },
  { value: 'revision', label: 'Perlu Revisi' },
]

function InvoicePrint({
  invoice,
  documentType,
  settings,
  innerRef,
}: {
  invoice: Invoice
  documentType: 'invoice' | 'sph'
  settings?: WorkspaceSettings
  innerRef?: React.RefObject<HTMLDivElement | null>
}) {
  const baps = (invoice.baps.length ? invoice.baps : invoice.bap ? [invoice.bap] : []).filter(
    (bap): bap is NonNullable<typeof bap> => Boolean(bap),
  )

  // Shared border style used everywhere
  const border = '1px solid #111'

  return (
    <div className="invoice-print" ref={innerRef}>
      {/* ── HEADER: logo | judul | alamat perusahaan ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '3mm' }}>
        <tbody>
          <tr>
            {/* Logo */}
            <td style={{ width: '34%', verticalAlign: 'top', textAlign: 'center' }}>
              {settings?.logoDataUrl
                ? <img src={settings.logoDataUrl} alt="Logo" style={{ display: 'block', width: '48mm', height: '24mm', objectFit: 'contain', margin: '0 auto' }} />
                : <strong style={{ color: '#e30613', fontSize: '37pt', fontFamily: 'Arial, sans-serif', letterSpacing: '-7px', lineHeight: '0.8', display: 'block' }}>BST</strong>}
              <span style={{ display: 'block', marginTop: '5px', fontSize: '8pt', fontWeight: 700, whiteSpace: 'nowrap' }}>CV. BERKARYA SATU TUJUAN</span>
            </td>
            {/* Judul */}
            <td style={{ width: '32%', verticalAlign: 'bottom', textAlign: 'center', paddingBottom: '2mm' }}>
              <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '21pt', fontWeight: 700, textDecoration: 'underline' }}>
                {documentType === 'sph' ? 'SPH' : 'INVOICE'}
              </span>
            </td>
            {/* Alamat perusahaan */}
            <td style={{ width: '34%', verticalAlign: 'top', fontSize: '8pt', lineHeight: '1.3' }}>
              <strong style={{ display: 'block', fontSize: '9.5pt' }}>CV. BERKARYA SATU TUJUAN</strong>
              <span style={{ display: 'block', marginTop: '5px' }}>
                Kp. Cilamajang, RT/RW. 004/006, Kel. Cipawitra,<br />
                Kec. Mangkubumi, Kota Tasikmalaya, 46181
              </span>
              <span style={{ display: 'block', marginTop: '5px' }}>No Telp. 081214245300</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── META: Bill To | No Invoice / Tanggal ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '3mm' }}>
        <tbody>
          <tr>
            {/* Bill To */}
            <td style={{ width: '49%', height: '32mm', border, verticalAlign: 'top', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px', textAlign: 'center', borderBottom: border, fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>BILL TO</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '7px', fontWeight: 700, minHeight: '13mm', display: 'block' }}>{invoice.store.ownerCompany ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '7px', borderTop: border }}>
                      TOKO : {invoice.store.name}<br />
                      KODE : {invoice.store.code}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            {/* Spacer */}
            <td style={{ width: '2%' }} />
            {/* No Invoice / Tanggal */}
            <td style={{ width: '49%', height: '32mm', border, verticalAlign: 'top', padding: 0 }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  <tr style={{ height: '100%' }}>
                    <td style={{ width: '50%', padding: '7px', verticalAlign: 'top', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
                      {documentType === 'sph' ? 'NO SPH' : 'NO INVOICE'}<br />
                      {invoice.number}
                    </td>
                    <td style={{ width: '50%', padding: '7px', verticalAlign: 'top', borderLeft: border }}>
                      TANGGAL :<br />
                      {formatDate(invoice.date)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="invoice-section-title">DETAIL PESANAN</h2>

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

      {/* ── GRAND TOTAL ── */}
      <div className="invoice-grand-total">
        <strong>TOTAL KESELURUHAN :</strong>
        <strong>{currency.format(invoice.totalAmount)}</strong>
      </div>

      {/* ── FOOTER: Note + Tanda Tangan ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '18mm', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', lineHeight: '1.45' }}>
              <strong><u>Note :</u></strong>
              <p style={{ margin: '14px 0 12px' }}>Silahkan transfer ke rekening:</p>
              <strong>
                {settings?.bankAccount ?? '0548985555'} ({settings?.bankName ?? 'BCA'})<br />
                a/n {settings?.bankAccountName ?? 'BERKARYA SATU TUJUAN CV'}
              </strong>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'center', width: '48mm', lineHeight: '1.45' }}>
              <p style={{ margin: '0 0 2mm' }}>Hormat Kami,</p>
              <div style={{ display: 'block', textAlign: 'center' }}>
                {settings?.signatureDataUrl && (
                  <img src={settings.signatureDataUrl} alt="Tanda tangan admin" style={{ display: 'block', width: '35mm', height: '18mm', objectFit: 'contain', margin: '0 auto' }} />
                )}
                <strong style={{ display: 'block' }}>{settings?.signerName ?? 'Muhamad Zidan Fauzan'}</strong>
              </div>
              <span style={{ fontSize: '10pt' }}>(Service Admin)</span>
            </td>
          </tr>
        </tbody>
      </table>

      {documentType === 'invoice' && (
        <section className="receipt-print" style={{ pageBreakBefore: 'always', marginTop: '40px' }}>
          <h2 style={{ margin: '0 0 10mm', fontSize: '17pt', letterSpacing: '.08em' }}>KWITANSI</h2>
          <div className="rc" style={{ transform: 'scale(0.95)', transformOrigin: 'top left' }}>
            <div className="ros bgr" style={{ width: '190px', height: '190px', left: '36%' }}></div>
            <div className="ros bgr" style={{ width: '170px', height: '170px', left: '72%' }}></div>
            <div className="stub"><div className="ros a"></div><div className="ros b"></div><div className="ros c"></div></div>
            <div className="main">
              <div className="r r1"><div className="lb">No.</div><div className="val ruled"><span>{invoice.number}</span></div></div>
              <div className="r"><div className="lb">Sudah terima dari</div><div className="val ruled"><span>{invoice.store.ownerCompany ?? '—'}</span></div></div>
              <div className="r r-terb"><div className="lb">Banyaknya uang</div><div className="val"><span style={{ textTransform: 'capitalize' }}>{invoice.amountWords ? (invoice.amountWords.toLowerCase() + ' rupiah') : '—'}</span></div></div>
              <div className="r r-untuk"><div className="lb">Untuk pembayaran</div><div className="val ruled"><span>{invoice.purpose ?? baps[0]?.title ?? '—'}</span></div></div>
              <div className="bottom">
                <div className="jml"><div className="lb">Jumlah Rp.</div><div className="jbox"><span>{invoice.totalAmount ? new Intl.NumberFormat('id-ID').format(invoice.totalAmount) + ',-' : ''}</span></div></div>
                <div className="sign">
                  <div>Tasikmalaya, {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(invoice.createdAt))}</div>
                  <div className="materai">METERAI<br/>TEMPEL</div>
                  <div className="nm-sign" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-4px' }}>
                    {settings?.signatureDataUrl && (
                      <img src={settings.signatureDataUrl} alt="Tanda tangan admin" style={{ height: '50px', objectFit: 'contain', marginBottom: '-12px', zIndex: 1, position: 'relative' }} />
                    )}
                    <div className="nm" style={{ marginTop: settings?.signatureDataUrl ? '0' : '30px' }}>{settings?.signerName ?? 'Muhamad Zidan Fauzan'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}


export function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [form, setForm] = useState(initialForm)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [selectedBapIds, setSelectedBapIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState(false)
  const [statusMenuInvoiceId, setStatusMenuInvoiceId] = useState<string | null>(null)
  const [statusMenuPosition, setStatusMenuPosition] = useState<CSSProperties | null>(null)
  const [actionInvoiceId, setActionInvoiceId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<CSSProperties | null>(null)
  const [pendingDeleteInvoice, setPendingDeleteInvoice] = useState<Invoice | null>(null)
  const [popup, setPopup] = useState<{ type: EventPopupType; title: string; description?: string } | null>(null)
  const [printRequest, setPrintRequest] = useState<{ invoice: Invoice; documentType: 'invoice' | 'sph' } | null>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const printDocumentRef = useRef<HTMLDivElement>(null)
  const statusMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const queryClient = useQueryClient()
  const settings = useQuery({ queryKey: ['workspace-settings'], queryFn: getSettings })
  const invoices = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: () => getInvoices(search, statusFilter || undefined),
  })
  const stores = useQuery({ queryKey: ['stores', 'invoice-options'], queryFn: getAllStores })
  const availableBaps = useQuery({
    queryKey: ['invoice-baps', form.date, form.storeId],
    queryFn: () => getAvailableBaps(form.date, form.storeId),
    enabled: Boolean(form.date && form.storeId),
  })

  const downloadPdf = useCallback(async () => {
    if (!printRequest) return
    setIsDownloadingPdf(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { InvoicePdfDocument } = await import('./invoice-pdf-document')

      const doc = <InvoicePdfDocument invoice={printRequest.invoice} documentType={printRequest.documentType} settings={settings.data} />
      const blob = await pdf(doc).toBlob()

      const prefix = printRequest.documentType === 'sph' ? 'SPH' : 'Tagihan Invoice'
      const safeNum = printRequest.invoice.number.replace(/[<>:"/\\|?*]/g, '-')

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${prefix} ${safeNum}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setPopup({
        type: 'error',
        title: 'Gagal mengunduh PDF',
        description: error instanceof Error ? error.message : 'PDF tidak dapat dibuat.',
      })
    } finally {
      setIsDownloadingPdf(false)
    }
  }, [printRequest, settings.data])


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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) => updateInvoice(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
    onError: (error) =>
      setPopup({
        type: 'error',
        title: 'Gagal memperbarui status',
        description: error instanceof Error ? error.message : 'Silakan coba lagi.',
      }),
  })

  useEffect(() => {
    if (!statusMenuInvoiceId) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (statusMenuTriggerRef.current?.contains(target) || statusMenuRef.current?.contains(target)) return
      setStatusMenuInvoiceId(null)
      setStatusMenuPosition(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setStatusMenuInvoiceId(null)
      setStatusMenuPosition(null)
      statusMenuTriggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [statusMenuInvoiceId])

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
  const storeOptions = useMemo(
    () => stores.data?.map((store) => ({ value: store.id, label: store.name, description: `${store.code} · ${store.storeType}` })) ?? [],
    [stores.data],
  )

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
      key: 'status',
      header: 'Status invoice',
      render: (invoice) => (
        <div className="invoice-status-picker">
          <button
            ref={(element) => {
              if (statusMenuInvoiceId === invoice.id) statusMenuTriggerRef.current = element
            }}
            type="button"
            className={`invoice-status-badge is-${invoice.status}`}
            aria-label={`Status invoice ${invoice.number}: ${invoiceStatuses.find((option) => option.value === invoice.status)?.label ?? 'Belum dibayar'}`}
            aria-haspopup="menu"
            aria-expanded={statusMenuInvoiceId === invoice.id}
            disabled={statusMutation.isPending}
            onClick={(event) => {
              event.stopPropagation()
              if (statusMenuInvoiceId === invoice.id) {
                setStatusMenuInvoiceId(null)
                setStatusMenuPosition(null)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              const menuHeight = 150
              setStatusMenuInvoiceId(invoice.id)
              setStatusMenuPosition({
                top: rect.bottom + menuHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 6) : rect.bottom + 6,
                left: Math.max(8, Math.min(window.innerWidth - 190, rect.left)),
              })
            }}
          >
            <span className="invoice-status-dot" />
            {invoiceStatuses.find((option) => option.value === invoice.status)?.label ?? 'Belum dibayar'}
            <ChevronDown size={13} aria-hidden="true" />
          </button>
        </div>
      ),
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
              const menuHeight = 268
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
              <div className="invoice-list-filters">
                <input
                  aria-label="Cari invoice"
                  placeholder="Cari nomor atau toko..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select
                  aria-label="Filter status invoice"
                  value={statusFilter}
                  onChange={(event) => {
                    const status = invoiceStatuses.find((option) => option.value === event.target.value)?.value
                    setStatusFilter(status ?? '')
                  }}
                >
                  <option value="">Semua status</option>
                  {invoiceStatuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
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

          {statusMenuInvoiceId && statusMenuPosition && createPortal(
            <div
              ref={statusMenuRef}
              className="invoice-status-popover"
              style={statusMenuPosition}
              role="menu"
              aria-label={`Pilih status ${invoices.data?.items.find((item) => item.id === statusMenuInvoiceId)?.number ?? 'invoice'}`}
            >
              <span className="invoice-status-popover-title">Ubah status</span>
              {invoiceStatuses.map((status) => {
                const invoice = invoices.data?.items.find((item) => item.id === statusMenuInvoiceId)
                return (
                  <button
                    key={status.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={invoice?.status === status.value}
                    className={`invoice-status-option is-${status.value}`}
                    onClick={() => {
                      setStatusMenuInvoiceId(null)
                      setStatusMenuPosition(null)
                      if (invoice && invoice.status !== status.value) {
                        statusMutation.mutate({ id: invoice.id, status: status.value })
                      }
                    }}
                  >
                    <span className="invoice-status-dot" />
                    <span>{status.label}</span>
                    {invoice?.status === status.value && <Check size={14} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>,
            document.body,
          )}

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
                        <Printer size={15} /> Cetak / Download PDF Invoice
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
                        <Printer size={15} /> Cetak / Download PDF SPH
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
                {!!availableBaps.data?.length && (
                  <div className="available-baps-table-wrap">
                    <table className="available-baps-table">
                      <thead>
                        <tr>
                          <th scope="col">Nomor BAP &amp; uraian</th>
                          <th scope="col">Total</th>
                          <th scope="col">Pilih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableBaps.data.map((bap) => (
                          <tr key={bap.id}>
                            <td>
                              <strong>{bap.number}</strong>
                              <span>{bap.title}</span>
                            </td>
                            <td>{currency.format(bap.totalAmount)}</td>
                            <td>
                              <input
                                type="checkbox"
                                aria-label={`Pilih BAP ${bap.number}`}
                                checked={selectedBapIds.includes(bap.id)}
                                onChange={(event) =>
                                  setSelectedBapIds(
                                    event.target.checked
                                      ? [...selectedBapIds, bap.id]
                                      : selectedBapIds.filter((id) => id !== bap.id),
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
            <Button type="button" onClick={downloadPdf} disabled={isDownloadingPdf} className="invoice-download-button">
              <Printer size={16} />
              {isDownloadingPdf ? 'Menyiapkan PDF...' : 'Download PDF'}
            </Button>
            <button type="button" onClick={() => setPrintRequest(null)}>
              Tutup
            </button>
          </div>
          <InvoicePrint
            invoice={printRequest.invoice}
            documentType={printRequest.documentType}
            settings={settings.data}
            innerRef={printDocumentRef}
          />
        </div>,
        document.body,
      )
        : null}
    </main>
  )
}
