# PRD — Refactor & Redesign Halaman Detail Pesanan

- **Produk:** Kayana Book (Laravel 13 + Inertia v3 + React 19 + Tailwind v4)
- **Halaman:** `resources/js/pages/orders/show.tsx` (buyer) — `GET /pesanan/{order}`
- **Status:** Implemented (2026-06-22)
- **Tanggal:** 2026-06-22
- **Penulis:** (diisi)

> Catatan revisi pasca-implementasi: **timeline pengiriman + tracking RajaOngkir
> dibatalkan** (API cek resi belum didukung). Salin resi dipindah ke **timeline
> riwayat**. Bukti jadi **multi-foto (maks 3) + partial upload**. Riwayat
> perubahan juga menangkap **perubahan judul**. Payment channel di-humanize.

---

## 1. Latar Belakang & Masalah

Detail pesanan saat ini menampilkan blok terpisah (pembayaran, info dikirim+resi,
tombol "Pesanan diterima", ringkasan item) tanpa **alur visual** progres pesanan.
Pembeli sulit:

- Melihat **di mana posisi** pesanannya (pending → bayar → kirim → selesai).
- Tahu **apa saja yang berubah** (ongkir diisi, harga diperbarui, dibayar, dikirim).
- **Menyalin nomor resi** dengan cepat; resi kurang menonjol.
- Memberi **bukti penerimaan** saat menyelesaikan pesanan.
- Melihat **progres pengiriman** secara terstruktur.

Tujuan: redesign jadi halaman berbasis **timeline** yang informatif + fitur resi
& bukti terima.

## 2. Goals / Non-Goals

**Goals**
- G1: Timeline **status pesanan** yang jelas (lifecycle).
- G2: Timeline **riwayat perubahan** pesanan (audit ringan: ongkir, reprice,
  bayar, kirim, terima, batal).
- G3: Nomor resi **menonjol** + **copy-to-clipboard**.
- G4: **Upload & tampilkan bukti** saat pesanan diterima.
- G5: Timeline **pengiriman** (diproses → dikirim+resi → diterima).

**Non-Goals**
- Redesign halaman admin order (terpisah; cukup dukung data baru + tampil bukti).
- Chat/komplain, retur/refund.
- Tracking untuk `pickup` (tak ada pengiriman).

## 3. Kondisi Saat Ini (yang sudah ada)

- `orders` status: `pending | paid | shipped | completed | cancelled`
  (check constraint Postgres).
- Timestamp: `created_at`, `paid_at`, `shipped_at`, `expires_at`; `cancel_reason`.
- Pengiriman: `shipping_courier`, `shipping_service`, `shipping_etd`,
  `shipping_tracking_number`. Pembayaran: `payment_gateway`, `payment_channel`.
- Item: snapshot `title`, `price`, `cover_path` (`order_items`).
- Transisi di `app/Services/OrderService.php`: `setShipping`, `markPaid`,
  `markPaidFromGateway`, `markShipped`, `complete`, `cancel`,
  `syncPendingFromBooks` (reprice pending), notifikasi email
  (`OrderReadyToPay/Paid/Shipped/Completed`).
- Buyer action: `confirmReceived` (`POST /pesanan/{order}/terima`) → `complete`.
- **Belum ada:** tabel audit/riwayat, kolom `received_at`/`completed_at`, bukti
  terima, UI timeline, copy resi.

## 4. Persona & User Story

- **Pembeli**: "Saya ingin lihat sekilas posisi pesanan & riwayatnya, salin resi
  cepat, dan unggah foto saat barang sampai."
- **Penjual (admin)**: "Saya ingin lihat bukti terima & riwayat agar mudah
  menyelesaikan sengketa."

## 5. Lingkup Fitur

### F1 — Timeline Status Pesanan (G1)
- Komponen vertikal: langkah **Dibuat → Dibayar → Dikirim → Selesai**
  (untuk `pickup`: **Dibuat → Dibayar → Selesai**, tanpa Dikirim);
  state **Dibatalkan** ditampilkan sebagai jalur merah terminal.
