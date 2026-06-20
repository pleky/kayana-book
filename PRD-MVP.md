# PRD — Kayana Book (Sistem Toko Buku Bekas)

**Status:** Draft v2 · **Tanggal:** 2026-06-20 · **Produk:** toko buku bekas fisik + online.
Dokumen ini = *apa & kenapa*. Detail teknis (data model, alur, DB, deploy, keputusan arsitektur) ada di [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 1. Ringkasan Eksekutif

**Masalah.** Toko buku Kayana (fisik + online) menjual mayoritas **buku bekas** dengan stok hampir selalu unik (jarang >2 eksemplar judul sama) plus sebagian buku baru. Penjualan masih dicatat manual (lambat, salah), belum ada toko online sendiri, dan tidak ada visibilitas omzet/untung.

**Solusi.** Sistem web yang memodelkan **1 buku fisik = 1 item** (kondisi, harga, foto, status jual). Pelanggan browsing katalog + checkout online → transaksi terekam otomatis & item ditandai terjual. Dashboard kecil untuk omzet dan buku terjual.

**Dampak bisnis.**
- Hilangkan pencatatan manual untuk penjualan online (0 input manual).
- Buka kanal jualan online sendiri (tak tergantung marketplace/WA).
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

- **Who:** (1) Pemilik — kelola stok, harga, lihat laporan. (2) Pelanggan — cari & beli buku online.
- **What:** Tidak ada sistem yang menangani stok unik + jual online + rekam otomatis.
- **When:** Tiap transaksi harian; tiap buku bekas masuk harus didata.
- **Why (root cause):** Buku bekas = inventory unik → model "judul + qty besar" tidak cocok. POS retail umum asumsikan stok seragam.
- **Impact kalau dibiarkan:** kehilangan penjualan online, salah catat, tidak tahu margin.

**Batasan kunci (membentuk desain):**
> Stok unik. Tiap eksemplar fisik berdiri sendiri: kondisi & harga bisa beda walau judul sama. Sekali terjual → hilang dari katalog. Tidak ada "restock judul yang sama".

---

## 3. Solusi & Scope

### 3.1 Prinsip desain
1. **1 item = 1 buku fisik.** Bukan judul+qty. Stok tersedia = jumlah item berstatus `available`.
2. **Input cepat di atas segalanya.** Pemilik input ratusan buku; alur input = pembunuh utama adopsi.
3. **Anti double-sell.** Item dikunci atomik saat checkout (lihat ARCHITECTURE §4.1).

### 3.2 In Scope (MVP)
| # | Fitur | Prioritas |
|---|---|---|
| F1 | CRUD item buku (judul, penulis, kondisi, baru/bekas, harga, modal, status) | P0 |
| F2 | Katalog publik (list + detail, cari & filter) | P0 |
| F3 | Keranjang + checkout online (pelanggan login) | P0 |
| F4 | Auto-record: checkout → buat order + item `reserved`; lunas → item `sold` | P0 |
| F5 | Anti double-sell (reserve item atomik saat checkout) | P0 |
| F6 | Auto-lepas reserve kadaluarsa (TTL) agar stok tak terkunci | P0 |
| F7 | Konfirmasi pembayaran manual (transfer bank, pemilik tandai lunas) | P0 |
| F8 | Dashboard: omzet, jumlah order, buku terjual | P0 |
| F9 | Kategori/genre (dikelola pemilik) + filter (kategori, bahasa, umur, kondisi, harga) | P0 |
| F10 | Foto buku (≥1 wajib, multi-foto kondisi asli) | P0 |

### 3.3 Out of Scope (fase 2+)
- POS kasir walk-in offline (model sudah disiapkan via field `channel`).
- Payment gateway otomatis (Midtrans/Xendit).
- Ongkir otomatis / integrasi kurir.
- Laporan untung/margin detail (modal sudah disimpan sejak MVP, laporannya fase 2).
- Tags lintas-kategori, kategori 2-level.
- Manajemen supplier/penerbit; diskon, voucher, membership.

### 3.4 MVP — definisi "jalan"
Pelanggan: buka katalog → lihat detail (kondisi+foto) → keranjang → checkout → instruksi transfer.
Pemilik: input buku < 2 menit → tandai order lunas → buku otomatis hilang dari katalog → lihat omzet di dashboard.

---

## 4. User Stories & Requirements

### 4.1 User Stories (P0)
```
US-1 — Pemilik input buku
As pemilik, I want input buku bekas cepat (judul, kondisi, harga, foto)
So that stok online cepat bertambah.
AC:
- [ ] Form 1 layar; field wajib: judul, harga, kondisi, status, ≥1 foto.
- [ ] Penulis, ISBN, deskripsi, modal, kategori = opsional (boleh belakangan).
- [ ] Simpan < 2 menit; langsung muncul di katalog (jika available).
```
```
US-2 — Pelanggan beli online
As pelanggan, I want cari buku & checkout
So that bisa beli tanpa chat WA.
AC:
- [ ] Katalog tampilkan hanya item available.
- [ ] Detail tampil kondisi + foto + harga.
- [ ] Checkout butuh login; isi nama, HP, pickup/kirim (+alamat).
- [ ] Setelah checkout, item tak bisa dibeli orang lain.
```
```
US-3 — Auto-record + anti double-sell
As sistem, saat checkout
So that transaksi terekam & stok akurat.
AC:
- [ ] Order pending, item reserved (atomik).
- [ ] Lunas → order paid, item sold, sold_at terisi.
- [ ] Item reserved/sold tak muncul di katalog & tak bisa checkout.
- [ ] Dua pelanggan tak bisa checkout item sama (conditional update).
- [ ] Pending kadaluarsa → otomatis batal, item kembali available.
```
```
US-4 — Dashboard pemilik
As pemilik, I want lihat omzet & buku terjual
So that tahu performa toko.
AC:
- [ ] Omzet (order paid) per hari/bulan.
- [ ] Jumlah order & buku terjual.
- [ ] Daftar order terbaru + status.
```

### 4.2 Functional Requirements
| ID | Requirement | Prioritas |
|---|---|---|
| FR1 | Pemilik CRUD item buku (kondisi, status, harga, modal) | P0 |
| FR2 | Katalog publik hanya item `available` | P0 |
| FR3 | Cari judul/penulis + filter kategori, bahasa, umur, kondisi, harga | P0 |
| FR4 | Keranjang menampung beberapa item (tiap item qty=1) | P0 |
| FR5 | Checkout buat order + reserve item secara atomik | P0 |
| FR6 | Pending kadaluarsa otomatis batal + lepas reserve (TTL job) | P0 |
| FR7 | Pemilik tandai order `paid`/`completed`/`cancelled` | P0 |
| FR8 | `paid` → item `sold`; `cancelled` → item `available` | P0 |
| FR9 | Dashboard agregasi omzet & penjualan | P0 |
| FR10 | Kategori dikelola pemilik + dipakai filter | P0 |
| FR11 | Upload ≥1 foto (multi-foto didukung) | P0 |

> NFR & spesifikasi teknis (anti double-sell, performa, keamanan, uang) → ARCHITECTURE §9.

---

## 5. Risiko & Mitigasi

| Risiko | Prob | Dampak | Mitigasi |
|---|---|---|---|
| Input buku lambat → pemilik malas pakai | Sedang | Tinggi | Uji input 50 buku (Fase 0); form 1 layar; foto via HP |
| Pelanggan ragu beli buku bekas online | Tinggi | Tinggi | Foto kondisi asli (P0), label kondisi jelas, deskripsi jujur |
| Double-sell stok unik | Sedang | Tinggi | Conditional update atomik (ARCHITECTURE §4.1) |
| Item reserved terkunci selamanya | Sedang | Tinggi | TTL + job pelepas (FR6, ARCHITECTURE §4.3) |
| Pembayaran manual ribet | Sedang | Sedang | MVP cukup konfirmasi transfer; gateway fase 2 |
| Scope melebar (POS, ongkir, untung) | Tinggi | Sedang | Kunci ke MVP; ditandai out-of-scope |

---

## 6. Fase & Milestone (dev solo)

| Fase | Isi | Output |
|---|---|---|
| **Fase 0 — Validasi (1 minggu)** | Input 50 buku via form sementara; sebar link katalog ke pelanggan WA | Ukur waktu/buku & sinyal demand |
| **Fase 1 — Inti stok (P0)** | Setup Postgres; model `books`+`categories`+`book_images`; CRUD admin; katalog+filter; seed kategori | Buku bisa didata & dilihat online |
| **Fase 2 — Jualan (P0)** | Keranjang + checkout + anti double-sell + TTL job + order | Transaksi online terekam otomatis |
| **Fase 3 — Operasi (P0)** | Konfirmasi bayar + dashboard omzet | Pemilik kelola order & lihat performa |
| **Fase 4 — Polish (P1)** | Kategori 2-level, tags, search lanjut, UX katalog | Katalog lebih kuat |

---

## 7. Keputusan Produk Terkunci (2026-06-20)

1. **Pembayaran:** transfer bank manual. Pemilik cek mutasi → tandai `paid`. Gateway = fase 2.
2. **Akun:** checkout **wajib login** (reuse Fortify). Guest tak didukung MVP.
3. **Pengiriman:** **pickup + kirim**, ongkir **diinput manual** pemilik. `total = subtotal + ongkir` (server-side).
4. **Harga modal (`cost_price`):** **disimpan sejak MVP** (nullable, privat). Buka laporan untung fase 2 tanpa backfill mustahil.
5. **Foto:** **dinaikkan ke P0**, wajib ≥1, multi-foto didukung (tabel `book_images`). Foto kondisi asli = kunci konversi buku bekas.
6. **Database:** **PostgreSQL** (ARCHITECTURE ADR-002).
7. **Dokumen teknis dipisah:** `ARCHITECTURE.md` (data model, alur, ADR).
