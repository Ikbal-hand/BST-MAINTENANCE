import { useQuery } from '@tanstack/react-query'
import { BarChart3, Download, FileCheck2, FileSpreadsheet, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { getRecapSummary } from './recaps-api'
import { getSettings } from '../settings/settings-api'
import defaultCompanyLogo from '../../../../image/logo_perusahaan.png'

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
const monthStart = () => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

export function RecapsPage() {
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [storeType, setStoreType] = useState('')
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [exportError, setExportError] = useState('')
  const settings = useQuery({ queryKey: ['workspace-settings'], queryFn: getSettings })
  const recap = useQuery({
    queryKey: ['recap-summary', from, to, storeType],
    queryFn: () => getRecapSummary(from, to, storeType),
    enabled: Boolean(from && to && from <= to),
  })
  const data = recap.data
  const summary = data?.summary
  async function exportPdf() {
    if (!data) return
    setExporting('pdf')
    setExportError('')
    try {
      const [{ pdf }, { RecapPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./recap-pdf-document'),
      ])
      const blob = await pdf(RecapPdfDocument({ data, logo: settings.data?.logoDataUrl ?? defaultCompanyLogo })).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rekap-invoice-${data.period.from}-${data.period.to}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Gagal membuat PDF rekap.')
    } finally {
      setExporting(null)
    }
  }

  async function exportExcel() {
    if (!data) return
    setExporting('excel')
    setExportError('')
    try {
      const { downloadRecapExcel } = await import('./recap-excel-export')
      downloadRecapExcel(data, settings.data)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Gagal membuat file Excel rekap.')
    } finally {
      setExporting(null)
    }
  }

  return <main className="dashboard-page recap-page"><section className="stores-content recap-content">
    <div className="stores-heading"><div><p className="eyebrow"><span /> LAPORAN</p><h1>Rekap invoice</h1><p>Daftar invoice berdasarkan rentang tanggal dan tipe toko.</p></div><div className="recap-heading-actions"><span className="store-count">{recap.data?.summary.invoiceCount ?? 0} invoice</span><button className="recap-export-button" type="button" disabled={!data || recap.isLoading || exporting !== null} onClick={exportPdf}><Download size={15} /> {exporting === 'pdf' ? 'Membuat PDF...' : 'Ekspor PDF'}</button><button className="recap-export-button is-secondary" type="button" disabled={!data || recap.isLoading || exporting !== null} onClick={exportExcel}><FileSpreadsheet size={15} /> {exporting === 'excel' ? 'Membuat Excel...' : 'Ekspor Excel'}</button></div></div>
    <section className="store-panel recap-filter"><div className="recap-filter-grid">
      <label>Dari tanggal<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
      <label>Sampai tanggal<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      <label>Tipe toko<select value={storeType} onChange={(event) => setStoreType(event.target.value)}><option value="">Semua tipe</option><option value="REG">REG</option><option value="FRC">FRC</option></select></label>
    </div>
    {from > to && <p className="panel-message error">Tanggal awal tidak boleh setelah tanggal akhir.</p>}
    </section>
    {exportError && <p className="panel-message error" role="alert">Ekspor gagal: {exportError}</p>}
    {recap.isLoading && <p className="panel-message">Memuat rekap...</p>}
    {recap.isError && <p className="panel-message error">Rekap gagal dimuat: {recap.error instanceof Error ? recap.error.message : 'Terjadi kesalahan pada server.'}</p>}
    {data && summary && <><div className="recap-cards">
      <article className="recap-card"><span><FileCheck2 size={17} /></span><small>Total invoice</small><strong>{summary.invoiceCount}</strong><em>{currency.format(summary.invoiceTotal)}</em></article>
      <article className="recap-card"><span><WalletCards size={17} /></span><small>Nilai invoice</small><strong>{currency.format(summary.invoiceTotal)}</strong><em>Periode terpilih</em></article>
      <article className="recap-card"><span><BarChart3 size={17} /></span><small>Toko terlibat</small><strong>{data.stores.length}</strong><em>{storeType || 'REG + FRC'}</em></article>
    </div>
    <section className="store-panel recap-table-panel"><div className="panel-heading"><h2>Daftar invoice</h2><small>{formatDate(data.period.from)} – {formatDate(data.period.to)}</small></div>
      {data.invoices.length === 0 ? <p className="panel-message">Belum ada invoice pada filter ini.</p> : <div className="recap-table-wrap"><table className="recap-table"><thead><tr><th>Tanggal</th><th>No invoice</th><th>Toko</th><th>Tipe</th><th>Total</th></tr></thead><tbody>{data.invoices.map((invoice) => <tr key={invoice.id}><td>{formatDate(invoice.date.slice(0, 10))}</td><td><strong>{invoice.number}</strong></td><td><strong>{invoice.store.name}</strong><small>{invoice.store.code}</small></td><td>{invoice.store.storeType}</td><td>{currency.format(invoice.totalAmount)}</td></tr>)}</tbody></table></div>}
    </section></>}
    {!recap.isLoading && !recap.isError && !summary && <div className="store-panel recap-empty"><BarChart3 size={24} /><p>Pilih periode untuk melihat rekap transaksi.</p></div>}
  </section>
  </main>
}
