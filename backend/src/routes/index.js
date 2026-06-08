const express = require("express");
const router = express.Router();

const { validateTable, getMenu } = require("../controllers/menuController");
const {
  calculateCart,
  createOrder,
  getOrderStatus,
  paymentWebhook,
  simulatePaid,
} = require("../controllers/orderController");
const { listKitchenOrders, markOrderDone } = require("../controllers/kitchenController");
const {
  getStats,
  listAllOrders,
  listMenuItems,
  toggleAvailability,
  updatePrice,
} = require("../controllers/adminController");
const { tableAuth } = require("../middleware/tableAuth");

// --- Meja & Menu (customer) ---
router.get("/tables/validate", tableAuth, validateTable);
router.get("/restaurants/:id/menu", getMenu);

// --- Cart & Order (customer) ---
router.post("/cart/calculate", calculateCart);
router.post("/orders", tableAuth, createOrder);
router.get("/orders/:id/status", getOrderStatus);

// --- Pembayaran ---
router.post("/payments/webhook", paymentWebhook);
router.post("/orders/:id/simulate-paid", simulatePaid); // dev only

// --- Kitchen Display System ---
router.get("/kitchen/orders", listKitchenOrders);
router.patch("/kitchen/orders/:id/done", markOrderDone);

// --- Admin ---
router.get("/admin/stats", getStats);
router.get("/admin/orders", listAllOrders);
router.get("/admin/menu", listMenuItems);
router.patch("/admin/menu/:id/availability", toggleAvailability);
router.patch("/admin/menu/:id/price", updatePrice);

module.exports = router;
