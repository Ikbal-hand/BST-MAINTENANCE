import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Check, CircleAlert, RefreshCw, RotateCcw } from 'lucide-react'
import { getActiveBranches } from '../workspaces/workspaces-api'
import {
  getDeveloperErrorReport,
  updateDeveloperErrorStatus,
  type DeveloperErrorReport,
  type DeveloperLogStatus,
} from './developer-report-api'
import './error-report-page.css'

const dayOptions = [7, 30, 90]
const statusOptions = ['all', 'new', 'acknowledged', 'resolved'] as const
const statusLabels: Record<(typeof statusOptions)[number], string> = {
  all: 'Semua status',
  new: 'Baru',
  acknowledged: 'Sedang ditangani',
  resolved: 'Selesai',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function nextStatus(log: DeveloperErrorReport): { value: DeveloperLogStatus; label: string; icon: typeof Check } {
  if (log.status === 'new') return { value: 'acknowledged', label: 'Tandai ditangani', icon: Check }
  if (log.status === 'acknowledged') return { value: 'resolved', label: 'Tandai selesai', icon: Check }
  return { value: 'new', label: 'Buka kembali', icon: RotateCcw }
}

export function ErrorReportPage() {
  const [days, setDays] = useState(30)
  const [status, setStatus] = useState<DeveloperLogStatus | 'all'>('new')
  const [branch, setBranch] = useState('')
  const queryClient = useQueryClient()
  const branches = useQuery({ queryKey: ['public-branch-workspaces'], queryFn: getActiveBranches })
  const report = useQuery({
    queryKey: ['developer-error-report', days, status, branch],
    queryFn: () => getDeveloperErrorReport({ days, status, branch: branch || undefined }),
  })
  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: DeveloperLogStatus }) => updateDeveloperErrorStatus(id, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['developer-error-report'] }),
  })

  return (
    <main className="error-report-page">
      <header className="error-report-heading">
        <div>
          <h1>Error Report</h1>
          <p>Error browser, kegagalan request, dan exception backend dari workspace cabang.</p>
        </div>
        <button className="error-report-refresh" type="button" onClick={() => void report.refetch()} disabled={report.isFetching}>
          <RefreshCw size={15} className={report.isFetching ? 'is-spinning' : ''} />
          Segarkan
        </button>
      </header>

      {report.data && (
        <section className="error-report-summary" aria-label="Ringkasan error">
          <article><small>Total laporan · {report.data.days} hari</small><strong>{report.data.summary.total.toLocaleString('id-ID')}</strong></article>
          <article className="is-new"><small>Baru</small><strong>{report.data.summary.new.toLocaleString('id-ID')}</strong></article>
          <article className="is-acknowledged"><small>Sedang ditangani</small><strong>{report.data.summary.acknowledged.toLocaleString('id-ID')}</strong></article>
          <article className="is-resolved"><small>Selesai</small><strong>{report.data.summary.resolved.toLocaleString('id-ID')}</strong></article>
        </section>
      )}

      <section className="error-report-list-section" aria-label="Daftar laporan error">
        <div className="error-report-filters">
          <label>
            <span>Rentang waktu</span>
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              {dayOptions.map((value) => <option value={value} key={value}>{value} hari terakhir</option>)}
            </select>
          </label>
          <label>
            <span>Status laporan</span>
            <select
              value={status}
              onChange={(event) => {
                const selected = statusOptions.find((option) => option === event.target.value)
                if (selected) setStatus(selected)
              }}
            >
              {statusOptions.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}
            </select>
          </label>
          <label>
            <span>Cabang</span>
            <select value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option value="">Semua cabang</option>
              {branches.data?.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
            </select>
          </label>
        </div>

        {branches.isError && <p className="error-report-inline-error" role="alert">Daftar cabang tidak dapat dimuat; filter cabang sementara tidak tersedia.</p>}
        {report.isPending && <p className="error-report-state" role="status">Memuat laporan error...</p>}
        {report.isError && (
          <div className="error-report-failure" role="alert">
            <p>Laporan error belum dapat dimuat.</p>
            <button type="button" onClick={() => void report.refetch()}>Coba lagi</button>
          </div>
        )}
        {updateStatus.isError && <p className="error-report-inline-error" role="alert">Status laporan gagal diperbarui. Coba lagi.</p>}
        {report.data && report.data.logs.length === 0 && (
          <div className="error-report-empty">
            <CircleAlert size={21} />
            <strong>Tidak ada laporan dengan filter ini.</strong>
            <span>Laporan error dari cabang akan muncul di sini saat terdeteksi.</span>
          </div>
        )}
        {report.data && report.data.logs.length > 0 && (
          <div className="error-report-list">
            {report.data.logs.map((log) => {
              const action = nextStatus(log)
              const ActionIcon = action.icon
              return (
                <article className="error-report-item" key={log.id}>
                  <div className="error-report-item-top">
                    <div className="error-report-tags">
                      <span className={`error-severity severity-${log.severity}`}>{log.severity}</span>
                      <span className={`error-status status-${log.status}`}>{statusLabels[log.status] ?? log.status}</span>
                      <span className="error-source">{log.source}</span>
                    </div>
                    <time dateTime={log.occurredAt}>{formatDate(log.occurredAt)}</time>
                  </div>
                  <div className="error-report-message">
                    <h2>{log.message}</h2>
                    <p>{log.workspace?.name ?? 'Workspace tidak diketahui'} · {log.workspace?.slug ?? 'tanpa cabang'}</p>
                  </div>
                  <div className="error-report-context">
                    {log.requestMethod && log.requestPath && <span>{log.requestMethod} {log.requestPath}</span>}
                    {log.requestId && <span>Request ID: {log.requestId}</span>}
                    {log.pageUrl && <span>Halaman: {log.pageUrl}</span>}
                  </div>
                  <div className="error-report-item-footer">
                    <details>
                      <summary>Detail teknis</summary>
                      {log.metadata && <pre>{JSON.stringify(log.metadata, null, 2)}</pre>}
                      {log.stack && <pre>{log.stack}</pre>}
                      <small>Diterima {formatDate(log.receivedAt)} · fingerprint {log.fingerprint}</small>
                    </details>
                    <button
                      className={`error-report-action${action.value === 'resolved' ? ' is-resolve' : action.value === 'new' ? ' is-reopen' : ''}`}
                      type="button"
                      onClick={() => updateStatus.mutate({ id: log.id, next: action.value })}
                      disabled={updateStatus.isPending}
                    >
                      <ActionIcon size={14} />
                      {action.label}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
        {report.data && report.data.summary.total > report.data.logs.length && (
          <p className="error-report-limit">Menampilkan maksimal 100 laporan untuk filter ini.</p>
        )}
      </section>
    </main>
  )
}
