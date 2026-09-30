import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Archive, ArchiveRestore, Building2, Check, Clipboard, KeyRound, MoreVertical, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound, UsersRound, X } from 'lucide-react'
import { appConfig } from '../../config'
import { EventPopup } from '../../components/ui/event-popup'
import { getActiveBranches, type BranchWorkspace } from '../workspaces/workspaces-api'
import {
  createDeveloperBranch,
  deleteDeveloperBranch,
  getDeveloperBranchUsers,
  moveDeveloperBranchUser,
  resetDeveloperBranchUserPassword,
  setDeveloperBranchActive,
  setDeveloperBranchUserActive,
  type BranchCreateInput,
  type DeveloperBranchUser,
} from './developer-user-api'
import './developer-users-page.css'

type RevealedCredential = {
  name: string
  email: string
  branch: string
  password: string
}

type BranchAction = 'archive' | 'restore' | 'delete'

type BranchConfirmation = {
  id: string
  name: string
  action: BranchAction
}

const emptyBranchForm: BranchCreateInput = {
  name: '',
  slug: '',
  contactPhone: '',
  adminName: '',
  adminEmail: '',
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function DeveloperUsersPage() {
  const [search, setSearch] = useState('')
  const [confirmUser, setConfirmUser] = useState<{ id: string; action: 'reset' | 'deactivate' | 'activate' } | null>(null)
  const [editingBranch, setEditingBranch] = useState<{ id: string; workspaceId: string } | null>(null)
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [branchForm, setBranchForm] = useState(emptyBranchForm)
  const [revealedCredential, setRevealedCredential] = useState<RevealedCredential | null>(null)
  const [copyMessage, setCopyMessage] = useState('')
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<CSSProperties | null>(null)
  const [branchConfirmation, setBranchConfirmation] = useState<BranchConfirmation | null>(null)
  const queryClient = useQueryClient()
  const users = useQuery({
    queryKey: ['developer-branch-users'],
    queryFn: getDeveloperBranchUsers,
  })
  const branches = useQuery({
    queryKey: ['public-branch-workspaces'],
    queryFn: getActiveBranches,
  })
  const invalidateManagementData = () => {
    void queryClient.invalidateQueries({ queryKey: ['developer-branch-users'] })
    void queryClient.invalidateQueries({ queryKey: ['public-branch-workspaces'] })
  }
  const resetPassword = useMutation({
    mutationFn: (user: DeveloperBranchUser) => resetDeveloperBranchUserPassword(user.id),
    onSuccess: (result, user) => {
      setRevealedCredential({
        name: user.name,
        email: user.email,
        branch: user.workspace.name,
        password: result.newPassword,
      })
      setConfirmUser(null)
      setCopyMessage('')
      invalidateManagementData()
    },
  })
  const moveUser = useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) => moveDeveloperBranchUser(id, workspaceId),
    onSuccess: () => {
      setEditingBranch(null)
      invalidateManagementData()
    },
  })
  const updateUserStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setDeveloperBranchUserActive(id, isActive),
    onSuccess: () => {
      setConfirmUser(null)
      invalidateManagementData()
    },
  })
  const updateBranchStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setDeveloperBranchActive(id, isActive),
    onSuccess: () => {
      setBranchConfirmation(null)
      invalidateManagementData()
    },
  })
  const deleteBranch = useMutation({
    mutationFn: (id: string) => deleteDeveloperBranch(id),
    onSuccess: () => {
      setBranchConfirmation(null)
      invalidateManagementData()
    },
  })
  const createBranch = useMutation({
    mutationFn: createDeveloperBranch,
    onSuccess: (result) => {
      setRevealedCredential({
        name: result.admin.name,
        email: result.admin.email,
        branch: result.workspace.name,
        password: result.newPassword,
      })
      setCopyMessage('')
      setBranchForm(emptyBranchForm)
      setShowBranchForm(false)
      invalidateManagementData()
    },
  })

  const normalizedSearch = search.trim().toLocaleLowerCase('id-ID')
  const visibleUsers = users.data?.filter((user) =>
    [user.name, user.email, user.workspace.name, user.workspace.slug, user.role]
      .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedSearch)),
  )
  const branchSummaries = users.data?.reduce<Array<DeveloperBranchUser['workspace'] & { userCount: number }>>((summaries, user) => {
    const branch = summaries.find((item) => item.id === user.workspace.id)
    if (branch) {
      branch.userCount += 1
    } else {
      summaries.push({ ...user.workspace, userCount: 1 })
    }
    return summaries
  }, [])
  const branchActionPending = updateBranchStatus.isPending || deleteBranch.isPending
  const branchActionError = branchConfirmation?.action === 'delete' ? deleteBranch.error : updateBranchStatus.error

  function requestBranchAction(branch: { id: string; name: string }, action: BranchAction) {
    updateBranchStatus.reset()
    deleteBranch.reset()
    setBranchConfirmation({ ...branch, action })
  }

  function closeBranchConfirmation() {
    if (!branchActionPending) setBranchConfirmation(null)
  }

  function confirmBranchAction() {
    if (!branchConfirmation) return
    if (branchConfirmation.action === 'delete') {
      deleteBranch.mutate(branchConfirmation.id)
      return
    }
    updateBranchStatus.mutate({
      id: branchConfirmation.id,
      isActive: branchConfirmation.action === 'restore',
    })
  }

  async function copyPassword() {
    if (!revealedCredential) return
    try {
      await navigator.clipboard.writeText(revealedCredential.password)
      setCopyMessage('Password berhasil disalin.')
    } catch {
      setCopyMessage('Clipboard tidak tersedia. Pilih dan salin password secara manual.')
    }
  }

  function updateBranchName(name: string) {
    setBranchForm((current) => ({ ...current, name, slug: slugify(name) }))
  }

  function closeBranchForm() {
    setShowBranchForm(false)
    setBranchForm(emptyBranchForm)
    createBranch.reset()
  }

  function closeUserActions() {
    setActionUserId(null)
    setActionMenuPosition(null)
  }

  return (
    <main className="developer-users-page">
      <header className="developer-users-heading">
        <div>
          <h1>Manajemen User &amp; Cabang</h1>
          <p>Kelola penanggung jawab, akses akun, dan pembukaan workspace cabang dari satu tempat.</p>
        </div>
        <button
          className="developer-users-refresh"
          type="button"
          onClick={() => {
            void users.refetch()
            void branches.refetch()
          }}
          disabled={users.isFetching || branches.isFetching}
        >
          <RefreshCw size={15} className={users.isFetching || branches.isFetching ? 'is-spinning' : ''} />
          Segarkan
        </button>
      </header>

      <section className="developer-users-security" aria-label="Informasi keamanan password">
        <ShieldCheck size={19} />
        <p>Password lama tidak dapat ditampilkan karena tersimpan dalam bentuk hash. Password baru hanya ditampilkan sekali setelah dibuat atau di-reset.</p>
      </section>

      <section className="developer-users-branch-section" aria-labelledby="branch-opening-title">
        <div className="developer-users-section-heading">
          <div>
            <h2 id="branch-opening-title">Pembukaan cabang baru</h2>
            <p>Cabang dibuat bersama akun admin pertamanya agar siap menerima akses login.</p>
          </div>
          {!showBranchForm && (
            <button className="developer-users-primary" type="button" onClick={() => setShowBranchForm(true)}>
              <Plus size={16} />
              Tambah cabang
            </button>
          )}
        </div>
        {showBranchForm && (
          <form
            className="developer-users-branch-form"
            onSubmit={(event) => {
              event.preventDefault()
              createBranch.mutate({
                ...branchForm,
                name: branchForm.name.trim(),
                slug: branchForm.slug.trim(),
                contactPhone: branchForm.contactPhone.trim(),
                adminName: branchForm.adminName.trim(),
                adminEmail: branchForm.adminEmail.trim().toLowerCase(),
              })
            }}
          >
            <div className="developer-users-form-grid">
              <label>
                <span>Nama cabang <b aria-hidden="true">*</b></span>
                <input required minLength={2} maxLength={100} value={branchForm.name} onChange={(event) => updateBranchName(event.target.value)} placeholder="Contoh: Bandung" />
              </label>
              <label>
                <span>Slug subdomain <b aria-hidden="true">*</b></span>
                <input required minLength={2} maxLength={48} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={branchForm.slug} onChange={(event) => setBranchForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} placeholder="bandung" />
                <small>Login cabang: {branchForm.slug || 'slug'}.{appConfig.branchDomain}/login</small>
              </label>
              <label>
                <span>Nomor kontak cabang <b aria-hidden="true">*</b></span>
                <input required minLength={8} maxLength={32} type="tel" value={branchForm.contactPhone} onChange={(event) => setBranchForm((current) => ({ ...current, contactPhone: event.target.value }))} placeholder="Nomor telepon PIC cabang" />
              </label>
              <label>
                <span>Nama admin pertama <b aria-hidden="true">*</b></span>
                <input required minLength={2} maxLength={100} autoComplete="name" value={branchForm.adminName} onChange={(event) => setBranchForm((current) => ({ ...current, adminName: event.target.value }))} placeholder="Nama penanggung jawab" />
              </label>
              <label className="developer-users-form-wide">
                <span>Email / username login admin <b aria-hidden="true">*</b></span>
                <input required maxLength={191} type="email" autoComplete="email" value={branchForm.adminEmail} onChange={(event) => setBranchForm((current) => ({ ...current, adminEmail: event.target.value }))} placeholder="admin@perusahaan.co.id" />
              </label>
            </div>
            {createBranch.isError && <p className="developer-users-inline-error" role="alert">{createBranch.error.message}</p>}
            <div className="developer-users-form-footer">
              <p>Password admin dibuat acak dan hanya diperlihatkan setelah cabang berhasil dibuat.</p>
              <div>
                <button className="developer-users-secondary-button" type="button" onClick={closeBranchForm} disabled={createBranch.isPending}>
                  <X size={15} />
                  Batal
                </button>
                <button className="developer-users-primary" type="submit" disabled={createBranch.isPending}>
                  <Building2 size={15} />
                  {createBranch.isPending ? 'Membuat cabang...' : 'Buat cabang'}
                </button>
              </div>
            </div>
          </form>
        )}
        <div className="developer-users-branch-list">
          <div className="developer-users-branch-list-heading">
            <div>
              <h3>Cabang terdaftar</h3>
              <p>Arsipkan untuk menghentikan akses tanpa menghapus data. Hapus permanen hanya tersedia jika cabang tidak memiliki toko, BAP, atau invoice; rekap dan SPH mengikuti data invoice.</p>
            </div>
            {branchSummaries && <span>{branchSummaries.length} cabang</span>}
          </div>
          {users.isPending ? (
            <p className="developer-users-state">Memuat daftar cabang...</p>
          ) : branchSummaries?.length ? (
            <div className="developer-users-branch-list-items">
              {branchSummaries.map((branch) => (
                <div className={`developer-users-branch-row${branch.isActive ? '' : ' is-archived'}`} key={branch.id}>
                  <div className="developer-users-branch-summary">
                    <strong>{branch.name}</strong>
                    <span>{branch.slug} · {branch.userCount} {branch.userCount === 1 ? 'akun' : 'akun'}</span>
                    <span className="developer-users-branch-record-counts">
                      {branch.counts.stores} toko · {branch.counts.baps} BAP · {branch.counts.invoices} invoice
                    </span>
                  </div>
                  <span className={`developer-users-status${branch.isActive ? ' is-active' : ''}`}>
                    {branch.isActive ? 'Aktif' : 'Diarsipkan'}
                  </span>
                  <div className="developer-users-branch-actions">
                    <button
                      type="button"
                      className={`developer-users-branch-toggle${branch.isActive ? ' is-archive' : ' is-restore'}`}
                      onClick={() => requestBranchAction(
                        { id: branch.id, name: branch.name },
                        branch.isActive ? 'archive' : 'restore',
                      )}
                      aria-label={`${branch.isActive ? 'Arsipkan' : 'Pulihkan'} cabang ${branch.name}`}
                    >
                      {branch.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      {branch.isActive ? 'Arsipkan' : 'Pulihkan'}
                    </button>
                    <button
                      type="button"
                      className="developer-users-branch-toggle is-delete"
                      onClick={() => requestBranchAction({ id: branch.id, name: branch.name }, 'delete')}
                      disabled={branch.counts.stores > 0 || branch.counts.baps > 0 || branch.counts.invoices > 0}
                      title={
                        branch.counts.stores > 0 || branch.counts.baps > 0 || branch.counts.invoices > 0
                          ? 'Hapus data toko, BAP, dan invoice terlebih dahulu'
                          : undefined
                      }
                      aria-label={`Hapus permanen cabang ${branch.name}`}
                    >
                      <Trash2 size={15} /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="developer-users-branch-list-empty">Belum ada cabang yang dapat dikelola.</p>
          )}
        </div>
      </section>

      <EventPopup
        open={branchConfirmation !== null}
        type="confirm"
        title={
          branchConfirmation?.action === 'delete'
            ? 'Hapus cabang permanen?'
            : branchConfirmation?.action === 'archive'
              ? 'Arsipkan cabang?'
              : 'Pulihkan cabang?'
        }
        description={[
          branchConfirmation?.action === 'delete'
            ? `${branchConfirmation.name} dan akun-akun cabangnya akan dihapus permanen. Penghapusan hanya diizinkan jika tidak ada toko, BAP, atau invoice. Rekap dan SPH mengikuti data invoice.`
            : branchConfirmation?.action === 'archive'
              ? `Akses login ${branchConfirmation.name} akan dihentikan. Semua data tetap tersimpan dan cabang dapat dipulihkan kapan saja.`
              : branchConfirmation
                ? `Akses login ${branchConfirmation.name} akan diaktifkan kembali.`
                : undefined,
          branchActionError?.message,
        ].filter(Boolean).join(' ')}
        confirmLabel={
          branchActionPending
            ? 'Memproses...'
            : branchConfirmation?.action === 'delete'
              ? 'Hapus permanen'
              : branchConfirmation?.action === 'archive'
                ? 'Ya, arsipkan'
                : 'Ya, pulihkan'
        }
        confirmDisabled={branchActionPending}
        cancelDisabled={branchActionPending}
        dismissible={!branchActionPending}
        onClose={closeBranchConfirmation}
        onConfirm={confirmBranchAction}
      />

      {revealedCredential && (
        <section className="developer-users-temporary" aria-live="polite">
          <div className="developer-users-temporary-copy">
            <strong>Akses awal untuk {revealedCredential.name}</strong>
            <span>{revealedCredential.email} · {revealedCredential.branch}</span>
            <code>{revealedCredential.password}</code>
            <p>Simpan dan sampaikan melalui kanal aman. Password ini tidak akan muncul kembali setelah halaman ditinggalkan.</p>
            {copyMessage && <small role="status">{copyMessage}</small>}
          </div>
          <button type="button" onClick={() => void copyPassword()}>
            <Clipboard size={15} />
            Salin password
          </button>
        </section>
      )}

      <section className="developer-users-list" aria-label="Daftar user cabang">
        <div className="developer-users-toolbar">
          <div>
            <h2>Akun user cabang</h2>
            {users.data && <span>{visibleUsers?.length ?? 0} dari {users.data.length} user</span>}
          </div>
          <label className="developer-users-search">
            <Search size={16} />
            <span className="visually-hidden">Cari user atau cabang</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari user atau cabang"
            />
          </label>
        </div>

        {users.isPending && <p className="developer-users-state" role="status">Memuat user dan cabang...</p>}
        {users.isError && (
          <div className="developer-users-error" role="alert">
            <p>Data user cabang belum dapat dimuat.</p>
            <button type="button" onClick={() => void users.refetch()}>Coba lagi</button>
          </div>
        )}
        {branches.isError && <p className="developer-users-inline-error" role="alert">Daftar cabang aktif tidak dapat dimuat. Coba segarkan sebelum memindahkan user.</p>}
        {updateBranchStatus.isError && <p className="developer-users-inline-error" role="alert">Status arsip cabang gagal diperbarui. Segarkan daftar sebelum mencoba lagi.</p>}
        {resetPassword.isError && <p className="developer-users-inline-error" role="alert">Reset gagal. Segarkan daftar; jika password belum berubah, silakan ulangi tindakan.</p>}
        {moveUser.isError && <p className="developer-users-inline-error" role="alert">Pemindahan user gagal. Pastikan cabang tujuan masih aktif, lalu coba lagi.</p>}
        {updateUserStatus.isError && <p className="developer-users-inline-error" role="alert">Status user gagal diperbarui. Segarkan daftar sebelum mengulangi tindakan.</p>}
        {users.data && visibleUsers?.length === 0 && (
          <div className="developer-users-empty">
            {users.data.length === 0 ? <UsersRound size={22} /> : <Search size={22} />}
            <strong>{users.data.length === 0 ? 'Belum ada user cabang.' : 'User tidak ditemukan.'}</strong>
            <span>{users.data.length === 0 ? 'Buka cabang baru untuk membuat akun admin pertama.' : 'Coba kata kunci nama, email, atau cabang yang berbeda.'}</span>
          </div>
        )}
        {visibleUsers && visibleUsers.length > 0 && (
          <div className="developer-users-table-wrap">
            <table className="developer-users-table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Cabang tanggung jawab</th>
                  <th scope="col">Akses</th>
                  <th scope="col">Password</th>
                  <th scope="col"><span className="visually-hidden">Tindakan user</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="developer-users-person"><UserRound size={15} />{user.name}</span>
                      <span className="developer-users-secondary">{user.email}</span>
                      {user.workspace.contactPhone && <span className="developer-users-secondary">Kontak cabang: {user.workspace.contactPhone}</span>}
                    </td>
                    <td>
                      <strong className="developer-users-branch">{user.workspace.name}</strong>
                      <span className="developer-users-secondary">{user.workspace.slug}</span>
                      {!user.workspace.isActive && <span className="developer-users-secondary">Cabang nonaktif</span>}
                    </td>
                    <td>
                      <span className={`developer-users-status${user.isActive ? ' is-active' : ''}`}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <span className="developer-users-secondary">{user.role === 'branch_admin' ? 'Admin cabang' : user.role}</span>
                    </td>
                    <td>
                      <span className="developer-users-password"><KeyRound size={14} />{user.hasPassword ? 'Tersimpan aman' : 'Belum diatur'}</span>
                    </td>
                    <td className="developer-users-action-cell">
                      <div className="developer-users-actions">
                        {editingBranch?.id === user.id ? (
                          <div className="developer-users-branch-editor">
                            <label>
                              <span className="visually-hidden">Cabang tujuan untuk {user.name}</span>
                              <select value={editingBranch.workspaceId} onChange={(event) => setEditingBranch({ ...editingBranch, workspaceId: event.target.value })}>
                                <option value="" disabled>Pilih cabang tujuan</option>
                                {branches.data?.map((branch: BranchWorkspace) => <option key={branch.id} value={branch.id} disabled={branch.id === user.workspace.id}>{branch.name}{branch.id === user.workspace.id ? ' (saat ini)' : ''}</option>)}
                              </select>
                            </label>
                            <button
                              className="developer-users-action is-save"
                              type="button"
                              onClick={() => {
                                const destination = branches.data?.find((branch) => branch.id === editingBranch.workspaceId)
                                if (destination) moveUser.mutate({ id: user.id, workspaceId: destination.id })
                              }}
                              disabled={moveUser.isPending || !editingBranch.workspaceId}
                            >
                              <Check size={14} />Pindahkan
                            </button>
                            <button className="developer-users-action" type="button" onClick={() => setEditingBranch(null)} disabled={moveUser.isPending}>Batal</button>
                          </div>
                        ) : confirmUser?.id === user.id && confirmUser.action !== 'reset' ? (
                          <div className="developer-users-confirm">
                            <span>{confirmUser.action === 'deactivate' ? 'Nonaktifkan akses akun ini?' : 'Aktifkan kembali akun ini?'}</span>
                            <div>
                              <button
                                className="is-confirm"
                                type="button"
                                onClick={() => updateUserStatus.mutate({ id: user.id, isActive: confirmUser.action === 'activate' })}
                                disabled={updateUserStatus.isPending}
                              >
                                {updateUserStatus.isPending ? 'Menyimpan...' : 'Konfirmasi'}
                              </button>
                              <button type="button" onClick={() => setConfirmUser(null)} disabled={updateUserStatus.isPending}>Batal</button>
                            </div>
                          </div>
                        ) : confirmUser?.id === user.id && confirmUser.action === 'reset' ? (
                          <div className="developer-users-confirm">
                            <span>Buat password baru untuk user ini?</span>
                            <div>
                              <button className="is-confirm" type="button" onClick={() => resetPassword.mutate(user)} disabled={resetPassword.isPending}>
                                {resetPassword.isPending ? 'Membuat...' : 'Konfirmasi reset'}
                              </button>
                              <button type="button" onClick={() => setConfirmUser(null)} disabled={resetPassword.isPending}>Batal</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="store-actions-trigger"
                            aria-label={`Buka aksi akun ${user.name}`}
                            aria-haspopup="menu"
                            aria-expanded={actionUserId === user.id}
                            onClick={(event) => {
                              event.stopPropagation()
                              if (actionUserId === user.id) {
                                closeUserActions()
                                return
                              }
                              const rect = event.currentTarget.getBoundingClientRect()
                              const menuHeight = 136
                              setActionUserId(user.id)
                              setActionMenuPosition({
                                top: rect.bottom + 4 > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4,
                                left: Math.max(8, Math.min(window.innerWidth - 168, rect.right - 160)),
                              })
                            }}
                          >
                            <MoreVertical size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {actionUserId && actionMenuPosition && createPortal(
        <div className="store-actions-menu" role="menu" style={actionMenuPosition} onClick={(event) => event.stopPropagation()}>
          {(() => {
            const user = users.data?.find((item) => item.id === actionUserId)
            if (!user) return null
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!user.isActive || !user.workspace.isActive || !branches.data?.length}
                  onClick={() => {
                    closeUserActions()
                    setConfirmUser(null)
                    setEditingBranch({ id: user.id, workspaceId: '' })
                  }}
                >
                  <Building2 size={15} /> Override user
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeUserActions()
                    setRevealedCredential(null)
                    setConfirmUser({ id: user.id, action: 'reset' })
                    resetPassword.reset()
                  }}
                >
                  <KeyRound size={15} /> Reset password
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeUserActions()
                    setConfirmUser({ id: user.id, action: user.isActive ? 'deactivate' : 'activate' })
                  }}
                >
                  {user.isActive ? <X size={15} /> : <Check size={15} />}
                  {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </>
            )
          })()}
        </div>,
        document.body,
      )}
    </main>
  )
}
