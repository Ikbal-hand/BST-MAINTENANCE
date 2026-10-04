# BST Invoice Apps

Aplikasi web untuk perusahaan maintenance yang mengelola data toko, BAP,
detail pekerjaan, invoice, SPH, kwitansi, dan rekap.

## Status saat ini

Fondasi aplikasi sudah siap dijalankan:

- frontend React + Vite + TypeScript;
- backend Express + TypeScript;
- database MySQL melalui Prisma;
- login JWT melalui HttpOnly cookie;
- workspace central dan cabang berbasis subdomain;
- seed workspace, user, dan sample store;
- REST API dengan validasi Zod;
- rate limiting, CORS, Helmet, request ID, structured logging;
- Tailwind CSS, React Router, TanStack Query, dan Zustand.

Dashboard operasional sudah menampilkan ringkasan bulan berjalan: total toko,
jumlah invoice, nominal invoice, dan toko dengan invoice terbanyak.
Modul bisnis BAP, invoice, SPH, kwitansi, dan rekap lain masih dikembangkan
bertahap. Lihat [Progres.md](./Progres.md) untuk status terperinci.

## Prasyarat

Install terlebih dahulu:

- Node.js 20 atau lebih baru;
- npm 10 atau lebih baru;
- MySQL 8 atau lebih baru;
- Git, jika project digunakan melalui repository.

Periksa versi:

```bash
node --version
npm --version
mysql --version
```

## Struktur project

```text
BST_invoice_apps/
├── frontend/       # React, Vite, TypeScript, Tailwind
├── backend/        # Express, TypeScript, Prisma
├── docs/           # Rencana pembangunan
├── docs_reference/ # PDF hasil akhir sebagai acuan
├── STORE (1).xlsx  # Data sumber awal
└── Progres.md      # Catatan kemajuan pengembangan
```

### Struktur backend

Backend menggunakan modular monolith dengan pemisahan tanggung jawab:

```text
backend/src/
├── controllers/    # Parsing input dan HTTP response
├── services/       # Use case dan aturan bisnis
├── repositories/   # Akses data melalui Prisma
├── middleware/     # Auth, request context, rate limit, log, error
├── domain.ts       # Resolusi workspace dari hostname
├── db.ts           # Prisma Client singleton
└── server.ts       # Komposisi aplikasi Express
```

### Struktur frontend

Frontend menggunakan feature-based architecture:

```text
frontend/src/
├── app/             # Router dan provider aplikasi
├── components/ui/   # Komponen UI reusable bergaya shadcn
├── features/auth/   # Login, auth API, protected route
├── pages/           # Landing dan dashboard
├── stores/          # Zustand client state
├── lib/             # API client dan utility
└── config.ts        # Konfigurasi dari VITE_*
```

## Instalasi dependency

Dari root project:

```bash
npm run install:all
```

Jika dependency sudah tersedia, langkah ini tidak perlu diulang.

## Konfigurasi environment

### Backend

Salin file contoh:

```bash
cp backend/.env.example backend/.env
```

Contoh konfigurasi development:

```env
PORT=3000
APP_DOMAIN=bst-maintenance.local
BRANCH_DOMAIN=bst-maintenance.local
DATABASE_URL="mysql://bst_user:password@127.0.0.1:3306/bst_invoice"
CENTRAL_URL=http://central.bst-maintenance.local:3000
APP_VERSION=0.1.0
JWT_SECRET=ganti-dengan-secret-minimal-32-karakter
JWT_EXPIRES_IN=8h
CORS_ORIGINS=http://localhost:5173,http://central.bst-maintenance.local:5173,http://bandung.bst-maintenance.local:5173
SEED_PASSWORD=ganti-dengan-password-development
```

Catatan:

- `DATABASE_URL` harus menunjuk ke database MySQL yang bisa diakses.
- `JWT_SECRET` minimal 32 karakter.
- `SEED_PASSWORD` dipakai oleh script seed untuk semua akun seed.
- Jangan commit file `.env`.

### Frontend

Salin file contoh:

```bash
cp frontend/.env.example frontend/.env
```

Contoh:

```env
# Kosongkan untuk development (request /api diproxy oleh Vite ke localhost:3000).
# Jika frontend dan backend dideploy terpisah, isi base URL backend.
VITE_API_URL=
VITE_APP_DOMAIN=bst-maintenance.local
VITE_BRANCH_DOMAIN=bst-maintenance.local
VITE_APP_VERSION=0.1.0
```

Hanya variable dengan prefix `VITE_` yang boleh dibaca oleh frontend.
Jangan menaruh password, JWT secret, service token, atau kredensial database
di `frontend/.env`.

## Setup database MySQL

Buat database dan user jika belum tersedia:

