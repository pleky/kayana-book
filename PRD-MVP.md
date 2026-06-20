# PRD — Kayana Book (Sistem Toko Buku Bekas)

**Status:** Draft v1 · **Tanggal:** 2026-06-20 · **Stack:** Laravel 13 · Inertia v3 · React 19 · Tailwind 4 · SQLite

---

## 1. Ringkasan Eksekutif

**Masalah.** Toko buku Kayana (fisik + online) menjual mayoritas **buku bekas** dengan stok hampir selalu unik (jarang >2 eksemplar judul sama) plus sebagian buku baru. Penjualan masih dicatat manual (lambat, salah), belum ada toko online sendiri, dan tidak ada visibilitas omzet/untung.

**Solusi.** Sistem berbasis web yang memodelkan **1 buku fisik = 1 item** (kondisi, harga, foto, status jual). Pelanggan browsing katalog + checkout online → transaksi terekam otomatis & item ditandai terjual. Dashboard kecil untuk omzet dan buku terjual.

**Dampak bisnis.**
- Hilangkan pencatatan manual untuk penjualan online (0 input manual).
- Buka kanal jualan online sendiri (tidak tergantung marketplace/WA).
- Visibilitas omzet & stok real-time.

**Success metrics (MVP):**
| Metrik | Baseline | Target |
|---|---|---|
| Penjualan online terekam otomatis | 0% | 100% |
| Waktu input 1 buku bekas | manual/Excel | < 2 menit |
| Buku terdaftar di katalog | 0 | 100+ dalam bulan pertama |
| Double-sell (1 buku terjual 2x) | risiko | 0 |

---

## 2. Definisi Masalah

- **Who:** (1) Pemilik toko — kelola stok, harga, lihat laporan. (2) Pelanggan — cari & beli buku online.
- **What:** Tidak ada sistem yang menangani stok unik + jual online + rekam otomatis.
- **When:** Tiap transaksi harian; tiap buku bekas masuk harus didata.
- **Why (root cause):** Buku bekas = inventory unik → model "judul + qty besar" tidak cocok. Tools umum (POS retail) asumsikan stok seragam.
- **Impact kalau tidak dibereskan:** kehilangan penjualan online, salah catat, tidak tahu margin.

**Batasan kunci (constraint yang membentuk desain):**
> Stok unik. Tiap eksemplar fisik berdiri sendiri: kondisi & harga bisa beda walau judul sama. Sekali terjual → hilang dari katalog. Tidak ada konsep "restock judul yang sama".

---

## 3. Solusi & Scope

### 3.1 Prinsip desain
1. **1 item = 1 buku fisik.** Bukan judul+qty. Qty tersedia = jumlah baris berstatus `available`.
2. **Input cepat di atas segalanya.** Pemilik akan input ratusan buku; alur input adalah pembunuh utama adopsi.
3. **Anti double-sell.** Status item dikunci saat checkout.

### 3.2 In Scope (MVP)
| # | Fitur | Prioritas |
|---|---|---|
| F1 | CRUD item buku (judul, penulis, kondisi, baru/bekas, harga, status, foto cover) | P0 |
| F2 | Katalog publik (list + detail, cari & filter dasar) | P0 |
| F3 | Keranjang + checkout online (pelanggan login) | P0 |
| F4 | Auto-record: checkout → buat order, item → `sold` | P0 |
| F5 | Anti double-sell (reserve item saat checkout) | P0 |
| F6 | Konfirmasi pembayaran manual (transfer bank, pemilik tandai lunas) | P0 |
| F7 | Dashboard: omzet, jumlah order, buku terjual | P0 |
| F8 | Kategori/genre (tabel) + filter katalog (kategori, bahasa, segmen umur, kondisi, harga) | P0 |
| F9 | Multi-foto per buku (foto kondisi asli) | P1 |

### 3.3 Out of Scope (fase 2+)
- POS kasir untuk pembeli walk-in offline (model sudah disiapkan via field `channel`).
- Payment gateway otomatis (Midtrans/Xendit).
- Ongkir otomatis / integrasi kurir.
- Laporan untung/margin detail (butuh harga modal).
- Manajemen supplier/penerbit.
- Diskon, voucher, membership.

