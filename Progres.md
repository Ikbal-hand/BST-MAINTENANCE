# Progress Pengembangan BST Maintenance

Dokumen ini mencatat kemajuan pembangunan aplikasi web pengganti AppSheet.

**Terakhir diperbarui:** 29 September 2026

## Status umum

**Status:** Fondasi teknis frontend/backend selesai, siap masuk ke modul bisnis.

## Yang sudah selesai

### Project dan frontend

- [x] Project dipisah menjadi `frontend` dan `backend`.
- [x] Frontend menggunakan React, Vite, dan TypeScript.
- [x] Feature-based frontend structure dibuat.
- [x] React Router digunakan untuk routing.
- [x] TanStack Query digunakan untuk server state.
- [x] Zustand digunakan untuk client/auth state.
- [x] Tailwind CSS v4 dan komponen UI bergaya shadcn ditambahkan.
- [x] API client terpusat dibuat dengan `credentials: include`.
- [x] Protected route `/app` dibuat.
- [x] Layout aplikasi dengan sidebar reusable dibuat.
- [x] Sidebar responsive dengan drawer mobile dibuat.
- [x] Navigasi role/workspace dasar dan tombol logout ditambahkan.
- [x] Sesi autentikasi dipulihkan sebelum protected route melakukan redirect saat refresh.
- [x] Opsi "Ingat saya" ditambahkan menggunakan cookie HttpOnly persisten 30 hari.
- [x] Race condition pemulihan sesi saat halaman login dibuka diperbaiki.
- [x] Development API memakai Vite proxy same-origin agar cookie workspace tidak hilang.
- [x] Pesan error pemuatan data toko dibuat informatif.
- [x] RBAC disederhanakan menjadi dua role: `developer` dan `branch_admin`.
- [x] Modul BAP backend dibuat dengan CRUD, pagination, pencarian, status, item detail, dan total otomatis.
- [x] Halaman BAP frontend dibuat dengan daftar, pencarian, pemilihan toko, dan form multi-item.
- [x] Menu BAP di sidebar diaktifkan.
- [x] Modul Invoice backend dibuat dengan pembuatan dari BAP, list, detail, dan print-data.
- [x] Halaman Invoice frontend dibuat dengan daftar, pembuatan dari BAP, dan preview cetak A4.
- [x] Format cetak Invoice disusun mengikuti template contoh: BILL TO, nomor/tanggal, detail pesanan, total, rekening, dan tanda tangan.
- [x] Alur Invoice diubah menjadi pilih tanggal + toko, lalu pilih satu atau beberapa BAP pada tanggal tersebut.
- [x] Relasi `InvoiceBap` ditambahkan agar satu invoice dapat memuat beberapa BAP seperti contoh `3036, 0350`.
- [x] Nomor invoice dan total kini dihitung backend dari BAP terpilih.
- [x] Preview/cetak diperbaiki dengan ukuran A4 eksplisit, font Times New Roman, tabel tidak meluber, dan halaman KWITANSI terpisah.
- [x] Percobaan visual modern UI dibatalkan atas masukan pengguna; UI dikembalikan ke gaya awal.
- [x] Response endpoint health/readiness diseragamkan dengan format `{ data }` agar status dashboard terbaca benar.
- [x] Crash preview Invoice karena frontend salah membaca bentuk array BAP diperbaiki.
- [x] SPH disatukan dengan daftar Invoice dengan dua aksi cetak: Invoice dan SPH.
- [x] Endpoint print-data SPH workspace-isolated ditambahkan.
- [x] Menu Rekap diaktifkan di sidebar dengan filter rentang tanggal dan tipe toko REG/FRC.
- [x] Endpoint rekap workspace-isolated menampilkan invoice sesuai periode dan tipe toko.
- [x] Cetak PDF Rekap format A4 Tanda Serah Terima berdasarkan filter aktif dan template referensi.
- [x] Dashboard awal dibuat sebagai target setelah login.
- [x] Landing page BST Invoice dibuat.
- [x] Halaman login dibuat di route `/login`.
- [x] Layout responsive untuk desktop dan mobile.
- [x] Konfigurasi frontend menggunakan `.env` dengan prefix `VITE_`.
- [x] JWT frontend tidak disimpan di `localStorage` atau `sessionStorage`.
- [x] Login menggunakan HttpOnly cookie dari backend.
- [x] Vite dikonfigurasi untuk hostname cabang lokal `.test` dan `.local`.