- Tiap langkah: ikon, label, **timestamp** (dari `created_at`, `paid_at`,
  `shipped_at`, `received_at`/`completed_at`), state: selesai / aktif / belum.
- Sumber data: kolom timestamp order (tambah `completed_at`/`received_at`).

### F2 — Timeline Riwayat Perubahan (G2) — *butuh audit log*
- Daftar kronologis peristiwa pesanan: dibuat, **ongkir diisi** (Rp), **harga
  diperbarui**, dibayar (channel), dikirim (resi), diterima, selesai,
  dibatalkan (alasan).
- **Detail event `repriced`** (terimplementasi): tangkap **perubahan harga DAN
  judul** tiap buku. `meta.items[]` = `{name, price_from?, price_to?, title_from?,
  title_to?}`; UI menampilkan "Judul: X → Y" dan/atau "Harga: Rp.. → Rp..".
  Deskripsi: "Detail buku diperbarui."
- **Humanize**: channel pembayaran di event `paid` di-humanize
  (`OrderService::humanizePaymentChannel`, mis. `qris`→QRIS, `bca_va`→Virtual
  Account BCA).
- Data baru: tabel **`order_events`** (lihat §6). Dicatat di tiap transisi
  `OrderService` + `setShipping` + `syncPendingFromBooks` (saat berubah).
- UI: timeline ringkas dgn waktu relatif ("2 jam lalu") + detail.

### F3 — Nomor Resi: Copy di Timeline Riwayat (G3)
- **Terimplementasi:** nomor resi + tombol **Salin** muncul pada event
  **`shipped`** di timeline riwayat (`OrderEventList`), bukan kartu terpisah.
- Salin pakai Clipboard API + fallback non-HTTPS (`execCommand`) → toast.

### F4 — Bukti Pengiriman (G4) — **opsional, ship saja, multi (maks 3), partial**
- Hanya `fulfillment = ship`, status `shipped`/`completed`. Konfirmasi terima
  ("Pesanan diterima") **terpisah** dari unggah bukti.
- **Multi-foto + partial upload (terimplementasi):** unggah **maks 3 foto**,
  bisa bertahap (endpoint append, divalidasi `max:sisa-slot`, dapat dipanggil
  berulang). Kolom **`received_proof_paths` (json array)**.
- **Penyimpanan privat:** disk privat (`storage/app/private/order-proofs/`).
  Akses per foto via route ber-otorisasi `GET /pesanan/{order}/bukti/{index}`
  (pemilik atau admin) → `Storage::disk('local')->response`.
- Validasi: tiap image maks 5MB.

### F5 — Timeline Pengiriman + Tracking RajaOngkir (G5) — **DIBATALKAN**
> Tak diimplementasi: API cek resi (waybill) belum didukung akun. Komponen
> shipping-timeline + endpoint `/lacak` + `RajaOngkirService::trackWaybill` +
> config `tracking_enabled` **dihapus**. Progres pengiriman cukup terlihat dari
> timeline status (F1) + event `shipped` (resi) di riwayat (F2/F3). Bisa
> dihidupkan lagi nanti bila API tersedia.

~~Rencana awal (tidak dipakai):~~
- Sub-timeline khusus pengiriman (hanya `fulfillment = ship`): **Diproses
  (paid)** → **Dikirim** (resi + tanggal) → **Diterima** (tanggal + bukti).
