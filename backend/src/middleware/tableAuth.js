const jwt = require("jsonwebtoken");
const { config } = require("../config");

/**
 * Token meja ditanam di URL QR sebagai JWT bertanda tangan.
 * Payload: { restaurantId, tableId, tableNumber }
 * Ini mencegah orang sembarangan flood pesanan ke meja tertentu (PRD bagian 7).
 */
function signTableToken(payload) {
  // Tanpa expiry agar QR meja bisa dipakai berulang; rotasi token dilakukan kasir bila perlu.
  return jwt.sign(payload, config.jwtSecret);
}

function tableAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Token meja tidak ditemukan. Scan QR di meja Anda." });
  }

  try {
    req.table = jwt.verify(token, config.jwtSecret);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token meja tidak valid atau kedaluwarsa." });
  }
}

module.exports = { signTableToken, tableAuth };
