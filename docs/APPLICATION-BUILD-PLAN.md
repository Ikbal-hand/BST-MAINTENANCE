# Rencana Pembangunan Aplikasi BST Maintenance

## 1. Ringkasan

Aplikasi ini menggantikan alur AppSheet untuk perusahaan maintenance yang menangani pekerjaan, invoice, SPH, BAP, kwitansi, dan rekap tagihan untuk banyak toko Alfamart.

Arsitektur utama:

```text
central.bst-maintenance.com
  └── memantau seluruh cabang dan mengelola konfigurasi pusat

bandung.bst-maintenance.com
jakarta.bst-maintenance.com
surabaya.bst-maintenance.com
  └── workspace operasional masing-masing cabang
```

Alur bisnis inti:

```text
Master Toko
  → BAP
  → Detail BAP
  → Invoice / SPH
  → Kwitansi
  → Rekap / Tanda Serah Terima
  → Pembayaran dan arsip
```

## 2. Sasaran aplikasi

### Sasaran operasional

- Mengurangi input berulang dari spreadsheet.
- Menjadikan data toko, pekerjaan, dan dokumen saling terhubung.
- Menghasilkan PDF dengan format yang konsisten dengan dokumen referensi.
- Memisahkan data berdasarkan cabang.
- Memberikan central visibilitas seluruh cabang.
- Menyediakan riwayat perubahan dan status dokumen.
- Menangkap error cabang melalui Developer Log central.

### Sasaran teknis

- Frontend React + TypeScript.
- Backend Express + TypeScript.
- API terpisah dari frontend.
- Database relasional untuk data transaksi.
- Object storage untuk file PDF.
- HTTPS untuk seluruh domain.
- Arsitektur tenant-aware sejak awal.

## 3. Prinsip desain

1. **Tenant isolation** — data cabang tidak boleh tercampur.
2. **Central visibility** — central dapat membaca seluruh cabang sesuai hak akses.
3. **Single source of truth** — total dan status dihitung dari database, bukan dari PDF.
4. **Dokumen repeatable** — PDF dapat dibuat ulang dari data yang sama.
5. **Auditability** — perubahan data penting memiliki jejak audit.
6. **Safe failure** — kegagalan Developer Log tidak menggagalkan transaksi utama.
7. **Progressive delivery** — modul dibangun dari alur bisnis paling penting.
8. **Configuration over duplication** — format perusahaan, rekening, tanda tangan, dan nomor dokumen dikonfigurasi.

## 4. Ruang lingkup

### Termasuk

- Login dan session.
- Role dan permission.
- Workspace central dan cabang.
- Master toko.
- BAP dan Detail BAP.
- Invoice.
- SPH.
- Kwitansi.
- Rekap REG/FRC.
- Tanda Serah Terima.
- Upload dan arsip PDF.
- Dashboard operasional.
- Dashboard central.
- Developer Log.
- Audit log.
- Import data awal dari Excel.
- Export dan pencarian.

### Tidak termasuk versi awal

- Integrasi pembayaran otomatis.
- Integrasi langsung ke sistem Alfamart.
- Aplikasi mobile native.
- WhatsApp gateway otomatis.
- OCR dokumen.
- Perhitungan pajak kompleks sebelum aturan bisnis dikonfirmasi.
- Multi-currency.
- Workflow approval yang sangat kompleks.

## 5. Arsitektur sistem

```text
Browser
  ↓ HTTPS
Reverse Proxy / Load Balancer
  ├── Frontend React
  └── Backend API Express
         ├── Database relational
         ├── Object storage PDF
         ├── Central Developer Log
         └── Worker PDF / notification
```

### Workspace resolution

Backend membaca hostname:

- `central.bst-maintenance.com` → central;
- `bandung.bst-maintenance.com` → branch `bandung`;
- hostname yang tidak dikenal → ditolak atau masuk mode lokal;
- workspace tidak boleh ditentukan hanya dari input client.

