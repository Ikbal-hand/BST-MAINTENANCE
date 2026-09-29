# Rencana Fitur Developer Log

## 1. Tujuan

Menyediakan mekanisme agar error atau bug yang terjadi pada aplikasi cabang dapat dikirim ke aplikasi central untuk dipantau developer tanpa harus mengakses laptop atau browser user secara langsung.

Contoh domain:

- Cabang: `bandung.bst-maintenance.com`
- Central: `central.bst-maintenance.com`

Fitur ini harus:

- menangkap error frontend dan backend;
- mengirim konteks cabang secara otomatis;
- menyimpan log di central;
- menyediakan daftar, detail, filter, status, dan penanganan log;
- tidak membuat aplikasi cabang gagal ketika central sedang tidak tersedia;
- tidak mengirim password, token, atau data sensitif.

## 2. Batasan tahap pertama

### Termasuk

- JavaScript runtime error;
- unhandled promise rejection;
- error API dari backend;
- request ID untuk menelusuri satu request;
- pengiriman log dari cabang ke central;
- penyimpanan log terstruktur;
- dashboard Developer Log di central;
- filter berdasarkan cabang, severity, status, waktu, dan fingerprint;
- status log: `new`, `acknowledged`, `in_progress`, `resolved`, `ignored`;
- deduplikasi berdasarkan fingerprint;
- retensi dan penghapusan log lama.

### Tidak termasuk tahap pertama

- pengumpulan rekaman layar;
- pengumpulan isi seluruh form;
- pengumpulan cookie atau access token;
- remote desktop;
- auto-fix bug;
- notifikasi WhatsApp;
- tracing performa mendalam;
- pengiriman source code ke central.

## 3. Prinsip arsitektur

### 3.1 Central sebagai penerima log

Setiap aplikasi cabang mengirim log ke endpoint central, bukan menyimpan log hanya di browser cabang.

Alur utama:

```text
User di cabang
  -> Frontend cabang menangkap error
  -> Backend cabang mencatat error API
  -> Error reporter mengirim payload
  -> Endpoint central menerima dan memvalidasi
  -> Central menyimpan log
  -> Developer melihat Developer Log
```

### 3.2 Error reporter tidak boleh mengganggu aplikasi

Pengiriman log harus:

- memakai request terpisah;
- memiliki timeout pendek;
- tidak melakukan retry tanpa batas;
- menyimpan antrean lokal terbatas jika central tidak tersedia;
- membuang log lama ketika kapasitas antrean penuh;
- tidak melempar error baru ke user;
- tidak menampilkan detail teknis pada UI production.

### 3.3 Konteks tenant wajib

Setiap log harus memiliki:

- workspace type: `branch` atau `central`;
- branch slug, misalnya `bandung`;
- hostname;
- environment;
- versi aplikasi;
- waktu kejadian.

Central boleh menerima log dari cabang, sedangkan cabang tidak boleh menganggap dirinya sebagai central hanya berdasarkan payload dari client.

## 4. Komponen yang diperlukan

### 4.1 Frontend cabang

Tambahkan error reporter global pada entry point aplikasi.

Sumber error:

- `window.error`;
- `window.unhandledrejection`;
- error boundary React;
- kegagalan request API;
- error yang sengaja dilaporkan melalui helper `reportError()`.

Frontend mengirim:

```text
POST https://central.<domain>/api/developer-logs
```

Jika domain central berbeda untuk local development, URL harus berasal dari konfigurasi environment, bukan hard-code di komponen UI.

### 4.2 Backend cabang

Backend harus:

- membuat `requestId` untuk setiap request;
- mencatat status response 5xx;
- menangkap exception di error middleware;
- mengirim ringkasan error ke central;
- meneruskan response error yang aman ke frontend;
- tidak mengirim body request yang mengandung data bisnis penuh.

### 4.3 Backend central

Central menyediakan:

- endpoint penerima log;
- autentikasi antar-service;
- validasi payload;
- rate limiting;
- penyimpanan;
- endpoint daftar log;
- endpoint detail log;
- endpoint perubahan status;
- endpoint pengelompokan/deduplicating log.

### 4.4 Dashboard Developer Log

Dashboard hanya tersedia untuk role developer atau administrator central.

Halaman minimal:

- ringkasan jumlah error baru;
- tabel log terbaru;
- filter;
- detail stack trace;
- detail request;
- riwayat status;
- aksi acknowledge, assign, resolve, ignore;
- tautan ke URL dan branch terkait.

## 5. Kontrak payload log

Contoh payload:

```json
{
  "eventId": "uuid",
  "occurredAt": "2026-09-29T12:00:00.000Z",
  "source": "frontend",
  "severity": "error",
  "workspace": {
    "type": "branch",
    "slug": "bandung",
    "host": "bandung.bst-maintenance.com"
  },
  "environment": "production",
  "appVersion": "2026.09.29.1",
  "requestId": "req_abc123",
  "fingerprint": "sha256-value",
  "error": {
    "name": "TypeError",
    "message": "Cannot read properties of undefined",
    "stack": "sanitized stack trace"
  },
  "request": {
    "method": "POST",
    "path": "/api/invoices",
    "statusCode": 500
  },
  "browser": {
    "userAgent": "sanitized user agent",
    "url": "https://bandung.bst-maintenance.com/invoice",
    "viewport": "1366x768"
  },
  "tags": {
    "module": "invoice"
  }
}
```

