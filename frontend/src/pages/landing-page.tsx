import './landing-page.css'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, AtSign, BarChart3, Building2, FileText, GitBranch, LayoutDashboard, Mail, MessageCircle, Receipt, Store } from 'lucide-react'
import { appConfig, resolveCurrentWorkspace } from '../config'
import { getActiveBranches } from '../features/workspaces/workspaces-api'
import bstLogo from '../../../image/Frame 5.png'

const features = [
  {
    title: 'Invoice lebih teratur',
    description:
      'Buat invoice, kelola detail pekerjaan, dan simpan semua riwayat dalam satu tempat.',
  },
  {
    title: 'Data toko terpusat',
    description:
      'Cari toko berdasarkan kode atau nama tanpa perlu membuka file spreadsheet satu per satu.',
  },
  {
    title: 'Dokumen siap dibagikan',
    description:
      'Siapkan BAP, SPH, dan invoice dalam format yang konsisten dan mudah diunduh.',
  },
]

function ArrowIcon() {
  return <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2.25} />
}

export function LandingPage() {
  const workspace = resolveCurrentWorkspace()
  const isCentral = workspace.type === 'central'
  const branches = useQuery({
    queryKey: ['public-branch-workspaces'],
    queryFn: getActiveBranches,
    enabled: isCentral,
  })
  const loginLabel = workspace.type === 'branch'
      ? `Masuk cabang ${workspace.slug[0].toUpperCase()}${workspace.slug.slice(1)}`
      : 'Masuk ke aplikasi'
  const port = window.location.port ? `:${window.location.port}` : ''

  function branchLoginUrl(slug: string) {
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return null
    return `${window.location.protocol}//${slug}.${appConfig.branchDomain}${port}/login`
  }

  return (
    <div className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="BST Invoice home">
          <img className="brand-logo" src={bstLogo} alt="BST Invoice" />
        </a>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          <a href="#fitur">Fitur</a>
          <a href="#alur">Cara kerja</a>
          <a href="#tentang">Tentang</a>
        </nav>
        {!isCentral && <a className="header-link" href="/login">{loginLabel} <ArrowIcon /></a>}
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <h1>Urusan invoice jadi <em>lebih ringan.</em></h1>
            <p className="hero-description">
              Platform sederhana untuk mengelola invoice, BAP, SPH, dan data
              toko secara rapi, cepat, dan terintegrasi.
            </p>
            <div className="hero-actions" id="mulai">
              {!isCentral && <a className="primary-button" href="/login">{loginLabel} <ArrowIcon /></a>}
              <a className="text-button" href="#alur">
                Lihat cara kerja <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="trust-row">
              <div className="avatar-stack" aria-hidden="true">
                <span>O</span><span>A</span><span>F</span>
              </div>
              <p>Dibuat untuk tim yang ingin bekerja lebih rapi.</p>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="glow" />
            <div className="dashboard-card">
              <div className="dashboard-topbar">
                <div className="mini-brand"><img className="brand-logo" src={bstLogo} alt="" /> Invoice</div>
                <div className="topbar-actions"><span /><span /><b>OP</b></div>
              </div>
              <div className="dashboard-body">
                <div className="dashboard-sidebar">
                  <div className="sidebar-active"><LayoutDashboard size={12} /> Overview</div>
                  <div><Receipt size={12} /> Invoice</div>
                  <div><FileText size={12} /> Dokumen</div>
                  <div><Store size={12} /> Data toko</div>
                  <div><BarChart3 size={12} /> Rekap</div>
                </div>
                <div className="dashboard-content">
                  <div className="content-heading">
                    <div><small>SELAMAT DATANG KEMBALI</small><h2>Overview</h2></div>
                    <button type="button">+ Buat invoice</button>
                  </div>
                  <div className="metric-grid">
                    <div className="metric-card"><small>Total invoice</small><strong>1.284</strong><span className="positive">↗ 12,8%</span></div>
                    <div className="metric-card"><small>Menunggu proses</small><strong>24</strong><span className="warning">Perlu ditinjau</span></div>
                  </div>
                  <div className="chart-card">
                    <div className="chart-heading"><span>Aktivitas invoice</span><small>7 hari terakhir⌄</small></div>
                    <div className="chart">
                      <div className="chart-bars"><i /><i /><i /><i /><i /><i /><i /></div>
                      <div className="chart-line" />
                    </div>
                    <div className="chart-labels"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isCentral && (
          <section className="branch-picker" aria-labelledby="branch-picker-title">
            <div className="branch-picker-heading">
              <div>
                <h2 id="branch-picker-title">Pilih cabang Anda.</h2>
                <p>Masuk langsung ke workspace cabang yang akan Anda gunakan.</p>
              </div>
              <span className="branch-picker-mark" aria-hidden="true"><Building2 size={22} /></span>
            </div>
            {branches.isLoading && <p className="branch-picker-status" role="status">Memuat daftar cabang...</p>}
            {branches.isError && (
              <div className="branch-picker-status branch-picker-error" role="alert">
                <span>Daftar cabang belum dapat dimuat.</span>
                <button type="button" onClick={() => void branches.refetch()}>Coba lagi</button>
              </div>
            )}
            {branches.data?.length === 0 && <p className="branch-picker-status">Belum ada cabang aktif.</p>}
            {branches.data && branches.data.length > 0 && (
              <div className="branch-grid">
                {branches.data.map((branch) => {
                  const loginUrl = branchLoginUrl(branch.slug)
                  if (!loginUrl) return null
                  return (
                    <a className="branch-card" href={loginUrl} key={branch.slug}>
                      <span className="branch-card-icon"><Building2 size={18} /></span>
                      <span className="branch-card-copy"><strong>{branch.name}</strong><small>{branch.slug}.{appConfig.branchDomain}</small></span>
                      <ArrowUpRight className="branch-card-arrow" aria-hidden="true" size={18} />
                    </a>
                  )
                })}
              </div>
            )}
          </section>
        )}

        <section className="feature-section" id="fitur">
          <div className="section-heading">
            <h2>Semua yang dibutuhkan,<br /><em>dalam satu alur.</em></h2>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#mulai" aria-label={`Pelajari ${feature.title}`}>Pelajari <ArrowIcon /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section" id="alur">
          <div className="process-copy">
            <h2>Kerja fokus,<br /><em>hasil maksimal.</em></h2>
            <p>Dirancang agar pekerjaan administratif terasa lebih sederhana dari awal sampai selesai.</p>
          </div>
          <div className="process-steps">
            <div><strong>01</strong><span>Input data</span><p>Isi informasi toko dan detail pekerjaan.</p></div>
            <div><strong>02</strong><span>Review & proses</span><p>Periksa data sebelum dokumen dibuat.</p></div>
            <div><strong>03</strong><span>Siap dibagikan</span><p>Unduh dokumen dan simpan riwayatnya.</p></div>
          </div>
        </section>
      </main>

      <footer id="tentang">
        <div className="landing-footer-brand">
          <a className="brand" href="/" aria-label="BST Invoice home"><img className="brand-logo" src={bstLogo} alt="BST Invoice" /></a>
          <p>Built for better work.</p>
          <span>© 2026 BST Invoice · v{appConfig.appVersion}</span>
        </div>
        <div className="landing-footer-contact">
          <h2>Dibuat oleh Ikbal Handini</h2>
          <nav aria-label="Kontak pembuat website">
            <a href="https://www.instagram.com/ikbal_handini/" target="_blank" rel="noreferrer">
              <AtSign size={16} aria-hidden="true" /> Instagram
            </a>
            <a href="https://wa.me/6281223173374" target="_blank" rel="noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp · 081223173374
            </a>
            <a href="https://github.com/ball-hand" target="_blank" rel="noreferrer">
              <GitBranch size={16} aria-hidden="true" /> GitHub · ball-hand
            </a>
            <a href="https://github.com/Ikbal-hand" target="_blank" rel="noreferrer">
              <GitBranch size={16} aria-hidden="true" /> GitHub · Ikbal-hand
            </a>
            <a href="mailto:ikbalhand13@gmail.com">
              <Mail size={16} aria-hidden="true" /> ikbalhand13@gmail.com
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