```sql
CREATE DATABASE bst_invoice
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'bst_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON bst_invoice.* TO 'bst_user'@'localhost';
FLUSH PRIVILEGES;
```

Sesuaikan user, password, host, port, dan nama database di `backend/.env`.

Generate Prisma Client dan terapkan migration:

```bash
npm run db:generate --prefix backend
npm run db:deploy --prefix backend
```

Migration yang tersedia ada di `backend/prisma/migrations`.

### Aturan migration

Development dengan perubahan schema:

```bash
npm run db:migrate --prefix backend -- --name nama_perubahan
```

Deployment atau database baru:

```bash
npm run db:deploy --prefix backend
```

Jangan mengubah tabel production secara manual. Perubahan schema harus dibuat
melalui migration Prisma dan diperiksa sebelum deployment.

## Seed data development

Seed bersifat idempotent, sehingga aman dijalankan ulang untuk data seed yang
sama:

```bash
npm run db:seed --prefix backend
```

Seed membuat atau memperbarui:

| Workspace | Domain lokal | Role |
|---|---|---|
| Central | `bst-maintenance.local` (alias: `central.bst-maintenance.local`) | `developer` |
| Bandung | `bandung.bst-maintenance.local` | `branch_admin` |

User seed:

| Email | Role |
|---|---|
| `admin@bst-maintenance.local` | `developer` |
| `developer@bst-maintenance.local` | `developer` |
| `admin.bandung@bst-maintenance.local` | `branch_admin` |
| `operator.bandung@bst-maintenance.local` | `branch_admin` |

Semua user seed memakai nilai `SEED_PASSWORD` dari `backend/.env`.
Ganti password tersebut sebelum digunakan bersama user lain.
Email akun boleh digunakan di beberapa workspace/cabang yang berbeda. Saat
login pada domain cabang, akun dicari di workspace cabang tersebut. Slug dan
domain workspace tetap harus unik.

Seed juga membuat sample store:

```text
Kode: B032
Nama: CIKUTRA
Tipe: REG
Workspace: Bandung
```

## Menjalankan aplikasi

Jalankan backend pada terminal pertama:

```bash
npm run dev:backend
```

Jalankan frontend pada terminal kedua:

```bash
npm run dev:frontend
```

URL utama:

- Landing: `http://localhost:5173`
- Login: `http://localhost:5173/login`
- Dashboard protected: `http://localhost:5173/app`
- Backend health: `http://localhost:3000/api/health`
- Backend readiness: `http://localhost:3000/api/ready`

## Domain lokal Ubuntu

Agar subdomain cabang bisa dibuka dari browser, tambahkan ke `/etc/hosts`:

```bash
sudo nano /etc/hosts
```

Tambahkan:

```text
127.0.0.1 bst-maintenance.local
127.0.0.1 central.bst-maintenance.local
127.0.0.1 bandung.bst-maintenance.local
```

Verifikasi:

```bash
getent hosts central.bst-maintenance.local
getent hosts bandung.bst-maintenance.local
getent hosts bst-maintenance.local
```

Akses menggunakan port Vite:

```text
http://central.bst-maintenance.local:5173
http://bandung.bst-maintenance.local:5173
```

## Alur domain production

- `https://bst-maintenance.com` menampilkan landing page; tombol masuk mengarah
  pilihan cabang aktif. Tidak ada tombol login developer yang ditampilkan;
  developer membuka `https://bst-maintenance.com/login` secara langsung.
- `https://<slug-cabang>.bst-finance.com/login` membuka login workspace cabang,
  misalnya `bandung.bst-finance.com/login`.
- Halaman root pada domain cabang tidak menampilkan landing page; pengunjung
  langsung diarahkan ke landing page domain utama. Tautan “Kembali ke beranda”
  pada login cabang juga selalu menuju domain utama.
- Saat development, Vite mengizinkan domain cabang yang ditentukan pada
  `VITE_BRANCH_DOMAIN` beserta seluruh subdomain-nya, sehingga workspace baru
  seperti `cianjur.bst-maintenance.local` tidak perlu ditambahkan satu per satu
  di `vite.config.ts`. Setelah mengubah konfigurasi domain, restart Vite.