Setiap request memiliki `workspaceId` hasil resolusi server dan user session harus diperiksa terhadap workspace tersebut.

## 6. Struktur repository target

Struktur yang disarankan:

```text
BST_invoice_apps/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── layouts/
│       ├── lib/
│       ├── pages/
│       └── types/
├── backend/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       ├── pdf/
│       ├── storage/
│       ├── jobs/
│       └── server.ts
├── docs/
├── scripts/
└── data/
```

Modul backend mengikuti domain bisnis, bukan hanya tipe file:

```text
auth
workspaces
users
stores
baps
invoices
sph
receipts
recaps
documents
developer-logs
audit-logs
```

## 7. Workspace dan multi-tenant

### Central

Central memiliki akses lintas cabang untuk:

- melihat ringkasan seluruh cabang;
- mencari transaksi;
- mengelola cabang;
- mengelola user;
- mengelola template dan konfigurasi dokumen;
- mengakses Developer Log;
- melakukan koreksi administratif dengan audit trail.

### Branch

Branch hanya memiliki akses terhadap:

- data toko yang ditugaskan ke cabang;
- BAP cabang;
- invoice/SPH cabang;
- rekap cabang;
- dokumen cabang;
- user cabang.

### Isolasi data

Semua tabel transaksi wajib memiliki `workspace_id`, kecuali data global yang memang dikelola central.

Setiap query transaksi harus memiliki filter workspace dari session/server context. Filter workspace tidak boleh diserahkan kepada frontend.

## 8. Role dan permission

### Role awal

| Role | Workspace | Kemampuan utama |
|---|---|---|
| `developer` | Central | Developer Log, health, audit teknis, dan administrasi pusat |
| `central_viewer` | Central | Melihat data lintas cabang tanpa mengubah konfigurasi |
| `branch_admin` | Branch | Master toko dan seluruh transaksi cabang |
| `operator` | Branch | BAP, detail pekerjaan, invoice, SPH, rekap |
| `finance` | Branch/Central | Review nominal, status tagihan, pembayaran |
| `viewer` | Branch | Melihat dan mengunduh dokumen |

### Aturan permission

Permission diperiksa pada backend. Frontend hanya menyembunyikan menu sebagai UX, bukan sebagai pengaman.

Permission minimum:

- `store.read`, `store.write`;
- `bap.read`, `bap.write`, `bap.submit`;
- `invoice.read`, `invoice.write`, `invoice.generate`;
- `sph.read`, `sph.generate`;
- `recap.read`, `recap.generate`;
- `document.download`;
- `user.manage`;
- `developer_log.read`, `developer_log.manage`;
- `audit_log.read`.

## 9. Model data inti

### `workspaces`

- `id`;
- `slug`;
- `name`;
- `type`: `central` atau `branch`;
- `domain`;
- `is_active`;
- `created_at`;
- `updated_at`.

### `users`

- `id`;
- `workspace_id`;
- `name`;
- `email`;
- `password_hash` atau identity provider ID;
- `role`;
- `is_active`;
- `last_login_at`;
- `created_at`;
- `updated_at`.

### `stores`

Berasal dari sheet `STORE`.

- `id`;
- `workspace_id`;
- `code`;
- `name`;
- `store_type`: `REG` atau `FRC`;
- `address`;
- `owner_name`;
- `owner_company`;
- `is_active`;
- `created_at`;
- `updated_at`.

Constraint:

```text
workspace_id + code harus unik
```

### `baps`

- `id`;
- `workspace_id`;
- `number`;
- `store_id`;
- `date`;
- `title`;
- `description`;
- `status`;
- `total_amount`;
- `amount_in_words`;
- `created_by`;
- `submitted_at`;
- `created_at`;
- `updated_at`.

Status:

```text
draft → submitted → reviewed → approved → invoiced → cancelled
```

### `bap_items`

