const { prisma } = require("../config");
const { broadcast } = require("../services/realtime");

// Membentuk objek order ringkas untuk KDS (dengan nama menu & modifier).
async function shapeOrderForKitchen(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true,
          modifiers: { include: { modifier: true } },
        },
      },
    },
  });
  if (!order) return null;
  return {
    id: order.id,
    queueNumber: order.queueNumber,
    tableNumber: order.table.tableNumber,
    customerName: order.customerName,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items.map((it) => ({
      name: it.menuItem.name,
      quantity: it.quantity,
      notes: it.notes,
      modifiers: it.modifiers.map((m) => m.modifier.name),
    })),
  };
}

// GET /api/v1/kitchen/orders?restaurantId=...
// Daftar order aktif untuk dapur (KITCHEN), terbaru di atas.
async function listKitchenOrders(req, res, next) {
  try {
    const { restaurantId } = req.query;
    const orders = await prisma.order.findMany({
      where: { restaurantId, status: { in: ["KITCHEN", "PAID"] } },
      orderBy: { createdAt: "asc" },
      include: {
        table: true,
        items: { include: { menuItem: true, modifiers: { include: { modifier: true } } } },
      },
    });
    res.json({
      orders: orders.map((order) => ({
        id: order.id,
        queueNumber: order.queueNumber,
        tableNumber: order.table.tableNumber,
        customerName: order.customerName,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((it) => ({
          name: it.menuItem.name,
          quantity: it.quantity,
          notes: it.notes,
          modifiers: it.modifiers.map((m) => m.modifier.name),
        })),
      })),
    });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/kitchen/orders/:id/done
// Tandai order selesai dimasak.
async function markOrderDone(req, res, next) {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "DONE" },
    });
    broadcast(`order:${order.id}`, { type: "order_update", orderId: order.id, status: "DONE" });
    broadcast("kitchen", { type: "kitchen_refresh" });
    res.json({ status: order.status });
  } catch (e) {
    next(e);
  }
}

module.exports = { listKitchenOrders, markOrderDone, shapeOrderForKitchen };