- Sidebar developer menampilkan Manajemen User & Cabang. Halaman ini
  menampilkan email login, nama user, status, dan
  cabang workspace yang menjadi tanggung jawabnya. Aksi per user dapat
  memindahkan user ke cabang aktif lain (override user), mereset password, serta
  menonaktifkan atau mengaktifkan akun. Akun tidak dihapus permanen agar riwayat
  transaksi tetap utuh; status aktif dan perubahan workspace diperiksa kembali
  pada setiap request sehingga sesi lama tidak mempertahankan akses. Pembukaan
  cabang meminta nama cabang, slug subdomain, nomor kontak, nama admin pertama,
  dan email admin; domain dibuat dari slug dan `BRANCH_DOMAIN`. Password admin
  dibuat acak, hanya ditampilkan sekali, dan disimpan sebagai hash. Password
  lama tidak dapat dibaca karena disimpan sebagai hash. User cabang dapat
  mengganti password sendiri melalui Pengaturan dengan memverifikasi password
  saat ini; perubahan membatalkan seluruh sesi lama dan mengharuskan login
  kembali. Migration `branch_contact_phone` dan `password_version` menambahkan
  data kontak cabang dan kontrol pencabutan sesi; jalankan
  `npm run db:deploy --prefix backend` setelah mengambil perubahan.
- Backend mencocokkan hostname saat login dan pada setiap permintaan sesi.
  Akun cabang hanya dapat masuk di subdomain cabangnya, sedangkan akun developer
  masuk melalui domain utama. Host yang tidak cocok dengan workspace ditolak.
- Endpoint operasional cabang memerlukan sesi workspace cabang; menyembunyikan
  menu developer di antarmuka bukan satu-satunya pengaman akses.

Siapkan DNS dan sertifikat TLS untuk domain utama serta wildcard
`*.bst-finance.com`. Pada build frontend production, set
`VITE_APP_DOMAIN=bst-maintenance.com` dan `VITE_BRANCH_DOMAIN=bst-finance.com`;
backend memakai `APP_DOMAIN=bst-maintenance.com` dan `BRANCH_DOMAIN=bst-finance.com`.
Reverse proxy harus meneruskan hostname tenant asli ke backend agar konteks
workspace tidak berubah menjadi hostname internal server.
Jangan memakai wildcard DNS sebagai pengganti pembuatan workspace cabang di
database: slug subdomain tetap harus cocok dengan workspace dan akun yang aktif.

Tanpa `:5173`, browser akan mencoba port HTTP default dan kemungkinan
menghasilkan `ERR_CONNECTION_REFUSED`.

## Pengujian API

Health:

```bash
curl http://localhost:3000/api/health
```

Context central:

```bash
curl -H 'Host: central.bst-maintenance.local' \
  http://localhost:3000/api/context
```

Context cabang:

```bash
curl -H 'Host: bandung.bst-maintenance.local' \
  http://localhost:3000/api/context
```

Login:

```bash
curl -i -c /tmp/bst-cookies.txt \
  -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"operator.bandung@bst-maintenance.local","password":"PASSWORD_SEED"}'
```

Ganti `PASSWORD_SEED` dengan nilai `SEED_PASSWORD` dari `backend/.env`.

Current user:

```bash
curl -b /tmp/bst-cookies.txt http://localhost:3000/api/auth/me
```

Daftar toko:

```bash
curl -b /tmp/bst-cookies.txt \
  'http://localhost:3000/api/stores?page=1&limit=20&search=CIKUTRA'
```

## Endpoint backend saat ini

### Public

```text
GET  /api/health
GET  /api/ready
GET  /api/context
POST /api/auth/login
```

### Authenticated

```text
GET  /api/auth/me
POST /api/auth/logout
GET  /api/stores?page=1&limit=20&search=...
GET  /api/baps?page=1&limit=20&search=...
POST /api/baps
GET  /api/baps/available-for-invoice?date=YYYY-MM-DD&storeId=...
GET  /api/invoices?page=1&limit=20&search=...
POST /api/invoices
GET  /api/invoices/:id/print-data
GET  /api/invoices/:id/sph-print-data
GET  /api/recaps/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&storeType=REG
```

Halaman protected yang tersedia:

```text
/app
/app/stores
/app/bap
/app/invoices
/app/recaps
/app/settings
```

Menu **Pengaturan** menampilkan akun aktif, role, workspace, serta status
keamanan sesi. Pengaturan workspace juga dapat menyimpan logo PNG, nama
penanda tangan, rekening cetak, tanda tangan admin PNG transparan, dan warna
utama aplikasi. Logo digunakan sebagai favicon setelah login serta pada cetak
Invoice, SPH, dan Rekap. File gambar dibatasi PNG maksimal 2 MB.

Pembuatan invoice menggunakan tanggal dan toko. Backend mengembalikan BAP pada
tanggal tersebut melalui `available-for-invoice`; satu atau beberapa BAP dapat
dipilih. Nomor invoice otomatis digabung dari nomor BAP, misalnya `3036, 0350`,
dan total invoice adalah penjumlahan seluruh BAP yang dipilih.

`sph-print-data` mengembalikan `{ invoice, store, baps, items, sph }`. Semua
data diambil dari invoice dalam workspace user; `items` adalah daftar item BAP
yang sudah diratakan, sedangkan `sph` berisi field template SPH seperti
`billTo`, `storeName`, `storeCode`, `totalAmount`, `amountWords`,
`paymentInstructions`, dan `signer`. Endpoint `print-data` tetap tersedia
sebagai alias kompatibilitas.