- `id`;
- `bap_id`;
- `service_name`;
- `unit`;
- `unit_price`;
- `subtotal`;
- `sort_order`;
- `created_at`;
- `updated_at`.

Rumus:

```text
subtotal = unit × unit_price
total BAP = Σ subtotal
```

Nominal harus dihitung ulang di backend ketika disimpan dan ketika dokumen dibuat.

### `invoices`

- `id`;
- `workspace_id`;
- `number`;
- `invoice_date`;
- `store_id`;
- `bap_id` atau relasi dokumen pekerjaan;
- `payment_purpose`;
- `total_amount`;
- `amount_in_words`;
- `status`;
- `pdf_document_id`;
- `created_by`;
- `created_at`;
- `updated_at`.

Status:

```text
draft → generated → sent → partially_paid → paid → cancelled
```

### `invoice_items` atau relasi pekerjaan

Jika satu invoice dapat memuat beberapa kelompok pekerjaan, gunakan:

```text
invoice
 └── invoice_jobs
      └── invoice_job_items
```

Jangan menduplikasi nominal secara manual jika sumbernya adalah BAP. Simpan snapshot saat invoice diterbitkan agar perubahan BAP di masa depan tidak mengubah invoice lama.

### `sph_documents`

- `id`;
- `workspace_id`;
- `number`;
- `date`;
- `store_id`;
- `source_bap_id`;
- `total_amount`;
- `amount_in_words`;
- `status`;
- `pdf_document_id`;
- `created_by`;
- `created_at`;
- `updated_at`.

### `receipts`

- `id`;
- `workspace_id`;
- `number`;
- `source_invoice_id`;
- `received_from`;
- `payment_purpose`;
- `total_amount`;
- `amount_in_words`;
- `signatory_name`;
- `signatory_role`;
- `pdf_document_id`;
- `created_at`.

### `recaps`

- `id`;
- `workspace_id`;
- `number`;
- `recap_date`;
- `date_from`;
- `date_to`;
- `store_type`;
- `document_type`;
- `payment_date`;
- `total_amount`;
- `pdf_document_id`;
- `created_by`;
- `created_at`;
- `updated_at`.

### `recap_items`

- `id`;
- `recap_id`;
- `store_id`;
- `source_invoice_id`;
- `amount`;
- `store_type`;
- `sort_order`.

### `documents`

- `id`;
- `workspace_id`;
- `document_type`;
- `entity_type`;
- `entity_id`;
- `file_name`;
- `storage_key`;
- `mime_type`;
- `file_size`;
- `checksum`;
- `created_by`;
- `created_at`.

### `audit_logs`

- `id`;
- `workspace_id`;
- `actor_user_id`;
- `action`;
- `entity_type`;
- `entity_id`;
- `before_json`;
- `after_json`;
- `ip_address`;
- `user_agent`;
- `created_at`.

## 10. Status dan aturan bisnis

### BAP

1. BAP dibuat sebagai draft.
2. Operator menambahkan satu atau lebih detail.
3. Sistem menghitung subtotal dan total.
4. Operator submit untuk review.
5. Setelah approved, BAP dapat digunakan untuk Invoice atau SPH.
6. BAP yang sudah menjadi dokumen keuangan tidak boleh diedit bebas.

### Invoice/SPH

1. Dokumen mengambil data toko dan pekerjaan.
2. Sistem membuat nomor dokumen sesuai konfigurasi.
3. Nominal dibekukan sebagai snapshot.
4. PDF dibuat dengan template sesuai jenis dokumen.
5. Perubahan setelah generate membuat versi baru atau memerlukan pembatalan.

### Rekap

1. User memilih rentang tanggal.
2. User memilih `REG` atau `FRC`.
3. Sistem menampilkan kandidat invoice.
4. User memilih invoice yang akan dimasukkan.
5. Sistem menghitung total.
6. User generate Tanda Serah Terima/Rekap.

## 11. Modul frontend

### Layout

