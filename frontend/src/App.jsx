import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ShoppingCart, Search, Menu as MenuIcon, X, Plus, Minus, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, Phone, Navigation, CheckCircle2, Download, History, Globe, HelpCircle, Shield, ChevronDown } from "lucide-react";
import { Analytics } from '@vercel/analytics/react';
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
// ICON COMPONENT — SVG profesional menggantikan emoji
// ============================================================
const ICONS = {
  logo: <><path d="M4 13.5h24l-1.6 9a4 4 0 0 1-4 3.3H9.6a4 4 0 0 1-4-3.3L4 13.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2.5 13.5h27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M11 9.5c0-1.5 1-2.5 2.5-2.5M16 9.5c0-1.5 1-2.5 2.5-2.5M21 9.5c0-1.5 1-2.5 2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
  flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-1.2-1-2.2-2.5-3.5 0 0 1-1 1-2.5 0-2.5-1.5-4-3-4.5 1 4-3 6-3 9 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.4-1.3-4.1-2.5-5.5 0 1.5-.5 2.5-2 2.5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round"/>,
  pin: <><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" fill="none"/></>,
  cart: <><circle cx="9" cy="20" r="1.6" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="18" cy="20" r="1.6" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 4h2.5l2.7 12.5h11l2.3-9H7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  chef: <><path d="M6 12.5c-2 0-3-1.7-3-3.5C3 6.5 5 5 7 5c.5-1.8 2.4-3 4.5-3S15.5 3.2 16 5c2 0 4 1.5 4 4 0 1.8-1 3.5-3 3.5" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round"/><path d="M6 12.5h12V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6.5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round"/></>,
  checkCircle: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="m8 12 3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  xCircle: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
  check: <path d="m5 12 5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  x: <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
  note: <><path d="M5 4h11l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/><path d="M15 4v5h5M8 13h8M8 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" fill="none"/></>,
  sunrise: <><circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="M12 4v2M5.5 7.5l1.4 1.4M2 14h2M20 14h2M17.1 8.9l1.4-1.4M3 20h18M8 18l1-2h6l1 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/></>,
  sun: <><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.2 2.2M4.9 19.1l2.1-2.2M16.9 7.1l2.2-2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></>,
  sunset: <><circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="M12 9V4M5.5 7.5l1.4 1.4M2 14h2M20 14h2M17.1 8.9l1.4-1.4M3 20h18M16 18l-1-2H9l-1 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/></>,
  moon: <path d="M21 13a8 8 0 0 1-10-10 8 8 0 1 0 10 10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>,
  utensils: <><path d="M7 2v8a3 3 0 0 0 3 3v9M5 2v8M10 2v8M16 2c-1 0-3 1.5-3 5s2 5 3 5v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/><circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" fill="none"/></>,
  star: <path d="M12 3 14.6 9 21 9.7l-4.7 4.5L17.6 21 12 17.6 6.4 21l1.3-6.8L3 9.7 9.4 9 12 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>,
  starFill: <path d="M12 3 14.6 9 21 9.7l-4.7 4.5L17.6 21 12 17.6 6.4 21l1.3-6.8L3 9.7 9.4 9 12 3z" fill="currentColor"/>,
  alert: <><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
  info: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="M12 8v.01M11 12h1v5h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
  clock: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/></>,
};
function Icon({ name, size = 18, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>{ICONS[name]}</svg>;
}
function IconLogo({ size = 24, style }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0, ...style }}>{ICONS.logo}</svg>;
}

// ============================================================
// SISTEM TOAST GLOBAL (notif modern, pengganti alert)
// Dipanggil dari komponen mana pun via window event — aman, tanpa props.
// ============================================================
function showToast(message, type = "info", duration = 3200) {
  try {
    window.dispatchEvent(new CustomEvent("mie99-toast", { detail: { message, type, duration, id: Date.now() + Math.random() } }));
  } catch (e) { /* no-op */ }
}

