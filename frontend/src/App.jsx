import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Search, Menu as MenuIcon, X, Plus, Minus, Trash2, ChevronLeft, MapPin, Clock, CheckCircle2, Copy, Download } from "lucide-react";
import { api } from "./api";

// ============================================================
// MODE OPERASI
// - Tanpa token QR di URL  -> MODE DEMO (data dummy di bawah, langsung jalan)
// - Dengan ?restaurant=&token= -> MODE LIVE (tarik menu & checkout via backend)
// Data dummy tetap dipertahankan sebagai fallback demo.
// ============================================================

// ============================================================
// DATA DUMMY (replika menu Mie Gacoan dari PRD)
// ============================================================
const OUTLET = {
  name: "Mie Gacoan - Mojokerto",
  address: "Jl. Mojopahit No. 91, Mojokerto",
  hours: "10.00 - 22.00 WIB",
  table: null, // didapat dari scan QR, bukan hardcode
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

// Foto makanan asli (Unsplash, free to use).
const FOOD_IMG = {
  mie_hompimpa: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=200&h=200&fit=crop",
  mie_suit: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop",
  mie_gacoan: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=200&h=200&fit=crop",
  gacoan_combat_a: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=200&h=200&fit=crop",
  udang_keju: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=200&h=200&fit=crop",
  udang_rambutan: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop",
  lemon_tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop",
  es_teh: "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=200&h=200&fit=crop",
  air_mineral: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop",
};

const CATEGORIES = [
  {
    id: "rekomendasi",
    name: "Menu Recommendation",
    items: [
      { id: "mie_hompimpa", name: "Mie Hompimpa", price: 10000, type: "spicy", desc: "Mie pedas dengan topcal & pangsit, level pedas bisa dipilih." },
      { id: "mie_suit", name: "Mie Suit", price: 10000, type: "spicy", desc: "Mie kuah gurih dengan level pedas pilihan." },
      { id: "mie_gacoan", name: "Mie Gacoan", price: 10000, type: "spicy", desc: "Menu andalan, mie pedas khas Gacoan." },
    ],
  },
  {
    id: "paket",
    name: "Paket Fest Dine In",
    items: [
      {
        id: "gacoan_combat_a",
        name: "Gacoan Combat A",
        price: 48183,
        type: "combo",
        desc: "2 Mie + 2 Dimsum + 2 Minuman. Hemat untuk berdua.",
        groups: [
          { id: "mie1", name: "Pilih Mie (1)", min: 1, max: 1, options: [{ id: "mie_gacoan", name: "Mie Gacoan", add: 0 }, { id: "mie_suit", name: "Mie Suit", add: 0 }] },
          { id: "mie2", name: "Pilih Mie (2)", min: 1, max: 1, options: [{ id: "mie_gacoan", name: "Mie Gacoan", add: 0 }, { id: "mie_suit", name: "Mie Suit", add: 0 }] },
          { id: "dimsum1", name: "Pilih Dimsum (1)", min: 1, max: 1, options: [{ id: "udang_keju", name: "Udang Keju", add: 0 }, { id: "udang_rambutan", name: "Udang Rambutan", add: 0 }] },
          { id: "dimsum2", name: "Pilih Dimsum (2)", min: 1, max: 1, options: [{ id: "udang_keju", name: "Udang Keju", add: 0 }, { id: "udang_rambutan", name: "Udang Rambutan", add: 0 }] },
          { id: "drink", name: "Pilih Minuman (2)", min: 2, max: 2, options: [{ id: "lemon_tea", name: "Lemon Tea", add: 0 }, { id: "es_teh", name: "Es Teh", add: 0 }, { id: "air_mineral", name: "Air Mineral", add: 0 }] },
        ],
      },
    ],
  },
  {
    id: "dimsum",
    name: "Dimsum",
    items: [
      { id: "udang_keju", name: "Dimsum Udang Keju", price: 9500, type: "simple", desc: "Dimsum isi udang dengan keju leleh." },
      { id: "udang_rambutan", name: "Dimsum Udang Rambutan", price: 9500, type: "simple", desc: "Dimsum udang dengan kulit renyah." },
    ],
  },
  {
    id: "minuman",
    name: "Minuman & Es Buah",
    items: [
      { id: "lemon_tea", name: "Lemon Tea", price: 8000, type: "simple", desc: "Teh segar dengan perasan lemon." },
      { id: "es_teh", name: "Es Teh", price: 5000, type: "simple", desc: "Es teh manis." },
      { id: "air_mineral", name: "Air Mineral", price: 4000, type: "simple", desc: "Air mineral 600ml." },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);
const findItem = (id) => ALL_ITEMS.find((i) => i.id === id);

const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

// ============================================================
// MODAL KUSTOMISASI PRODUK
// ============================================================
function ProductModal({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState(item.type === "spicy" ? "lvl1" : null);
  const [notes, setNotes] = useState("");
  // untuk combo: { groupId: [optionId, ...] }
  const [selections, setSelections] = useState(() => {
    if (item.type !== "combo") return {};
    const init = {};
    item.groups.forEach((g) => (init[g.id] = []));
    return init;
  });

  const toggleSelection = (group, optId) => {
    setSelections((prev) => {
      const cur = prev[group.id] || [];
      if (cur.includes(optId)) {
        return { ...prev, [group.id]: cur.filter((x) => x !== optId) };
      }
      if (group.max === 1) return { ...prev, [group.id]: [optId] };
      if (cur.length >= group.max) return prev; // batas tercapai
      return { ...prev, [group.id]: [...cur, optId] };
    });
  };

  const spiceAdd = useMemo(() => {
    if (!spice) return 0;
    return SPICE_LEVELS.find((s) => s.id === spice)?.add || 0;
  }, [spice]);

  const unitPrice = item.price + spiceAdd;
  const totalPrice = unitPrice * qty;

  const comboValid =
    item.type !== "combo" ||
    item.groups.every((g) => (selections[g.id] || []).length === (g.min === g.max ? g.min : Math.max(g.min, 1)) || (selections[g.id] || []).length >= g.min);

  const canAdd = item.type !== "combo" || item.groups.every((g) => (selections[g.id] || []).length >= g.min);

  const handleAdd = () => {
    const detail = [];
    const modifierIds = [];
    if (spice) {
      detail.push(SPICE_LEVELS.find((s) => s.id === spice).name);
      // Mode live: petakan level pedas ke id modifier asli dari backend bila ada.
      const spiceGroup = (item.groups || []).find((g) => g.name?.toUpperCase().includes("PEDAS"));
      if (spiceGroup) {
        const spiceName = SPICE_LEVELS.find((s) => s.id === spice).name;
        const match = spiceGroup.options.find((o) => o.name === spiceName);
        if (match) modifierIds.push(match.id);
      }
    }
    if (item.type === "combo") {
      item.groups.forEach((g) => {
        (selections[g.id] || []).forEach((optId) => {
          const opt = g.options.find((o) => o.id === optId);
          if (opt) { detail.push(opt.name); modifierIds.push(opt.id); }
        });
      });
    }
    onAdd({
      lineId: Date.now() + Math.random(),
      itemId: item.id,
      name: item.name,
      qty,
      unitPrice,
      detail,
      modifierIds,
      notes,
    });
    onClose();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHandle} />
        <button style={styles.modalClose} onClick={onClose}><X size={20} /></button>
        <div style={styles.modalScroll}>
          <div style={styles.modalImg}><img src={FOOD_IMG[item.id] || ""} alt={item.name} style={styles.modalImgPhoto} /></div>
          <h2 style={styles.modalTitle}>{item.name}</h2>
          <p style={styles.modalDesc}>{item.desc}</p>
          <div style={styles.modalPrice}>{rupiah(item.price)}</div>

          {item.type === "spicy" && (
            <div style={styles.group}>
              <div style={styles.groupTitle}>LEVEL PEDAS <span style={styles.required}>Wajib</span></div>
              {SPICE_LEVELS.map((s) => (
                <label key={s.id} style={styles.optRow}>
                  <span>{s.name}{s.add > 0 && <span style={styles.optAdd}> +{rupiah(s.add)}</span>}</span>
                  <input type="radio" name="spice" checked={spice === s.id} onChange={() => setSpice(s.id)} style={styles.radio} />
                </label>
              ))}
            </div>
          )}

          {item.type === "combo" && item.groups.map((g) => {
            const cur = selections[g.id] || [];
            return (
              <div key={g.id} style={styles.group}>
                <div style={styles.groupTitle}>
                  {g.name} <span style={styles.required}>Pilih {g.min === g.max ? g.min : `${g.min}-${g.max}`}</span>
                </div>
                {g.options.map((o) => {
                  const checked = cur.includes(o.id);
                  const disabled = !checked && cur.length >= g.max;
                  return (
                    <label key={o.id} style={{ ...styles.optRow, opacity: disabled ? 0.4 : 1 }}>
                      <span>{o.name}{o.add > 0 && <span style={styles.optAdd}> +{rupiah(o.add)}</span>}</span>
                      <input
                        type={g.max === 1 ? "radio" : "checkbox"}
                        name={g.id}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleSelection(g, o.id)}
                        style={styles.radio}
                      />
                    </label>
                  );
                })}
              </div>
            );
          })}

          <div style={styles.group}>
            <div style={styles.groupTitle}>Catatan (opsional)</div>
            <input
              style={styles.noteInput}
              placeholder="Sedikit gula"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.modalFooter}>
          <div style={styles.qtyBox}>
            <button style={styles.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
            <span style={styles.qtyNum}>{qty}</span>
            <button style={styles.qtyBtn} onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
          </div>
          <button
            style={{ ...styles.addBtn, ...(canAdd ? {} : styles.addBtnDisabled) }}
            disabled={!canAdd}
            onClick={handleAdd}
          >
            Tambah · {rupiah(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP UTAMA
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("menu"); // menu | cart | checkout | qris | success
  const [cart, setCart] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ----- Mode & sumber data -----
  const isLive = api.hasSession;
  const [categories, setCategories] = useState(CATEGORIES); // dummy default
  const [outlet, setOutlet] = useState(OUTLET);
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [orderId, setOrderId] = useState(null);
  const [qrisPayload, setQrisPayload] = useState(null);
  const [queueNumber, setQueueNumber] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Muat data dari backend bila ada sesi QR.
  useEffect(() => {
    if (!isLive) return;
    (async () => {
      try {
        const { restaurant, table } = await api.validateTable();
        setOutlet({ name: restaurant.name, address: restaurant.address, hours: restaurant.hours, table: table.number });
        const { categories: cats } = await api.getMenu();
        // Transformasi format backend -> format komponen.
        const mapped = cats.map((c) => ({
          id: c.id,
          name: c.name,
          items: c.items.map((it) => ({
            id: it.id,
            name: it.name,
            price: it.basePrice,
            desc: it.description || "",
            type: it.isPackage ? "combo" : it.modifierGroups?.some((g) => g.name.toUpperCase().includes("PEDAS")) ? "spicy" : "simple",
            groups: (it.modifierGroups || []).map((g) => ({
              id: g.id, name: g.name, min: g.minSelections, max: g.maxSelections,
              options: g.modifiers.map((m) => ({ id: m.id, name: m.name, add: m.additionalPrice })),
            })),
          })),
        }));
        setCategories(mapped);
        if (mapped[0]) setActiveCat(mapped[0].id);
      } catch (e) {
        setLoadError(e.message);
      }
    })();
  }, [isLive]);

  // checkout form
  const [form, setForm] = useState({ name: "", phone: "", email: "", agree: false });
  const [payMethod, setPayMethod] = useState("online");
  const [timer, setTimer] = useState(600);
  const [processing, setProcessing] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const rounding = subtotal > 0 ? -(((subtotal + tax) % 100) || 0) : 0;
  const total = subtotal + tax + rounding;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (line) => setCart((c) => [...c, line]);
  const removeLine = (lineId) => setCart((c) => c.filter((i) => i.lineId !== lineId));
  const changeQty = (lineId, d) =>
    setCart((c) =>
      c
        .map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + d } : i))
        .filter((i) => i.qty > 0)
    );

  // timer QRIS
  useEffect(() => {
    if (screen !== "qris") return;
    setTimer(600);
    const t = setInterval(() => setTimer((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [screen]);

  // Polling status order (mode live) saat di halaman QRIS.
  useEffect(() => {
    if (!isLive || screen !== "qris" || !orderId) return;
    const t = setInterval(async () => {
      try {
        const { status, queueNumber: q } = await api.getOrderStatus(orderId);
        if (status === "KITCHEN" || status === "PAID" || status === "DONE") {
          setQueueNumber(q);
          setScreen("success");
        }
      } catch (_) {}
    }, 5000);
    return () => clearInterval(t);
  }, [isLive, screen, orderId]);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  // Susun payload item untuk backend (kumpulkan id modifier yang dipilih).
  const buildApiItems = () =>
    cart.map((line) => ({
      menuItemId: line.itemId,
      quantity: line.qty,
      notes: line.notes || "",
      modifierIds: line.modifierIds || [],
    }));

  const handleCheckout = async () => {
    setProcessing(true);
    if (!isLive) {
      // MODE DEMO
      setTimeout(() => {
        setProcessing(false);
        setScreen(payMethod === "online" ? "qris" : "success");
      }, 1200);
      return;
    }
    // MODE LIVE
    try {
      const res = await api.createOrder({
        customerName: form.name,
        phone: form.phone,
        email: form.email,
        paymentMethod: payMethod === "online" ? "QRIS" : "CASHIER",
        items: buildApiItems(),
      });
      setOrderId(res.orderId);
      setProcessing(false);
      if (payMethod === "online") {
        setQrisPayload(res.qris?.payload || null);
        setScreen("qris");
      } else {
        setScreen("success");
      }
    } catch (e) {
      setProcessing(false);
      alert("Gagal membuat pesanan: " + e.message);
    }
  };

  const simulatePaid = async () => {
    setProcessing(true);
    if (!isLive) {
      setTimeout(() => { setProcessing(false); setScreen("success"); }, 1000);
      return;
    }
    try {
      const { queueNumber: q } = await api.simulatePaid(orderId);
      setQueueNumber(q);
      setProcessing(false);
      setScreen("success");
    } catch (e) {
      setProcessing(false);
      alert("Gagal: " + e.message);
    }
  };

  const resetAll = () => {
    setCart([]);
    setForm({ name: "", phone: "", email: "", agree: false });
    setOrderId(null);
    setQrisPayload(null);
    setQueueNumber(null);
    setScreen("menu");
  };

  const filteredCats = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.map((c) => ({ ...c, items: c.items.filter((i) => i.name.toLowerCase().includes(q)) })).filter((c) => c.items.length);
  }, [search, categories]);

  // ---------------- RENDER ----------------
  return (
    <div style={styles.phone}>
      <style>{globalCss}</style>

      {/* ===== MENU SCREEN ===== */}
      {screen === "menu" && (
        <>
          <div style={styles.header}>
            <button style={styles.iconBtn}><MenuIcon size={22} /></button>
            <div style={styles.logo}>Mie Gacoan</div>
            <button style={styles.iconBtn} onClick={() => setShowSearch((s) => !s)}><Search size={22} /></button>
          </div>

          {showSearch && (
            <div style={styles.searchBar}>
              <Search size={16} color="#999" />
              <input style={styles.searchInput} placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
            </div>
          )}

          <div style={styles.scroll}>
            <div style={styles.banner}>🍜 PROMO PAKET FEST · Hemat hingga 30%</div>

            <div style={styles.outletCard}>
              <div style={styles.outletName}>{outlet.name}</div>
              <div style={styles.outletRow}><MapPin size={13} /> {outlet.address}</div>
              <div style={styles.outletRow}><Clock size={13} /> {outlet.hours}</div>
            </div>

            <div style={styles.tableTag}>{outlet.table ? `Nomor Meja: ${outlet.table}` : "📷 Scan QR di meja untuk memulai pesanan"}</div>

            {/* tab kategori */}
            <div style={styles.catTabs}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  style={{ ...styles.catTab, ...(activeCat === c.id ? styles.catTabActive : {}) }}
                  onClick={() => {
                    setActiveCat(c.id);
                    document.getElementById("cat-" + c.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {filteredCats.map((cat) => (
              <div key={cat.id} id={"cat-" + cat.id} style={styles.catSection}>
                <div style={styles.catHeading}>{cat.name}</div>
                {cat.items.map((item) => (
                  <div key={item.id} style={styles.itemCard}>
                    <div style={styles.itemThumb}><img src={FOOD_IMG[item.id] || ""} alt={item.name} style={styles.thumbImg} /></div>
                    <div style={styles.itemInfo}>
                      <div style={styles.itemName}>{item.name}</div>
                      <div style={styles.itemDesc}>{item.desc}</div>
                      <div style={styles.itemPrice}>{rupiah(item.price)}</div>
                    </div>
                    <button style={styles.addItemBtn} onClick={() => setModalItem(item)}>Tambah</button>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ height: 90 }} />
          </div>

          {cartCount > 0 && (
            <button style={styles.cartFab} onClick={() => setScreen("cart")}>
              <ShoppingCart size={18} />
              <span>{cartCount} item</span>
              <span style={styles.cartFabPrice}>{rupiah(subtotal)}</span>
            </button>
          )}
        </>
      )}

      {/* ===== CART SCREEN ===== */}
      {screen === "cart" && (
        <>
          <div style={styles.subHeader}>
            <button style={styles.iconBtn} onClick={() => setScreen("menu")}><ChevronLeft size={22} /></button>
            <div style={styles.subTitle}>Pesanan</div>
            <div style={{ width: 22 }} />
          </div>
          <div style={styles.scroll}>
            <div style={styles.orderTypeTag}>Makan di tempat{outlet.table ? ` · Meja ${outlet.table}` : ""}</div>
            {cart.length === 0 && <div style={styles.empty}>Keranjang kosong</div>}
            {cart.map((line) => (
              <div key={line.lineId} style={styles.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={styles.itemName}>{line.name}</div>
                  {line.detail.length > 0 && <div style={styles.itemDesc}>{line.detail.join(", ")}</div>}
                  {line.notes && <div style={styles.noteTag}>Catatan: {line.notes}</div>}
                  <div style={styles.itemPrice}>{rupiah(line.unitPrice * line.qty)}</div>
                </div>
                <div style={styles.qtyBoxSm}>
                  <button style={styles.qtyBtnSm} onClick={() => changeQty(line.lineId, -1)}>
                    {line.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span style={styles.qtyNum}>{line.qty}</span>
                  <button style={styles.qtyBtnSm} onClick={() => changeQty(line.lineId, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <div style={styles.summaryCard}>
                <div style={styles.sumRow}><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
                <div style={styles.sumRow}><span>Pajak (10%)</span><span>{rupiah(tax)}</span></div>
                <div style={styles.sumRow}><span>Pembulatan</span><span>{rupiah(rounding)}</span></div>
                <div style={{ ...styles.sumRow, ...styles.sumTotal }}><span>Total</span><span>{rupiah(total)}</span></div>
              </div>
            )}
            <div style={{ height: 90 }} />
          </div>
          {cart.length > 0 && (
            <button style={styles.bottomBtn} onClick={() => setScreen("checkout")}>
              Lanjut ke Pembayaran · {rupiah(total)}
            </button>
          )}
        </>
      )}

      {/* ===== CHECKOUT SCREEN ===== */}
      {screen === "checkout" && (
        <>
          <div style={styles.subHeader}>
            <button style={styles.iconBtn} onClick={() => setScreen("cart")}><ChevronLeft size={22} /></button>
            <div style={styles.subTitle}>Pembayaran</div>
            <div style={{ width: 22 }} />
          </div>
          <div style={styles.scroll}>
            <div style={styles.formCard}>
              <div style={styles.formTitle}>Informasi Pemesan</div>
              <input style={styles.input} placeholder="Nama Lengkap *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input style={styles.input} placeholder="Nomor Ponsel *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input style={styles.input} placeholder="Email (kirim struk, opsional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input style={{ ...styles.input, background: "#f0f0f0", color: "#888" }} value={outlet.table ? `Nomor Meja: ${outlet.table}` : "Nomor meja dari scan QR"} readOnly />
            </div>

            <div style={styles.formCard}>
              <div style={styles.formTitle}>Metode Pembayaran</div>
              <div style={styles.payTabs}>
                <button style={{ ...styles.payTab, ...(payMethod === "online" ? styles.payTabActive : {}) }} onClick={() => setPayMethod("online")}>Pembayaran Online</button>
                <button style={{ ...styles.payTab, ...(payMethod === "cashier" ? styles.payTabActive : {}) }} onClick={() => setPayMethod("cashier")}>Bayar di Kasir</button>
              </div>
              {payMethod === "online" && (
                <label style={styles.optRow}><span>QRIS (semua e-wallet & m-banking)</span><input type="radio" checked readOnly style={styles.radio} /></label>
              )}
              {payMethod === "cashier" && (
                <div style={styles.itemDesc}>Bayar langsung di kasir setelah memesan.</div>
              )}
            </div>

            <div style={styles.formCard}>
              <div style={styles.sumRow}><span>Total Pembayaran</span><span style={{ fontWeight: 700, color: "#2e7d32" }}>{rupiah(total)}</span></div>
            </div>

            <label style={styles.agreeRow}>
              <input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
              <span>Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi.</span>
            </label>
            <div style={{ height: 90 }} />
          </div>
          <button
            style={{ ...styles.bottomBtn, ...(form.name && form.phone && form.agree ? {} : styles.addBtnDisabled) }}
            disabled={!(form.name && form.phone && form.agree)}
            onClick={handleCheckout}
          >
            Pesan Sekarang · {rupiah(total)}
          </button>
        </>
      )}

      {/* ===== QRIS SCREEN ===== */}
      {screen === "qris" && (
        <>
          <div style={styles.subHeader}>
            <button style={styles.iconBtn} onClick={() => setScreen("checkout")}><ChevronLeft size={22} /></button>
            <div style={styles.subTitle}>Pembayaran QRIS</div>
            <div style={{ width: 22 }} />
          </div>
          <div style={{ ...styles.scroll, textAlign: "center" }}>
            <div style={styles.qrisTimer}>Selesaikan dalam {mm}:{ss}</div>
            <div style={styles.qrisCard}>
              <div style={styles.qrisMerchant}>ESB RESTAURANT TECHNOLOGY</div>
              <div style={styles.qrFake}>
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} style={{ background: Math.random() > 0.5 ? "#000" : "transparent" }} />
                ))}
              </div>
              <div style={styles.gpn}>QRIS · GPN</div>
              <div style={styles.qrisTotal}>{rupiah(total)}</div>
            </div>
            <div style={styles.qrisActions}>
              <button style={styles.qrisOutline}><Download size={15} /> Simpan QR</button>
              <button style={styles.qrisOutline} onClick={simulatePaid}><CheckCircle2 size={15} /> Cek Status</button>
            </div>
            <div style={styles.qrisHint}>
              Screenshot QR → buka m-banking/e-wallet → upload gambar → bayar. Status akan diperbarui otomatis.
            </div>
            <button style={{ ...styles.bottomBtnStatic }} onClick={simulatePaid}>Simulasikan Pembayaran Berhasil</button>
            <div style={{ height: 30 }} />
          </div>
        </>
      )}

      {/* ===== SUCCESS SCREEN ===== */}
      {screen === "success" && (
        <div style={styles.successWrap}>
          <CheckCircle2 size={72} color="#1aa260" />
          <div style={styles.successTitle}>Pesanan Berhasil!</div>
          <div style={styles.successSub}>
            {payMethod === "online" ? "Pembayaran diterima." : "Silakan bayar di kasir."} Pesanan dikirim ke dapur.
          </div>
          <div style={styles.queueBox}>
            <div style={styles.queueLabel}>Nomor Antrean</div>
            <div style={styles.queueNum}>A-{String(Math.floor(Math.random() * 90) + 10)}</div>
          </div>
          <div style={styles.successSub}>{outlet.table ? `Meja ${outlet.table} · ` : ""}Total {rupiah(total)}</div>
          <button style={styles.bottomBtnStatic} onClick={resetAll}>Pesan Lagi</button>
        </div>
      )}

      {/* ===== MODAL ===== */}
      {modalItem && <ProductModal item={modalItem} onClose={() => setModalItem(null)} onAdd={addToCart} />}

      {/* ===== PROCESSING OVERLAY ===== */}
      {processing && (
        <div style={styles.processOverlay}>
          <div style={styles.spinner} />
          <div style={{ color: "#fff", marginTop: 14 }}>Sedang diproses, mohon tunggu...</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const ORANGE = "#2e7d32";
const ORANGE2 = "#43a047";

const globalCss = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #2a2a2a; font-family: 'Segoe UI', system-ui, sans-serif; }
  ::-webkit-scrollbar { display: none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
`;

const styles = {
  phone: { maxWidth: 430, margin: "0 auto", height: "100dvh", background: "#fafafa", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,.3)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: ORANGE, color: "#fff", flexShrink: 0 },
  logo: { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  iconBtn: { background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" },
  searchBar: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderBottom: "1px solid #eee", flexShrink: 0 },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 14 },
  scroll: { flex: 1, overflowY: "auto", padding: 14 },
  banner: { background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: "#fff", borderRadius: 14, padding: "20px 16px", fontWeight: 700, fontSize: 15, marginBottom: 14 },
  outletCard: { background: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid #eee" },
  outletName: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  outletRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#777", marginTop: 3 },
  tableTag: { background: "#ececec", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 14 },
  catTabs: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 10 },
  catTab: { whiteSpace: "nowrap", padding: "7px 14px", borderRadius: 20, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer", color: "#555" },
  catTabActive: { background: ORANGE, color: "#fff", borderColor: ORANGE, fontWeight: 600 },
  catSection: { marginBottom: 20 },
  catHeading: { fontWeight: 800, fontSize: 16, marginBottom: 10, color: "#222" },
  itemCard: { display: "flex", gap: 12, background: "#fff", borderRadius: 12, padding: 10, marginBottom: 10, border: "1px solid #eee", alignItems: "center" },
  itemThumb: { width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#e8f5e9" },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: 700, fontSize: 14, color: "#222" },
  itemDesc: { fontSize: 11.5, color: "#888", margin: "3px 0", lineHeight: 1.4 },
  itemPrice: { fontWeight: 700, fontSize: 14, color: ORANGE, marginTop: 4 },
  addItemBtn: { background: "#fff", border: `1.5px solid ${ORANGE}`, color: ORANGE, fontWeight: 700, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, alignSelf: "center" },
  cartFab: { position: "absolute", bottom: 16, left: 14, right: 14, background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 20px rgba(46,125,50,.4)" },
  cartFabPrice: { marginLeft: "auto" },
  subHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eee", flexShrink: 0 },
  subTitle: { fontWeight: 700, fontSize: 16 },
  orderTypeTag: { background: "#e8f5e9", color: ORANGE, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, marginBottom: 12 },
  empty: { textAlign: "center", color: "#aaa", padding: 40 },
  cartItem: { display: "flex", gap: 10, background: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, border: "1px solid #eee" },
  noteTag: { fontSize: 11, color: "#999", fontStyle: "italic", marginTop: 2 },
  qtyBoxSm: { display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-end" },
  qtyBtnSm: { width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${ORANGE}`, background: "#fff", color: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  summaryCard: { background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #eee", marginTop: 6 },
  sumRow: { display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#555", padding: "4px 0" },
  sumTotal: { fontWeight: 800, fontSize: 16, color: "#222", borderTop: "1px dashed #ddd", marginTop: 6, paddingTop: 10 },
  bottomBtn: { position: "absolute", bottom: 16, left: 14, right: 14, background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 15, cursor: "pointer" },
  bottomBtnStatic: { width: "100%", background: ORANGE, color: "#fff", border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 16 },
  formCard: { background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #eee" },
  formTitle: { fontWeight: 700, fontSize: 14, marginBottom: 10 },
  input: { width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginBottom: 8, outline: "none" },
  payTabs: { display: "flex", gap: 8, marginBottom: 10 },
  payTab: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer", color: "#555" },
  payTabActive: { background: "#e8f5e9", borderColor: ORANGE, color: ORANGE, fontWeight: 700 },
  agreeRow: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#666", padding: "4px 2px", lineHeight: 1.4 },
  // modal
  modalOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "flex-end", zIndex: 50 },
  modalSheet: { background: "#fff", width: "100%", maxHeight: "88%", borderRadius: "20px 20px 0 0", display: "flex", flexDirection: "column", position: "relative", animation: "slideUp .25s ease" },
  modalHandle: { width: 40, height: 4, background: "#ddd", borderRadius: 4, margin: "10px auto 0" },
  modalClose: { position: "absolute", top: 12, right: 12, background: "#f0f0f0", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 },
  modalScroll: { overflowY: "auto", padding: "10px 18px" },
  modalImg: { width: "100%", height: 180, borderRadius: 14, overflow: "hidden", marginBottom: 12, background: "#e8f5e9" },
  modalImgPhoto: { width: "100%", height: "100%", objectFit: "cover" },
  modalTitle: { fontSize: 19, fontWeight: 800, margin: 0 },
  modalDesc: { fontSize: 13, color: "#888", margin: "6px 0", lineHeight: 1.4 },
  modalPrice: { fontSize: 17, fontWeight: 800, color: ORANGE, marginBottom: 8 },
  group: { borderTop: "8px solid #f5f5f5", margin: "0 -18px", padding: "14px 18px" },
  groupTitle: { fontWeight: 700, fontSize: 13.5, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  required: { fontSize: 11, fontWeight: 600, color: ORANGE, background: "#e8f5e9", padding: "2px 8px", borderRadius: 6 },
  optRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", fontSize: 14, cursor: "pointer", borderBottom: "1px solid #f5f5f5" },
  optAdd: { color: ORANGE, fontSize: 12.5, fontWeight: 600 },
  radio: { width: 18, height: 18, accentColor: ORANGE },
  noteInput: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" },
  modalFooter: { display: "flex", gap: 12, padding: 16, borderTop: "1px solid #eee", alignItems: "center" },
  qtyBox: { display: "flex", alignItems: "center", gap: 12, border: "1px solid #ddd", borderRadius: 10, padding: "6px 10px" },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, border: "none", background: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  qtyNum: { fontWeight: 700, minWidth: 18, textAlign: "center" },
  addBtn: { flex: 1, background: ORANGE, color: "#fff", border: "none", borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 14.5, cursor: "pointer" },
  addBtnDisabled: { background: "#ccc", cursor: "not-allowed" },
  // qris
  qrisTimer: { background: "#e8f5e9", color: ORANGE, fontWeight: 700, borderRadius: 8, padding: "10px", fontSize: 14, marginBottom: 16 },
  qrisCard: { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eee", display: "inline-block", width: "100%" },
  qrisMerchant: { fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 14 },
  qrFake: { width: 180, height: 180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(10,1fr)", gridTemplateRows: "repeat(10,1fr)", border: "6px solid #fff", boxShadow: "0 0 0 1px #ddd" },
  gpn: { fontSize: 11, color: "#999", marginTop: 12, fontWeight: 600 },
  qrisTotal: { fontSize: 22, fontWeight: 800, color: "#222", marginTop: 8 },
  qrisActions: { display: "flex", gap: 10, marginTop: 16 },
  qrisOutline: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 10, border: `1.5px solid ${ORANGE}`, background: "#fff", color: ORANGE, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  qrisHint: { fontSize: 12, color: "#999", marginTop: 16, lineHeight: 1.5, textAlign: "left", background: "#f7f7f7", padding: 12, borderRadius: 10 },
  // success
  successWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" },
  successTitle: { fontSize: 22, fontWeight: 800, marginTop: 16, color: "#2e7d32" },
  successSub: { fontSize: 13.5, color: "#777", marginTop: 6, lineHeight: 1.5 },
  queueBox: { background: ORANGE, color: "#fff", borderRadius: 16, padding: "20px 40px", margin: "24px 0" },
  queueLabel: { fontSize: 13, opacity: 0.9 },
  queueNum: { fontSize: 40, fontWeight: 800, marginTop: 4 },
  // overlay
  processOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100 },
  spinner: { width: 40, height: 40, border: "4px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" },
};
