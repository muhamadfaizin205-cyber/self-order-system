import { supabase } from "./supabase";

const params = new URLSearchParams(window.location.search);
const RESTAURANT_ID = params.get("restaurant") || "11111111-1111-1111-1111-111111111111";

function getTableNumber() {
  const t = params.get("table");
  if (t) return parseInt(t, 10);
  const token = params.get("token");
  if (token) {
    try {
      const payload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(payload));
      if (decoded.tableNumber) return decoded.tableNumber;
    } catch (e) {}
  }
  const m = params.get("meja");
  if (m) return parseInt(m, 10);
  return null;
}

const tableNumber = getTableNumber();

// ============================================================
// DEVICE ID — penanda unik HP pelanggan (untuk riwayat tanpa login)
// ID acak permanen disimpan di localStorage. Selama pelanggan pakai
// HP & browser yang sama, riwayat selalu kebaca otomatis.
// ============================================================
function getOrCreateDeviceId() {
  try {
    const KEY = "mie99_device_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
      // Buat ID unik: timestamp + random, sangat kecil kemungkinan tabrakan
      id = "dev_" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 12) +
        Math.random().toString(36).slice(2, 8);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch (e) {
    // Kalau localStorage diblokir (private mode dll), pakai session sementara
    if (!window.__mie99_tmp_device)
      window.__mie99_tmp_device = "tmp_" + Math.random().toString(36).slice(2, 14);
    return window.__mie99_tmp_device;
  }
}

const deviceId = getOrCreateDeviceId();

