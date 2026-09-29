import { Building2, CheckCircle2, KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, logout } from '../auth/auth-api'
import { useAuthStore } from '../../stores/auth-store'
import { getSettings, updateSettings, type WorkspaceSettings } from './settings-api'

const roleLabels: Record<string, string> = {
  developer: 'Developer',
  branch_admin: 'Admin Cabang',
}

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const settings = useQuery({ queryKey: ['workspace-settings'], queryFn: getSettings })
  const [form, setForm] = useState<WorkspaceSettings | null>(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const current = form ?? (settings.data ? { ...settings.data, transportPrice: settings.data.transportPrice ?? 0, servicePrice: settings.data.servicePrice ?? 0 } : undefined)
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (value) => { setForm(value); queryClient.setQueryData(['workspace-settings'], value) },
  })
  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwordForm.currentPassword, passwordForm.newPassword),
    onSuccess: () => {
      clear()
      queryClient.clear()
      navigate('/login', { replace: true, state: { message: 'Password berhasil diganti. Silakan masuk dengan password baru.' } })
    },
  })

  function updateField<K extends keyof Omit<WorkspaceSettings, 'workspaceId'>>(key: K, value: WorkspaceSettings[K]) {
    if (current) setForm({ ...current, [key]: value })
  }
  function readPng(event: React.ChangeEvent<HTMLInputElement>, key: 'logoDataUrl' | 'signatureDataUrl') {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'image/png') { window.alert('File harus berupa PNG.'); return }
    if (file.size > 2 * 1024 * 1024) { window.alert('Ukuran file maksimal 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => updateField(key, String(reader.result))
    reader.readAsDataURL(file)
  }

  async function handleLogout() {
    try { await logout() } finally { clear(); navigate('/login', { replace: true }) }
  }

  if (!user || !current) return <main className="dashboard-page"><section className="stores-content"><p className="panel-message">Memuat pengaturan...</p></section></main>

  return <main className="dashboard-page"><section className="stores-content settings-content">
    <div className="stores-heading"><div><p className="eyebrow"><span /> SISTEM</p><h1>Pengaturan</h1><p>Informasi akun dan workspace yang sedang digunakan.</p></div></div>
    {mutation.isSuccess && <p className="form-message settings-success">Pengaturan berhasil disimpan.</p>}
    {mutation.isError && <p className="form-message error settings-success">Pengaturan gagal disimpan.</p>}
    <form className="settings-layout" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ logoDataUrl: current.logoDataUrl, signerName: current.signerName, bankAccount: current.bankAccount, bankName: current.bankName, bankAccountName: current.bankAccountName, transportPrice: current.transportPrice, servicePrice: current.servicePrice, signatureDataUrl: current.signatureDataUrl, primaryColor: current.primaryColor }) }}>
      <section className="store-panel settings-profile-panel">
        <div className="settings-profile-hero"><span className="settings-avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><h2>{user.name}</h2><p>{user.email}</p></div></div>
        <div className="settings-status"><CheckCircle2 size={16} /><span>Sesi aktif dan terlindungi</span></div>
        <div className="settings-detail-list">
          <div><UserRound size={16} /><span><small>Nama pengguna</small><strong>{user.name}</strong></span></div>
          <div><KeyRound size={16} /><span><small>Email login</small><strong>{user.email}</strong></span></div>
          <div><ShieldCheck size={16} /><span><small>Hak akses</small><strong>{roleLabels[user.role] ?? user.role}</strong></span></div>
        </div>
      </section>
      <section className="store-panel settings-workspace-panel">
        <div className="settings-section-heading"><span className="settings-icon"><Building2 size={17} /></span><div><h2>Workspace</h2><p>Ruang kerja aktif untuk data aplikasi.</p></div></div>
        <div className="settings-workspace-box"><small>WORKSPACE AKTIF</small><strong>{user.workspace.name}</strong><span>{user.workspace.slug} · {user.workspace.type === 'branch' ? 'Cabang' : 'Central'}</span></div>
        <div className="settings-note">Data toko, BAP, invoice, SPH, dan Rekap yang Anda lihat dibatasi pada workspace ini.</div>
      </section>
      <section className="store-panel settings-documents-panel">
        <div className="settings-section-heading"><span className="settings-icon"><Save size={17} /></span><div><h2>Identitas dokumen</h2><p>Data ini digunakan pada cetak PDF Invoice, SPH, dan Rekap.</p></div></div>
        <div className="settings-form-grid">
          <label>Nama penanda tangan<input value={current.signerName} onChange={(event) => updateField('signerName', event.target.value)} /></label>
          <label>Warna aplikasi<div className="color-input"><input type="color" value={current.primaryColor} onChange={(event) => updateField('primaryColor', event.target.value.toUpperCase())} /><code>{current.primaryColor}</code></div></label>
          <label>Nomor rekening<input value={current.bankAccount} onChange={(event) => updateField('bankAccount', event.target.value)} /></label>
          <label>Bank<input value={current.bankName} onChange={(event) => updateField('bankName', event.target.value)} /></label>
          <label>Default biaya Transport<input type="number" min={0} step={1000} value={current.transportPrice} onChange={(event) => { const value = Number(event.target.value); updateField('transportPrice', Number.isFinite(value) && value >= 0 ? value : 0) }} /></label>
          <label>Default biaya Jasa Service<input type="number" min={0} step={1000} value={current.servicePrice} onChange={(event) => { const value = Number(event.target.value); updateField('servicePrice', Number.isFinite(value) && value >= 0 ? value : 0) }} /></label>
          <label className="settings-field-wide">Nama pemilik rekening<input value={current.bankAccountName} onChange={(event) => updateField('bankAccountName', event.target.value)} /></label>
          <label className="settings-field-wide">Logo aplikasi (PNG)<input type="file" accept="image/png" onChange={(event) => readPng(event, 'logoDataUrl')} />{current.logoDataUrl && <img className="settings-logo-preview" src={current.logoDataUrl} alt="Pratinjau logo" />}</label>
          <label className="settings-field-wide">Tanda tangan admin (PNG transparan, opsional)<input type="file" accept="image/png" onChange={(event) => readPng(event, 'signatureDataUrl')} />{current.signatureDataUrl && <img className="settings-signature-preview" src={current.signatureDataUrl} alt="Pratinjau tanda tangan" />}</label>
        </div>
        <button className="settings-save-button" type="submit" disabled={mutation.isPending}><Save size={15} /> {mutation.isPending ? 'Menyimpan...' : 'Simpan pengaturan'}</button>
      </section>
    <section className="store-panel settings-security-panel"><div className="settings-section-heading"><span className="settings-icon"><ShieldCheck size={17} /></span><div><h2>Keamanan sesi</h2><p>Autentikasi menggunakan cookie HttpOnly.</p></div></div><div className="settings-security-row"><span>Simpan sesi di perangkat ini</span><strong>Diatur saat login</strong></div><button className="settings-logout-button" type="button" onClick={handleLogout}><LogOut size={15} /> Keluar dari akun</button></section>
    </form>
    <section className="store-panel settings-password-panel">
      <div className="settings-section-heading"><span className="settings-icon"><KeyRound size={17} /></span><div><h2>Ganti password</h2><p>Perbarui password akun Anda. Semua sesi akan diminta masuk kembali.</p></div></div>
      <form
        className="settings-password-form"
        onSubmit={(event) => {
          event.preventDefault()
          setPasswordMessage('')
          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage('Konfirmasi password baru tidak sama.')
            return
          }
          if (passwordForm.newPassword === passwordForm.currentPassword) {
            setPasswordMessage('Password baru harus berbeda dari password saat ini.')
            return
          }
          passwordMutation.mutate()
        }}
      >
        <label>Password saat ini<input type="password" autoComplete="current-password" minLength={1} maxLength={128} required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>
        <label>Password baru<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /><small>Minimal 8 karakter, maksimal 72 karakter.</small></label>
        <label>Konfirmasi password baru<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
        {passwordMessage && <p className="settings-password-message" role="alert">{passwordMessage}</p>}
        {passwordMutation.isError && <p className="settings-password-message" role="alert">{passwordMutation.error.message}</p>}
        <div className="settings-password-footer">
          <p>Setelah berhasil, Anda akan keluar dan perlu login kembali menggunakan password baru.</p>
          <button className="settings-save-button" type="submit" disabled={passwordMutation.isPending}>
            <KeyRound size={15} />{passwordMutation.isPending ? 'Mengganti password...' : 'Ganti password'}
          </button>
        </div>
      </form>
    </section>
  </section></main>
}
