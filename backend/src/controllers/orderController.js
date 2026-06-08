const { prisma, config } = require("../config");
const { validateAndPrice, generateQueueNumber } = require("../services/orderService");
const { createQrisCharge, verifyMidtransSignature } = require("../services/paymentService");
const { broadcast } = require("../services/realtime");

// POST /api/v1/cart/calculate
// Validasi ulang harga, pajak, pembulatan tanpa membuat order (untuk preview cart).
async function calculateCart(req, res, next) {
  try {
    const { items, totals } = await validateAndPrice(req.body.items);
    res.json({ items, totals });
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/orders  (butuh token meja)
// Membuat order PENDING dari keranjang.
async function createOrder(req, res, next) {
  try {
    const { restaurantId, tableId } = req.table;
    const { customerName, phone, email, paymentMethod, items } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({ error: "Nama dan nomor ponsel wajib diisi." });
    }
    if (!["QRIS", "CASHIER"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Metode pembayaran tidak valid." });
    }

    const { items: priced, totals } = await validateAndPrice(items);

    const expiresAt =
      paymentMethod === "QRIS"
        ? new Date(Date.now() + config.qrisExpiryMinutes * 60 * 1000)
        : null;

    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId,
        customerName,
        phone,
        email: email || null,
        paymentMethod,
        status: "PENDING",
        subtotal: totals.subtotal,
        tax: totals.tax,
        rounding: totals.rounding,
        totalAmount: totals.totalAmount,
        expiresAt,
        items: {
          create: priced.map((it) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            notes: it.notes,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            modifiers: { create: it.modifiers },
          })),
        },
      },
    });

    let qris = null;
    if (paymentMethod === "QRIS") {
      const charge = await createQrisCharge({ orderId: order.id, amount: order.totalAmount });
      await prisma.order.update({
        where: { id: order.id },
        data: { qrisPayload: charge.qrisPayload, paymentRef: charge.paymentRef },
      });
      qris = { payload: charge.qrisPayload, expiresAt, provider: charge.provider };
    }

    res.status(201).json({ orderId: order.id, status: order.status, totals, qris });
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/orders/:id/status  (polling tiap ~5 detik dari halaman QRIS)
async function getOrderStatus(req, res, next) {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan." });

    // Auto-expire QRIS yang lewat batas waktu (PRD bagian 7).
    if (order.status === "PENDING" && order.expiresAt && order.expiresAt < new Date()) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      return res.json({ status: "CANCELLED", queueNumber: null });
    }
    res.json({ status: order.status, queueNumber: order.queueNumber });
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/payments/webhook  (dipanggil Midtrans saat status berubah)
async function paymentWebhook(req, res, next) {
  try {
    if (!verifyMidtransSignature(req.body)) {
      return res.status(403).json({ error: "Signature tidak valid." });
    }
    const { order_id, transaction_status } = req.body;
    const settled = ["capture", "settlement"].includes(transaction_status);
    if (settled) await markPaid(order_id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/orders/:id/simulate-paid  (HANYA mode mock/dev)
async function simulatePaid(req, res, next) {
  try {
    if (!config.midtrans.mockMode) {
      return res.status(403).json({ error: "Simulasi hanya tersedia di mode mock." });
    }
    const order = await markPaid(req.params.id);
    res.json({ status: order.status, queueNumber: order.queueNumber });
  } catch (e) {
    next(e);
  }
}

// Helper: tandai order lunas + masuk dapur + beri nomor antrean.
async function markPaid(orderId) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "KITCHEN", paidAt: new Date(), queueNumber: generateQueueNumber() },
  });
  // Beri tahu dapur ada order baru, dan beri tahu halaman customer status berubah.
  broadcast("kitchen", { type: "kitchen_refresh" });
  broadcast(`order:${order.id}`, { type: "order_update", orderId: order.id, status: "KITCHEN", queueNumber: order.queueNumber });
  return order;
}

module.exports = { calculateCart, createOrder, getOrderStatus, paymentWebhook, simulatePaid };
