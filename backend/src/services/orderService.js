const { prisma } = require("../config");
const { calculateOrderTotals } = require("../utils/pricing");

/**
 * Memvalidasi keranjang yang dikirim frontend terhadap data di database,
 * lalu menghitung ulang harga setiap item (termasuk modifier) DARI SERVER.
 * Frontend TIDAK PERNAH dipercaya soal harga (PRD bagian 5 & 7).
 *
 * Input cartItems: [{ menuItemId, quantity, notes, modifierIds: [] }]
 * Output: { items: [...siap simpan], totals: {...} }
 */
async function validateAndPrice(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw Object.assign(new Error("Keranjang kosong."), { status: 400 });
  }

  const pricedItems = [];

  for (const ci of cartItems) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: ci.menuItemId },
      include: { modifierGroups: { include: { modifiers: true } } },
    });

    if (!menuItem || !menuItem.isAvailable) {
      throw Object.assign(new Error(`Menu tidak tersedia: ${ci.menuItemId}`), { status: 400 });
    }

    const qty = Math.max(1, parseInt(ci.quantity, 10) || 1);
    const chosenIds = Array.isArray(ci.modifierIds) ? ci.modifierIds : [];

    // Validasi tiap grup modifier: jumlah pilihan harus dalam rentang min..max
    let modifierTotal = 0;
    const chosenModifiers = [];

    for (const group of menuItem.modifierGroups) {
      const validIds = group.modifiers.map((m) => m.id);
      const selectedInGroup = chosenIds.filter((id) => validIds.includes(id));

      if (selectedInGroup.length < group.minSelections || selectedInGroup.length > group.maxSelections) {
        throw Object.assign(
          new Error(`Pilihan "${group.name}" harus ${group.minSelections}-${group.maxSelections} item.`),
          { status: 400 }
        );
      }

      for (const modId of selectedInGroup) {
        const mod = group.modifiers.find((m) => m.id === modId);
        modifierTotal += mod.additionalPrice;
        chosenModifiers.push({ modifierId: mod.id, priceAtOrder: mod.additionalPrice });
      }
    }

    const unitPrice = menuItem.basePrice + modifierTotal;
    pricedItems.push({
      menuItemId: menuItem.id,
      quantity: qty,
      notes: ci.notes || null,
      unitPrice,
      totalPrice: unitPrice * qty,
      modifiers: chosenModifiers,
    });
  }

  const totals = calculateOrderTotals(pricedItems);
  return { items: pricedItems, totals };
}

function generateQueueNumber() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A-E
  const num = Math.floor(Math.random() * 90) + 10;
  return `${letter}-${num}`;
}

module.exports = { validateAndPrice, generateQueueNumber };