- sidebar sesuai role;
- topbar berisi workspace dan user;
- breadcrumb;
- notification/status area;
- responsive untuk laptop dan tablet;
- mode mobile minimal untuk melihat status dan dokumen.

### Halaman publik

- landing page;
- login;
- forgot password;
- reset password;
- halaman error 404;
- halaman error 500.

### Halaman branch

- dashboard;
- daftar dan detail toko;
- daftar BAP;
- form BAP;
- detail BAP;
- daftar invoice;
- form/generate invoice;
- daftar SPH;
- daftar rekap;
- generator Tanda Serah Terima;
- daftar dokumen;
- profil dan pengaturan user.

### Halaman central

- dashboard lintas cabang;
- daftar workspace/cabang;
- user management;
- master data;
- semua BAP/invoice/SPH/rekap;
- konfigurasi template;
- konfigurasi penandatangan dan rekening;
- Developer Log;
- Audit Log.

## 12. Form dan validasi

### Form toko

Wajib:

- kode toko;
- nama toko;
- tipe toko;
- pemilik/perusahaan.

Validasi:

- kode unik dalam workspace;
- tipe hanya `REG` atau `FRC`;
- alamat dan nama tidak boleh hanya whitespace.

### Form BAP

Wajib:

- toko;
- tanggal;
- judul pekerjaan;
- minimal satu item.

Setiap item wajib:

- nama service;
- unit lebih besar dari nol;
- harga satuan tidak negatif.

### Form dokumen

- sumber BAP harus berstatus valid;
- nomor dokumen tidak boleh bentrok;
- total ditampilkan dari perhitungan backend;
- preview sebelum generate;
- konfirmasi setelah PDF dibuat.

## 13. Generator PDF

### Dokumen yang harus didukung

1. Invoice + kwitansi.
2. SPH.
3. Tanda Serah Terima.
4. Rekap REG.
5. Rekap FRC.

### Kesetiaan terhadap referensi

Template harus mengikuti PDF pada [docs_reference](/home/zero/Documents/BST_invoice_apps/docs_reference):

- ukuran halaman;
- posisi header;
- tabel detail;
- format rupiah;
- format terbilang;
- rekening;
- penandatangan;
- halaman kwitansi;
- total dokumen.

### Strategi implementasi

1. Buat data view khusus PDF.
2. Render HTML template dengan CSS print atau engine PDF server.
3. Bandingkan hasil dengan PDF referensi.
4. Uji item satu baris dan banyak baris.
5. Uji satu pekerjaan dan banyak kelompok pekerjaan.
6. Simpan file final ke object storage.
7. Simpan checksum dan metadata dokumen.

### Aturan nominal

- gunakan integer minor unit atau decimal yang aman;
- jangan memakai floating point untuk perhitungan uang;
- format tampilan Indonesia: `Rp1.000.000,00` sesuai kebutuhan template;
- `amount_in_words` dihasilkan dari total final backend.

## 14. Import data awal

Sumber awal:

- [STORE (1).xlsx](/home/zero/Documents/BST_invoice_apps/STORE%20%281%29.xlsx).

Sheet yang perlu dipetakan:

- `STORE`;
- `REKAP XLSX`;
- `Filter`;
- `Rekap Invoice Upload`;
- `BAP`;
- `Detail Bap`;
- `Invoice`;
- `SPH`.

### Proses import

1. Salin file asli sebagai arsip.
2. Buat mapping kolom.
3. Bersihkan tanggal Excel serial.
4. Normalisasi kode toko.
5. Normalisasi tipe `REG`/`FRC`.
6. Validasi referensi toko.
7. Validasi relasi BAP dan Detail BAP.
8. Deduplicate berdasarkan ID lama.
9. Jalankan dry-run.
10. Review laporan error.
11. Import ke staging.
12. Verifikasi jumlah dan nominal.
13. Promote staging ke production.