function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, t.duration || 3200);
    };
    window.addEventListener("mie99-toast", onToast);
    return () => window.removeEventListener("mie99-toast", onToast);
  }, []);

  const STYLE = {
    success: { bg: "linear-gradient(135deg,#1b7a3d,#25a550)", iconName: "check", ring: "rgba(37,165,80,.45)" },
    error:   { bg: "linear-gradient(135deg,#c1121f,#e03131)", iconName: "alert", ring: "rgba(224,49,49,.45)" },
    info:    { bg: "linear-gradient(135deg,#1b7a3d,#25a550)", iconName: "info", ring: "rgba(37,165,80,.45)" },
  };

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 10, padding: "14px 14px 0", pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const s = STYLE[t.type] || STYLE.info;
        return (
          <div key={t.id} style={{
            pointerEvents: "auto",
            width: "100%", maxWidth: 400,
            background: s.bg, color: "#fff",
            borderRadius: 16, padding: "13px 15px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: `0 10px 30px ${s.ring}, 0 2px 8px rgba(0,0,0,.15)`,
            fontFamily: "'Poppins',sans-serif",
            animation: "toastIn .35s cubic-bezier(.2,.9,.3,1.3)",
          }}>
            <div style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,.22)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#fff",
            }}><Icon name={s.iconName} size={17} /></div>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, flex: 1 }}>{t.message}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// CONFIRM DIALOG MODERN (pengganti window.confirm)
