import { useQuery } from '@tanstack/react-query'
import { BarChart3, Check, FileCheck2, Printer, WalletCards } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useState } from 'react'
import { getRecapSummary, type RecapSummary } from './recaps-api'
import { getSettings } from '../settings/settings-api'
import defaultCompanyLogo from '../../../../image/logo_perusahaan.png'

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
const monthStart = () => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

function RecapPrintSheet({ data, logo }: { data: RecapSummary; logo: string }) {
  const storeTypes = new Map(data.invoices.map((invoice) => [invoice.store.id, invoice.store.storeType]))

  return (
    <section className="recap-print-sheet" aria-hidden="true">
      <header className="recap-print-header">
        <div className="recap-print-contact">
          <p>
            Perum Marga Mulya Indah
            <br />
            Desa Cikunir Kec. Singaparna,
            <br />
            Tasikmalaya
          </p>
          <p>
            Email: <span>cvbstteknik@gmail.com</span>
            <br />
            Telp: 081214245300 / 081224642959
            <br />
            No./Tgl: <i />
          </p>
        </div>
        <img className="recap-print-logo" src={logo} alt="Logo CV. BST" />
        <table className="recap-handover-table">
          <thead>
            <tr>
              <th>Diserahkan</th>
              <th>Diterima</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}><strong>CV. BST</strong></td>
            </tr>
            <tr>
              <td>Bpk/Ibu................</td>
              <td>Bpk/Ibu................</td>
            </tr>
          </tbody>
        </table>
      </header>
      <h1>TANDA SERAH TERIMA</h1>
      <div className="recap-print-types">
        <strong><Check size={14} /> Jenis</strong>
        <span><i /> Dokumen</span>
        <span><i /> Tagihan</span>
        <span><i /> Giro/cek</span>
        <span><i /> Lain-Lain</span>
      </div>
      <div className="recap-print-fields">
        {['Sudah diterima', 'Jumlah', 'Keterangan'].map((label) => (
          <p key={label}><strong>{label}</strong><span>:</span><i /></p>
        ))}
      </div>
      <p className="recap-print-store-label"><strong>Nama Toko</strong><span>:</span></p>
      <table className="recap-print-store-table">
        <tbody>
          {data.stores.map((store) => (
            <tr key={store.storeId}>
              <td>{store.name} ({store.code})</td>
              <td>{currency.format(store.invoiceTotal)}</td>
              <td>{storeTypes.get(store.storeId) ?? ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>TOTAL :</td>
            <td>{currency.format(data.summary.invoiceTotal)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      <p className="recap-print-payment-date">
        <strong>Tanggal Pembayaran</strong><span>:</span><i />
      </p>
    </section>
  )
}

export function RecapsPage() {
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [storeType, setStoreType] = useState('')
  const settings = useQuery({ queryKey: ['workspace-settings'], queryFn: getSettings })
  const recap = useQuery({
    queryKey: ['recap-summary', from, to, storeType],
    queryFn: () => getRecapSummary(from, to, storeType),
    enabled: Boolean(from && to && from <= to),
  })
  const data = recap.data
  const summary = data?.summary
  function printRecap() {
    window.print()
  }

  return <main className="dashboard-page recap-page"><section className="stores-content recap-content">
    <div className="stores-heading"><div><p className="eyebrow"><span /> LAPORAN</p><h1>Rekap invoice</h1><p>Daftar invoice berdasarkan rentang tanggal dan tipe toko.</p></div><div className="recap-heading-actions"><span className="store-count">{recap.data?.summary.invoiceCount ?? 0} invoice</span><button className="recap-print-button" type="button" disabled={!data || recap.isLoading} onClick={printRecap}><Printer size={15} /> Cetak PDF</button></div></div>
    <section className="store-panel recap-filter"><div className="recap-filter-grid">
      <label>Dari tanggal<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
      <label>Sampai tanggal<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      <label>Tipe toko<select value={storeType} onChange={(event) => setStoreType(event.target.value)}><option value="">Semua tipe</option><option value="REG">REG</option><option value="FRC">FRC</option></select></label>
    </div>
    {from > to && <p className="panel-message error">Tanggal awal tidak boleh setelah tanggal akhir.</p>}
    </section>
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
  {data && createPortal(
    <RecapPrintSheet data={data} logo={settings.data?.logoDataUrl ?? defaultCompanyLogo} />,
    document.body,
  )}
  </main>
}
