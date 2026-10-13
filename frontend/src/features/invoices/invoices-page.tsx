import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Eye, MoreVertical, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { ComboBox } from '../../components/ui/combo-box'
import { DataTable, type DataTableColumn } from '../../components/ui/data-table'
import { DatePicker } from '../../components/ui/date-picker'
import { EventPopup, type EventPopupType } from '../../components/ui/event-popup'
import { Invoice as WordInvoice } from '../../components/Invoice/Invoice'
import sphHeaderPng from '../../components/Invoice/sph-header.png'
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

  const isSph = documentType === 'sph'

  const sections = baps.map((bap) => ({
    judul: bap.title,
    deskripsi: bap.description ?? undefined,
    items: bap.items.map((item) => ({
      service: item.serviceName,
      unit: item.unit,
      hargaSatuan: item.unitPrice,
      subTotal: item.subtotal,
    })),
    total: bap.totalAmount,
  }))

  return (
    <div className="invoice-print has-invoice-component" ref={innerRef}>
      <WordInvoice
        headerSrc={isSph ? sphHeaderPng : undefined}
        noLabel={isSph ? 'NO SPH :' : 'NO INVOICE :'}
        noInvoice={invoice.number}
        tanggal={formatDate(invoice.date)}
        toko={{
          kode: invoice.store.code,
          nama: invoice.store.name,
          milik: invoice.store.ownerCompany ?? '—',
        }}
        sections={sections}
        total={invoice.totalAmount}
        payment={{
          label: 'Silahkan transfer ke rekening:',
          rekening: `${settings?.bankAccount ?? '0548985555'} (${settings?.bankName ?? 'BCA'})`,
          atasNama: `a/n ${settings?.bankAccountName ?? 'BERKARYA SATU TUJUAN CV'}`,
        }}
        signer={{
          salam: 'Hormat Kami,',
          nama: settings?.signerName ?? 'Muhamad Zidan Fauzan',
          jabatan: '(Service Admin)',
          signatureSrc: settings?.signatureDataUrl ?? undefined,
        }}
      />

      {!isSph && (
        <section className="receipt-print" style={{ breakBefore: 'page', pageBreakBefore: 'always', marginTop: '40px', padding: '17mm 16mm' }}>
          <h2 style={{ margin: '0 0 10mm', fontSize: '17pt', letterSpacing: '.08em' }}>KWITANSI</h2>
          <div className="rc">
            <div className="ros bgr" style={{ width: '160px', height: '160px', left: '38%' }}></div>
            <div className="ros bgr" style={{ width: '140px', height: '140px', left: '72%' }}></div>
            <div className="stub">
              <div className="ros a"></div>
              <div className="ros b"></div>
              <div className="ros c"></div>
            </div>
            <div className="main">
              <div className="r r1"><div className="lb">No.</div><div className="val ruled"><span>{invoice.number}</span></div></div>
              <div className="r"><div className="lb">Sudah terima dari</div><div className="val ruled"><span>{invoice.store.ownerCompany ?? '—'}</span></div></div>
              <div className="r r-terb"><div className="lb">Banyaknya uang</div><div className="val"><span style={{ textTransform: 'capitalize' }}>{invoice.amountWords ? invoice.amountWords.toLowerCase() : '—'}</span></div></div>
              <div className="r r-untuk"><div className="lb">Untuk pembayaran</div><div className="val ruled"><span>{invoice.purpose ?? baps[0]?.title ?? '—'}</span></div></div>
              <div className="bottom">
                <div className="jml"><div className="lb">Jumlah Rp.</div><div className="jbox"><span>{invoice.totalAmount ? new Intl.NumberFormat('id-ID').format(invoice.totalAmount) + ',-' : ''}</span></div></div>
                <div className="sign">
                  <div className="nm-sign" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {settings?.signatureDataUrl && (
                      <img src={settings.signatureDataUrl} alt="Tanda tangan admin" style={{ height: '46px', objectFit: 'contain', marginBottom: '-10px', zIndex: 1, position: 'relative' }} />
                    )}
                    <div className="nm" style={{ marginTop: settings?.signatureDataUrl ? '0' : '28px' }}>{settings?.signerName ?? 'Muhamad Zidan Fauzan'}</div>
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
      const { toCanvas, toPng } = await import('html-to-image')

      let receiptImage: string | undefined = undefined
      let invoiceImages: string[] | undefined = undefined

      const invoiceEl = document.querySelector('.invoice-root') as HTMLElement | null
      if (invoiceEl) {
        const canvas = await toCanvas(invoiceEl, { pixelRatio: 2 })
        const a4Ratio = 297 / 210
        const pageHeight = Math.round(canvas.width * a4Ratio)

        if (canvas.height <= pageHeight * 1.05) {
          invoiceImages = [canvas.toDataURL('image/png')]
        } else {
          const pagesCount = Math.ceil(canvas.height / pageHeight)
          invoiceImages = []
          for (let i = 0; i < pagesCount; i++) {
            const pCanvas = document.createElement('canvas')
            pCanvas.width = canvas.width
            pCanvas.height = pageHeight
            const ctx = pCanvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(0, 0, pCanvas.width, pCanvas.height)
              ctx.drawImage(
                canvas,
                0, i * pageHeight, canvas.width, pageHeight,
                0, 0, canvas.width, pageHeight
              )
              invoiceImages.push(pCanvas.toDataURL('image/png'))
            }
          }
        }
      }

      if (printRequest.documentType === 'invoice') {
        const rcElement = document.querySelector('.rc') as HTMLElement | null
        if (rcElement) {
          const oldTransform = rcElement.style.transform
          rcElement.style.transform = 'none'
          receiptImage = await toPng(rcElement, { pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left' } })
          rcElement.style.transform = oldTransform
        }
      }

      const doc = (
        <InvoicePdfDocument
          invoice={printRequest.invoice}
          documentType={printRequest.documentType}
          settings={settings.data}
          receiptImage={receiptImage}
          invoiceImages={invoiceImages}
        />
      )
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
      if (
        error instanceof Error &&
        (error.message.includes('dynamically imported module') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Importing a module script failed'))
      ) {
        setPopup({
          type: 'loading',
          title: 'Memperbarui aplikasi...',
          description: 'Aplikasi baru saja diperbarui. Halaman sedang dimuat ulang.',
        })
        window.setTimeout(() => window.location.reload(), 1200)
        return
      }
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
