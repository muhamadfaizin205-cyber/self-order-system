const { prisma } = require("../config");

// GET /api/v1/admin/stats?restaurantId=...
// Ringkasan penjualan hari ini.
async function getStats(req, res, next) {
  try {
    const { restaurantId } = req.query;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const paidStatuses = ["PAID", "KITCHEN", "DONE"];
    const orders = await prisma.order.findMany({
      where: { restaurantId, status: { in: paidStatuses }, createdAt: { gte: startOfDay } },
    });

    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const allOrders = await prisma.order.count({ where: { restaurantId, createdAt: { gte: startOfDay } } });

    res.json({
      todayRevenue: revenue,
      paidOrders: orders.length,
      totalOrders: allOrders,
      avgOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/admin/orders?restaurantId=...
// Daftar semua order (riwayat).
async function listAllOrders(req, res, next) {
  try {
    const { restaurantId } = req.query;
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { table: true },
    });
    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        queueNumber: o.queueNumber,
        tableNumber: o.table.tableNumber,
        customerName: o.customerName,
        status: o.status,
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/admin/menu?restaurantId=...
// Daftar menu untuk dikelola (termasuk yang tidak tersedia).
async function listMenuItems(req, res, next) {
  try {
    const { restaurantId } = req.query;
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category.name,
        basePrice: i.basePrice,
        isAvailable: i.isAvailable,
        isPackage: i.isPackage,
      })),
    });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/admin/menu/:id/availability  { isAvailable: bool }
// Toggle ketersediaan menu (mis. saat stok habis).
async function toggleAvailability(req, res, next) {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable: Boolean(req.body.isAvailable) },
    });
    res.json({ id: item.id, isAvailable: item.isAvailable });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/admin/menu/:id/price  { basePrice: int }
async function updatePrice(req, res, next) {
  try {
    const price = parseInt(req.body.basePrice, 10);
    if (isNaN(price) || price < 0) return res.status(400).json({ error: "Harga tidak valid." });
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { basePrice: price },
    });
    res.json({ id: item.id, basePrice: item.basePrice });
  } catch (e) {
    next(e);
  }
}

module.exports = { getStats, listAllOrders, listMenuItems, toggleAvailability, updatePrice };