### Multi-domain workspace

- [x] Resolver hostname central dan cabang dibuat.
- [x] Format domain production ditetapkan:
  - `central.bst-maintenance.com`
  - `<cabang>.bst-maintenance.com`
- [x] Format domain local development didukung:
  - `central.bst-maintenance.local`
  - `<cabang>.bst-maintenance.local`
- [x] Endpoint `GET /api/context` tersedia.

### Backend architecture

- [x] Backend menggunakan Express + TypeScript.
- [x] Arsitektur modular monolith diterapkan.
- [x] Pemisahan controller, service, repository, middleware, dan domain.
- [x] REST API digunakan sebagai komunikasi utama.
- [x] Pagination dan filtering awal tersedia pada endpoint store.
- [x] Centralized error handling tersedia.
- [x] Response error tidak membocorkan stack trace.
- [x] Request ID dibuat dan dikembalikan melalui header `x-request-id`.
- [x] Structured JSON logging menggunakan Pino.
- [x] Access log mencatat method, path, status, durasi, workspace, dan request ID.
- [x] Endpoint health dan readiness tersedia:
  - `GET /api/health`
  - `GET /api/ready`
- [x] 404 handler tersedia.

### Database dan Prisma

- [x] Prisma digunakan sebagai ORM.
- [x] Database dipindahkan dari SQLite ke MySQL.
- [x] Prisma datasource menggunakan `provider = "mysql"`.
- [x] Migration lock menggunakan provider MySQL.
- [x] Migration MySQL awal tersedia di `backend/prisma/migrations`.
- [x] Prisma Client singleton tersedia.
- [x] Schema awal tersedia untuk:
  - Workspace
  - User
  - Store
  - BAP
  - Detail BAP
  - Invoice
  - Dokumen
  - Developer Log
- [x] Index dan unique constraint awal ditambahkan.
- [x] Script database tersedia:
  - `db:generate`
  - `db:push`
  - `db:migrate`
  - `db:deploy`

### Security dan API foundation

- [x] JWT authentication foundation tersedia.
- [x] Cookie autentikasi HttpOnly tersedia.
- [x] Endpoint logout tersedia.
- [x] Role-based access foundation tersedia.
- [x] Workspace access middleware tersedia.
- [x] Password verification menggunakan bcrypt-compatible hashing.
- [x] Validasi input menggunakan Zod.
- [x] Helmet aktif.
- [x] CORS membaca konfigurasi environment.
- [x] Rate limiting aktif.
- [x] Konfigurasi rahasia dipisahkan ke `.env`.
- [x] Endpoint protected mengembalikan `401` tanpa token.

### Developer Log

- [x] Schema `DeveloperLog` tersedia.
- [x] Endpoint `POST /api/developer-logs` tersedia.
- [x] Endpoint menggunakan token service melalui header.
- [x] Payload divalidasi.
- [x] Event diterima dengan response `202`.
- [x] Error dari cabang dapat memiliki event ID, severity, fingerprint, stack, request ID, URL, dan metadata.

### Dokumentasi

- [x] Rencana pembangunan aplikasi tersedia di [docs/APPLICATION-BUILD-PLAN.md](./docs/APPLICATION-BUILD-PLAN.md).
- [x] Rencana Developer Log tersedia di [docs/DEVELOPER-LOG-PLAN.md](./docs/DEVELOPER-LOG-PLAN.md).
- [x] Referensi PDF hasil akhir tersedia di [docs_reference](./docs_reference).
- [x] README setup dan arsitektur diperbarui.

## Validasi terakhir

- [x] Frontend berhasil di-build.
- [x] Backend berhasil di-build.
- [x] Prisma Client berhasil digenerate.
- [x] Prisma schema MySQL berhasil divalidasi.
- [x] Migration MySQL berhasil diuji pada database baru.
- [x] Endpoint health berhasil diuji.
- [x] Endpoint context berhasil diuji untuk domain branch.
- [x] Endpoint 404 mengembalikan response terstruktur.
- [x] Endpoint protected menolak request tanpa autentikasi.
- [x] Developer Log menolak token salah dan menerima token valid.

