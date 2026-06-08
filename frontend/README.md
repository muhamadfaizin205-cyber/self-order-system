# Frontend — Self-Order Mie Gacoan (Vite + React)

UI pelanggan. Punya dua mode otomatis:

- **Mode Demo** — dibuka tanpa parameter QR. Memakai data dummy bawaan, pembayaran disimulasikan. Langsung jalan tanpa backend.
- **Mode Live** — dibuka dengan `?restaurant=<id>&token=<jwt>` (URL dari hasil `db:seed` backend). Menarik menu & info meja dari backend, checkout dan pembayaran lewat API, status order dipantau via polling.

## Menjalankan

```bash
cd frontend
npm install
cp .env.example .env     # sesuaikan VITE_API_URL jika perlu
npm run dev              # http://localhost:5173
```

- Buka `http://localhost:5173` → **mode demo**.
- Buka `http://localhost:5173/?restaurant=<id>&token=<jwt>` → **mode live** (pastikan backend jalan).

## Build untuk produksi

```bash
npm run build            # hasil di folder dist/
npm run preview          # pratinjau hasil build
```

## Struktur

```
frontend/
├── index.html           # entry HTML Vite
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx         # bootstrap React
    ├── App.jsx          # seluruh UI + logika (demo & live)
    └── api.js           # client API ke backend
```

## Catatan

- QRIS di layar masih placeholder visual. Untuk render QR asli dari `qris.payload`, tambahkan library seperti `qrcode.react` lalu render payload pada layar QRIS.
- Mode live memetakan level pedas ke modifier backend berdasarkan kecocokan nama ("Level 6", dst) — pastikan nama di seed konsisten.