Import tidak boleh langsung menimpa data production tanpa backup dan laporan hasil.

## 15. API utama

### Auth

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Workspace dan user

```text
GET   /api/context
GET   /api/workspaces
POST  /api/workspaces
PATCH /api/workspaces/:id
GET   /api/users
POST  /api/users
PATCH /api/users/:id
```

### Store

```text
GET   /api/stores
GET   /api/stores/:id
POST  /api/stores
PATCH /api/stores/:id
POST  /api/stores/import
```

### BAP

```text
GET   /api/baps
GET   /api/baps/:id
POST  /api/baps
PATCH /api/baps/:id
POST  /api/baps/:id/submit
POST  /api/baps/:id/review
POST  /api/baps/:id/approve
POST  /api/baps/:id/cancel
```

### Invoice dan SPH

```text
GET  /api/invoices
GET  /api/invoices/:id
POST /api/invoices
POST /api/invoices/:id/generate
GET  /api/invoices/:id/pdf

GET  /api/sph
GET  /api/sph/:id
POST /api/sph
POST /api/sph/:id/generate
GET  /api/sph/:id/pdf
```

### Kwitansi dan rekap

```text
POST /api/invoices/:id/receipt
GET  /api/receipts/:id/pdf

GET  /api/recaps/candidates
POST /api/recaps
POST /api/recaps/:id/generate
GET  /api/recaps/:id/pdf
```

### Developer Log

Rencana detail ada di [DEVELOPER-LOG-PLAN.md](./DEVELOPER-LOG-PLAN.md).

## 16. Keamanan

- password disimpan dengan hashing yang kuat;
- session/token memiliki expiry;
- cookie production memakai `HttpOnly`, `Secure`, dan `SameSite`;
- CORS dibatasi ke domain yang terdaftar;
- service token cabang tidak pernah dikirim ke frontend;
- semua endpoint memeriksa role dan workspace;
- file PDF memakai URL sementara atau endpoint authorization;
- upload membatasi MIME type, ukuran, dan nama file;
- log dan audit menyensor data sensitif;
- rate limit diterapkan untuk login, import, PDF, dan Developer Log;
- semua traffic production memakai HTTPS.

## 17. Search, pagination, dan performa

### Daftar transaksi

- server-side pagination;
- filter tanggal;
- filter status;
- filter toko;
- filter jenis `REG`/`FRC`;
- sort terkontrol;
- indeks pada `workspace_id`, `store_id`, `status`, dan tanggal.

### Dashboard

- gunakan query agregasi;
- cache metrik yang mahal;
- hindari memuat seluruh transaksi ke browser;
- tampilkan loading, empty, dan error state.

### PDF

- generator berjalan asynchronous jika dokumen besar;
- status generation: `queued`, `processing`, `ready`, `failed`;
- user dapat mengunduh dokumen yang sudah siap;
- kegagalan PDF masuk Developer Log.

## 18. Background jobs

Gunakan worker terpisah ketika volume mulai meningkat untuk:

- generate PDF;
- import Excel;
- upload object storage;
- retry Developer Log;
- email/notifikasi;
- purge file dan log kedaluwarsa.

Tahap awal dapat menjalankan proses sinkron untuk dokumen kecil, tetapi API harus dirancang agar mudah dipindahkan ke queue.

## 19. Deployment

### Local

- gunakan `central.bst-maintenance.local`;
- gunakan `bandung.bst-maintenance.local`;
- arahkan domain melalui `/etc/hosts`;
- jalankan frontend dan backend terpisah;
- gunakan database lokal dan storage lokal/minio jika diperlukan.

### Staging

- gunakan domain staging terpisah;
- gunakan database dan bucket terpisah;
- gunakan data sintetis atau data yang sudah disamarkan;
- aktifkan Developer Log ke central staging.

### Production