### 3.4 MVP — definisi "jalan"
Pelanggan bisa: buka katalog → lihat detail buku → masukkan keranjang → checkout → dapat instruksi transfer. Pemilik bisa: input buku < 2 menit → tandai order lunas → buku otomatis hilang dari katalog → lihat omzet di dashboard.

---

## 4. User Stories & Requirements

### 4.1 User Stories (P0)

```
US-1 — Pemilik input buku
As pemilik, I want input buku bekas cepat (judul, kondisi, harga, foto)
So that stok online cepat bertambah.
AC:
- [ ] Form 1 layar, field minimal: judul, harga, kondisi, status.
- [ ] Penulis, ISBN, deskripsi, foto = opsional.
- [ ] Simpan < 2 menit; setelah simpan langsung muncul di katalog (jika available).
```
```
US-2 — Pelanggan beli online
As pelanggan, I want cari buku & checkout
So that bisa beli tanpa chat WA.
AC:
- [ ] Katalog tampilkan hanya item `available`.
- [ ] Detail tampil kondisi + foto + harga.
- [ ] Checkout butuh login; isi nama, HP, alamat/ambil di toko.
- [ ] Setelah checkout, item tidak bisa dibeli orang lain (reserved).
```
```
US-3 — Auto-record + anti double-sell
As sistem, saat checkout berhasil
So that transaksi terekam & stok akurat.
AC:
- [ ] Order dibuat status `pending`, item → `reserved`.
- [ ] Saat pemilik tandai lunas → order `paid`, item → `sold`, `sold_at` terisi.
- [ ] Item `reserved`/`sold` tidak muncul di katalog & tidak bisa di-checkout.
- [ ] Dua pelanggan tidak bisa checkout item sama (transaksi DB / lock).
```
```
US-4 — Dashboard pemilik
As pemilik, I want lihat omzet & buku terjual
So that tahu performa toko.
AC:
- [ ] Total omzet (order paid) per hari/bulan.
- [ ] Jumlah order & buku terjual.
- [ ] Daftar order terbaru + statusnya.
```

### 4.2 Functional Requirements

| ID | Requirement | Prioritas |
|---|---|---|
| FR1 | Pemilik CRUD item buku dengan field kondisi & status | P0 |
| FR2 | Katalog publik hanya menampilkan item `available` | P0 |
| FR3 | Pencarian judul/penulis + filter kategori, bahasa, segmen umur, kondisi, harga | P0 |
| FR4 | Keranjang menampung beberapa item (tiap item qty=1) | P0 |
| FR5 | Checkout membuat order + reserve item secara atomik | P0 |
| FR6 | Pemilik dapat menandai order `paid` / `cancelled` | P0 |
| FR7 | Order `paid` → item `sold`; order `cancelled` → item kembali `available` | P0 |
| FR8 | Dashboard agregasi omzet & penjualan | P0 |
| FR10 | Kategori dikelola pemilik (tabel) + dipakai filter katalog | P0 |
| FR9 | Upload banyak foto per buku | P1 |

### 4.3 Non-Functional Requirements
- **Anti double-sell:** reserve item dalam DB transaction + cek status; pakai pessimistic/optimistic lock.
- **Performa:** katalog paginasi/infinite scroll (Inertia merge props); hindari N+1 (eager load images).
- **Keamanan:** route pemilik dilindungi `auth` + policy/role; checkout butuh verified user (reuse Fortify).
- **Uang:** simpan harga sebagai **integer rupiah** (hindari float). Snapshot harga & judul di `order_items`.
- **Mobile-first:** pemilik kemungkinan input via HP (foto buku pakai kamera).

---

## 5. Data Model (usulan)

> App saat ini hanya punya tabel `users`. Semua di bawah ini baru.

### `books` (katalog item = satu eksemplar fisik)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | bigint PK | |
| title | string | wajib |
| author | string nullable | |
| isbn | string nullable | buku bekas sering tanpa ISBN |
| description | text nullable | |
| condition | enum(`new`,`like_new`,`good`,`fair`,`poor`) | kondisi fisik |
| is_new | boolean default false | baru vs bekas |
| price | unsignedInteger | rupiah, integer |
| status | enum(`available`,`reserved`,`sold`) default `available`, index | |
| cover_image | string nullable | path foto utama |
| category_id | FK nullable → categories | nullable = boleh dikategorikan nanti (input cepat) |
| language | enum(`id`,`en`,`lainnya`) default `id` | filter |
| audience | enum(`anak`,`remaja`,`dewasa`,`umum`) default `umum` | filter |
| sold_at | timestamp nullable | |
| timestamps | | |