export const api = {
  hasSession: Boolean(tableNumber),
  tableNumber,
  deviceId,
  restaurantId: RESTAURANT_ID,

  async validateTable() {
    try {
      const { data: restaurant, error: rErr } = await supabase
        .from("restaurants").select("*").eq("id", RESTAURANT_ID).single();
      if (rErr) console.error("validateTable restaurant error:", rErr);

      let table = null;
      if (tableNumber) {
        const { data, error: tErr } = await supabase
          .from("tables").select("*").eq("restaurant_id", RESTAURANT_ID).eq("table_number", tableNumber).single();
        if (tErr) console.error("validateTable table error:", tErr);
        table = data;
      }
      return {
        restaurant: restaurant
          ? { id: restaurant.id, name: restaurant.name, address: restaurant.address, hours: (restaurant.open_hour || "10:00") + " - " + (restaurant.close_hour || "22:00") }
          : { id: RESTAURANT_ID, name: "Mie 99", address: "Jl. Pahlawan No. 99, Mojokerto", hours: "10:00 - 22:00" },
        table: table ? { id: table.id, number: table.table_number } : { id: null, number: tableNumber },
      };
    } catch (e) {
      console.error("validateTable error:", e);
      return {
        restaurant: { id: RESTAURANT_ID, name: "Mie 99", address: "", hours: "10:00 - 22:00" },
        table: { id: null, number: tableNumber },
      };
    }
  },

  async getMenu() {
    try {
      // Ambil kategori
      const { data: categories, error: cErr } = await supabase
        .from("menu_categories").select("*").eq("restaurant_id", RESTAURANT_ID).order("sort_order");
      if (cErr) console.error("getMenu categories error:", cErr);

      // Ambil semua menu item
      const { data: items, error: iErr } = await supabase
        .from("menu_items").select("*").eq("restaurant_id", RESTAURANT_ID).eq("is_available", true).order("sort_order");
      if (iErr) console.error("getMenu items error:", iErr);

      // Ambil semua modifier groups
      const itemIds = (items || []).map(i => i.id);
      let groups = [];
      if (itemIds.length > 0) {
        const { data: gData, error: gErr } = await supabase
          .from("modifier_groups").select("*").in("menu_item_id", itemIds);
        if (gErr) console.error("getMenu groups error:", gErr);
        groups = gData || [];
      }

      // Ambil semua modifiers
      const groupIds = groups.map(g => g.id);
      let modifiers = [];
      if (groupIds.length > 0) {
        const { data: mData, error: mErr } = await supabase
          .from("modifiers").select("*").in("group_id", groupIds);
        if (mErr) console.error("getMenu modifiers error:", mErr);
        modifiers = mData || [];
      }

      // Susun jadi struktur yang diharapkan App.jsx
      const mapped = (categories || []).map(c => ({
        id: c.id,
        name: c.name,
        items: (items || []).filter(it => it.category_id === c.id).map(it => {
          const itemGroups = groups.filter(g => g.menu_item_id === it.id);
          const hasSpicy = itemGroups.some(g => g.name?.toUpperCase().includes("PEDAS"));
          return {
            id: it.id,
            name: it.name,
            price: it.base_price,
            desc: it.description || "",
            type: it.is_package ? "combo" : hasSpicy ? "spicy" : "simple",
            groups: itemGroups.map(g => ({
              id: g.id,
              name: g.name,
              min: g.min_selections,
              max: g.max_selections,
              options: modifiers.filter(m => m.group_id === g.id).map(m => ({
                id: m.id,
                name: m.name,
                add: m.additional_price,
              })),
            })),
          };
        }),
      }));

      console.log("Menu loaded:", mapped.map(c => c.name + " (" + c.items.length + " items)"));
      return { categories: mapped };
    } catch (e) {
      console.error("getMenu error:", e);
      return { categories: [] };
    }
  },

  async createOrder({ customerName, phone, email, paymentMethod, items }) {
    try {
      let tableId = null;
      if (tableNumber) {
        const { data } = await supabase
          .from("tables").select("id").eq("restaurant_id", RESTAURANT_ID).eq("table_number", tableNumber).single();
        tableId = data?.id;
      }

      const subtotal = items.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantity || it.qty || 1), 0);
      const tax = Math.round(subtotal * 0.1);
      const rounding = subtotal > 0 ? -(((subtotal + tax) % 100) || 0) : 0;
      const totalAmount = subtotal + tax + rounding;

      const { data: order, error } = await supabase.from("orders").insert({
        restaurant_id: RESTAURANT_ID,
        table_id: tableId,
        customer_name: customerName,
        phone,
        email: email || null,
        payment_method: paymentMethod,
        status: "PENDING",
        subtotal,
        tax,
        rounding,
        total_amount: totalAmount,
        customer_device: deviceId,
      }).select().single();

      if (error) throw new Error(error.message);

      for (const item of items) {
        const { data: orderItem } = await supabase.from("order_items").insert({
          order_id: order.id,
          menu_item_id: item.menuItemId || item.itemId,
          quantity: item.quantity || item.qty || 1,
          notes: item.notes || "",
          unit_price: item.unitPrice || 0,
          total_price: (item.unitPrice || 0) * (item.quantity || item.qty || 1),
        }).select().single();

        if (item.modifierIds?.length && orderItem) {
          for (const modId of item.modifierIds) {
            await supabase.from("order_item_modifiers").insert({
              order_item_id: orderItem.id,
              modifier_id: modId,
              price_at_order: 0,
            });
          }
        }
      }

      return {
        orderId: order.id,
        status: order.status,
        totals: { subtotal, tax, rounding, totalAmount },
        qris: paymentMethod === "QRIS" ? { payload: "mock-qris-" + order.id.slice(0, 8) } : null,
      };
    } catch (e) {
      console.error("createOrder error:", e);
      throw e;
    }
  },

  async getOrderStatus(orderId) {
    const { data } = await supabase.from("orders").select("status, queue_number").eq("id", orderId).single();
    return { status: data?.status, queueNumber: data?.queue_number };
  },

  // ============================================================
  // RIWAYAT PESANAN — query semua order milik device ini
  // ============================================================
  async getOrderHistory() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, status, queue_number, customer_name,
          subtotal, tax, total_amount, payment_method,
          created_at, paid_at,
          tables ( table_number ),
          order_items (
            quantity, unit_price, notes,
            menu_items ( name ),
            order_item_modifiers ( modifiers ( name ) )
          )
        `)
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("customer_device", deviceId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) { console.error("getOrderHistory error:", error); return []; }

      return (data || []).map(o => ({
        id: o.id,
        status: o.status,
        queueNumber: o.queue_number,
        customerName: o.customer_name,
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total_amount,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
        paidAt: o.paid_at,
        tableNumber: o.tables?.table_number || null,
        items: (o.order_items || []).map(it => ({
          name: it.menu_items?.name || "Item",
          qty: it.quantity,
          unitPrice: it.unit_price,
          notes: it.notes,
          modifiers: (it.order_item_modifiers || [])
            .map(m => m.modifiers?.name).filter(Boolean),
        })),
      }));
    } catch (e) {
      console.error("getOrderHistory exception:", e);
      return [];
    }
  },

  async simulatePaid(orderId) {
    const queueNumber = "A-" + String(Math.floor(Math.random() * 90) + 10);
    await supabase.from("orders").update({
      status: "KITCHEN",
      paid_at: new Date().toISOString(),
      queue_number: queueNumber,
    }).eq("id", orderId);
    return { status: "KITCHEN", queueNumber };
  },


  async getSettings() {
    try {
      const { data } = await supabase.from("restaurants").select("*").eq("id", RESTAURANT_ID).single();
      const { data: banners } = await supabase.from("banners").select("*").eq("restaurant_id", RESTAURANT_ID).eq("is_active", true).order("sort_order");
      return {
        name: data?.name || "Mie 99",
        address: data?.address || "",
        phone: data?.phone || "",
        hours: data?.hours_full || "10:00 - 22:00 WIB",
        mapsUrl: data?.maps_url || "",
        schedule: data?.schedule_json ? JSON.parse(data.schedule_json) : [],
        faq: data?.faq_json ? JSON.parse(data.faq_json) : [],
        privacy: data?.privacy_text || "",
        banners: banners || [],
      };
    } catch (e) {
      console.error("getSettings error:", e);
      return { name: "Mie 99", address: "", phone: "", hours: "", schedule: [], faq: [], privacy: "", banners: [] };
    }
  },

  subscribeOrders(callback) {
    return supabase.channel("orders-changes").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, callback).subscribe();
  },
};
