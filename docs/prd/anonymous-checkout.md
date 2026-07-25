# PRD — Anonymous Checkout (Payment Link)

- **Status:** Implemented (2026-06-22)
- **Tanggal:** 2026-06-22
- **Branch:** feature/catalog

> Koreksi arsitek pasca-implementasi:
> - `CatalogController@show` + index + `HomeController` pakai scope baru
>   `Book::listed()` (available && !is_unlisted) — buku unlisted tak bisa kebuka
>   via slug (404).
> - Pivot tabel **`checkout_link_book`** (relasi set eksplisit; default Laravel
>   `book_checkout_link` → di-override).
> - `orders.channel` enum diperluas: tambah `link` (migrasi check constraint).
> - Guest dideteksi via `channel = 'link'`; bayar guest pakai endpoint terpisah
>   `payGuest` (by `track_token`), **tanpa** reprice (harga link terkunci).

## 1. Latar Belakang
Sebagian transaksi terjadi di luar app (Instagram/offline). Penjual ingin
membuat **link bayar** untuk produk tertentu yang bisa dibayar pembeli **tanpa
akun**, hanya lewat URL rahasia + token. Bukan katalog publik — tak bisa
di-search, hanya pemegang link yang bisa checkout.

## 2. Goals
- G1. Admin buat **checkout link** berisi 1+ buku, siap dibayar.
- G2. Link hanya akses via URL token (`/beli/{token}`), tak muncul di katalog/search.
- G3. Token punya **expiry** + bisa **revoke**; invalid → 404.
- G4. Checkout tanpa akun (guest): nama + HP, bayar (Midtrans/manual).
- G5. Ongkir mode **admin_set** (alamat dikonfirmasi offline) atau **pickup**.
- G6. **Guest tracking page** via token transaksi: status + resi read-only.
- G7. Admin input resi di detail pesanan (kirim resi di luar app).

**Non-Goals**
- Buyer self-serve cek ongkir / RajaOngkir di flow ini (mode admin_set/pickup saja).
- Email/akun guest, simpan alamat, cart multi-produk.
- buyer_choice ongkir (ditunda).

## 3. Keputusan (terkunci)
1. URL **token-only**: `/beli/{token}`.
2. 1 link = 1 transaksi; **boleh >1 buku**, berat di-override admin manual.
3. Token: **expiry + revoke**.
4. Tanpa email. Tracking via **token transaksi** di guest page.
5. Ongkir: **admin_set** + **pickup**.

## 4. Model Data

### 4.1 `checkout_links` (entity baru)
- `id`
- `token` (string unique index, ~40 char acak — kunci akses)
- `status` (string: `active` | `revoked`)
- `expires_at` (timestamp nullable)
- `shipping_mode` (string: `admin_set` | `pickup`)
- `shipping_cost` (int, default 0 — dipakai saat `admin_set`)
- `weight_grams` (int nullable — override; null → jumlah berat buku)
- `label` (string nullable — catatan admin)
- `recipient_name`, `recipient_phone`, `shipping_address` (nullable — admin isi
  bila alamat sudah dikonfirmasi offline)
- `order_id` (FK nullable — diisi saat link dikonsumsi 1 order aktif)
- timestamps

Relasi: `belongsToMany(Book)` via pivot `checkout_link_book` (book_id).

**Validitas link** = `status === active` && (`expires_at` null || future) &&
(tak ada order aktif: `order_id` null **atau** order terkait sudah `cancelled`).

### 4.2 `books` — tambah kolom
- `is_unlisted` (boolean default false). Buku terlampir di link → `true`
  (disembunyikan dari katalog + Postgres FTS). Link revoke/expire/hapus →
  balik `false`. Stok tetap dijaga `reserve` atomik saat checkout.

### 4.3 `orders` — ubah
- `user_id` → **nullable** (guest order).
- `track_token` (string unique index — kunci tracking guest, **beda** dari token
  link).
- `channel` set `link` untuk order anon (kolom channel sudah ada).
- `customer_name`/`customer_phone` (sudah ada) dipakai utk guest.
- Field shipping/recipient existing dipakai dari link.

## 5. Flow

### 5.1 Admin buat link
1. Pilih buku (1+), set `shipping_mode`, (`admin_set` → isi `shipping_cost`
   + opsional alamat offline), `weight_grams` override opsional, `expires_at`.