### `book_images` (P1 — multi-foto)
`id, book_id FK, path, sort_order, timestamps`

### `categories` (P0)
`id, name, slug, parent_id (nullable, untuk 2-level fase 2), sort_order, timestamps`

**Kategorisasi = multi-dimensi (jangan campur jadi satu kolom):**

| Sumbu | Tempat | Tipe | Guna |
|---|---|---|---|
| Genre | tabel `categories` → `books.category_id` | 1 primary, pemilik bisa tambah | navigasi utama |
| Bahasa | `books.language` | enum | filter |
| Segmen umur | `books.audience` | enum | filter |
| Kondisi | `books.condition` | enum | filter |
| Baru/bekas | `books.is_new` | bool | filter |

- Genre = **tabel**, bukan enum → pemilik tambah genre sendiri tanpa ubah kode.
- 1 buku = 1 genre primary di MVP. Tags many-to-many (lintas-kategori: "langka", "edisi pertama") = fase 2.
- Flat dulu; `parent_id` disiapkan tapi tidak dipakai sampai kategori membludak.

**Seed kategori awal (~14, flat):**
```
Fiksi: Novel · Sastra · Fantasi & Sci-Fi · Misteri & Thriller · Komik & Manga
Non-Fiksi: Biografi · Sejarah · Pengembangan Diri · Bisnis & Ekonomi ·
           Agama & Religi · Sains & Teknologi · Psikologi & Filsafat
Pendidikan: Buku Pelajaran & Kuliah · Kamus & Bahasa
Anak: Buku Anak
```

### `orders`
| Kolom | Tipe | Catatan |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users nullable | pelanggan (nullable utk offline fase 2) |
| status | enum(`pending`,`paid`,`completed`,`cancelled`) default `pending`, index | |
| channel | enum(`online`,`offline`) default `online` | siapkan POS fase 2 |
| total | unsignedInteger | snapshot |
| customer_name | string | snapshot |
| customer_phone | string | |
| fulfillment | enum(`pickup`,`ship`) | ambil di toko / kirim |
| shipping_address | text nullable | |
| payment_method | enum(`transfer`,`cash`) default `transfer` | MVP: transfer manual |
| shipping_cost | unsignedInteger default 0 | ongkir manual; 0 jika pickup |
| paid_at | timestamp nullable | |
| timestamps | | |

### `order_items`
| Kolom | Tipe | Catatan |
|---|---|---|
| id | bigint PK | |
| order_id | FK → orders | |
| book_id | FK → books | item unik |
| title | string | snapshot judul |
| price | unsignedInteger | snapshot harga |
| timestamps | | |

**Relasi:** Order hasMany OrderItem; OrderItem belongsTo Book; Book hasMany BookImage; Book belongsTo Category; Order belongsTo User.

**Catatan model:** Karena tiap buku unik, `order_items` selalu qty=1, jadi tidak perlu kolom quantity. Saldo stok = `books.where(status,'available')->count()`.

---

## 6. Spesifikasi Teknis

### 6.1 Routes (usulan)
```
# Publik
GET  /catalog                 katalog (index)        → CatalogController@index
GET  /catalog/{book}          detail buku            → CatalogController@show

# Pelanggan (auth)
POST /cart/{book}             tambah ke keranjang
GET  /cart                    lihat keranjang
POST /checkout                buat order (reserve)   → CheckoutController@store
GET  /orders                  riwayat order pelanggan
GET  /orders/{order}          detail order + instruksi bayar

# Pemilik (auth + policy)
GET    /admin/books           kelola item            → Admin\BookController
POST   /admin/books           tambah item
PUT    /admin/books/{book}    edit item
DELETE /admin/books/{book}    hapus item
GET    /admin/orders          kelola order
PATCH  /admin/orders/{order}  ubah status (paid/cancel)
GET    /admin/dashboard       omzet & laporan
```