1. Daftarkan `bst-maintenance.com`.
2. Buat DNS untuk central.
3. Gunakan wildcard DNS untuk cabang.
4. Pasang HTTPS termasuk wildcard certificate.
5. Pasang reverse proxy.
6. Deploy frontend dan backend.
7. Siapkan database backup.
8. Siapkan object storage backup.
9. Buat secret per environment.
10. Buat workspace dan user central.
11. Uji satu cabang pilot.
12. Tambahkan cabang secara bertahap.

## 20. Backup dan recovery

- backup database harian;
- backup incremental jika didukung provider;
- versioning object storage;
- backup konfigurasi template;
- uji restore berkala;
- dokumentasikan RPO dan RTO;
- simpan backup production terpisah dari server aplikasi.

Target awal yang disarankan:

- RPO: maksimal 24 jam;
- RTO: maksimal 8 jam.

## 21. Testing

### Unit test

- perhitungan subtotal;
- total BAP;
- terbilang;
- format rupiah;
- nomor dokumen;
- workspace resolver;
- permission;
- sanitizer log.

### Integration test

- login;
- query tenant isolation;
- create BAP;
- add detail;
- submit/approve;
- generate invoice;
- generate SPH;
- generate kwitansi;
- generate rekap;
- akses PDF.

### Visual regression

- bandingkan PDF dengan referensi;
- uji satu item;
- uji banyak item;
- uji banyak kelompok pekerjaan;
- uji halaman kedua;
- uji tanda tangan dan rekening.

### End-to-end

Skenario utama:

```text
Login operator
→ pilih toko
→ buat BAP
→ tambah detail
→ submit dan approve
→ generate invoice
→ download PDF
→ masukkan invoice ke rekap
→ generate Tanda Serah Terima
```

### Security test

- user cabang tidak dapat membaca cabang lain;
- role viewer tidak dapat mengubah data;
- central endpoint menolak token branch yang salah;
- file PDF tidak dapat diakses tanpa authorization;
- payload Developer Log disanitasi;
- login memiliki rate limit.

## 22. Monitoring

Metrik minimum:

- API request count;
- response 4xx/5xx;
- latency;
- PDF generation duration;
- failed PDF jobs;
- login failure;
- import failure;
- jumlah invoice per status;
- jumlah Developer Log per cabang;
- database connection;
- storage usage.

Health endpoint:

```text
GET /api/health
```

Readiness endpoint:

```text
GET /api/ready
```

Readiness harus memeriksa database dan dependency wajib, bukan hanya proses Node hidup.

## 23. Tahapan delivery

### Milestone 0 — Discovery dan keputusan

- validasi semua alur AppSheet;
- finalisasi arti setiap sheet;
- finalisasi status;
- finalisasi siapa yang membuat dan menyetujui dokumen;
- konfirmasi format PDF;
- pilih database, storage, dan deployment.

Output:

- business rules;
- ERD;
- permission matrix;
- daftar template dokumen;
- keputusan teknis.

### Milestone 1 — Fondasi teknis

- struktur frontend/backend;
- konfigurasi environment;
- database migration;
- workspace resolver;
- auth dasar;
- request ID;
- logging dasar;
- CI build dan test.

Output:

- user dapat login;
- central dan branch terdeteksi;
- tenant isolation tersedia.

### Milestone 2 — Master toko dan import

- schema stores;
- CRUD toko;
- search toko;
- import Excel;
- laporan hasil import;
- audit perubahan master.

Output:

- data `STORE` tersedia di aplikasi.

### Milestone 3 — BAP dan Detail BAP

- form BAP;
- item dinamis;
- kalkulasi;
- status workflow;
- review dan approval;
- audit log.

Output:

- BAP dapat dibuat sampai approved.

### Milestone 4 — Invoice dan SPH

- pembuatan dokumen dari BAP;
- nomor dokumen;
- snapshot nominal;
- preview;
- generator PDF;
- arsip file.

Output:

- PDF Invoice dan SPH mendekati referensi dan dapat diunduh.

