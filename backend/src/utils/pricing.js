// Perhitungan harga terpusat di backend (PRD: cegah manipulasi harga dari frontend)
// Semua nilai dalam Rupiah penuh sebagai integer — QRIS gateway tidak menerima desimal.

const TAX_RATE = 0.1; // 10% pajak restoran

/**
 * Membulatkan total ke kelipatan 100 terdekat (ke bawah),
 * menghasilkan nilai rounding negatif seperti yang terlihat di struk PRD.
 * @returns {{ rounding: number, rounded: number }}
 */
function roundTotal(amount) {
  const rounded = Math.floor(amount / 100) * 100;
  return { rounding: rounded - amount, rounded };
}

/**
 * Menghitung ringkasan order dari daftar item yang sudah divalidasi.
 * @param {Array<{unitPrice:number, quantity:number}>} items
 */
function calculateOrderTotals(items) {
  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const beforeRounding = subtotal + tax;
  const { rounding, rounded } = roundTotal(beforeRounding);
  return { subtotal, tax, rounding, totalAmount: rounded };
}

module.exports = { TAX_RATE, roundTotal, calculateOrderTotals };