### 6.2 Alur kunci — Checkout (anti double-sell)
```
Pelanggan klik "Checkout"
  └─ DB transaction:
       1. Ambil item di keranjang dengan lockForUpdate()
       2. Pastikan SEMUA item masih status `available`
          - jika ada yang tidak → rollback, kasih pesan "buku X sudah laku"
       3. Buat order (pending) + order_items (snapshot judul+harga)
       4. Set item → `reserved`
       5. Commit
  └─ Tampilkan instruksi transfer bank
Pemilik verifikasi transfer → PATCH order = paid
  └─ item `reserved` → `sold`, sold_at = now
Order cancelled / expired → item `reserved` → `available`
```

### 6.3 Auth & peran
- Reuse Fortify (sudah ada): registrasi, login, verifikasi email.
- Tambah penanda peran pemilik: kolom `is_admin` di `users` (MVP sederhana) atau policy. Route `/admin/*` dijaga gate `admin`.
- Checkout butuh user login (boleh + verified).

### 6.4 Frontend (Inertia React)
Halaman baru di `resources/js/pages`:
- `catalog/index.tsx`, `catalog/show.tsx`
- `cart/index.tsx`, `checkout/index.tsx`
- `orders/index.tsx`, `orders/show.tsx`
- `admin/books/index.tsx`, `admin/books/form.tsx`
- `admin/orders/index.tsx`, `admin/dashboard.tsx`

Pakai Wayfinder untuk panggil route (typed), komponen Radix yang sudah ada untuk UI.

---

## 7. Risiko & Mitigasi

| Risiko | Prob | Dampak | Mitigasi |
|---|---|---|---|
| Input buku lambat → pemilik malas pakai | Sedang | Tinggi | Uji alur input 50 buku sebelum bangun penuh; form 1 layar; foto via HP |
| Pelanggan ragu beli buku bekas online | Tinggi | Tinggi | Foto kondisi asli (P1 dinaikkan), label kondisi jelas, deskripsi jujur |
| Double-sell stok unik | Sedang | Tinggi | DB transaction + lockForUpdate (FR5/6.2) |
| Pembayaran manual ribet | Sedang | Sedang | Fase 2: payment gateway; MVP cukup konfirmasi transfer |
| Scope melebar (POS, ongkir, untung) | Tinggi | Sedang | Kunci ke MVP; sudah ditandai out-of-scope |

---

## 8. Fase & Milestone (usulan, dev solo)

| Fase | Isi | Output |
|---|---|---|
| **Fase 0 — Validasi (1 minggu)** | Input 50 buku via form sementara; sebar link katalog ke pelanggan WA | Ukur waktu/buku & sinyal demand |
| **Fase 1 — Inti stok (P0)** | Model `books` + CRUD admin + katalog publik | Buku bisa didata & dilihat online |
| **Fase 2 — Jualan (P0)** | Keranjang + checkout + anti double-sell + order | Transaksi online terekam otomatis |
| **Fase 3 — Operasi (P0)** | Konfirmasi bayar + dashboard omzet | Pemilik kelola order & lihat performa |
| **Fase 4 — Polish (P1)** | Multi-foto, kategori, filter lanjut | Katalog lebih meyakinkan |

---

## 9. Keputusan Terkunci (2026-06-20)

1. **Pembayaran:** transfer bank manual. Pemilik cek mutasi → tandai `paid`. Payment gateway = fase 2.
2. **Akun:** checkout **wajib login** (reuse Fortify). `orders.user_id` not null untuk online. Guest = tidak didukung MVP.
3. **Pengiriman:** **pickup + kirim**, ongkir **diinput manual** pemilik (`orders.shipping_cost`). `total = Σ harga item + shipping_cost`. Ongkir otomatis (kurir) = fase 2.

### Open Questions (sisa)
4. Simpan harga modal (`cost_price`) sejak awal untuk laporan untung fase 2? (Murah ditambah sekarang, nanti susah backfill.)
5. Foto buku MVP: 1 cover cukup, atau multi-foto dinaikkan ke P0? (Buku bekas → foto kondisi asli ningkatin konversi.)
