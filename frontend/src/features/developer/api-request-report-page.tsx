import { useQuery } from '@tanstack/react-query'
import { Activity, CircleCheck, CircleX, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { getApiRequestReport } from './developer-report-api'
import './api-request-report-page.css'

const ranges = [7, 30, 90] as const

export function ApiRequestReportPage() {
  const [days, setDays] = useState<number>(30)
  const report = useQuery({
    queryKey: ['developer-api-request-report', days],
    queryFn: () => getApiRequestReport(days),
  })

  return (
    <main className="api-report-page">
      <div className="api-report-heading">
        <div>
          <h1>API Request Report</h1>
          <p>Jumlah request berhasil dan gagal dari setiap cabang.</p>
        </div>
        <label className="api-report-range">
          <span>Periode</span>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {ranges.map((range) => <option key={range} value={range}>{range} hari terakhir</option>)}
          </select>
        </label>
      </div>

      {report.isPending && <p className="api-report-state" role="status">Memuat laporan request...</p>}
      {report.isError && (
        <div className="api-report-error" role="alert">
          <p>Laporan belum dapat dimuat. Periksa koneksi, lalu coba lagi.</p>
          <button type="button" onClick={() => void report.refetch()}><RefreshCw size={15} /> Coba lagi</button>
        </div>
      )}
      {report.data && (
        <>
          <section className="api-report-summary" aria-label="Ringkasan request API">
            <article>
              <span className="api-report-metric-icon"><Activity size={17} /></span>
              <div><small>Total request</small><strong>{report.data.total.toLocaleString('id-ID')}</strong></div>
            </article>
            <article>
              <span className="api-report-metric-icon is-success"><CircleCheck size={17} /></span>
              <div><small>Berhasil · 2xx</small><strong>{report.data.successful.toLocaleString('id-ID')}</strong></div>
            </article>
            <article>
              <span className="api-report-metric-icon is-failed"><CircleX size={17} /></span>
              <div><small>Gagal · selain 2xx</small><strong>{report.data.failed.toLocaleString('id-ID')}</strong></div>
            </article>
          </section>

          <section className="api-report-table-section" aria-labelledby="api-report-branches-title">
            <div className="api-report-table-heading">
              <h2 id="api-report-branches-title">Request per cabang</h2>
              <span>{report.data.branches.length} cabang</span>
            </div>
            {report.data.branches.length === 0
              ? <p className="api-report-state">Belum ada cabang aktif untuk ditampilkan.</p>
              : <div className="api-report-table-scroll">
                <table className="api-report-table">
                  <thead>
                    <tr>
                      <th scope="col">Cabang</th>
                      <th scope="col">Total request</th>
                      <th scope="col">Berhasil</th>
                      <th scope="col">Gagal · bukan 2xx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.branches.map((branch) => (
                      <tr key={branch.slug}>
                        <th scope="row">
                          <span className="api-report-branch-name">{branch.name}</span>
                          <span className="api-report-branch-slug">{branch.slug}</span>
                        </th>
                        <td>{branch.total.toLocaleString('id-ID')}</td>
                        <td><span className="api-report-count is-success">{branch.successful.toLocaleString('id-ID')}</span></td>
                        <td><span className={`api-report-count${branch.failed ? ' is-failed' : ''}`}>{branch.failed.toLocaleString('id-ID')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </section>
          <p className="api-report-footnote">Periode laporan: {new Date(report.data.since).toLocaleDateString('id-ID')} sampai sekarang.</p>
        </>
      )}
    </main>
  )
}
