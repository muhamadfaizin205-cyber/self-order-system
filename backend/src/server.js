const http = require("http");
const express = require("express");
const cors = require("cors");
const { config } = require("./config");
const apiRoutes = require("./routes");
const { initWebSocket } = require("./services/realtime");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, mockPayment: config.midtrans.mockMode }));

app.use("/api/v1", apiRoutes);

// Error handler terpusat
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Terjadi kesalahan server." });
});

const server = http.createServer(app);
initWebSocket(server);

server.listen(config.port, () => {
  console.log(`🍜 Gacoan API berjalan di port ${config.port}`);
  if (config.midtrans.mockMode) console.log("⚠️  Pembayaran dalam MODE MOCK (tanpa Midtrans key).");
});

module.exports = app;
