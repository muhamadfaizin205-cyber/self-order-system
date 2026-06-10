import { supabase } from "./supabase";

// Mendukung 2 format URL QR:
// Format baru: ?table=5 (simpel)
// Format lama: ?restaurant=...&token=eyJ... (JWT)
const params = new URLSearchParams(window.location.search);
const RESTAURANT_ID = params.get("restaurant") || "11111111-1111-1111-1111-111111111111";

// Ambil nomor meja dari URL
function getTableNumber() {
  // Format baru: ?table=5
  const tableParam = params.get("table");
  if (tableParam) return parseInt(tableParam, 10);

  // Format lama: ?token=eyJ... (decode JWT tanpa verifikasi)
  const token = params.get("token");
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(atob(payload));
        if (decoded.tableNumber) return decoded.tableNumber;
      }
    } catch (e) {}
  }

  // Cek juga ?meja=5 (alternatif bahasa Indonesia)
  const mejaParam = params.get("meja");
  if (mejaParam) return parseInt(mejaParam, 10);

  return null;
}

const tableNumber = getTableNumber();

export const api = {
  hasSession: Boolean(tableNumber),
  tableNumber,
  restaurantId: RESTAURANT_ID,

  async validateTable() {
    const { data: restaurant } = await supabase
      .from("restaurants").select("*").eq("id", RESTAURANT_ID).single();
    let table = null;
    if (tableNumber) {
      const { data } = await supabase
        .from("tables").select("*").eq("restaurant_id", RESTAURANT_ID).eq("table_number", tableNumber).single();
      table = data;
    }
    return {
      restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, address: restaurant.address, hours: `${restaurant.open_hour} - ${restaurant.close_hour}` } : { id: RESTAURANT_ID, name: "Mie 99", address: "", hours: "" },
      table: table ? { id: table.id, number: table.table_number } : { id: null, number: tableNumber },
    };
  },

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

  async createOrder({ customerName, phone, email, paymentMethod, items }) {
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
      phone, email,
      payment_method: paymentMethod,
      status: "PENDING",
      subtotal, tax, rounding, total_amount: totalAmount,
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
            order_item_id: orderItem.id, modifier_id: modId, price_at_order: 0,
          });
        }
      }
    }

    return {
      orderId: order.id, status: order.status,
      totals: { subtotal, tax, rounding, totalAmount },
      qris: paymentMethod === "QRIS" ? { payload: "mock-qris-" + order.id.slice(0, 8) } : null,
    };
  },

  async getOrderStatus(orderId) {
    const { data } = await supabase.from("orders").select("status, queue_number").eq("id", orderId).single();
    return { status: data?.status, queueNumber: data?.queue_number };
  },

  async simulatePaid(orderId) {
    const queueNumber = "A-" + String(Math.floor(Math.random() * 90) + 10);
    await supabase.from("orders").update({
      status: "KITCHEN", paid_at: new Date().toISOString(), queue_number: queueNumber,
    }).eq("id", orderId);
    return { status: "KITCHEN", queueNumber };
  },

  subscribeOrders(callback) {
    return supabase.channel("orders-changes").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, callback).subscribe();
  },
};
