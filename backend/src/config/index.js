const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  qrisExpiryMinutes: 10, // PRD: batas waktu pembayaran QRIS
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    isProduction: process.env.MIDTRANS_PRODUCTION === "true",
    // Jika serverKey kosong, gateway berjalan dalam MODE MOCK (untuk dev/demo).
    mockMode: !process.env.MIDTRANS_SERVER_KEY,
  },
};

module.exports = { prisma, config };
