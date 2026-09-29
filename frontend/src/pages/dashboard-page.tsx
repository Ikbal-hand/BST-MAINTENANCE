import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, FileStack, Receipt, Store, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth-store'
import { getDashboardSummary } from './dashboard-api'

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
const number = new Intl.NumberFormat('id-ID')

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const dashboard = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })
  const data = dashboard.data
  const topStoreShare = data?.topStore && data.monthlyInvoiceCount > 0
    ? Math.round((data.topStore.invoiceCount / data.monthlyInvoiceCount) * 100)
    : 0
  const currentMonth = data?.period.from
    ? monthLabel.format(new Date(`${data.period.from}T00:00:00Z`))
    : 'Bulan berjalan'

  return (
    <main className="dashboard-page">
      <div className="dashboard-overview dashboard-overview-modern">
        <header className="dashboard-welcome dashboard-welcome-modern">
          <div>
            <p className="eyebrow"><span /> DASHBOARD</p>
            <h1>Selamat datang, {user?.name ?? 'Operator'}.</h1>
            <p>Berikut ringkasan aktivitas workspace Anda.</p>
          </div>
          <div className="dashboard-month-chip">
            <CalendarDays size={17} aria-hidden="true" />
            <span><small>PERIODE</small><strong>{currentMonth}</strong></span>
          </div>
        </header>

        {dashboard.isLoading && <p className="panel-message">Memuat ringkasan dashboard...</p>}
        {dashboard.isError && <p className="panel-message error">Ringkasan dashboard gagal dimuat: {dashboard.error instanceof Error ? dashboard.error.message : 'Terjadi kesalahan pada server.'}</p>}
        {data && <>
          <section className="dashboard-metrics" aria-label="Ringkasan workspace">
            <article className="dashboard-metric">
              <span className="dashboard-metric-icon"><Store size={19} aria-hidden="true" /></span>
              <small>Total toko</small>
              <strong>{number.format(data.totalStores)}</strong>
              <span className="dashboard-metric-note">Toko aktif di workspace</span>
            </article>
            <article className="dashboard-metric">
              <span className="dashboard-metric-icon dashboard-metric-icon-lilac"><FileStack size={19} aria-hidden="true" /></span>
              <small>Invoice bulan ini</small>
              <strong>{number.format(data.monthlyInvoiceCount)}</strong>
              <span className="dashboard-metric-note">{currentMonth}</span>
            </article>
            <article className="dashboard-metric">
              <span className="dashboard-metric-icon dashboard-metric-icon-peach"><Wallet size={19} aria-hidden="true" /></span>
              <small>Nominal invoice</small>
              <strong className="dashboard-metric-amount">{currency.format(data.monthlyInvoiceTotal)}</strong>
              <span className="dashboard-metric-note">Akumulasi bulan ini</span>
            </article>
            <article className="dashboard-metric dashboard-metric-top-store">
              <span className="dashboard-metric-icon"><Building2 size={19} aria-hidden="true" /></span>
              <small>Toko paling aktif</small>
              <strong>{data.topStore?.name ?? 'Belum ada invoice'}</strong>
              <span className="dashboard-metric-note">{data.topStore ? `${data.topStore.code} · ${number.format(data.topStore.invoiceCount)} invoice` : 'Bulan ini'}</span>
            </article>
          </section>

          <section className="dashboard-insights" aria-label="Analisis dan akses cepat">
            <article className="dashboard-insight-panel dashboard-highlight-panel">
              <div className="dashboard-panel-heading">
                <div><h2>Sorotan bulan ini</h2><p>Kontribusi invoice dari toko teratas</p></div>
                <span className="dashboard-panel-icon"><Receipt size={18} aria-hidden="true" /></span>
              </div>
              {data.topStore ? <>
                <div className="dashboard-highlight-store">
                  <span className="dashboard-store-monogram" aria-hidden="true">{data.topStore.name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{data.topStore.name}</strong><small>{data.topStore.code}</small></span>
                  <span className="dashboard-store-count"><strong>{number.format(data.topStore.invoiceCount)}</strong><small>invoice</small></span>
                </div>
                <div className="dashboard-share-copy"><span>Porsi dari seluruh invoice</span><strong>{topStoreShare}%</strong></div>
                <div
                  className="dashboard-share-track"
                  role="progressbar"
                  aria-label="Porsi invoice toko teratas"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={topStoreShare}
                ><span style={{ width: `${topStoreShare}%` }} /></div>
                <div className="dashboard-highlight-footer">
                  <span>Nilai invoice toko</span><strong>{currency.format(data.topStore.invoiceTotal)}</strong>
                </div>
              </> : <div className="dashboard-empty-highlight">
                <p>Belum ada invoice yang tercatat pada {currentMonth}.</p>
                <Link to="/app/invoices">Buat invoice pertama <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>}
            </article>

            <aside className="dashboard-insight-panel dashboard-shortcuts-panel">
              <div className="dashboard-panel-heading">
                <div><h2>Akses cepat</h2><p>Lanjutkan pekerjaan Anda</p></div>
                <span className="dashboard-panel-icon dashboard-panel-icon-soft"><ArrowUpRight size={18} aria-hidden="true" /></span>
              </div>
              <Link className="dashboard-shortcut" to="/app/invoices">
                <span className="dashboard-shortcut-icon"><Receipt size={17} aria-hidden="true" /></span>
                <span><strong>Kelola invoice</strong><small>Lihat dan buat invoice</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="dashboard-shortcut" to="/app/stores">
                <span className="dashboard-shortcut-icon dashboard-shortcut-icon-lilac"><Store size={17} aria-hidden="true" /></span>
                <span><strong>Data toko</strong><small>Kelola toko workspace</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </aside>
          </section>
        </>}
      </div>
    </main>
  )
}