// ============================================================
function ConfirmDialog({ open, title, message, confirmText = "Ya, Hapus", cancelText = "Batal", danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div onClick={onCancel} style={{
      position: "absolute", inset: 0, zIndex: 9998,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 22,
      animation: "fadeIn .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 320, background: "#fff", borderRadius: 22,
        padding: "26px 22px 20px", textAlign: "center",
        fontFamily: "'Poppins',sans-serif",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        animation: "popIn .3s cubic-bezier(.2,.9,.3,1.3)",
      }}>
        <div style={{
          width: 58, height: 58, borderRadius: "50%", margin: "0 auto 16px",
          background: danger ? "#fdeaea" : GL,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Trash2 size={26} color={danger ? "#e03131" : G} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#222" }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "#777", marginTop: 8, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="tap" onClick={onCancel} style={{
            flex: 1, background: "#f1f2f4", color: "#555", border: "none",
            borderRadius: 13, padding: 13, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
          }}>{cancelText}</button>
          <button className="tap" onClick={onConfirm} style={{
            flex: 1, background: danger ? "#e03131" : G, color: "#fff", border: "none",
            borderRadius: 13, padding: 13, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: danger ? "0 6px 18px rgba(224,49,49,.4)" : `0 6px 18px rgba(27,122,61,.4)`,
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GLOBAL CSS
// ============================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:#1a1a1a;font-family:'Poppins',sans-serif}
::-webkit-scrollbar{display:none}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes toastIn{from{opacity:0;transform:translateY(-18px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes slideLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes slideUpFade{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes subtlePulse{0%,100%{box-shadow:inset 0 0 0 0 rgba(255,255,255,0)}50%{box-shadow:inset 0 0 0 100px rgba(255,255,255,.04)}}
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
function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0);
  const list = banners && banners.length ? banners : [{ image_url: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&h=400&fit=crop", title: "Mie 99", subtitle: "Pedas nampol bikin nagih" }];
  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % list.length), 4000);
    return () => clearInterval(t);
  }, [list.length]);
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", margin: "0 0 14px", height: 160 }}>
      {list.map((b, i) => (
        <img key={i} src={b.image_url || b} alt="promo" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: i === idx ? 1 : 0, transition: "opacity .6s ease",
        }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(0,0,0,.55) 0%,transparent 60%)" }} />
      <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{list[idx]?.title || ""}</div>
        {list[idx]?.subtitle && <div style={{ fontSize: 12, opacity: .95, marginTop: 2 }}>{list[idx].subtitle}</div>}
      </div>
      {list.length > 1 && (
        <div style={{ position: "absolute", bottom: 10, right: 14, display: "flex", gap: 5 }}>
          {list.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 3, cursor: "pointer",
              background: i === idx ? "#fff" : "rgba(255,255,255,.5)", transition: "all .3s ease",
            }} />
          ))}
        </div>
      )}
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
        <div style={{ fontWeight: 800, fontSize: 16, color: "#222", display: "flex", alignItems: "center", gap: 8 }}>Menu Andalan <span style={{ color: "#ef4444" }}><Icon name="flame" size={18}/></span></div>
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
function SideDrawer({ open, onClose, settings, tableNumber, cartCount, subtotal }) {
  const [subView, setSubView] = useState(null); // null | "history" | "language" | "help" | "privacy"
  const [lang, setLang] = useState("id");
  const [faqOpen, setFaqOpen] = useState(null);
  const [fbRating, setFbRating] = useState(0);
  const [fbCategory, setFbCategory] = useState("Pelayanan");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbSent, setFbSent] = useState(false);

  // Riwayat pesanan (device-based, tanpa login)
  const [history, setHistory] = useState(null); // null = belum load, [] = kosong
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getOrderHistory();
      setHistory(data);
    } catch (e) {
      setHistory([]);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (subView === "history") loadHistory();
  }, [subView]);

  const submitFeedback = async () => {
    if (!fbMessage.trim()) { showToast("Mohon tulis pesan Anda.", "error"); return; }
    if (!fbRating) { showToast("Mohon beri rating bintang.", "error"); return; }
    setFbSending(true);
    try {
      const { supabase: sb } = await import("./supabase");
      await sb.from("feedback").insert({
        restaurant_id: api.restaurantId,
        table_number: api.tableNumber,
        customer_name: null,
        rating: fbRating,
        category: fbCategory,
        message: fbMessage.trim(),
      });
      setFbSent(true);
      setFbRating(0); setFbMessage(""); setFbCategory("Pelayanan");
      setTimeout(() => setFbSent(false), 4000);
    } catch (e) {
      showToast("Gagal kirim. Coba lagi.", "error");
    }
    setFbSending(false);
  };

  if (!open) return null;

  const back = () => setSubView(null);
  const close = () => { setSubView(null); onClose(); };

  const menuItems = [
    { key: "history", icon: <History size={18} />, label: "Riwayat Pesanan", sub: "Lihat pesanan sebelumnya" },
    { key: "feedback", icon: <HelpCircle size={18} />, label: "Kritik & Saran", sub: "Beri masukan untuk kami" },
    { key: "language", icon: <Globe size={18} />, label: "Bahasa", sub: lang === "id" ? "Indonesia" : "English" },
    { key: "help", icon: <HelpCircle size={18} />, label: "Bantuan", sub: "FAQ & panduan pemesanan" },
    { key: "privacy", icon: <Shield size={18} />, label: "Kebijakan Privasi", sub: "Syarat & ketentuan" },
  ];

  const faqItems = (settings?.faq && settings.faq.length) ? settings.faq : [
    { q: "Bagaimana cara memesan?", a: "Scan QR code di meja Anda, pilih menu, kustomisasi sesuai selera, lalu bayar lewat QRIS atau kasir. Pesanan langsung masuk ke dapur." },
    { q: "Bisa bayar tunai?", a: "Bisa! Saat checkout, pilih 'Bayar di Kasir'. Pesanan akan masuk sistem, dan Anda tinggal bayar di kasir." },
    { q: "Berapa lama pesanan siap?", a: "Biasanya 10-15 menit tergantung jumlah pesanan. Makanan akan diantar langsung ke meja Anda." },
    { q: "Level pedas bisa diubah?", a: "Level pedas dipilih saat menambahkan menu ke keranjang. Level 0 (tidak pedas) sampai Level 8 (sangat pedas). Level 6 dan 8 ada biaya tambahan." },
    { q: "Pesanan salah, bagaimana?", a: "Hubungi staf restoran terdekat. Mereka akan membantu mengubah atau membatalkan pesanan Anda." },
    { q: "QRIS saya gagal/expired?", a: "QRIS berlaku 10 menit. Jika expired, Anda bisa membuat pesanan baru. Tidak ada uang yang terpotong jika belum bayar." },
  ];

  const drawerContent = () => {
    if (subView === "feedback") return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Kritik & Saran</span>
        </div>
        <div style={{ padding: "20px" }}>
          {fbSent ? (
            <div style={{ padding: 20, background: GL, border: `1.5px solid ${G}`, borderRadius: 12, textAlign: "center" }}>
              <CheckCircle2 size={40} color={G} style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: G, marginBottom: 6 }}>Terima kasih!</div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>Masukan Anda sudah kami terima dan akan menjadi bahan evaluasi.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>Bagikan pengalaman Anda. Setiap masukan membantu kami menjadi lebih baik.</div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#333" }}>RATING ANDA</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setFbRating(n)} style={{ background: "none", border: "none", cursor: "pointer", color: n <= fbRating ? "#f59e0b" : "#ddd", padding: 0, transition: ".15s", display: "inline-flex" }} aria-label={`Rating ${n}`}><Icon name={n <= fbRating ? "starFill" : "star"} size={32}/></button>
                  ))}
                </div>
                {fbRating > 0 && <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginTop: 4 }}>{["", "Sangat Buruk", "Kurang", "Cukup", "Baik", "Sangat Baik"][fbRating]}</div>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#333" }}>KATEGORI</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Pelayanan", "Rasa Makanan", "Kebersihan", "Harga", "Lainnya"].map(c => (
                    <button key={c} onClick={() => setFbCategory(c)} style={{ padding: "7px 12px", borderRadius: 20, border: `1px solid ${fbCategory === c ? G : "#ddd"}`, background: fbCategory === c ? G : "#fff", color: fbCategory === c ? "#fff" : "#666", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{c}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#333" }}>PESAN ANDA</div>
                <textarea value={fbMessage} onChange={e => setFbMessage(e.target.value)} rows={5} maxLength={500} placeholder="Ceritakan pengalaman Anda makan di Mie 99..." style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 10, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none" }} />
                <div style={{ textAlign: "right", fontSize: 10, color: "#aaa", marginTop: 2 }}>{fbMessage.length}/500</div>
              </div>

              <button onClick={submitFeedback} disabled={fbSending} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: G, color: "#fff", fontWeight: 700, fontSize: 14, cursor: fbSending ? "not-allowed" : "pointer", opacity: fbSending ? .6 : 1, fontFamily: "inherit" }}>{fbSending ? "Mengirim..." : "Kirim Masukan"}</button>
            </>
          )}
        </div>
      </div>
    );

    if (subView === "history") {
      const STATUS_MAP = {
        PENDING:   { label: "Menunggu Bayar", color: "#f59e0b", bg: "#fef3c7", iconName: "clock" },
        KITCHEN:   { label: "Sedang Dimasak",  color: "#3b82f6", bg: "#dbeafe", iconName: "chef" },
        PAID:      { label: "Sedang Dimasak",  color: "#3b82f6", bg: "#dbeafe", iconName: "chef" },
        DONE:      { label: "Selesai",         color: "#16a34a", bg: "#dcfce7", iconName: "checkCircle" },
        CANCELLED: { label: "Dibatalkan",      color: "#ef4444", bg: "#fee2e2", iconName: "xCircle" },
      };
      const fmtDate = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        const today = new Date(); today.setHours(0,0,0,0);
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        const dDay = new Date(d); dDay.setHours(0,0,0,0);
        const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        if (dDay.getTime() === today.getTime()) return `Hari ini, ${time}`;
        if (dDay.getTime() === yest.getTime()) return `Kemarin, ${time}`;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) + `, ${time}`;
      };

      // Stats ringkas
      const totalOrders = history?.length || 0;
      const totalSpent = (history || []).reduce((s, o) => s + (o.total || 0), 0);

      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f7f7f8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee", background: "#fff" }}>
            <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Riwayat Pesanan</span>
            {!historyLoading && totalOrders > 0 &&
              <button className="tap" onClick={loadHistory} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: G, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>↻ Segarkan</button>}
          </div>

          {/* Loading */}
          {historyLoading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, color: "#aaa" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e5e5e5", borderTopColor: G, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              <div style={{ fontSize: 13, marginTop: 14, color: "#999" }}>Memuat riwayat...</div>
            </div>
          )}

          {/* Empty */}
          {!historyLoading && history && history.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, color: "#aaa" }}>
              <History size={48} color="#ddd" />
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 14, color: "#999" }}>Belum ada pesanan</div>
              <div style={{ fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 1.5, maxWidth: 240 }}>Pesanan Anda akan otomatis muncul di sini setelah memesan. Tidak perlu login!</div>
            </div>
          )}

          {/* List */}
          {!historyLoading && history && history.length > 0 && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 24px" }}>
              {/* Summary card */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, background: `linear-gradient(135deg,${G},${G2})`, color: "#fff", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, opacity: .85, fontWeight: 600 }}>Total Pesanan</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{totalOrders}</div>
                </div>
                <div style={{ flex: 1.4, background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>Total Belanja</div>
                  <div style={{ fontSize: 19, fontWeight: 900, marginTop: 2, color: G }}>{rupiah(totalSpent)}</div>
                </div>
              </div>

              {history.map(o => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.PENDING;
                const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
                return (
                  <div key={o.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #f3f3f3" }}>
                      <div>
                        <div style={{ fontSize: 11.5, color: "#999" }}>{fmtDate(o.createdAt)}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#444", marginTop: 2 }}>
                          {o.tableNumber ? `Meja ${o.tableNumber}` : "Take Away"}
                          {o.queueNumber && <span style={{ color: G, marginLeft: 6 }}>· No. {o.queueNumber}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, background: st.bg, color: st.color, padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        <Icon name={st.iconName} size={13}/>{st.label}
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ padding: "10px 14px" }}>
                      {o.items.map((it, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 0", fontSize: 13 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 700, color: G, marginRight: 6 }}>{it.qty}×</span>
                            <span style={{ color: "#333" }}>{it.name}</span>
                            {it.modifiers.length > 0 && <div style={{ fontSize: 11, color: "#999", marginLeft: 22, marginTop: 1 }}>{it.modifiers.join(", ")}</div>}
                            {it.notes && <div style={{ fontSize: 11, color: "#f59e0b", marginLeft: 22, marginTop: 1, fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 4 }}><Icon name="note" size={12} style={{ marginTop: 1 }}/><span>{it.notes}</span></div>}
                          </div>
                          <span style={{ color: "#666", fontSize: 12.5, whiteSpace: "nowrap", marginLeft: 8 }}>{rupiah(it.unitPrice * it.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderTop: "1px solid #f3f3f3", background: "#fafafa" }}>
                      <span style={{ fontSize: 11.5, color: "#999" }}>{itemCount} item · {o.paymentMethod === "QRIS" ? "QRIS" : "Tunai"}</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#222" }}>{rupiah(o.total)}</span>
                    </div>
                  </div>
                );
              })}

              <div style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 8, lineHeight: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Icon name="lock" size={14}/>
                <span>Riwayat tersimpan otomatis di perangkat ini<br/>tanpa perlu login</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (subView === "language") return (
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button className="tap" onClick={back} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Pilih Bahasa</span>
        </div>
        <div style={{ padding: "8px 0" }}>
          {[{ code: "id", flagText: "ID", flagBg: "#dc2626", name: "Bahasa Indonesia", sub: "Indonesian" }, { code: "en", flagText: "EN", flagBg: "#1d4ed8", name: "English", sub: "Inggris" }].map(l => (
            <button key={l.code} className="tap" onClick={() => setLang(l.code)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
              border: "none", background: lang === l.code ? GL : "transparent", cursor: "pointer", textAlign: "left",
              transition: "background .15s",
            }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: l.flagBg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, letterSpacing: ".5px" }}>{l.flagText}</span>
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
          {settings?.privacy ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{settings.privacy}</div>
          ) : (
            <>
              <p>Kami menghargai privasi Anda. Data yang kami kumpulkan saat pemesanan (nama, nomor ponsel, email) digunakan hanya untuk:</p>
              <p style={{ marginTop: 8 }}><b>1. Memproses pesanan Anda</b> — Nama dan nomor meja digunakan untuk mengidentifikasi dan mengantarkan pesanan.</p>
              <p style={{ marginTop: 8 }}><b>2. Mengirim struk digital</b> — Email digunakan untuk mengirim bukti pembayaran jika Anda memilih opsi ini.</p>
              <p style={{ marginTop: 8 }}><b>3. Informasi promo</b> — Nomor ponsel dapat digunakan untuk mengirimkan promo, namun Anda bisa berhenti kapan saja.</p>
              <p style={{ marginTop: 12 }}>Kami <b>tidak</b> menjual atau membagikan data Anda kepada pihak ketiga.</p>
              <p style={{ marginTop: 12 }}>Dengan menggunakan layanan ini, Anda menyetujui kebijakan privasi di atas.</p>
            </>
          )}
          <div style={{ marginTop: 16, padding: "12px", background: GL, borderRadius: 10, fontSize: 12, color: G }}>
            Terakhir diperbarui: Juni 2026
          </div>
        </div>
      </div>
    );

    // Main menu
    return (
      <>
        <div style={{ padding: "22px 20px 18px", background: `linear-gradient(145deg,${G} 0%,${G2} 100%)`, color: "#fff", position: "relative", overflow: "hidden" }}>
          {/* Background decorative circles */}
          <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.07)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -16, right: 20, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><IconLogo size={22}/></div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-.3px" }}>Mie 99</div>
          </div>

          {/* Dynamic greeting */}
          {(() => {
            const h = new Date().getHours();
            const [salam, ic] =
              h < 11 ? ["Selamat Pagi", "sunrise"] :
              h < 15 ? ["Selamat Siang", "sun"] :
              h < 18 ? ["Selamat Sore", "sunset"] :
                       ["Selamat Malam", "moon"];
            return (
              <div style={{ fontSize: 13, fontWeight: 600, opacity: .95, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name={ic} size={16}/><span>{salam}, selamat datang!</span>
              </div>
            );
          })()}

          {/* Info chips row */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {/* Table chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)",
              padding: "5px 11px", borderRadius: 20,
              fontSize: 11.5, fontWeight: 700,
              border: "1px solid rgba(255,255,255,.25)",
            }}>
              <Icon name="pin" size={13}/><span>Meja {tableNumber || "—"}</span>
            </div>

            {/* Cart status chip — only if ada item */}
            {cartCount > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,.22)", backdropFilter: "blur(4px)",
                padding: "5px 11px", borderRadius: 20,
                fontSize: 11.5, fontWeight: 700,
                border: "1px solid rgba(255,255,255,.3)",
                animation: "pulse .8s ease 2",
              }}>
                <Icon name="cart" size={13}/><span>{cartCount} item · {rupiah(subtotal)}</span>
              </div>
            )}
          </div>
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
  const [confirmClear, setConfirmClear] = useState(false);
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
  const [settings, setSettings] = useState({ banners: [], faq: [], privacy: "", schedule: [], phone: "", mapsUrl: "" });

  // Fetch settings (banner, faq, privacy, schedule)
  useEffect(() => {
    (async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
        setOutlet(o => ({ ...o, name: s.name || o.name, address: s.address || o.address, hours: s.hours || o.hours, phone: s.phone || o.phone, mapsUrl: s.mapsUrl || "" }));
      } catch (e) { console.error("settings:", e); }
    })();
  }, []);

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

  const buildApiItems = () => cart.map(l => ({ menuItemId: l.itemId, quantity: l.qty, unitPrice: l.unitPrice, notes: l.notes || "", modifierIds: l.modifierIds || [] }));

  const handleCheckout = async () => {
    setProcessing(true);
    if (!isLive) { setTimeout(() => { setProcessing(false); setScreen(payMethod === "online" ? "qris" : "success"); }, 1200); return; }
    try {
      const res = await api.createOrder({ customerName: form.name, phone: form.phone, email: form.email, paymentMethod: payMethod === "online" ? "QRIS" : "CASHIER", items: buildApiItems() });
      setOrderId(res.orderId); setProcessing(false);
      if (payMethod === "online") { setQrisPayload(res.qris?.payload || null); setScreen("qris"); } else setScreen("success");
    } catch (e) { setProcessing(false); showToast(e.message, "error", 4200); }
  };

  const simulatePaid = async () => {
    setProcessing(true);
    if (!isLive) { setTimeout(() => { setProcessing(false); setScreen("success"); }, 1000); return; }
    try { const { queueNumber: q } = await api.simulatePaid(orderId); setQueueNumber(q); setProcessing(false); setScreen("success"); } catch (e) { setProcessing(false); showToast(e.message, "error", 4200); }
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
          <BannerCarousel banners={settings.banners} />
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
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#ff9800", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="camera" size={22}/></div>
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
          <div style={{ height: cartCount > 0 ? 100 : 24 }} />
        </div>

        {cartCount > 0 && <div style={{
          position: "absolute", bottom: 18, left: 12, right: 12,
          display: "flex", alignItems: "center", gap: 10,
          animation: "slideUpFade .4s cubic-bezier(.34,1.56,.64,1)",
        }}>
          {/* Trash button — clear all cart */}
          <button
            className="tap"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmClear(true);
            }}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "#fff", color: G,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 10px 24px rgba(0,0,0,.18), 0 3px 8px rgba(0,0,0,.1)",
              flexShrink: 0, position: "relative",
              fontFamily: "inherit",
            }}
            title="Hapus semua pesanan"
          >
            <Trash2 size={22} strokeWidth={2.2} />
            <div style={{
              position: "absolute", top: -3, right: -3,
              background: "#ef4444", color: "#fff",
              fontSize: 10.5, fontWeight: 800,
              minWidth: 21, height: 21, padding: "0 6px",
              borderRadius: 11, display: "flex",
              alignItems: "center", justifyContent: "center",
              border: "2.5px solid #fff",
              boxShadow: "0 2px 4px rgba(239,68,68,.4)",
            }}>{cartCount}</div>
          </button>

          {/* Main pill bar */}
          <div style={{
            flex: 1, minWidth: 0,
            boxShadow: "0 12px 28px rgba(27,122,61,.45), 0 4px 10px rgba(27,122,61,.25), inset 0 1px 0 rgba(255,255,255,.15)",
            borderRadius: 999,
            overflow: "hidden",
          }}>
            <button className="tap" onClick={() => setScreen("cart")} style={{
              display: "flex", width: "100%", border: "none", padding: 0,
              cursor: "pointer", fontFamily: "inherit", background: "transparent",
              position: "relative",
            }}>
              {/* Left: TOTAL + Price */}
              <div style={{
                flex: 1, background: G2, color: "#fff",
                padding: "14px 22px", display: "flex", alignItems: "center",
                position: "relative", minWidth: 0,
              }}>
                <div style={{ textAlign: "left", lineHeight: 1.1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, opacity: .8,
                    letterSpacing: "1.5px", textTransform: "uppercase",
                    marginBottom: 4,
                  }}>Total</div>
                  <div style={{
                    fontSize: 19, fontWeight: 900,
                    letterSpacing: "-.5px",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{rupiah(subtotal)}</div>
                </div>
                {/* Subtle vertical divider */}
                <div style={{
                  position: "absolute", right: 0, top: "22%", bottom: "22%",
                  width: 1, background: "rgba(255,255,255,.18)",
                }} />
              </div>
              {/* Right: CHECK OUT + arrow */}
              <div style={{
                background: G, color: "#fff",
                padding: "14px 20px 14px 22px", display: "flex",
                alignItems: "center", gap: 10, lineHeight: 1.1,
                animation: "subtlePulse 2.5s ease-in-out infinite",
              }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{
                    fontSize: 13, fontWeight: 900,
                    letterSpacing: ".8px", textTransform: "uppercase",
                  }}>Check Out</div>
                  <div style={{
                    fontSize: 10, opacity: .82, marginTop: 4,
                    fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                  }}>{cartCount} Item</div>
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <ChevronRight size={19} strokeWidth={2.8} />
                </div>
              </div>
            </button>
          </div>
        </div>}
      </>}

      {/* ===== CART ===== */}
      {screen === "cart" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eee", flexShrink: 0 }}>
          <button className="tap" onClick={() => setScreen("menu")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><ChevronLeft size={22} /></button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Pesanan</div>
          <div style={{ width: 22 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ background: GL, color: G, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="utensils" size={16}/><span>Makan di tempat{outlet.table ? ` · Meja ${outlet.table}` : ""}</span>
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
                {line.notes && <div style={{ fontSize: 11, color: "#e65100", fontStyle: "italic", marginTop: 2, display: "flex", alignItems: "flex-start", gap: 4 }}><Icon name="note" size={12} style={{ marginTop: 1 }}/><span>{line.notes}</span></div>}
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
          <div style={{ background: GL, color: G, fontWeight: 700, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 18, animation: "pulse 2s ease infinite", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name="clock" size={16}/><span>Selesaikan dalam {mm}:{ss}</span></div>
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
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} settings={settings} tableNumber={outlet.table} cartCount={cartCount} subtotal={subtotal} />

      {/* ===== NOTIF MODERN & CONFIRM ===== */}
      <ToastHost />
      <ConfirmDialog
        open={confirmClear}
        title="Hapus Keranjang?"
        message={`Semua ${cartCount} item akan dihapus dari keranjang. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { setCart([]); setConfirmClear(false); showToast("Keranjang dikosongkan.", "success"); }}
      />
      {processing && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <div style={{ color: "#fff", marginTop: 14, fontFamily: "'Poppins',sans-serif" }}>Sedang diproses...</div>
      </div>}
      <Analytics />
    </div>
  );
}
