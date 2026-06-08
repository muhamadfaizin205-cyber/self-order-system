const { PrismaClient } = require("@prisma/client");
const { signTableToken } = require("../src/middleware/tableAuth");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Bersihkan (urutan penting karena relasi)
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.restaurant.deleteMany();

  const resto = await prisma.restaurant.create({
    data: {
      name: "Mie Gacoan - Mojokerto",
      address: "Jl. Mojopahit No. 91, Mojokerto",
      phone: "0321-123456",
      openHour: "10:00",
      closeHour: "22:00",
    },
  });

  // Meja 91 dengan token QR
  const qrToken = crypto.randomBytes(16).toString("hex");
  const table = await prisma.table.create({
    data: { restaurantId: resto.id, tableNumber: 91, qrToken },
  });

  // Kategori + menu
  const recommendation = await prisma.menuCategory.create({
    data: { restaurantId: resto.id, name: "Menu Recommendation", sortOrder: 1 },
  });
  const paket = await prisma.menuCategory.create({
    data: { restaurantId: resto.id, name: "Paket Fest Dine In", sortOrder: 2 },
  });
  const dimsum = await prisma.menuCategory.create({
    data: { restaurantId: resto.id, name: "Dimsum", sortOrder: 3 },
  });
  const minuman = await prisma.menuCategory.create({
    data: { restaurantId: resto.id, name: "Minuman & Es Buah", sortOrder: 4 },
  });

  // Mie dengan level pedas
  const spiceLevels = [
    { name: "Level 0", additionalPrice: 0 },
    { name: "Level 1", additionalPrice: 0 },
    { name: "Level 2", additionalPrice: 0 },
    { name: "Level 3", additionalPrice: 0 },
    { name: "Level 4", additionalPrice: 0 },
    { name: "Level 6", additionalPrice: 910 },
    { name: "Level 8", additionalPrice: 910 },
  ];

  for (const nama of ["Mie Hompimpa", "Mie Suit", "Mie Gacoan"]) {
    await prisma.menuItem.create({
      data: {
        restaurantId: resto.id,
        categoryId: recommendation.id,
        name: nama,
        description: "Mie pedas khas Gacoan, level pedas bisa dipilih.",
        basePrice: 10000,
        modifierGroups: {
          create: {
            name: "LEVEL PEDAS",
            minSelections: 1,
            maxSelections: 1,
            modifiers: { create: spiceLevels },
          },
        },
      },
    });
  }

  // Dimsum (simple)
  await prisma.menuItem.create({
    data: { restaurantId: resto.id, categoryId: dimsum.id, name: "Dimsum Udang Keju", basePrice: 9500 },
  });
  await prisma.menuItem.create({
    data: { restaurantId: resto.id, categoryId: dimsum.id, name: "Dimsum Udang Rambutan", basePrice: 9500 },
  });

  // Minuman (simple)
  await prisma.menuItem.create({
    data: { restaurantId: resto.id, categoryId: minuman.id, name: "Lemon Tea", basePrice: 8000 },
  });
  await prisma.menuItem.create({
    data: { restaurantId: resto.id, categoryId: minuman.id, name: "Es Teh", basePrice: 5000 },
  });
  await prisma.menuItem.create({
    data: { restaurantId: resto.id, categoryId: minuman.id, name: "Air Mineral", basePrice: 4000 },
  });

  // Paket combo Gacoan Combat A (multi-modifier)
  await prisma.menuItem.create({
    data: {
      restaurantId: resto.id,
      categoryId: paket.id,
      name: "Gacoan Combat A",
      description: "2 Mie + 2 Dimsum + 2 Minuman. Hemat untuk berdua.",
      basePrice: 48183,
      isPackage: true,
      modifierGroups: {
        create: [
          { name: "Pilih Mie (1)", minSelections: 1, maxSelections: 1, modifiers: { create: [{ name: "Mie Gacoan" }, { name: "Mie Suit" }] } },
          { name: "Pilih Mie (2)", minSelections: 1, maxSelections: 1, modifiers: { create: [{ name: "Mie Gacoan" }, { name: "Mie Suit" }] } },
          { name: "Pilih Dimsum (1)", minSelections: 1, maxSelections: 1, modifiers: { create: [{ name: "Udang Keju" }, { name: "Udang Rambutan" }] } },
          { name: "Pilih Dimsum (2)", minSelections: 1, maxSelections: 1, modifiers: { create: [{ name: "Udang Keju" }, { name: "Udang Rambutan" }] } },
          { name: "Pilih Minuman (2)", minSelections: 2, maxSelections: 2, modifiers: { create: [{ name: "Lemon Tea" }, { name: "Es Teh" }, { name: "Air Mineral" }] } },
        ],
      },
    },
  });

  const token = signTableToken({ restaurantId: resto.id, tableId: table.id, tableNumber: 91 });
  console.log("\n✅ Seed selesai.");
  console.log("Restaurant ID:", resto.id);
  console.log("\n🔗 URL QR meja 91 (tempel di frontend):");
  console.log(`   ?restaurant=${resto.id}&token=${token}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