## 6. Severity

Gunakan nilai:

- `fatal`: aplikasi atau proses tidak dapat digunakan;
- `error`: operasi gagal;
- `warning`: kondisi tidak normal tetapi operasi masih berjalan;
- `info`: event teknis penting, bukan error.

Tahap pertama fokus pada `fatal`, `error`, dan `warning`.

## 7. Fingerprint dan deduplikasi

Fingerprint dibuat dari kombinasi:

```text
source
+ error.name
+ normalized error.message
+ lokasi stack trace utama
+ endpoint API jika tersedia
```

Tujuannya agar 1 bug yang terjadi 1.000 kali tampil sebagai satu grup dengan jumlah kejadian, bukan 1.000 baris terpisah.

Setiap grup menyimpan:

- jumlah kejadian;
- kejadian pertama;
- kejadian terakhir;
- jumlah cabang terdampak;
- contoh event terbaru;
- status penanganan.

## 8. Model data central

### 8.1 `developer_error_groups`

Kolom minimum:

- `id`;
- `fingerprint`;
- `title`;
- `source`;
- `severity`;
- `status`;
- `first_seen_at`;
- `last_seen_at`;
- `occurrence_count`;
- `affected_branch_count`;
- `assigned_to`;
- `resolved_at`;
- `created_at`;
- `updated_at`.

### 8.2 `developer_error_events`

Kolom minimum:

- `id`;
- `group_id`;
- `event_id`;
- `workspace_type`;
- `branch_slug`;
- `host`;
- `environment`;
- `app_version`;
- `request_id`;
- `error_name`;
- `error_message`;
- `stack_trace`;
- `request_method`;
- `request_path`;
- `response_status`;
- `page_url`;
- `user_agent`;
- `metadata_json`;
- `occurred_at`;
- `received_at`.

### 8.3 `developer_error_status_history`

Kolom minimum:

- `id`;
- `group_id`;
- `old_status`;
- `new_status`;
- `changed_by`;
- `note`;
- `created_at`.

## 9. Endpoint API

### Endpoint internal dari cabang ke central

```text
POST /api/developer-logs
```

Fungsi:

- validasi payload;
- autentikasi service;
- sanitasi data;
- membuat atau mencari fingerprint;
- menyimpan event;
- memperbarui grup error.

### Endpoint dashboard central

```text
GET /api/developer-logs
GET /api/developer-logs/:id
PATCH /api/developer-logs/:id/status
POST /api/developer-logs/:id/notes
```

Parameter daftar:

- `branch`;
- `severity`;
- `status`;
- `source`;
- `from`;
- `to`;
- `fingerprint`;
- `page`;
- `limit`.

## 10. Keamanan

### 10.1 Autentikasi pengiriman

Jangan mempercayai `branch_slug` dari browser tanpa verifikasi.

Gunakan salah satu mekanisme berikut:

1. service token per branch;
2. signed request dengan secret per branch;
3. mTLS jika infrastruktur production sudah siap.

Rekomendasi tahap awal: service token per branch yang disimpan sebagai secret environment backend cabang.

### 10.2 Sanitasi

Hapus atau mask:

- password;
- authorization header;
- cookie;
- refresh token;
- access token;
- nomor rekening;
- data pribadi yang tidak diperlukan;
- body request penuh;
- query string yang mengandung secret.

### 10.3 Validasi

Central harus membatasi:

- ukuran payload;
- panjang message;
- panjang stack trace;
- jumlah metadata;
- jenis `source`;
- jenis `severity`;
- format hostname;
- ukuran batch.

### 10.4 Rate limit

Rate limit wajib dibedakan berdasarkan:

- service token;
- branch;
- IP;
- endpoint.

## 11. Reliabilitas

### Saat central aktif

- log dikirim segera;
- response `202 Accepted` berarti log diterima;
- UI user tidak menunggu proses penyimpanan log.

### Saat central tidak aktif

- error utama tetap ditangani aplikasi;
- reporter menyimpan antrean lokal maksimum, misalnya 20 event;
- antrean dicoba ulang dengan backoff;
- event duplikat digabung sebelum dikirim;
- event kedaluwarsa dibuang setelah batas waktu.

## 12. UI Developer Log

### Ringkasan

Tampilkan kartu:

- error baru;
- error kritis;
- error 24 jam terakhir;
- cabang terdampak;
- error belum terselesaikan.

### Tabel

Kolom:

- severity;
- judul error;
- module;
- cabang;
- jumlah kejadian;
- terakhir terjadi;
- status;
- versi aplikasi.

### Detail

Tampilkan:

- pesan error;
- stack trace dengan tombol salin;
- URL halaman;
- endpoint API;
- request ID;
- branch dan hostname;
- waktu;
- versi aplikasi;
- browser;
- metadata yang sudah disanitasi;
- timeline status.