2. Sistem generate `token` → tampilkan **full URL** + tombol salin.
3. Buku terpilih → `is_unlisted = true`.
4. Admin bisa: **revoke** (status=revoked, lepas unlisted buku), **regenerate
   token** (revoke lama), **hapus** (lepas buku).

### 5.2 Guest checkout (`/beli/{token}`)
- GET: resolve link valid → tampil produk (foto/judul/harga), ringkasan ongkir
  (admin_set → tampil; pickup → ambil di toko), form **nama + HP**.
  Invalid/expired/revoked/sold → **404**.
- POST: `OrderService::createFromLink(link, guest)`:
  - txn: validasi link valid; **reserve tiap buku** (`available→reserved`, else
    `CartConflictException`); buat order (`user_id=null`, snapshot item,
    `shipping_cost` & alamat & berat dari link, `track_token` generate,
    `channel=link`); `link.order_id = order.id`; `recordEvent(Created)`.
  - redirect → guest tracking page (+ buka Snap bila bayar online).

### 5.3 Pembayaran
Reuse Midtrans Snap (customer dari guest input, tanpa user). Webhook by
`payment_reference`. Admin **mark-paid** manual juga tetap jalan (admin order show).
Buku `reserved→sold` saat paid (existing `markPaid`).

### 5.4 Guest tracking (`/lacak/{track_token}`)
- Read-only: `OrderStatusTimeline` + ringkasan item + **resi** + `OrderEventList`.
- Bila `pending` + online → tombol bayar (Snap) pakai `track_token`.
- Invalid token → 404. Throttle.

### 5.5 Resi
Reuse `shipping_tracking_number` + form ship admin (existing). Guest page tampil
resi read-only. Nol kode baru.

## 6. Routes
Public (tanpa auth):
- `GET /beli/{token}` → `CheckoutLinkController@show`
- `POST /beli/{token}` → `@store` (buat order)
- `GET /lacak/{track_token}` → `GuestOrderController@show`
- `POST /lacak/{track_token}/bayar` → Snap token (reuse PaymentController logic)

Admin (auth + can:admin):
- `resource admin/checkout-links` (index/create/store/destroy)
- `POST admin/checkout-links/{link}/revoke`
- `POST admin/checkout-links/{link}/regenerate`

## 7. Keamanan
- `token` & `track_token` acak tak tertebak (`Str::random(40)`). Invalid → 404,
  tanpa bocor info (no enumeration).
- `track_token` ≠ checkout `token` (link bisa disebar; tracking jangan ikut bocor).
- Rate-limit `POST /beli/{token}` + `/lacak` per IP.
- order_events `meta` jangan bocor `cost_price`.
- Reserve atomik cegah double-sell (katalog vs link).

## 8. Reuse
visibility filter katalog (`is_unlisted`), snapshot item, `order_events`,
`OrderStatusTimeline`, `OrderEventList`, bukti pengiriman, Midtrans Snap,
admin order show (resi/mark-paid/ship).

## 9. Edge cases
- Link expired/revoked saat guest di halaman → POST gagal 404, pesan jelas.
- Buku keburu sold via jalur lain → `CartConflictException` → tampil "produk
  tak tersedia".
- Order guest `cancelled`/expired (TTL 24h) → lepas reserve; link balik valid
  (selama belum expired) → bisa checkout ulang.
- Hapus/revoke link → buku `is_unlisted=false` (kembali ke katalog bila masih available).

## 10. Test (Pest)
- Link valid → guest checkout bikin order (user_id null, track_token ada, buku reserved).
- Token invalid/expired/revoked → 404.
- Buku sudah sold → checkout 422/konflik.
- Guest tracking by track_token → tampil; token salah → 404.
- Buku terlampir link → tak muncul di katalog/search.
- Admin revoke → buku kembali listed; regenerate → token lama mati.
- Mark-paid → buku sold, event paid.

## 11. Phasing
- Fase 1: migrasi (`checkout_links`, pivot, `books.is_unlisted`,
  `orders.user_id` nullable + `track_token`), model + relasi.
- Fase 2: `OrderService::createFromLink` + reserve/snapshot + events.
- Fase 3: admin CRUD link (pilih buku, generate/revoke/regenerate, copy URL).
- Fase 4: guest `/beli/{token}` (show + checkout) + Snap.
- Fase 5: guest `/lacak/{track_token}` tracking read-only.
- Fase 6: katalog exclude `is_unlisted`; tests.