### Milestone 5 — Kwitansi dan rekap

- kwitansi;
- kandidat rekap;
- filter tanggal dan REG/FRC;
- Tanda Serah Terima;
- total rekap;
- PDF rekap.

Output:

- alur lengkap transaksi sampai dokumen serah terima.

### Milestone 6 — Central dashboard

- dashboard lintas cabang;
- branch management;
- user management;
- konfigurasi perusahaan;
- pencarian lintas workspace;
- laporan ringkas.

Output:

- central dapat mengawasi operasional cabang.

### Milestone 7 — Developer Log

- error reporter frontend;
- error reporter backend;
- endpoint central;
- grouping;
- dashboard developer;
- retention dan alert.

Output:

- bug cabang terlihat di central.

### Milestone 8 — Hardening dan rollout

- security review;
- backup/restore;
- load test;
- visual PDF sign-off;
- staging pilot;
- migrasi data final;
- rollout cabang bertahap.

## 24. Definition of Done

Sebuah modul dianggap selesai jika:

1. Memiliki migration/schema yang tervalidasi.
2. Memiliki API dengan authorization dan workspace isolation.
3. Memiliki UI loading, empty, success, dan error state.
4. Memiliki validasi frontend dan backend.
5. Memiliki audit untuk perubahan penting.
6. Memiliki unit/integration test yang relevan.
7. Tidak ada error TypeScript/lint/build.
8. Dokumentasi user dan developer diperbarui.
9. Jika menghasilkan PDF, sudah dibandingkan dengan referensi.
10. Sudah diuji pada central dan minimal satu branch.

## 25. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Struktur AppSheet belum seluruhnya diketahui | Fitur terlewat | Discovery per alur dan validasi dengan user |
| Data Excel tidak konsisten | Import gagal | Staging, dry-run, laporan error |
| Nomor dokumen bentrok | Dokumen tidak valid | Counter per workspace dan transaction lock |
| Data antar cabang tercampur | Risiko besar | Filter tenant di backend dan integration test |
| Layout PDF berbeda | Dokumen ditolak | Visual regression dan approval template |
| Central down | Log tidak terkirim | Queue lokal terbatas dan retry |
| PDF besar lambat | UX buruk | Background job |
| User mengubah dokumen yang sudah terbit | Audit/keuangan tidak konsisten | Snapshot, versioning, dan cancel/reissue |
| Domain salah konfigurasi | Cabang masuk workspace salah | Validasi hostname dan daftar workspace aktif |
| Kredensial bocor di log | Risiko keamanan | Sanitizer, allowlist metadata, secret scanning |

## 26. Urutan pekerjaan paling aman

```text
1. Finalisasi business rules
2. Finalisasi ERD dan permission
3. Siapkan database dan workspace
4. Import master toko
5. Bangun BAP dan Detail BAP
6. Bangun Invoice/SPH
7. Cocokkan PDF dengan referensi
8. Bangun kwitansi dan rekap
9. Tambahkan central dashboard
10. Tambahkan Developer Log
11. Uji keamanan dan tenant isolation
12. Pilot satu cabang
13. Migrasi dan rollout cabang berikutnya
```

## 27. Keputusan yang harus dibuat sebelum coding modul bisnis

- Database yang dipilih: PostgreSQL, MySQL, atau lainnya.
- Provider deployment.
- Provider object storage.
- Strategi authentication.
- Apakah nomor dokumen global atau per cabang.
- Format nomor BAP, invoice, SPH, dan rekap.
- Siapa yang boleh approve BAP.
- Apakah satu invoice dapat memuat banyak BAP.
- Aturan pembatalan dan revisi dokumen.
- Definisi pembayaran dan status lunas.
- Format resmi rupiah dan terbilang.
- Daftar penandatangan per cabang.
- Rekening bank global atau per cabang.
- Retensi dokumen dan Developer Log.
- Kebutuhan notifikasi email atau WhatsApp.
