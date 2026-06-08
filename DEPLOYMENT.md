# 🚀 Panduan Deploy — Sistem Self-Order Mie Gacoan

Sistem ini perlu **3 layanan terpisah** karena Vercel tidak bisa menjalankan server Express, WebSocket, maupun database. Semuanya punya tier gratis.

| Bagian | Layanan | Kenapa |
|--------|---------|--------|
| Database PostgreSQL | **Neon** | Vercel tidak host database |
| Backend (Express + WebSocket) | **Railway** | Vercel tidak support server persisten / WS |
| Frontend, KDS, Admin | **Vercel** | Statis, cocok di Vercel |

Urutan deploy: **Database → Backend → Frontend**.

---

## 1. Database (Neon)

1. Daftar di https://neon.tech → buat project baru.
2. Salin **connection string** (format: `postgresql://user:pass@host/db?sslmode=require`).
3. Simpan untuk dipakai sebagai `DATABASE_URL` di langkah backend.

## 2. Backend (Railway)

1. Push repo ini ke GitHub.
2. Daftar di https://railway.app → **New Project** → **Deploy from GitHub repo** → pilih repo kamu.
3. Di pengaturan service, set **Root Directory** = `backend`.
4. Tambahkan **Variables**:
   - `DATABASE_URL` = connection string dari Neon
   - `JWT_SECRET` = string acak panjang (mis. hasil `openssl rand -hex 32`)
   - `PORT` = `4000`
   - `MIDTRANS_SERVER_KEY` = kosongkan dulu (mode mock)
5. Railway akan build & menjalankan `prisma migrate deploy` lalu `npm start` (lihat `railway.json`).
6. Setelah live, jalankan seed sekali lewat tab **Settings → Deploy** atau Railway CLI:
   ```bash
   railway run npm run db:seed
   ```
   Catat **Restaurant ID** & **URL QR** yang dicetak.
7. Salin domain publik backend, mis. `https://gacoan-production.up.railway.app`.

## 3. Frontend (Vercel)

1. Di https://vercel.com → **Add New Project** → **Import** repo GitHub yang sama.
2. Set **Root Directory** = `frontend` (Vercel auto-deteksi Vite, lihat `frontend/vercel.json`).
3. Tambahkan **Environment Variable**:
   - `VITE_API_URL` = `https://<domain-railway>/api/v1`
4. **Deploy**.
5. Akses frontend live:
   - `https://<app>.vercel.app/` → mode demo
   - `https://<app>.vercel.app/?restaurant=<id>&token=<jwt>` → mode live (pakai URL QR dari seed)

## 4. KDS & Admin (Vercel — opsional, project terpisah)

Keduanya HTML statis. Dua pilihan:
- **Cara cepat:** buka file `kitchen-display/index.html` & `admin-panel/index.html` langsung, lalu isi field "API URL" dengan domain Railway + Restaurant ID.
- **Deploy ke Vercel:** buat project baru, set Root Directory ke `kitchen-display` (atau `admin-panel`). Lalu isi API URL & Restaurant ID di halamannya.

---

## Ringkasan Environment Variables

**Railway (backend):**
```
DATABASE_URL=postgresql://...      # dari Neon
JWT_SECRET=...                     # acak panjang
PORT=4000
MIDTRANS_SERVER_KEY=               # kosong = mode mock
```

**Vercel (frontend):**
```
VITE_API_URL=https://<railway-domain>/api/v1
```

## Catatan

- Selama `MIDTRANS_SERVER_KEY` kosong, pembayaran berjalan **mode mock** (tombol "Simulasikan Pembayaran Berhasil"). Untuk QRIS asli: daftar merchant Midtrans, isi key, aktifkan skeleton di `backend/src/services/paymentService.js`.
- Endpoint admin & kitchen belum ada login — tambahkan auth sebelum dipakai publik.