## Keputusan teknis

- Backend: Express + TypeScript.
- Arsitektur: modular monolith dengan pemisahan layer.
- Database: MySQL melalui Prisma.
- API: REST.
- Auth awal: JWT.
- Password: bcrypt-compatible hashing.
- Validasi: Zod.
- Logging: Pino structured logging.
- Frontend: React + Vite + TypeScript.
- Multi-tenant: workspace berdasarkan hostname dan `workspace_id`.
- PDF: akan dibangun setelah alur BAP dan invoice tersedia.
- GraphQL, gRPC, WebSocket, Redis, queue, dan microservices belum digunakan karena belum dibutuhkan pada tahap ini.

## Sedang menunggu / perhatian

- [x] Pastikan `backend/.env` berisi host, user, password, port, dan nama database MySQL yang sebenarnya.
- [x] Jalankan `npm run db:deploy --prefix backend` terhadap database MySQL target.
- [x] Buat seed workspace central dan minimal satu workspace cabang.
- [x] Buat seed user admin/operator untuk pengujian.
- [x] Jangan commit file `.env` atau kredensial database.

## Backlog berikutnya

### Prioritas 1 — Auth dan workspace

- [x] Implementasi endpoint login tersedia dan siap terhubung ke user seed.
- [x] Endpoint current user tersedia.
- [x] Frontend login memanggil API backend.
- [x] Logout endpoint.
- [ ] Refresh/expiry strategy lanjutan.
- [x] Seed central dan cabang.
- [x] Seed user central admin/developer dan branch admin/operator.
- [x] Seed sample store untuk pengujian.
- [ ] Validasi akses central versus branch.
- [ ] RBAC lengkap per role.

### Prioritas 2 — Master data toko

- [x] CRUD store.
- [x] Search dan pagination store.
- [x] Frontend halaman daftar dan tambah toko di `/app/stores`.
- [x] Tenant isolation pada akses toko.
- [ ] Import `STORE (1).xlsx`.
- [ ] Validasi kode toko dan tipe `REG`/`FRC`.
- [ ] Audit perubahan master toko.

### Prioritas 3 — BAP

- [ ] Use case create/update BAP.
- [ ] Detail BAP dinamis.
- [ ] Kalkulasi subtotal dan total di backend.
- [ ] Workflow draft, submitted, reviewed, approved, cancelled.
- [ ] Endpoint list/detail BAP.
- [ ] UI form dan daftar BAP.

### Prioritas 4 — Invoice dan SPH

- [ ] Generate invoice dari BAP.
- [ ] Generate SPH dari BAP.
- [ ] Nomor dokumen.
- [ ] Snapshot nominal.
- [ ] Template PDF berdasarkan referensi `docs_reference`.
- [ ] Arsip dokumen.

### Prioritas 5 — Kwitansi dan rekap

- [ ] Generate kwitansi.
- [x] Kandidat invoice untuk rekap.
- [x] Daftar invoice dan ringkasan nilai berdasarkan periode dan tipe toko REG/FRC.
- [ ] Filter tanggal dan `REG`/`FRC`.
- [ ] Generate Tanda Serah Terima.
- [ ] Generate PDF rekap.

### Prioritas 6 — Central monitoring

- [ ] Dashboard central.
- [ ] Dashboard branch.
- [ ] Daftar Developer Log.
- [ ] Detail dan status Developer Log.
- [ ] Filter berdasarkan cabang, severity, status, dan waktu.
- [ ] Audit Log.

### Prioritas 7 — Production readiness

- [ ] Dockerfile dan Docker Compose development.
- [ ] CI build, typecheck, lint, dan test.
- [ ] HTTPS dan reverse proxy.
- [ ] DNS wildcard cabang.
- [ ] Backup MySQL.
- [ ] Object storage untuk PDF.
- [ ] Monitoring dan alerting.

## Cara memperbarui dokumen ini

Setiap menyelesaikan fitur:

1. Centang item yang selesai.
2. Tambahkan catatan singkat jika ada keputusan baru.
3. Perbarui bagian **Terakhir diperbarui**.
4. Tambahkan hasil validasi atau command yang dijalankan.
5. Pindahkan item dari backlog ke daftar selesai jika seluruh acceptance criteria terpenuhi.