- **Integrasi RajaOngkir (keputusan, Fase 4)**: saat ada resi + status `shipped`,
  tarik **manifest waybill** dari RajaOngkir (Komerce) → tampilkan langkah
  perjalanan paket (tanggal, kota, deskripsi, status terkini).
  - **PRASYARAT (MUST verify):** endpoint tracking/waybill **belum tentu** ada di
    tier akun Komerce kita (sering beda paket dari cost/search). Verifikasi key
    sebelum implement; bila tak didukung → fitur ini di-skip via feature-flag,
    sisa F5 (timeline lokal) tetap jalan.
  - **Feature-flag** `services.rajaongkir.tracking_enabled` (default false).
  - `RajaOngkirService::trackWaybill(string $awb, string $courier): ?array`
    (pola existing: Http + cache + circuit breaker + graceful `null`).
  - **On-demand** (tombol "Lacak"), **bukan** auto tiap load — kuota harian
    (`daily_limit` 90) dipakai bareng cost/search.
  - **Cache**: in-transit 1–3 jam; bila status `delivered` → cache permanen
    (tak perlu hit lagi).
  - **Mapping kurir**: pastikan `shipping_courier` (jne/jnt/sicepat) cocok param
    tracking Komerce.
  - Graceful: API gagal/kuota habis/kurir tak didukung/flag off → tampilkan
    "Pelacakan tak tersedia — cek resi di situs kurir" + link.
- Jika `received_proof_path` ada → tampil di langkah Diterima.

## 6. Perubahan Data (Backend)

### 6.1 Migration `add_completion_to_orders` (+ `change_..._proofs_to_json`)
- `completed_at` (timestamp, nullable) — **terminal**; di-set tiap `complete()`
  dari sumber **apa pun** (buyer confirm / pickup seller / auto-complete scheduler).
- `received_at` (timestamp, nullable) — khusus **konfirmasi terima oleh buyer**
  (ship). Auto-complete scheduler → hanya `completed_at`, `received_at` null.
- **`received_proof_paths` (json, nullable)** — array path bukti (maks 3),
  cast `array`. (Awalnya `received_proof_path` string → diubah jadi json.)

**Matrix penyelesaian:**
| Jalur | `received_at` | `completed_at` | bukti |
|---|---|---|---|
| Buyer "Pesanan diterima" (ship) | ✓ | ✓ | opsional |
| Seller "Tandai selesai" (pickup) | — | ✓ | — |
| Auto-complete scheduler | — | ✓ | — |

Timeline F5 "Diterima" pakai `received_at` (fallback `completed_at`).

### 6.2 Migration `create_order_events`
| kolom | tipe | ket |
|---|---|---|
| id | bigint pk | |
| order_id | fk → orders cascade, **index** | |
| type | string | enum: `created,ongkir_set,repriced,paid,shipped,received,completed,cancelled` |
| description | string | teks human-readable (ID) |
| meta | json nullable | whitelist (lihat bawah) |
| created_at | timestamp | dipakai sbg urutan timeline (**no `updated_at`**) |

- **`meta` whitelist** (jangan bocorkan data privat penjual, mis. `cost_price`):
  - `repriced`: `{ items: [{title, from, to}] }` (harga jual saja).
  - `ongkir_set`: `{ amount }`. `shipped`: `{ resi, courier, service }`.
  - `cancelled`: `{ reason }`. Lainnya: kosong.
- Model `OrderEvent` (enum PHP `OrderEventType` + cast) + relasi
  `Order hasMany events` (orderBy `created_at`).
- Helper `OrderService::recordEvent(Order,$type,$desc,$meta=[])`; dipanggil di
  `markPaid/markShipped/complete/cancel/setShipping/syncPendingFromBooks`.
- **Atomic:** `recordEvent` dipanggil **di dalam `DB::transaction` transisi**
  yang sama, supaya audit tak tercatat saat state rollback.
- **Dedup repriced:** hanya catat saat benar-benar berubah; jangan catat event
  `repriced` identik (`items from/to` sama) berturut-turut. (Catatan: `show`
  bersifat GET tapi sudah ber-side-effect via `syncPendingFromBooks` — dedup +
  guard "hanya saat changed" mencegah spam.)
- **Tanpa backfill** (keputusan): pesanan lama tak diisi event; timeline status
  tetap dari timestamp. Event mulai tercatat untuk pesanan/transisi baru.

