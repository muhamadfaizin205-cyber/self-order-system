import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ShoppingCart, Search, Menu as MenuIcon, X, Plus, Minus, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, Phone, Navigation, CheckCircle2, Download, History, Globe, HelpCircle, Shield, ChevronDown } from "lucide-react";
import { api } from "./api";

// ============================================================
// DATA & CONFIG
// ============================================================
const OUTLET = {
  name: "Mie 99 - Mojokerto",
  address: "Jl. Pahlawan No. 99, Kec. Magersari, Mojokerto, Jawa Timur",
  phone: "0321-999999",
  hours: "10.00 - 22.00 WIB",
  table: null,
  schedule: [
    { day: "SENIN", time: "10.00 - 22.00" },
    { day: "SELASA", time: "10.00 - 22.00" },
    { day: "RABU", time: "10.00 - 22.00" },
    { day: "KAMIS", time: "10.00 - 22.00" },
    { day: "JUMAT", time: "10.00 - 22.00" },
    { day: "SABTU", time: "10.00 - 23.00" },
    { day: "MINGGU", time: "10.00 - 23.00" },
  ],
};

const SPICE_LEVELS = [
  { id: "lvl0", name: "Level 0", add: 0 },
  { id: "lvl1", name: "Level 1", add: 0 },
  { id: "lvl2", name: "Level 2", add: 0 },
  { id: "lvl3", name: "Level 3", add: 0 },
  { id: "lvl4", name: "Level 4", add: 0 },
  { id: "lvl6", name: "Level 6", add: 910 },
  { id: "lvl8", name: "Level 8", add: 910 },
];

const FOOD_IMG_MAP = {
  "mie tornado": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop",
  "mie tsunami": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop",
  "mie 99 spesial": "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop",
  "paket combo 99": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop",
  "dimsum keju lumer": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop",
  "dimsum crispy roll": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=400&fit=crop",
  "es jeruk peras": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
  "es teh manis": "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=400&h=400&fit=crop",
  "air mineral": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop",
};
const DEFAULT_FOOD_IMG = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop";
const getImg = (item) => {
  if (item?.image_url || item?.imageUrl) return item.image_url || item.imageUrl;
  const key = (item?.name || "").toLowerCase().trim();
  return FOOD_IMG_MAP[key] || DEFAULT_FOOD_IMG;
};
const FOOD_IMG = new Proxy({}, { get: () => DEFAULT_FOOD_IMG }); // backward compat

const BANNERS = [
  "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&h=400&fit=crop",
];

