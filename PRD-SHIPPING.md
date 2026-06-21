# PRD — Pengiriman: Cek Ongkir (RajaOngkir) + Alamat Tersimpan

**Status:** Draft v1 · **Tanggal:** 2026-06-21 · **Produk:** Kayana Book (toko buku bekas/baru online).
Dokumen ini melanjutkan [`PRD-MVP.md`](PRD-MVP.md) §3.3 (item out-of-scope MVP: "ongkir otomatis / integrasi kurir") yang kini dinaikkan jadi fitur. Detail arsitektur umum lihat [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 1. Ringkasan & Tujuan

**Masalah.** Saat checkout `ship`, pelanggan hanya mengetik alamat bebas (free-text) dan **ongkir diisi manual oleh pemilik** setelah order masuk. Pelanggan tak tahu estimasi ongkir saat memesan; pemilik harus cek manual tiap order.

**Solusi.** (1) Pelanggan menyimpan beberapa **alamat** terstruktur dan memilih satu saat checkout. (2) Sistem **mengecek ongkir via RajaOngkir (Komerce API V2)** sebagai **acuan/estimasi** yang langsung mengisi `shipping_cost`. Pemilik tetap punya override manual.

**Dampak.** Kurangi kerja manual pemilik; pelanggan dapat estimasi ongkir saat checkout; alamat tak perlu diketik ulang.

**Catatan kunci.** Ongkir = **estimasi/acuan**, bukan harga terkunci mati — pemilik tetap final say. Bukan tujuan: pembayaran otomatis, tracking resi, multi-paket.

---

## 2. Keputusan Terkunci (2026-06-21)

| # | Keputusan |
|---|---|
| 1 | API: **RajaOngkir Komerce V2** (akun sudah dimiliki). |
| 2 | Granularitas tujuan: **desa/kecamatan (subdistrict)**. |
| 3 | Berat: **pemilik mengisi `weight_grams` per buku**; default 300 g bila kosong. |
| 4 | Kurir: **jne, jnt, sicepat** (configurable, bisa nambah). |
| 5 | **1 paket gabungan** per order (Σ berat item). |
| 6 | API down → **order tetap masuk**, ongkir cost-pending, pemilik isi manual. |
| 7 | **Tanpa free-ongkir/flat-rate.** Ongkir murni acuan dari RajaOngkir. |

---

## 3. Scope

**In:** alamat tersimpan (CRUD + default) di account settings · field berat per buku (input pemilik) · pilih alamat saat checkout · cek ongkir (kurir+service+cost+etd) sebagai estimasi · estimasi mengisi `shipping_cost` · override manual pemilik (sudah ada).

**Out (fase berikut):** payment gateway · tracking AWB/resi · multi-paket/split shipment · COD/pickup point · free-ongkir/flat-rate · asuransi.

---

## 4. Spesifikasi API — RajaOngkir Komerce V2 (terverifikasi live 2026-06-21)

- **Base URL:** `https://rajaongkir.komerce.id/api/v1/`
- **Auth:** header `key: <API_KEY>` → simpan di `.env` (`RAJAONGKIR_KEY`), baca via `config/services.php` (`services.rajaongkir`). **Jangan hardcode/commit.**
- **Client:** Laravel `Http` facade (client tipis sendiri); jangan tambah dependency paket pihak ketiga.

### 4.1 Search alamat (autocomplete, level subdistrict)
```
GET /destination/domestic-destination?search={q}&limit={n}&offset={n}
Header: key: <API_KEY>
```
Response (terverifikasi):
```json
{ "meta": { "code": 200, "status": "success" },
  "data": [
    { "id": 26027, "label": "DAUH PURI, DENPASAR BARAT, DENPASAR, BALI, 80113",
      "province_name": "BALI", "city_name": "DENPASAR",
      "district_name": "DENPASAR BARAT", "subdistrict_name": "DAUH PURI",
      "zip_code": "80113" } ] }
```
Simpan `id` (dipakai sebagai `destination`) + `label` di `user_addresses`.

### 4.2 Hitung ongkir
```
POST /calculate/domestic-cost      (Content-Type: x-www-form-urlencoded)
Header: key: <API_KEY>
Body: origin={id}  destination={id}  weight={gram}  courier=jne:jnt:sicepat  [price=...]
```
- **Multi-kurir = 1 request**, kode dipisah titik dua (`jne:jnt:sicepat`).
- `weight` dalam gram (1 kg = 1000 g).

Response (terverifikasi):
```json
{ "meta": { "code": 200, "status": "success" },
  "data": [
    { "name": "Jalur Nugraha Ekakurir (JNE)", "code": "jne", "service": "REG",
      "description": "Layanan Reguler", "cost": 30000, "etd": "2 day" },
    { "name": "J&T Express", "code": "jnt", "service": "EZ",
      "description": "Reguler", "cost": 27000, "etd": "" } ] }
```
- `cost` = **integer rupiah** (cocok aturan money). 
- `etd` = string tak konsisten (`""`, `"2 day"`, `"3-5 day"`) → tampil apa adanya.
- Tiap kurir bisa banyak service (incl. cargo besar mis. `JTR>200`) → filter cargo atau tampil semua (putuskan saat impl).

### 4.3 Rate limit
- **100 hit / hari** (akun saat ini). **Sangat ketat** → wajib caching agresif + circuit breaker. Lihat §6.5.

---

## 5. Data Model

### 5.1 `user_addresses` (baru — user-owned, pola Fortify settings)
| kolom | tipe | catatan |
|---|---|---|
| id | bigint pk | |
| user_id | FK→users, index, cascadeOnDelete | |
| label | string | "Rumah", "Kantor" |
| recipient_name | string | |
| recipient_phone | string | |
| destination_id | unsignedBigInteger, index | id subdistrict RajaOngkir |
| destination_label | string | denormalized (tampil tanpa call API) |
| postal_code | string nullable | |
| address_line | text | detail jalan/rumah |
| is_default | boolean default false | 1 default/user (enforce server-side) |
| timestamps | | index (user_id, is_default) |

### 5.2 `books` (alter)
| kolom | tipe | catatan |
|---|---|---|
| weight_grams | unsignedInteger nullable | input pemilik; fallback config default (300 g) |

### 5.3 `orders` (alter — semua **SNAPSHOT**, di-copy saat checkout, bukan FK ke alamat)
recipient_name, recipient_phone, shipping_destination_id, shipping_destination_label, shipping_address_line, shipping_courier, shipping_service, shipping_etd, shipping_weight_grams. (`shipping_cost` sudah ada → kini **estimasi**, bisa di-override pemilik.) Opsional `user_address_id` FK nullOnDelete (analytics; snapshot tetap sumber kebenaran).

> Cache (wajib, karena limit 100/hari): `Cache` persisten (database/Redis). Quote key `ongkir:{origin}:{dest}:{weightBucket}:{courierSet}`, **TTL 14–30 hari** (tarif jarang berubah). Search key per query ternormalisasi, TTL 30+ hari. Strategi lengkap di §6.5.

---

## 6. Alur

### 6.1 Pelanggan — kelola alamat (settings)
Tab "Alamat" (reuse `resources/js/layouts/settings/layout.tsx` + pola profile/security). List kartu + badge "Utama". Tambah/edit via FormRequest server-validated: label, penerima, HP, **search lokasi** (debounced → §4.1 → simpan `destination_id`+`label`), kode pos, detail jalan. Set default (server enforce 1/user). Hapus tak memengaruhi snapshot order.

### 6.2 Checkout — cek ongkir (`ship` saja; `pickup` tetap ongkir 0)
1. Pilih alamat tersimpan (atau tambah inline).
2. Server hitung berat = Σ `weight_grams` item (fallback default).
3. Server call §4.2 (origin config, dest alamat, berat, `jne:jnt:sicepat`).
4. Tampil opsi {kurir, service, cost, etd}; pelanggan pilih satu.
5. **Server set `shipping_cost`** (estimasi) → `total = subtotal + shipping_cost`.
6. Quote sebelum reserve item; cocok dengan anti-double-sell + TTL order existing.

### 6.3 Admin — fallback/override
Input `shipping_cost` manual di `admin/orders/show` (sudah ada) = override bila API down / area tak didukung / koreksi estimasi.

### 6.4 Aturan kepercayaan
Client kirim `address_id` + pilihan kurir/service. **Server yang quote & set cost** — tolak cost dari client (konsisten aturan total server-side MVP).

### 6.5 Strategi hemat rate limit (100 hit/hari)
Budget sangat ketat → tiap call harus dihindari kalau bisa. Semua call server-side & ter-cache.

- **a. Cache hasil quote (dampak terbesar).** Key `ongkir:{origin}:{dest}:{weightBucket}:{courierSet}`, TTL **14–30 hari** (tarif jarang berubah), store persisten. Order berikutnya ke area+berat sama = **0 call**.
- **b. Bucket berat.** Bulatkan berat ke atas ke kelipatan **1000 g** sebelum jadi key (RajaOngkir tetap tagih per kg) → banyak order berbagi 1 cache entry.
- **c. Cache search alamat.** Hasil `destination/domestic-destination` di-cache per query (lowercase+trim), TTL 30+ hari (data lokasi ~statis). **Debounce ≥500 ms + minimal 3 karakter**; call hanya saat user berhenti mengetik / klik "cari", bukan tiap keystroke.
- **d. Reuse `destination_id`.** Setelah alamat disimpan, id-nya tersimpan → checkout berikutnya **tak perlu search lagi**. Search = sekali per alamat baru.
- **e. Lazy local cache wilayah (opsional, Phase C).** Upsert tiap hasil search ke tabel lokal `ro_destinations`; cek lokal dulu sebelum API → makin lama makin jarang call.
- **f. Circuit breaker harian.** Hitung call nyata per hari (Cache `ro:calls:{Ymd}`, increment tiap hit). Bila ≥ ambang aman (mis. **90**), **stop call live** → fallback cost-pending (pemilik isi manual). Cegah nabrak limit di tengah hari.
- **g. Quote on-demand.** Jangan auto-quote saat render checkout. Quote hanya saat user pilih alamat & klik **"Cek ongkir"**. Hasil di-cache → re-checkout sama = gratis.
- **h. 1 call = semua kurir.** `courier=jne:jnt:sicepat` sekali jalan (jangan 3 call terpisah).

> Estimasi: dengan cache, call nyata ≈ jumlah alamat baru unik + rute (dest×berat-bucket) baru per hari — jauh di bawah 100 untuk volume toko kecil.

---

## 7. Risiko & Edge Case

| Risiko | Mitigasi |
|---|---|
| API down/timeout/kuota | timeout 3–5s + retry 1x; gagal → cost-pending, order tetap masuk (#6). |
| Tarif berubah quote↔bayar | simpan cost ter-quote di order; estimasi, pemilik final say. Re-quote hanya jika TTL kadaluarsa. |
| Abuse endpoint quote | throttle per user/IP + cache hasil. |
| **Limit 100 hit/hari habis** | cache agresif + circuit breaker harian (§6.5) → fallback cost-pending sebelum nabrak limit. |
| Berat 0/null | fallback config default; pertimbangkan min weight. |
| Area tak didukung | search tak nemu → blok `ship`, sarankan `pickup`/WA. |
| Cart banyak buku | asumsi 1 paket (Σ berat). Buku berat → handle Phase C. |
| Cargo service muncul (mahal) | filter/grup service di UI. |

---

## 8. Fase & RICE

| Fase | Isi | Reach | Impact | Effort | Dependency |
|---|---|---|---|---|---|
| **A — Alamat + berat** | `user_addresses` CRUD (settings), `books.weight_grams` (input form buku), checkout pakai alamat terstruktur (ongkir masih manual) | Tinggi | Sedang | Sedang | — (tanpa API) |
| **B — Live ongkir** | client `Http` RajaOngkir, config origin/key, quote di checkout, opsi kurir, set cost estimasi, **+ cache quote/search + circuit breaker harian (§6.5 a–d,f,g,h) — wajib karena limit 100/hari** | Tinggi | **Tinggi** | Tinggi | A + akun RajaOngkir |
| **C — Resilience+** | throttle endpoint, lazy local `ro_destinations` (§6.5e), config kurir, filter service cargo, polish UI | Sedang | Sedang | Sedang | B |

---

## 9. Success Metrics
- % order `ship` dengan ongkir terisi otomatis (target tinggi).
- Waktu pemilik proses order turun (tak cek ongkir manual).
- Error rate call RajaOngkir < ambang; pantau pemakaian fallback.

---

## 10. Item Konfirmasi saat Implementasi
1. Rotate API key (sudah pernah ter-paste plaintext) → simpan di `.env`.
2. Origin `destination_id` toko (cari via §4.1) → `config/services.php`.
3. Default `weight_grams` (usul 300 g) + min weight order.
4. Filter service cargo di UI ongkir atau tampil semua.
5. Rate limit **100 hit/hari** (diketahui) → set ambang circuit breaker (mis. 90) + TTL cache (§6.5).

---

## 11. Keamanan
- API key **hanya** di `.env` (`RAJAONGKIR_KEY`), dibaca via `config('services.rajaongkir.key')`. Jangan hardcode, jangan commit, jangan kirim ke client. `.env` sudah di-gitignore.
- Semua call RajaOngkir **server-side**; client tak pernah pegang key maupun set cost.