## 7. API / Endpoint (terimplementasi)
- `confirmReceived` (`POST /pesanan/{order}/terima`): set `received_at` + event
  `received`, lalu `complete()`. **Tanpa** field bukti (bukti terpisah). Valid
  hanya `fulfillment = ship` & status `shipped`.
- **`uploadProofs`** (`POST /pesanan/{order}/bukti`, name `orders.proofs.store`):
  `photos[]` (image, maks `sisa-slot`, total ≤3) → append ke
  `received_proof_paths` (disk privat). Partial: callable saat `shipped`/
  `completed`. Otorisasi pemilik.
- **`proof`** (`GET /pesanan/{order}/bukti/{index}`, name `orders.proof`): stream
  foto ke pemilik/admin; 404 bila index kosong.
- ~~`track` / `/lacak`~~ — **dihapus** (F5 dibatalkan).
- **Show** `OrderController@show`: props tambahan `events`, `proofCount`,
  `maxProofs` + field order baru. Tetap `syncPendingFromBooks` (pending).
- Tak ada perubahan kontrak gateway/pembayaran.

## 8. UI / Layout (wireframe)

```
Pesanan #123                              [Badge: Dikirim]
┌───────────────────────────── Timeline status ─────────────────────────────┐
│  ●Dibuat ─ ●Dibayar ─ ◉Dikirim ─ ○Selesai      (ikon+tanggal tiap langkah)  │
└────────────────────────────────────────────────────────────────────────────┘
┌── Resi (highlight) ──┐   ┌── Pengiriman (timeline) ──┐
│ JNE  REG  ETD 2-3hr  │   │ Diproses 21 Jun           │
│ ┌ JNE0099 ┐ [Salin]  │   │ Dikirim  22 Jun (resi)    │
│ └─────────┘          │   │ Diterima  —               │
└──────────────────────┘   └───────────────────────────┘
[ Pesanan diterima → buka aksi unggah bukti ]   (saat shipped)
┌── Riwayat perubahan ──┐
│ • Dibuat — 21 Jun     │
│ • Ongkir diisi Rp18rb │
│ • Harga diperbarui …  │
│ • Dibayar (QRIS)      │
│ • Dikirim — resi …    │
└───────────────────────┘
[ Ringkasan item + total ]   (existing, snapshot)
```

- Komponen baru FE: `OrderStatusTimeline`, `ShippingTimeline`, `OrderEventList`,
  `TrackingNumberCard` (copy), `ReceiveProofDialog` (upload + preview).
- Reuse: `Reveal`, `Badge`, `Button`, `Dialog`, token tema (navy/brand/sky),
  ikon Lucide, `useFlashToasts`/`toast`. No emoji.
- A11y: tombol salin `aria-label`, fokus ring, kontras ≥4.5:1, input file ber-label.

## 9. State & Edge Cases
- `pickup`: sembunyikan timeline pengiriman & resi; status timeline tanpa
  "Dikirim".
- `cancelled`: timeline berhenti, tampil alasan; sembunyikan aksi.
- `pending` + ongkir belum diset (ship): langkah Dibayar belum aktif; tampil
  status menunggu ongkir (existing).
- Resi kosong saat `shipped`: kartu resi tampil "menunggu nomor resi".
- Bukti gagal upload: error inline, tak mengubah status.
- Bukti **hanya `ship`** (keputusan); pickup tak ada opsi unggah bukti.
- `cancelled` dari `pending` (belum bayar): timeline = Dibuat → Dibatalkan.
- Copy resi di non-secure context (tanpa HTTPS): pakai fallback
  (`execCommand('copy')` / select), bila gagal tampilkan pesan.
- Tracking flag off / tak didukung: sembunyikan tombol Lacak, timeline lokal
  tetap tampil.

## 10. Acceptance Criteria
- AC1: Timeline status menampilkan langkah benar + timestamp sesuai
  `created_at/paid_at/shipped_at/received_at` untuk ship & pickup.