const CATEGORIES = [
  {
    id: "rekomendasi", name: "Menu Andalan",
    items: [
      { id: "mie_tornado", name: "Mie Tornado", price: 10000, type: "spicy", desc: "Mie pedas berputar rasa, topping pangsit goreng renyah." },
      { id: "mie_tsunami", name: "Mie Tsunami", price: 10000, type: "spicy", desc: "Mie kuah pedas meluap dengan irisan daging ayam." },
      { id: "mie_99_spesial", name: "Mie 99 Spesial", price: 12000, type: "spicy", desc: "Menu signature, pedas nampol dengan telur mata sapi." },
    ],
  },
  {
    id: "paket", name: "Paket Hemat 99",
    items: [{
      id: "combo_99", name: "Paket Combo 99", price: 49000, type: "combo",
      desc: "2 Mie + 2 Dimsum + 2 Minuman. Hemat buat berdua!",
      groups: [
        { id: "mie1", name: "Pilih Mie (1)", min: 1, max: 1, options: [{ id: "mie_99_spesial", name: "Mie 99 Spesial", add: 0 }, { id: "mie_tsunami", name: "Mie Tsunami", add: 0 }] },
        { id: "mie2", name: "Pilih Mie (2)", min: 1, max: 1, options: [{ id: "mie_99_spesial", name: "Mie 99 Spesial", add: 0 }, { id: "mie_tsunami", name: "Mie Tsunami", add: 0 }] },
        { id: "dimsum1", name: "Pilih Dimsum (1)", min: 1, max: 1, options: [{ id: "dimsum_keju", name: "Dimsum Keju Lumer", add: 0 }, { id: "dimsum_crispy", name: "Dimsum Crispy Roll", add: 0 }] },
        { id: "dimsum2", name: "Pilih Dimsum (2)", min: 1, max: 1, options: [{ id: "dimsum_keju", name: "Dimsum Keju Lumer", add: 0 }, { id: "dimsum_crispy", name: "Dimsum Crispy Roll", add: 0 }] },
        { id: "drink", name: "Pilih Minuman (2)", min: 2, max: 2, options: [{ id: "es_jeruk", name: "Es Jeruk Peras", add: 0 }, { id: "es_teh", name: "Es Teh Manis", add: 0 }, { id: "air_mineral", name: "Air Mineral", add: 0 }] },
      ],
    }],
  },
  {
    id: "dimsum", name: "Dimsum",
    items: [
      { id: "dimsum_keju", name: "Dimsum Keju Lumer", price: 9500, type: "simple", desc: "Dimsum isi udang dengan keju meleleh." },
      { id: "dimsum_crispy", name: "Dimsum Crispy Roll", price: 9500, type: "simple", desc: "Dimsum gulung renyah dengan saus pedas manis." },
    ],
  },
  {
    id: "minuman", name: "Minuman Segar",
    items: [
      { id: "es_jeruk", name: "Es Jeruk Peras", price: 8000, type: "simple", desc: "Jeruk segar diperas langsung." },
      { id: "es_teh", name: "Es Teh Manis", price: 5000, type: "simple", desc: "Teh manis dingin klasik." },
      { id: "air_mineral", name: "Air Mineral", price: 4000, type: "simple", desc: "Air mineral 600ml." },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items);
const rupiah = n => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
const G = "#1b7a3d";
const G2 = "#25a550";
const GL = "#e6f4ea";

// ============================================================
// GLOBAL CSS
// ============================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:#1a1a1a;font-family:'Poppins',sans-serif}
::-webkit-scrollbar{display:none}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes slideLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.tap{transition:transform .12s ease,box-shadow .12s ease}
.tap:active{transform:scale(.96)!important;box-shadow:none!important}
.hover-lift{transition:transform .2s ease,box-shadow .2s ease}
.hover-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.hover-lift:active{transform:translateY(0) scale(.97)}
.fade-item{animation:fadeIn .3s ease both}
.cart-item-enter{animation:scaleIn .25s ease both}
`;

// ============================================================
// BANNER CAROUSEL
// ============================================================
function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", margin: "0 0 14px", height: 160 }}>
      {BANNERS.map((src, i) => (
        <img key={i} src={src} alt="promo" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: i === idx ? 1 : 0, transition: "opacity .6s ease",
        }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(0,0,0,.5) 0%,transparent 60%)" }} />
      <div style={{ position: "absolute", bottom: 14, left: 16, color: "#fff", fontWeight: 700, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>
        🍜 Paket Hemat 99 — Diskon hingga 30%
      </div>
      <div style={{ position: "absolute", bottom: 10, right: 14, display: "flex", gap: 5 }}>
        {BANNERS.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 18 : 6, height: 6, borderRadius: 3, cursor: "pointer",
            background: i === idx ? "#fff" : "rgba(255,255,255,.5)", transition: "all .3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// EXPANDABLE OUTLET CARD
// ============================================================
function OutletCard({ outlet }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tap" onClick={() => setOpen(!open)} style={{
      background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12,
      border: "1px solid #eee", cursor: "pointer", transition: "all .2s ease",
      boxShadow: open ? "0 4px 16px rgba(0,0,0,.08)" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{outlet.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#777", marginTop: 4 }}><MapPin size={12} />{outlet.address?.split(",")[0]}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#777", marginTop: 2 }}><Clock size={12} />{outlet.hours}</div>
        </div>
        <ChevronDown size={18} color="#999" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease" }} />
      </div>
      <div style={{
        maxHeight: open ? 400 : 0, overflow: "hidden", transition: "max-height .35s ease",
      }}>
        <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>{outlet.address}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button className="tap" style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }} onClick={e => e.stopPropagation()}><Phone size={13} />Hubungi Outlet</button>
            <button className="tap" style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }} onClick={e => e.stopPropagation()}><Navigation size={13} />Kunjungi Outlet</button>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Jam Operasional</div>
          {(outlet.schedule || OUTLET.schedule).map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12.5 }}>
              <span style={{ fontWeight: new Date().getDay() === (i + 1) % 7 ? 700 : 400, color: new Date().getDay() === (i + 1) % 7 ? G : "#555" }}>{s.day}</span>
              <span style={{ color: "#555" }}>{s.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HORIZONTAL RECOMMENDATION SCROLL
// ============================================================
function RecoScroll({ items, onAdd }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#222" }}>Menu Andalan 🔥</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="tap" onClick={() => scroll(-1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #ddd", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={14} /></button>
          <button className="tap" onClick={() => scroll(1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #ddd", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronRight size={14} /></button>
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollSnapType: "x mandatory" }}>
        {items.map((item, i) => (
          <div key={item.id} className="hover-lift" style={{
            minWidth: 150, maxWidth: 150, background: "#fff", borderRadius: 14, overflow: "hidden",
            border: "1px solid #eee", scrollSnapAlign: "start", animation: `fadeIn .3s ease ${i * .08}s both`,
          }}>
            <div style={{ height: 120, overflow: "hidden" }}>
              <img src={getImg(item)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" }}
                onMouseOver={e => e.target.style.transform = "scale(1.08)"}
                onMouseOut={e => e.target.style.transform = "scale(1)"} />
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: G, margin: "4px 0 8px" }}>{rupiah(item.price)}</div>
              <button className="tap" onClick={() => onAdd(item)} style={{
                width: "100%", padding: "8px", borderRadius: 8, border: `1.5px solid ${G}`,
                background: "#fff", color: G, fontWeight: 700, fontSize: 12, cursor: "pointer",
                transition: "all .2s ease",
              }}
                onMouseOver={e => { e.target.style.background = G; e.target.style.color = "#fff" }}
                onMouseOut={e => { e.target.style.background = "#fff"; e.target.style.color = G }}
              >Tambah</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SIDE DRAWER (Hamburger Menu) — Fungsional penuh
// ============================================================
function SideDrawer({ open, onClose }) {
  const [subView, setSubView] = useState(null); // null | "history" | "language" | "help" | "privacy"
  const [lang, setLang] = useState("id");
  const [faqOpen, setFaqOpen] = useState(null);

  if (!open) return null;

  const back = () => setSubView(null);
  const close = () => { setSubView(null); onClose(); };

  const menuItems = [
    { key: "history", icon: <History size={18} />, label: "Riwayat Pesanan", sub: "Lihat pesanan sebelumnya" },
    { key: "language", icon: <Globe size={18} />, label: "Bahasa", sub: lang === "id" ? "Indonesia" : "English" },
    { key: "help", icon: <HelpCircle size={18} />, label: "Bantuan", sub: "FAQ & panduan pemesanan" },
    { key: "privacy", icon: <Shield size={18} />, label: "Kebijakan Privasi", sub: "Syarat & ketentuan" },
  ];

  const faqItems = [
    { q: "Bagaimana cara memesan?", a: "Scan QR code di meja Anda, pilih menu, kustomisasi sesuai selera, lalu bayar lewat QRIS atau kasir. Pesanan langsung masuk ke dapur." },
    { q: "Bisa bayar tunai?", a: "Bisa! Saat checkout, pilih 'Bayar di Kasir'. Pesanan akan masuk sistem, dan Anda tinggal bayar di kasir." },
    { q: "Berapa lama pesanan siap?", a: "Biasanya 10-15 menit tergantung jumlah pesanan. Makanan akan diantar langsung ke meja Anda." },
    { q: "Level pedas bisa diubah?", a: "Level pedas dipilih saat menambahkan menu ke keranjang. Level 0 (tidak pedas) sampai Level 8 (sangat pedas). Level 6 dan 8 ada biaya tambahan." },
    { q: "Pesanan salah, bagaimana?", a: "Hubungi staf restoran terdekat. Mereka akan membantu mengubah atau membatalkan pesanan Anda." },
    { q: "QRIS saya gagal/expired?", a: "QRIS berlaku 10 menit. Jika expired, Anda bisa membuat pesanan baru. Tidak ada uang yang terpotong jika belum bayar." },
  ];

  const drawerContent = () => {
    if (subView === "history") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Riwayat Pesanan</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, color: "#aaa" }}>
          <History size={48} color="#ddd" />
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 14, color: "#999" }}>Belum ada pesanan</div>
          <div style={{ fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>Pesanan yang sudah selesai akan muncul di sini. Scan QR di meja untuk mulai memesan.</div>
        </div>
      </div>
    );

    if (subView === "language") return (
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Pilih Bahasa</span>
        </div>
        <div style={{ padding: "8px 0" }}>
          {[{ code: "id", flag: "🇮🇩", name: "Bahasa Indonesia", sub: "Indonesian" }, { code: "en", flag: "🇬🇧", name: "English", sub: "Inggris" }].map(l => (
            <button key={l.code} className="tap" onClick={() => setLang(l.code)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
              border: "none", background: lang === l.code ? GL : "transparent", cursor: "pointer", textAlign: "left",
              transition: "background .15s",
            }}>
              <span style={{ fontSize: 24 }}>{l.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{l.name}</div>
                <div style={{ fontSize: 11, color: "#999" }}>{l.sub}</div>
              </div>
              {lang === l.code && <CheckCircle2 size={18} color={G} />}
            </button>
          ))}
        </div>
      </div>
    );

    if (subView === "help") return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Bantuan & FAQ</span>
        </div>
        <div style={{ padding: "8px 12px" }}>
          {faqItems.map((f, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <button className="tap" onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 10px", border: "none", background: faqOpen === i ? GL : "transparent",
                cursor: "pointer", textAlign: "left", borderRadius: 10, transition: "background .2s",
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#222", flex: 1, paddingRight: 10 }}>{f.q}</span>
                <ChevronDown size={16} color="#999" style={{ transform: faqOpen === i ? "rotate(180deg)" : "none", transition: "transform .3s", flexShrink: 0 }} />
              </button>
              <div style={{ maxHeight: faqOpen === i ? 200 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                <div style={{ padding: "8px 10px 14px", fontSize: 12.5, color: "#666", lineHeight: 1.6 }}>{f.a}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: "16px 10px", borderTop: "1px solid #eee", marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Butuh bantuan lebih?</div>
            <button className="tap" style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Hubungi Kami</button>
          </div>
        </div>
      </div>
    );

    if (subView === "privacy") return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Kebijakan Privasi</span>
        </div>
        <div style={{ padding: "16px 20px", fontSize: 12.5, color: "#555", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 8 }}>Kebijakan Privasi Mie 99</div>
          <p>Kami menghargai privasi Anda. Data yang kami kumpulkan saat pemesanan (nama, nomor ponsel, email) digunakan hanya untuk:</p>
          <p style={{ marginTop: 8 }}><b>1. Memproses pesanan Anda</b> — Nama dan nomor meja digunakan untuk mengidentifikasi dan mengantarkan pesanan.</p>
          <p style={{ marginTop: 8 }}><b>2. Mengirim struk digital</b> — Email digunakan untuk mengirim bukti pembayaran jika Anda memilih opsi ini.</p>
          <p style={{ marginTop: 8 }}><b>3. Informasi promo</b> — Nomor ponsel dapat digunakan untuk mengirimkan promo, namun Anda bisa berhenti kapan saja.</p>
          <p style={{ marginTop: 12 }}>Kami <b>tidak</b> menjual atau membagikan data Anda kepada pihak ketiga. Data pembayaran diproses sepenuhnya oleh payment gateway (Midtrans) dan tidak disimpan di server kami.</p>
          <p style={{ marginTop: 12 }}>Dengan menggunakan layanan ini, Anda menyetujui kebijakan privasi di atas.</p>
          <div style={{ marginTop: 16, padding: "12px", background: GL, borderRadius: 10, fontSize: 12, color: G }}>
            Terakhir diperbarui: Juni 2026
          </div>
        </div>
      </div>
    );

    // Main menu
    return (
      <>
        <div style={{ padding: "28px 20px 20px", background: `linear-gradient(135deg,${G},${G2})`, color: "#fff" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Mie 99</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>👋 Masuk sebagai tamu</div>
          <button className="tap" style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,.5)", background: "transparent", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "background .2s" }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>Masuk / Daftar</button>
        </div>
        <div style={{ flex: 1, padding: "8px 0" }}>
          {menuItems.map((it, i) => (
            <button key={i} className="tap" onClick={() => setSubView(it.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
              border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
              transition: "background .15s",
            }} onMouseOver={e => e.currentTarget.style.background = GL}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ color: G }}>{it.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{it.label}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>{it.sub}</div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </button>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #eee", fontSize: 11, color: "#bbb" }}>v1.0.0 · Self-Order System</div>
      </>
    );
  };

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, display: "flex" }} onClick={close}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.5)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "80%", maxWidth: 330, height: "100%",
        background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,.2)",
        display: "flex", flexDirection: "column", overflow: "hidden auto",
        zIndex: 61,
      }}>
        {drawerContent()}
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT MODAL
// ============================================================
function ProductModal({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState(item.type === "spicy" ? "lvl1" : null);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState(() => {
    if (item.type !== "combo") return {};
    const init = {};
    item.groups.forEach(g => (init[g.id] = []));
    return init;
  });

  const toggleSelection = (group, optId) => {
    setSelections(prev => {
      const cur = prev[group.id] || [];
      if (cur.includes(optId)) return { ...prev, [group.id]: cur.filter(x => x !== optId) };
      if (group.max === 1) return { ...prev, [group.id]: [optId] };
      if (cur.length >= group.max) return prev;
      return { ...prev, [group.id]: [...cur, optId] };
    });
  };

  const spiceAdd = useMemo(() => (spice ? SPICE_LEVELS.find(s => s.id === spice)?.add || 0 : 0), [spice]);
  const unitPrice = item.price + spiceAdd;
  const totalPrice = unitPrice * qty;
  const canAdd = item.type !== "combo" || item.groups.every(g => (selections[g.id] || []).length >= g.min);

  const handleAdd = () => {
    const detail = [];
    const modifierIds = [];
    if (spice) {
      detail.push(SPICE_LEVELS.find(s => s.id === spice).name);
      const sg = (item.groups || []).find(g => g.name?.toUpperCase().includes("PEDAS"));
      if (sg) { const m = sg.options.find(o => o.name === SPICE_LEVELS.find(s => s.id === spice).name); if (m) modifierIds.push(m.id); }
    }
    if (item.type === "combo") {
      item.groups.forEach(g => (selections[g.id] || []).forEach(optId => {
        const opt = g.options.find(o => o.id === optId);
        if (opt) { detail.push(opt.name); modifierIds.push(opt.id); }
      }));
    }
    onAdd({ lineId: Date.now() + Math.random(), itemId: item.id, name: item.name, qty, unitPrice, detail, modifierIds, notes });
    onClose();
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", width: "100%", maxHeight: "90%", borderRadius: "22px 22px 0 0",
        display: "flex", flexDirection: "column", animation: "slideUp .3s ease",
      }}>
        <div style={{ width: 36, height: 4, background: "#ddd", borderRadius: 4, margin: "10px auto 0" }} />
        <button className="tap" onClick={onClose} style={{ position: "absolute", top: "auto", right: 14, marginTop: 6, width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}><X size={18} /></button>
        <div style={{ overflowY: "auto", flex: 1 }}>
          <div style={{ height: 200, overflow: "hidden" }}>
            <img src={getImg(item)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ padding: "16px 20px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{item.name}</h2>
            <p style={{ fontSize: 13, color: "#888", margin: "6px 0", lineHeight: 1.5 }}>{item.desc}</p>
            <div style={{ fontSize: 18, fontWeight: 800, color: G }}>{rupiah(item.price)}</div>
          </div>

          {item.type === "spicy" && (
            <div style={{ borderTop: "8px solid #f5f5f5", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                LEVEL PEDAS <span style={{ fontSize: 11, color: G, background: GL, padding: "2px 10px", borderRadius: 6 }}>Wajib</span>
              </div>
              {SPICE_LEVELS.map(s => (
                <label key={s.id} className="tap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", cursor: "pointer", borderBottom: "1px solid #f5f5f5", transition: "background .15s", borderRadius: 4, paddingLeft: 4, paddingRight: 4 }}
                  onMouseOver={e => e.currentTarget.style.background = GL}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 14 }}>{s.name}{s.add > 0 && <span style={{ color: G, fontSize: 12, fontWeight: 600 }}> +{rupiah(s.add)}</span>}</span>
                  <input type="radio" name="spice" checked={spice === s.id} onChange={() => setSpice(s.id)} style={{ width: 18, height: 18, accentColor: G }} />
                </label>
              ))}
            </div>
          )}

          {item.type === "combo" && item.groups.map(g => {
            const cur = selections[g.id] || [];
            return (
              <div key={g.id} style={{ borderTop: "8px solid #f5f5f5", padding: "16px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  {g.name} <span style={{ fontSize: 11, color: G, background: GL, padding: "2px 10px", borderRadius: 6 }}>Pilih {g.min === g.max ? g.min : `${g.min}-${g.max}`}</span>
                </div>
                {g.options.map(o => {
                  const checked = cur.includes(o.id);
                  const disabled = !checked && cur.length >= g.max;
                  return (
                    <label key={o.id} className="tap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", cursor: disabled ? "default" : "pointer", borderBottom: "1px solid #f5f5f5", opacity: disabled ? .4 : 1, transition: "background .15s", borderRadius: 4 }}
                      onMouseOver={e => !disabled && (e.currentTarget.style.background = GL)}
                      onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ fontSize: 14 }}>{o.name}</span>
                      <input type={g.max === 1 ? "radio" : "checkbox"} name={g.id} checked={checked} disabled={disabled} onChange={() => toggleSelection(g, o.id)} style={{ width: 18, height: 18, accentColor: G }} />
                    </label>
                  );
                })}
              </div>
            );
          })}

          <div style={{ borderTop: "8px solid #f5f5f5", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Catatan (opsional)</div>
            <input style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, outline: "none", transition: "border .2s", fontFamily: "inherit" }}
              placeholder="Contoh: kuah dipisah, tanpa daun bawang"
              value={notes} onChange={e => setNotes(e.target.value)}
              onFocus={e => e.target.style.borderColor = G}
              onBlur={e => e.target.style.borderColor = "#ddd"} />
          </div>
          <div style={{ height: 90 }} />
        </div>

        <div style={{ display: "flex", gap: 12, padding: "14px 20px", borderTop: "1px solid #eee", background: "#fff", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #ddd", borderRadius: 12, padding: "8px 12px" }}>
            <button className="tap" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: GL, color: G, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700 }}><Minus size={16} /></button>
            <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: 16 }}>{qty}</span>
            <button className="tap" onClick={() => setQty(qty + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: G, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={16} /></button>
          </div>
          <button className="tap" disabled={!canAdd} onClick={handleAdd} style={{
            flex: 1, padding: "14px", borderRadius: 12, border: "none", fontFamily: "inherit",
            background: canAdd ? G : "#ccc", color: "#fff", fontWeight: 700, fontSize: 15, cursor: canAdd ? "pointer" : "default",
            transition: "all .2s ease", boxShadow: canAdd ? `0 4px 14px rgba(27,122,61,.35)` : "none",
          }}>Tambah · {rupiah(totalPrice)}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("menu");
  const [cart, setCart] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLive = api.hasSession;
  const [categories, setCategories] = useState(CATEGORIES);
  const [outlet, setOutlet] = useState({ ...OUTLET, table: api.tableNumber || OUTLET.table });
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [orderId, setOrderId] = useState(null);
  const [qrisPayload, setQrisPayload] = useState(null);
  const [queueNumber, setQueueNumber] = useState(null);

  useEffect(() => {
    if (!isLive) return;
    (async () => {
      try {
        const { restaurant, table } = await api.validateTable();
        setOutlet(o => ({ ...o, name: restaurant.name, address: restaurant.address, hours: restaurant.hours, table: table.number }));
        const { categories: cats } = await api.getMenu();
        const mapped = (cats || []).map(c => ({
          id: c.id, name: c.name,
          items: (c.items || []).map(it => ({
            id: it.id,
            name: it.name,
            price: it.price ?? it.basePrice ?? 0,
            desc: it.desc || it.description || "",
            type: it.type || (it.isPackage ? "combo" : "simple"),
            groups: (it.groups || it.modifierGroups || []).map(g => ({
              id: g.id,
              name: g.name,
              min: g.min ?? g.minSelections ?? 1,
              max: g.max ?? g.maxSelections ?? 1,
              options: (g.options || g.modifiers || []).map(m => ({
                id: m.id,
                name: m.name,
                add: m.add ?? m.additionalPrice ?? 0,
              })),
            })),
          })),
        }));
        if (mapped.length > 0) {
          setCategories(mapped);
          if (mapped[0]) setActiveCat(mapped[0].id);
        }
      } catch (_) {}
    })();
  }, [isLive]);

  const [form, setForm] = useState({ name: "", phone: "", email: "", agree: false });
  const [payMethod, setPayMethod] = useState("online");
  const [timer, setTimer] = useState(600);
  const [processing, setProcessing] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const rounding = subtotal > 0 ? -(((subtotal + tax) % 100) || 0) : 0;
  const total = subtotal + tax + rounding;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (line) => setCart(c => [...c, line]);
  const removeLine = (lineId) => setCart(c => c.filter(i => i.lineId !== lineId));
  const changeQty = (lineId, d) => setCart(c => c.map(i => (i.lineId === lineId ? { ...i, qty: i.qty + d } : i)).filter(i => i.qty > 0));

  useEffect(() => {
    if (screen !== "qris") return;
    setTimer(600);
    const t = setInterval(() => setTimer(x => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    if (!isLive || screen !== "qris" || !orderId) return;
    const t = setInterval(async () => {
      try { const { status, queueNumber: q } = await api.getOrderStatus(orderId); if (["KITCHEN","PAID","DONE"].includes(status)) { setQueueNumber(q); setScreen("success"); } } catch (_) {}
    }, 5000);
    return () => clearInterval(t);
  }, [isLive, screen, orderId]);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  const buildApiItems = () => cart.map(l => ({ menuItemId: l.itemId, quantity: l.qty, notes: l.notes || "", modifierIds: l.modifierIds || [] }));

  const handleCheckout = async () => {
    setProcessing(true);
    if (!isLive) { setTimeout(() => { setProcessing(false); setScreen(payMethod === "online" ? "qris" : "success"); }, 1200); return; }
    try {
      const res = await api.createOrder({ customerName: form.name, phone: form.phone, email: form.email, paymentMethod: payMethod === "online" ? "QRIS" : "CASHIER", items: buildApiItems() });
      setOrderId(res.orderId); setProcessing(false);
      if (payMethod === "online") { setQrisPayload(res.qris?.payload || null); setScreen("qris"); } else setScreen("success");
    } catch (e) { setProcessing(false); alert("Gagal: " + e.message); }
  };

  const simulatePaid = async () => {
    setProcessing(true);
    if (!isLive) { setTimeout(() => { setProcessing(false); setScreen("success"); }, 1000); return; }
    try { const { queueNumber: q } = await api.simulatePaid(orderId); setQueueNumber(q); setProcessing(false); setScreen("success"); } catch (e) { setProcessing(false); alert("Gagal: " + e.message); }
  };

  const resetAll = () => { setCart([]); setForm({ name: "", phone: "", email: "", agree: false }); setOrderId(null); setQrisPayload(null); setQueueNumber(null); setScreen("menu"); };

  const filteredCats = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.map(c => ({ ...c, items: c.items.filter(i => i.name.toLowerCase().includes(q)) })).filter(c => c.items.length);
  }, [search, categories]);

  const recoItems = categories.find(c => c.id === "rekomendasi")?.items || categories[0]?.items || [];

  // ============= RENDER =============
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", height: "100dvh", background: "#f5f6f8", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,.3)", fontFamily: "'Poppins',sans-serif" }}>
      <style>{CSS}</style>

      {/* ===== MENU ===== */}
      {screen === "menu" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: G, color: "#fff", flexShrink: 0 }}>
          <button className="tap" onClick={() => setDrawerOpen(true)} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex", transition: "background .2s" }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}><MenuIcon size={22} /></button>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.5 }}>Mie 99</div>
          <button className="tap" onClick={() => setShowSearch(s => !s)} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex", transition: "background .2s" }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}><Search size={22} /></button>
        </div>

        {showSearch && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fff", borderBottom: "1px solid #eee", animation: "fadeIn .2s ease" }}>
          <Search size={16} color="#999" />
          <input style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "inherit" }} placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          {search && <button className="tap" onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}><X size={16} color="#999" /></button>}
        </div>}

        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <BannerCarousel />
          <OutletCard outlet={outlet} />
          {outlet.table ? (
            <div className="tap" style={{
              background: GL, borderRadius: 14, padding: "14px 16px", marginBottom: 14,
              border: `1.5px solid ${G}33`, display: "flex", alignItems: "center", gap: 12,
              animation: "scaleIn .3s ease", cursor: "default",
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: G, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>{outlet.table}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: G }}>Meja {outlet.table}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Pesanan akan diantar ke meja ini</div>
              </div>
              <CheckCircle2 size={20} color={G} style={{ marginLeft: "auto" }} />
            </div>
          ) : (
            <div className="tap" style={{
              background: "linear-gradient(135deg, #fff9e6, #fff3e0)", borderRadius: 14, padding: "14px 16px", marginBottom: 14,
              border: "1.5px dashed #ffb74d", display: "flex", alignItems: "center", gap: 12,
              animation: "pulse 3s ease infinite", cursor: "pointer",
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#ff9800", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📷</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#e65100" }}>Scan QR di meja Anda</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Arahkan kamera HP ke QR code untuk mulai pesan</div>
              </div>
            </div>
          )}

          <RecoScroll items={recoItems} onAdd={setModalItem} />

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
            {categories.map(c => (
              <button key={c.id} className="tap" onClick={() => { setActiveCat(c.id); document.getElementById("cat-" + c.id)?.scrollIntoView({ behavior: "smooth" }); }}
                style={{
                  whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  border: activeCat === c.id ? "none" : "1px solid #ddd",
                  background: activeCat === c.id ? G : "#fff",
                  color: activeCat === c.id ? "#fff" : "#555",
                  fontWeight: activeCat === c.id ? 600 : 400,
                  transition: "all .2s ease", boxShadow: activeCat === c.id ? `0 2px 8px rgba(27,122,61,.3)` : "none",
                }}>{c.name}</button>
            ))}
          </div>

          {filteredCats.map(cat => (
            <div key={cat.id} id={"cat-" + cat.id} style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10, color: "#222" }}>{cat.name}</div>
              {cat.items.map((item, i) => (
                <div key={item.id} className="hover-lift fade-item" style={{
                  display: "flex", gap: 12, background: "#fff", borderRadius: 14, padding: 10, marginBottom: 10,
                  border: "1px solid #eee", alignItems: "center", cursor: "pointer", animationDelay: `${i * .05}s`,
                }} onClick={() => setModalItem(item)}>
                  <div style={{ width: 68, height: 68, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: GL }}>
                    <img src={getImg(item)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{item.name}</div>
                    <div style={{ fontSize: 11.5, color: "#888", margin: "3px 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: G, marginTop: 4 }}>{rupiah(item.price)}</div>
                  </div>
                  <button className="tap" onClick={e => { e.stopPropagation(); setModalItem(item); }} style={{
                    background: "#fff", border: `1.5px solid ${G}`, color: G, fontWeight: 700, borderRadius: 10,
                    padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                    transition: "all .2s ease",
                  }}
                    onMouseOver={e => { e.target.style.background = G; e.target.style.color = "#fff" }}
                    onMouseOut={e => { e.target.style.background = "#fff"; e.target.style.color = G }}
                  >Tambah</button>
                </div>
              ))}
            </div>
          ))}
          <div style={{ height: 90 }} />
        </div>

        {cartCount > 0 && <button className="tap" onClick={() => setScreen("cart")} style={{
          position: "absolute", bottom: 16, left: 14, right: 14, background: G, color: "#fff", border: "none",
          borderRadius: 14, padding: "15px 20px", display: "flex", alignItems: "center", gap: 10, fontWeight: 700,
          fontSize: 15, cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 6px 24px rgba(27,122,61,.4)`, animation: "scaleIn .25s ease",
        }}><ShoppingCart size={18} /><span>{cartCount} item</span><span style={{ marginLeft: "auto" }}>{rupiah(subtotal)}</span></button>}
      </>}

      {/* ===== CART ===== */}
      {screen === "cart" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eee", flexShrink: 0 }}>
          <button className="tap" onClick={() => setScreen("menu")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><ChevronLeft size={22} /></button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Pesanan</div>
          <div style={{ width: 22 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ background: GL, color: G, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            🍽️ Makan di tempat{outlet.table ? ` · Meja ${outlet.table}` : ""}
          </div>
          {cart.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40, fontSize: 14 }}>Keranjang kosong</div>}
          {cart.map(line => (
            <div key={line.lineId} className="cart-item-enter" style={{ display: "flex", gap: 10, background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, border: "1px solid #eee", transition: "all .2s ease" }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <img src={getImg({ id: line.itemId, name: line.name })} alt={line.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{line.name}</div>
                {line.detail.length > 0 && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{line.detail.join(", ")}</div>}
                {line.notes && <div style={{ fontSize: 11, color: "#e65100", fontStyle: "italic", marginTop: 2 }}>📝 {line.notes}</div>}
                <div style={{ fontWeight: 700, fontSize: 14, color: G, marginTop: 4 }}>{rupiah(line.unitPrice * line.qty)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                <button className="tap" onClick={() => removeLine(line.lineId)} style={{
                  background: "#fff0f0", border: "none", borderRadius: 8, padding: 6, cursor: "pointer",
                  transition: "all .2s", display: "flex",
                }} onMouseOver={e => e.currentTarget.style.background = "#ffcdd2"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff0f0"}>
                  <Trash2 size={15} color="#e53935" />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="tap" onClick={() => changeQty(line.lineId, -1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Minus size={14} /></button>
                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{line.qty}</span>
                  <button className="tap" onClick={() => changeQty(line.lineId, 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: G, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {cart.length > 0 && <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #eee", marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#555", padding: "4px 0" }}><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#555", padding: "4px 0" }}><span>Pajak (10%)</span><span>{rupiah(tax)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#555", padding: "4px 0" }}><span>Pembulatan</span><span>{rupiah(rounding)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, color: "#222", borderTop: "1px dashed #ddd", marginTop: 8, paddingTop: 10 }}><span>Total</span><span>{rupiah(total)}</span></div>
          </div>}
          <div style={{ height: 90 }} />
        </div>
        {cart.length > 0 && <button className="tap" onClick={() => setScreen("checkout")} style={{
          position: "absolute", bottom: 16, left: 14, right: 14, background: G, color: "#fff", border: "none",
          borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 6px 24px rgba(27,122,61,.4)`,
        }}>Lanjut ke Pembayaran · {rupiah(total)}</button>}
      </>}

      {/* ===== CHECKOUT ===== */}
      {screen === "checkout" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eee", flexShrink: 0 }}>
          <button className="tap" onClick={() => setScreen("cart")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><ChevronLeft size={22} /></button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Pembayaran</div>
          <div style={{ width: 22 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, border: "1px solid #eee" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Informasi Pemesan</div>
            {[
              { ph: "Nama Lengkap *", key: "name" },
              { ph: "Nomor Ponsel *", key: "phone" },
              { ph: "Email (kirim struk, opsional)", key: "email" },
            ].map(f => (
              <input key={f.key} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 8, outline: "none", fontFamily: "inherit", transition: "border .2s" }}
                placeholder={f.ph} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                onFocus={e => e.target.style.borderColor = G}
                onBlur={e => e.target.style.borderColor = "#ddd"} />
            ))}
            <input style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #eee", background: "#f5f5f5", color: "#888", fontSize: 14, fontFamily: "inherit" }} value={outlet.table ? `Nomor Meja: ${outlet.table}` : "Nomor meja dari scan QR"} readOnly />
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, border: "1px solid #eee" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Metode Pembayaran</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[{ k: "online", l: "Pembayaran Online" }, { k: "cashier", l: "Bayar di Kasir" }].map(t => (
                <button key={t.k} className="tap" onClick={() => setPayMethod(t.k)} style={{
                  flex: 1, padding: 12, borderRadius: 10, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                  border: payMethod === t.k ? `2px solid ${G}` : "1px solid #ddd",
                  background: payMethod === t.k ? GL : "#fff",
                  color: payMethod === t.k ? G : "#555",
                  fontWeight: payMethod === t.k ? 700 : 400, transition: "all .2s ease",
                }}>{t.l}</button>
              ))}
            </div>
            {payMethod === "online" && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px", fontSize: 14 }}><span>QRIS (semua e-wallet & m-banking)</span><input type="radio" checked readOnly style={{ width: 18, height: 18, accentColor: G }} /></div>}
            {payMethod === "cashier" && <div style={{ fontSize: 13, color: "#888", padding: "4px" }}>Bayar langsung di kasir setelah memesan.</div>}
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, border: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14 }}>Total Pembayaran</span><span style={{ fontWeight: 700, color: G, fontSize: 16 }}>{rupiah(total)}</span></div>
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: "#666", padding: "4px 2px", lineHeight: 1.5, cursor: "pointer" }}>
            <input type="checkbox" checked={form.agree} onChange={e => setForm({ ...form, agree: e.target.checked })} style={{ marginTop: 2, accentColor: G }} />
            <span>Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi.</span>
          </label>
          <div style={{ height: 90 }} />
        </div>
        <button className="tap" disabled={!(form.name && form.phone && form.agree)} onClick={handleCheckout} style={{
          position: "absolute", bottom: 16, left: 14, right: 14, background: form.name && form.phone && form.agree ? G : "#ccc",
          color: "#fff", border: "none", borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 15,
          cursor: form.name && form.phone && form.agree ? "pointer" : "default", fontFamily: "inherit",
          transition: "all .2s", boxShadow: form.name && form.phone && form.agree ? `0 6px 24px rgba(27,122,61,.4)` : "none",
        }}>Pesan Sekarang · {rupiah(total)}</button>
      </>}

      {/* ===== QRIS ===== */}
      {screen === "qris" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eee", flexShrink: 0 }}>
          <button className="tap" onClick={() => setScreen("checkout")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><ChevronLeft size={22} /></button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Pembayaran QRIS</div>
          <div style={{ width: 22 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14, textAlign: "center" }}>
          <div style={{ background: GL, color: G, fontWeight: 700, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 18, animation: "pulse 2s ease infinite" }}>⏱ Selesaikan dalam {mm}:{ss}</div>
          <div style={{ background: "#fff", borderRadius: 18, padding: 24, border: "1px solid #eee", display: "inline-block", width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 16 }}>ESB RESTAURANT TECHNOLOGY</div>
            <div style={{ width: 180, height: 180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(10,1fr)", gridTemplateRows: "repeat(10,1fr)", border: "6px solid #fff", boxShadow: "0 0 0 1px #ddd", borderRadius: 4 }}>
              {Array.from({ length: 100 }).map((_, i) => (<div key={i} style={{ background: Math.random() > .5 ? "#000" : "transparent" }} />))}
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 14, fontWeight: 600 }}>QRIS · GPN</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#222", marginTop: 8 }}>{rupiah(total)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 13, borderRadius: 12, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}><Download size={15} />Simpan QR</button>
            <button className="tap" onClick={simulatePaid} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 13, borderRadius: 12, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}><CheckCircle2 size={15} />Cek Status</button>
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 18, lineHeight: 1.6, textAlign: "left", background: "#f7f7f7", padding: 14, borderRadius: 12 }}>
            Screenshot QR → buka m-banking/e-wallet → upload gambar → bayar. Status diperbarui otomatis.
          </div>
          <button className="tap" onClick={simulatePaid} style={{ width: "100%", background: G, color: "#fff", border: "none", borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 18, fontFamily: "inherit", boxShadow: `0 6px 24px rgba(27,122,61,.4)` }}>Simulasikan Pembayaran Berhasil</button>
          <div style={{ height: 20 }} />
        </div>
      </>}

      {/* ===== SUCCESS ===== */}
      {screen === "success" && <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", animation: "scaleIn .4s ease" }}>
        <CheckCircle2 size={72} color={G} />
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 16, color: G }}>Pesanan Berhasil!</div>
        <div style={{ fontSize: 13.5, color: "#777", marginTop: 6, lineHeight: 1.5 }}>
          {payMethod === "online" ? "Pembayaran diterima." : "Silakan bayar di kasir."} Pesanan dikirim ke dapur.
        </div>
        <div style={{ background: G, color: "#fff", borderRadius: 18, padding: "22px 44px", margin: "24px 0" }}>
          <div style={{ fontSize: 13, opacity: .9 }}>Nomor Antrean</div>
          <div style={{ fontSize: 42, fontWeight: 800, marginTop: 4 }}>{queueNumber || `A-${Math.floor(Math.random() * 90) + 10}`}</div>
        </div>
        <div style={{ fontSize: 13.5, color: "#777" }}>{outlet.table ? `Meja ${outlet.table} · ` : ""}Total {rupiah(total)}</div>
        <button className="tap" onClick={resetAll} style={{ width: "100%", background: G, color: "#fff", border: "none", borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 20, fontFamily: "inherit", boxShadow: `0 6px 24px rgba(27,122,61,.4)` }}>Pesan Lagi</button>
      </div>}

      {/* ===== MODAL & DRAWER ===== */}
      {modalItem && <ProductModal item={modalItem} onClose={() => setModalItem(null)} onAdd={addToCart} />}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {processing && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <div style={{ color: "#fff", marginTop: 14, fontFamily: "'Poppins',sans-serif" }}>Sedang diproses...</div>
      </div>}
    </div>
  );
}