Menu **Rekap** menampilkan daftar invoice berdasarkan rentang tanggal dan tipe
toko (`REG` atau `FRC`). Batas tanggal bersifat inklusif, sehingga invoice pada
tanggal awal dan tanggal akhir ikut ditampilkan. Jika tipe toko dikosongkan,
invoice dari semua tipe ditampilkan. Seluruh hasil tetap dibatasi ke workspace
user yang sedang login. Tombol **Cetak PDF** membuka dialog print browser
dengan format A4 **TANDA SERAH TERIMA** seperti template Rekap: pilihan jenis,
kolom penerimaan, daftar nama toko dengan nilai dan tipe toko, total, serta
tanggal pembayaran. Pilih printer **Save to PDF** untuk menyimpan file.

Semua response error memiliki bentuk:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan yang aman untuk user",
    "requestId": "uuid"
  }
}
```

Stack trace tidak dikirim ke response API. Detail teknis dicatat di structured
log backend.

## Arsitektur authentication

- Login menghasilkan JWT.
- JWT dikirim backend melalui cookie `HttpOnly`.
- Browser mengirim cookie dengan `credentials: include`.
- Frontend tidak menyimpan JWT di `localStorage` atau `sessionStorage`.
- Opsi **Ingat saya** membuat cookie persisten selama 30 hari; tanpa opsi ini,
  cookie sesi berakhir saat sesi browser berakhir dan JWT tetap berlaku maksimal
  sesuai `JWT_EXPIRES_IN`.
- Saat refresh, frontend menunggu verifikasi `/api/auth/me` selesai sebelum
  menentukan apakah user diarahkan ke login.
- Protected route frontend mengarahkan user tanpa session ke `/login`.
- Backend tetap menjadi sumber otorisasi utama.
- Role dan workspace harus diverifikasi backend pada setiap endpoint protected.

## Workspace dan multi-tenant

Production:

- Central: `central.bst-maintenance.com`
- Cabang: `<slug>.bst-maintenance.com`, contoh `bandung.bst-maintenance.com`

Local:

- Central: `central.bst-maintenance.local`
- Cabang: `<slug>.bst-maintenance.local`

Backend menentukan workspace dari hostname. Data transaksi menggunakan
`workspace_id` sehingga data antar cabang tidak boleh tercampur.

## Perintah development

```bash
# Install dependency
npm run install:all

# Jalankan service
npm run dev:backend
npm run dev:frontend

# Build semua aplikasi
npm run build

# Lint frontend
npm run lint --prefix frontend

# Prisma
npm run db:generate --prefix backend
npm run db:migrate --prefix backend -- --name nama_perubahan
npm run db:deploy --prefix backend
npm run db:seed --prefix backend
```

## Troubleshooting

### `DNS_PROBE_FINISHED_NXDOMAIN`

Hostname belum ada di `/etc/hosts`. Tambahkan domain lokal lalu verifikasi dengan
`getent hosts`.

### `ERR_CONNECTION_REFUSED`

Pastikan service berjalan:

```bash
ss -tulpn | grep -E '3000|5173'
```

Buka frontend dengan port `5173` dan backend dengan port `3000`.

### Prisma gagal konek ke MySQL

Periksa:

1. MySQL sedang berjalan.
2. Database `bst_invoice` sudah dibuat.
3. User memiliki permission.
4. `DATABASE_URL` benar.
5. Host dan port dapat dijangkau.

Tes koneksi:

```bash
mysql -h 127.0.0.1 -P 3306 -u bst_user -p bst_invoice
```

### Login `401`

Jalankan seed:

```bash
npm run db:seed --prefix backend
```

Pastikan email dan password sama dengan user seed serta hostname workspace
sesuai dengan workspace user.

### Login berhasil tetapi dashboard tidak tampil

Pastikan:

- frontend menggunakan `VITE_API_URL` yang benar;
- backend mengizinkan origin frontend di `CORS_ORIGINS`;
- browser menerima cookie;
- backend dan frontend menggunakan `http`/`https` yang konsisten.

## Dokumentasi lanjutan

- [Progres.md](./Progres.md) — status dan backlog pengembangan.
- [docs/APPLICATION-BUILD-PLAN.md](./docs/APPLICATION-BUILD-PLAN.md) — rencana
  pembangunan aplikasi lengkap.
- [docs/DEVELOPER-LOG-PLAN.md](./docs/DEVELOPER-LOG-PLAN.md) — rencana Developer
  Log.
- [docs_reference](./docs_reference) — PDF hasil akhir sebagai acuan generator
  Invoice, SPH, kwitansi, dan rekap.