Stack trace hanya boleh terlihat oleh developer/admin central.

## 13. Observability tambahan

Tambahkan informasi berikut pada seluruh request backend:

- `requestId`;
- `workspace`;
- `userId` jika tersedia;
- `durationMs`;
- `responseStatus`.

Request ID harus:

- dibuat jika client belum mengirim;
- diteruskan pada response header;
- dicatat di error log;
- ditampilkan pada pesan error user dalam bentuk singkat agar support mudah mencari log.

## 14. Konfigurasi environment

Konfigurasi yang diperlukan:

```env
APP_DOMAIN=bst-maintenance.com
CENTRAL_URL=https://central.bst-maintenance.com
DEVELOPER_LOG_ENABLED=true
DEVELOPER_LOG_SERVICE_TOKEN=
DEVELOPER_LOG_TIMEOUT_MS=2000
DEVELOPER_LOG_MAX_QUEUE=20
APP_VERSION=2026.09.29.1
NODE_ENV=production
```

Aturan:

- token hanya berada di backend;
- frontend tidak boleh menerima service token;
- central memiliki secret/token berbeda untuk setiap cabang;
- local development memakai `.test` atau `.local`;
- log production dan development tidak boleh tercampur.

## 15. Tahapan implementasi

### Tahap 1 — Kontrak dan konfigurasi

- tetapkan format payload;
- tetapkan severity dan status;
- tetapkan `CENTRAL_URL`;
- tetapkan strategi service token;
- tetapkan kebijakan sanitasi;
- tetapkan retensi.

### Tahap 2 — Backend central

- buat endpoint `POST /api/developer-logs`;
- buat autentikasi service;
- buat validator payload;
- buat sanitizer;
- buat tabel/grouping fingerprint;
- tambahkan rate limit;
- tambahkan endpoint query untuk dashboard.

### Tahap 3 — Reporter backend cabang

- buat request ID middleware;
- tambahkan error middleware;
- kirim error 5xx ke central;
- pastikan log gagal kirim tidak menggagalkan response utama;
- uji timeout dan central down.

### Tahap 4 — Reporter frontend cabang

- pasang handler global;
- pasang React error boundary;
- integrasikan API client;
- tambahkan queue lokal terbatas;
- tambahkan sanitasi browser context;
- tambahkan `reportError()` untuk error bisnis yang diketahui.

### Tahap 5 — Dashboard central

- buat route Developer Log;
- buat ringkasan;
- buat tabel dan filter;
- buat halaman detail;
- buat perubahan status dan catatan;
- batasi akses dengan role developer/admin.

### Tahap 6 — Deployment dan domain

- siapkan DNS central;
- siapkan endpoint internal central;
- pasang HTTPS;
- buat token per cabang;
- tambahkan konfigurasi pada setiap deployment cabang;
- uji `bandung`, `jakarta`, dan central.

## 16. Skenario pengujian

### Frontend

- error runtime tertangkap;
- unhandled rejection tertangkap;
- React render error tertangkap;
- error tidak menghasilkan loop pelaporan;
- central mati tidak mengubah UX utama;
- password dan token tidak masuk payload;
- fingerprint konsisten untuk error yang sama.

### Backend

- response 500 menghasilkan event;
- request ID konsisten di response dan log;
- request body sensitif disanitasi;
- payload invalid ditolak;
- token branch yang salah ditolak;
- rate limit bekerja;
- timeout central tidak menahan request bisnis.

### Central

- event valid tersimpan;
- event duplikat masuk grup yang sama;
- branch berbeda tetap dapat dibedakan;
- filter bekerja;
- status dan riwayat perubahan tersimpan;
- hanya developer/admin yang dapat melihat stack trace.

## 17. Kriteria penerimaan

Fitur dianggap selesai jika:

1. Error frontend di `bandung.bst-maintenance.com` muncul di Developer Log central.
2. Error backend cabang memiliki `branch_slug`, `requestId`, waktu, endpoint, dan stack trace.
3. Error yang sama tidak membuat ribuan grup duplikat.
4. Developer dapat memfilter log berdasarkan cabang dan status.
5. Developer dapat mengubah status menjadi `acknowledged`, `in_progress`, atau `resolved`.
6. Central down tidak menyebabkan request invoice gagal hanya karena pelaporan log.
7. Password, token, cookie, dan body sensitif tidak tersimpan.
8. Log hanya dapat dilihat oleh role developer/admin central.
9. Log lama dapat dihapus otomatis berdasarkan kebijakan retensi.
10. Local development dapat diuji menggunakan domain `.test` atau `.local`.

## 18. Keputusan yang perlu dikonfirmasi sebelum implementasi

Sebelum coding, tetapkan:

- database central yang akan digunakan;
- apakah backend cabang dan central satu deployment atau terpisah;
- apakah semua cabang memiliki service token sendiri;
- durasi retensi log;
- siapa saja yang boleh melihat stack trace;
- apakah error tertentu wajib mengirim notifikasi;
- apakah data user harus dianonimkan;
- apakah central boleh melihat detail data invoice saat error;
- provider deployment dan reverse proxy yang digunakan.

