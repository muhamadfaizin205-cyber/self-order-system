# 🍜 Sistem Self-Order Mie Gacoan (Full-Stack)

Sistem pemesanan mandiri _contactless_ untuk restoran dine-in, lengkap dengan dapur & admin. Pelanggan scan QR di meja → pilih menu (level pedas & paket combo) → bayar QRIS/kasir → pesanan masuk dapur secara real-time → admin pantau penjualan.

Dibangun berdasarkan PRD studi kasus Mie Gacoan.

## 📦 Komponen

```
gacoan/
├── frontend/         # UI pelanggan (React) — scan, pesan, bayar
├── kitchen-display/  # Kitchen Display System (HTML) — layar dapur real-time
├── admin-panel/      # Panel admin (HTML) — statistik, pesanan, kelola menu
└── backend/          # API Node.js + Express + Prisma + PostgreSQL + WebSocket
```

| Komponen | Teknologi | Untuk |
|----------|-----------|-------|
| Frontend | React (mobile-first) | Pelanggan |
| Kitchen Display | HTML + WebSocket | Staf dapur |
| Admin Panel | HTML | Manajer/kasir |
| Backend | Node + Express + Prisma + WS | API & data |

## 🚀 Setup (mulai dari backend)

```bash
cd backend
npm install
cp .env.example .env          # isi DATABASE_URL & JWT_SECRET

npm run db:generate
npm run db:migrate
npm run db:seed               # mengisi menu + meja 91; mencetak restaurant ID & URL QR

npm run dev                   # http://localhost:4000
```

`db:seed` akan mencetak **Restaurant ID** dan **URL QR meja 91**. Catat keduanya.

### Menjalankan tiap antarmuka

- **Frontend pelanggan:** `cd frontend && npm install && npm run dev` → buka `http://localhost:5173`. Tanpa parameter = mode demo (dummy). Dengan URL QR `?restaurant=<id>&token=<jwt>` = mode live (tarik data & checkout via backend). Lihat `frontend/README.md`.
- **Kitchen Display:** buka `kitchen-display/index.html` di browser → tempel Restaurant ID → Hubungkan. Order baru muncul otomatis (real-time via WebSocket).
- **Admin Panel:** buka `admin-panel/index.html` → tempel Restaurant ID → Muat Data.

## 🔌 API Endpoints

**Customer**
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/v1/tables/validate` | Validasi QR meja |
| GET | `/api/v1/restaurants/:id/menu` | Katalog menu |
| POST | `/api/v1/cart/calculate` | Hitung harga (preview) |
| POST | `/api/v1/orders` | Buat order + QRIS |
| GET | `/api/v1/orders/:id/status` | Polling status |
| POST | `/api/v1/orders/:id/simulate-paid` | Simulasi bayar (mock) |
| POST | `/api/v1/payments/webhook` | Callback Midtrans |

**Kitchen**
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/v1/kitchen/orders` | Order aktif untuk dapur |
| PATCH | `/api/v1/kitchen/orders/:id/done` | Tandai selesai |

**Admin**
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/v1/admin/stats` | Statistik hari ini |
| GET | `/api/v1/admin/orders` | Riwayat pesanan |
| GET | `/api/v1/admin/menu` | Daftar menu |
| PATCH | `/api/v1/admin/menu/:id/availability` | Toggle stok |
| PATCH | `/api/v1/admin/menu/:id/price` | Ubah harga |

**WebSocket:** `/ws` — channel `kitchen` (refresh dapur) & `order:<id>` (status customer).

## 💳 Mode Pembayaran

- **Mock (default):** `MIDTRANS_SERVER_KEY` kosong. QRIS palsu, konfirmasi via `/simulate-paid`. Untuk dev/demo.
- **Production:** isi `MIDTRANS_SERVER_KEY`, aktifkan skeleton di `src/services/paymentService.js`, `npm install midtrans-client`.

## 🔒 Catatan Keamanan (dari PRD)

- Harga **selalu** dihitung ulang di server — frontend tidak dipercaya.
- Token meja JWT mencegah flood pesanan dari luar.
- QRIS auto-expire 10 menit → order jadi `CANCELLED`.
- Semua nominal integer Rupiah penuh (QRIS tolak desimal).

## ⚠️ Yang masih perlu kamu lakukan

- Jalankan PostgreSQL & migrasi sendiri: `npm run db:migrate` (belum diuji terhadap DB live; kode, sintaks, dan logika harga sudah diverifikasi). Folder `prisma/migrations/` baru terbentuk setelah perintah ini.
- Untuk QRIS asli: daftar merchant Midtrans/Xendit & isi API key, lalu aktifkan skeleton di `paymentService.js`.
- Auth admin/kitchen belum ada — tambahkan login sebelum produksi (endpoint ini sekarang terbuka).
- Render QR asli dari payload QRIS (tambah `qrcode.react` di frontend).

## 🚀 Deploy

Sistem perlu 3 layanan: **Neon** (database), **Railway** (backend + WebSocket), **Vercel** (frontend/KDS/admin). Semua punya tier gratis. Panduan lengkap langkah demi langkah ada di **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## 🗺️ Roadmap

- [ ] Login & role untuk admin/kitchen
- [ ] Migrasi frontend ke Next.js penuh
- [ ] Render QR asli dari payload QRIS
- [ ] Laporan penjualan per periode & export
