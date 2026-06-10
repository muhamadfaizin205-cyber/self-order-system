import { supabase } from "./supabase";

// URL QR sederhana: ?table=5 (nomor meja langsung di URL, tanpa JWT)
const params = new URLSearchParams(window.location.search);
const tableParam = params.get("table");
const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

export const api = {
  hasSession: Boolean(tableParam),
  tableNumber: tableParam ? parseInt(tableParam, 10) : null,
  restaurantId: RESTAURANT_ID,

  // Validasi meja + ambil info restoran
  async validateTable() {
    const { data: restaurant } = await supabase
      .from("restaurants").select("*").eq("id", RESTAURANT_ID).single();
    const { data: table } = await supabase
      .from("tables").select("*").eq("restaurant_id", RESTAURANT_ID).eq("table_number", parseInt(tableParam, 10)).single();
    return {
      restaurant: { id: restaurant.id, name: restaurant.name, address: restaurant.address, hours: `${restaurant.open_hour} - ${restaurant.close_hour}` },
      table: { id: table?.id, number: table?.table_number },
    };
  },

  // Ambil menu lengkap dengan kategori dan modifier
  async getMenu() {
    const { data: categories } = await supabase
      .from("menu_categories").select("*").eq("restaurant_id", RESTAURANT_ID).order("sort_order");
    const { data: items } = await supabase
      .from("menu_items").select("*, modifier_groups(*, modifiers(*))").eq("restaurant_id", RESTAURANT_ID).eq("is_available", true).order("sort_order");
    const mapped = (categories || []).map(c => ({
      id: c.id, name: c.name,
      items: (items || []).filter(it => it.category_id === c.id).map(it => ({
        id: it.id, name: it.name, price: it.base_price, desc: it.description || "",
        type: it.is_package ? "combo" : (it.modifier_groups || []).some(g => g.name?.toUpperCase().includes("PEDAS")) ? "spicy" : "simple",
        groups: (it.modifier_groups || []).map(g => ({
          id: g.id, name: g.name, min: g.min_selections, max: g.max_selections,
          options: (g.modifiers || []).map(m => ({ id: m.id, name: m.name, add: m.additional_price })),
        })),
      })),
    }));
    return { categories: mapped };
  },

  // Buat pesanan
  async createOrder({ customerName, phone, email, paymentMethod, items }) {
    // Cari table ID dari nomor meja
    const { data: table } = await supabase
      .from("tables").select("id").eq("restaurant_id", RESTAURANT_ID).eq("table_number", parseInt(tableParam, 10)).single();

    // Hitung total di client (dalam produksi, pakai database function)
    const subtotal = items.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantity || 1), 0);
    const tax = Math.round(subtotal * 0.1);
    const rounding = subtotal > 0 ? -(((subtotal + tax) % 100) || 0) : 0;
    const totalAmount = subtotal + tax + rounding;

    const { data: order, error } = await supabase.from("orders").insert({
      restaurant_id: RESTAURANT_ID,
      table_id: table?.id,
      customer_name: customerName,
      phone, email,
      payment_method: paymentMethod,
      status: "PENDING",
      subtotal, tax, rounding, total_amount: totalAmount,
    }).select().single();

    if (error) throw new Error(error.message);

    // Insert order items
    for (const item of items) {
      const { data: orderItem } = await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: item.menuItemId || item.itemId,
        quantity: item.quantity || item.qty || 1,
        notes: item.notes || "",
        unit_price: item.unitPrice || 0,
        total_price: (item.unitPrice || 0) * (item.quantity || item.qty || 1),
      }).select().single();

      // Insert modifiers
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
  },

  // Cek status pesanan
  async getOrderStatus(orderId) {
    const { data } = await supabase.from("orders").select("status, queue_number").eq("id", orderId).single();
    return { status: data?.status, queueNumber: data?.queue_number };
  },

  // Simulasi pembayaran (untuk development)
  async simulatePaid(orderId) {
    const queueNumber = "A-" + String(Math.floor(Math.random() * 90) + 10);
    await supabase.from("orders").update({
      status: "KITCHEN", paid_at: new Date().toISOString(), queue_number: queueNumber,
    }).eq("id", orderId);
    return { status: "KITCHEN", queueNumber };
  },

  // ===== KASIR =====
  async getOrders() {
    const { data } = await supabase
      .from("orders").select("*, tables(table_number)").eq("restaurant_id", RESTAURANT_ID)
      .order("created_at", { ascending: false }).limit(100);
    return (data || []).map(o => ({
      ...o, tableNumber: o.tables?.table_number, customerName: o.customer_name,
      totalAmount: o.total_amount, paymentMethod: o.payment_method,
      queueNumber: o.queue_number, createdAt: o.created_at,
    }));
  },

  async getStats() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data } = await supabase.from("orders").select("*").eq("restaurant_id", RESTAURANT_ID).gte("created_at", today.toISOString());
    const paid = (data || []).filter(o => ["PAID", "KITCHEN", "DONE"].includes(o.status));
    const revenue = paid.reduce((s, o) => s + o.total_amount, 0);
    return { todayRevenue: revenue, paidOrders: paid.length, totalOrders: (data || []).length, avgOrderValue: paid.length ? Math.round(revenue / paid.length) : 0 };
  },

  async markDone(orderId) {
    await supabase.from("orders").update({ status: "DONE" }).eq("id", orderId);
  },

  async getMenuAdmin() {
    const { data } = await supabase.from("menu_items").select("*, menu_categories(name)").eq("restaurant_id", RESTAURANT_ID);
    return (data || []).map(i => ({ ...i, category: i.menu_categories?.name, basePrice: i.base_price, isAvailable: i.is_available, isPackage: i.is_package }));
  },

  async toggleAvailability(id, isAvailable) {
    await supabase.from("menu_items").update({ is_available: isAvailable }).eq("id", id);
  },

  async updatePrice(id, price) {
    await supabase.from("menu_items").update({ base_price: price }).eq("id", id);
  },

  // Real-time subscription untuk orders
  subscribeOrders(callback) {
    return supabase.channel("orders-changes").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, callback).subscribe();
  },
};
