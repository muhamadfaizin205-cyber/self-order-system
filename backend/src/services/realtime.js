// WebSocket sederhana untuk update real-time.
// Dipakai KDS (Kitchen Display) agar order baru langsung muncul,
// dan halaman customer agar status order ter-update tanpa polling.

const { WebSocketServer } = require("ws");

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
      // Klien bisa mendaftar ke channel: { type: "subscribe", channel: "kitchen" | "order:<id>" }
      try {
        const msg = JSON.parse(raw);
        if (msg.type === "subscribe") ws.channel = msg.channel;
      } catch (_) {}
    });
    ws.send(JSON.stringify({ type: "connected" }));
  });
  console.log("🔌 WebSocket aktif di /ws");
}

// Broadcast ke semua klien pada channel tertentu (atau semua bila channel null).
function broadcast(channel, payload) {
  if (!wss) return;
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState !== 1) return; // OPEN
    if (!channel || client.channel === channel || client.channel === "kitchen") {
      client.send(data);
    }
  });
}

module.exports = { initWebSocket, broadcast };
