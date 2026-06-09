// API client — menghubungkan frontend ke backend.
// Token meja & restaurantId diambil dari URL QR: ?restaurant=...&token=...

const BASE = import.meta?.env?.VITE_API_URL || "http://localhost:4000/api/v1";

function getQrParams() {
  const p = new URLSearchParams(window.location.search);
  return { restaurantId: p.get("restaurant"), token: p.get("token") };
}

// Decode JWT payload tanpa verifikasi signature (untuk baca nomor meja dari URL).
// Aman untuk tampilan saja — backend tetap memverifikasi token saat checkout.
function decodeTokenPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

const { restaurantId, token } = getQrParams();
const tokenData = token ? decodeTokenPayload(token) : null;

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request gagal");
  return data;
}

export const api = {
  restaurantId,
  hasSession: Boolean(restaurantId && token),
  // Nomor meja yang dibaca langsung dari JWT (tanpa perlu backend).
  tableNumber: tokenData?.tableNumber || null,
  validateTable: () => request("/tables/validate", { auth: true }),
  getMenu: () => request(`/restaurants/${restaurantId}/menu`),
  calculateCart: (items) => request("/cart/calculate", { method: "POST", body: { items } }),
  createOrder: (payload) => request("/orders", { method: "POST", body: payload, auth: true }),
  getOrderStatus: (orderId) => request(`/orders/${orderId}/status`),
  simulatePaid: (orderId) => request(`/orders/${orderId}/simulate-paid`, { method: "POST" }),
};