- AC2: Setiap transisi (ongkir, reprice, paid, shipped, received, completed,
  cancelled) tercatat di `order_events` & tampil di timeline riwayat.
- AC3: Tombol Salin menyalin resi ke clipboard + feedback; resi tampil mono &
  menonjol.
- AC4: Buyer bisa menyelesaikan **tanpa** bukti (opsional); bila unggah, file
  tervalidasi (image ≤5MB), tersimpan di **disk privat**, `received_at` &
  `received_proof_path` terisi, dan hanya bisa diakses pemilik/admin via route
  `/bukti` (non-pemilik → 403).
- AC5: Timeline pengiriman tampil untuk `ship` dengan tanggal & bukti; manifest
  tracking muncul bila flag aktif & API sukses, jika tidak → fallback rapi.
- AC6: Pesanan lama tetap tampil rapi (timeline dari timestamp; **tanpa**
  backfill event).
- AC7: Event hanya tercatat saat transisi sukses (atomic); `repriced` tak dobel
  untuk perubahan identik berturut-turut.

## 11. Phasing (hasil akhir)
- **Fase 1 ✅:** migration (events + completion), `OrderEvent` + `recordEvent` di
  transisi, props `events` di show.
- **Fase 2 ✅:** timeline status (centered) + riwayat (repriced: judul+harga,
  payment humanized) + salin resi di event `shipped`.
- **Fase 3 ✅:** bukti pengiriman multi (maks 3) + partial upload → disk privat +
  route auth `/bukti/{index}` + galeri di detail.
- **Fase 4 ❌ dibatalkan:** tracking RajaOngkir (API resi belum didukung).

## 12. Testing
- Unit/Feature (Pest):
  - `recordEvent` terpanggil & event tersimpan di tiap transisi
    (`OrderService`), termasuk `repriced` saat `syncPendingFromBooks` berubah.
  - `confirmReceived` **tanpa** file → tetap `completed` (opsional); **dengan**
    file → bukti tersimpan di disk privat + `received_at`; tanpa kepemilikan →
    403; status bukan `shipped` / `fulfillment != ship` → 422.
  - Route `/bukti`: pemilik & admin → file; non-pemilik → 403; tak ada → 404.
  - Tracking: `Http::fake` sukses → manifest; gagal/flag off → fallback (null),
    tak error.
  - `show` mengirim `events` + field baru.
- Manual: lifecycle penuh (pending→paid→shipped→received) cek timeline, copy
  resi, upload bukti; pickup & cancelled; pesanan lama.
- Wajib: `vendor/bin/pint`, `npx tsc --noEmit`, `npm run build`, full Pest hijau.

## 13. Risiko
- **Privasi bukti** (mitigasi): disk **privat** + route ber-otorisasi (§F4/§7),
  bukan `public`. Tak perlu `storage:link` untuk bukti.
- **RajaOngkir tracking** (eksternal): dukungan tier akun belum pasti → verifikasi
  + feature-flag + graceful fallback (§F5). Tanpa ini, F5 tetap jalan tanpa
  manifest.
- **Kuota RajaOngkir**: tracking berbagi `daily_limit` 90/hari → on-demand +
  cache panjang (delivered = permanen).
- **GET ber-side-effect** (`show` → reprice + event): mitigasi dgn guard
  "hanya saat changed" + dedup `repriced`.
- **Konsistensi event**: satu helper `recordEvent` + dalam transaksi transisi.

## 14. Keputusan (Open Questions — RESOLVED)
1. Bukti penerimaan → **OPSIONAL**.
2. Bukti hanya untuk **`ship`** (belum pakai third party untuk pickup).
3. Timeline riwayat → event `repriced` cukup tampilkan **judul + harga** tiap
   buku yang berubah (`from → to`).
4. **Tanpa backfill** — pesanan baru saja yang akan punya event.
5. ~~Integrasikan RajaOngkir~~ — **dibatalkan** saat implementasi (API cek resi
   belum didukung akun). Bisa dihidupkan lagi nanti.
