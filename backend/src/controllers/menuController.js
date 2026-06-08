const { prisma } = require("../config");

// GET /api/v1/tables/validate  (butuh token meja)
// Memvalidasi QR dan mengembalikan info outlet + meja.
async function validateTable(req, res) {
  const { restaurantId, tableId } = req.table;
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { restaurant: true },
  });
  if (!table || table.restaurantId !== restaurantId) {
    return res.status(404).json({ error: "Meja tidak ditemukan." });
  }
  res.json({
    table: { id: table.id, number: table.tableNumber },
    restaurant: {
      id: table.restaurant.id,
      name: table.restaurant.name,
      address: table.restaurant.address,
      phone: table.restaurant.phone,
      hours: `${table.restaurant.openHour} - ${table.restaurant.closeHour}`,
    },
  });
}

// GET /api/v1/restaurants/:id/menu
// Katalog menu lengkap dengan kategori & modifier.
async function getMenu(req, res) {
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: req.params.id },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        include: { modifierGroups: { include: { modifiers: true } } },
      },
    },
  });
  res.json({ categories });
}

module.exports = { validateTable, getMenu };
