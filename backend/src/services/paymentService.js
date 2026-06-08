const crypto = require("crypto");
const { config } = require("../config");

/**
 * Service pembayaran QRIS.
 *
 * MODE MOCK (default, saat MIDTRANS_SERVER_KEY kosong):
 *   - Menghasilkan payload QRIS palsu untuk development/demo.
 *   - Pembayaran dikonfirmasi manual lewat endpoint /simulate-paid.
 *
 * MODE PRODUCTION (saat MIDTRANS_SERVER_KEY terisi):
 *   - Memanggil Midtrans CoreAPI untuk membuat transaksi QRIS asli.
 *   - Konfirmasi datang lewat webhook /payments/webhook.
 *
 * Untuk produksi, install: npm install midtrans-client
 */

async function createQrisCharge({ orderId, amount }) {
  if (config.midtrans.mockMode) {
    // --- MODE MOCK ---
    const fakePayload = "00020101021226" + crypto.randomBytes(20).toString("hex");
    return {
      provider: "mock",
      qrisPayload: fakePayload,
      paymentRef: "MOCK-" + orderId.slice(0, 8),
    };
  }

  // --- MODE PRODUCTION (skeleton Midtrans) ---
  // const midtransClient = require("midtrans-client");
  // const core = new midtransClient.CoreApi({
  //   isProduction: config.midtrans.isProduction,
  //   serverKey: config.midtrans.serverKey,
  // });
  // const charge = await core.charge({
  //   payment_type: "qris",
  //   transaction_details: { order_id: orderId, gross_amount: amount },
  //   qris: { acquirer: "gopay" },
  // });
  // return {
  //   provider: "midtrans",
  //   qrisPayload: charge.actions.find(a => a.name === "generate-qr-code").url,
  //   paymentRef: charge.transaction_id,
  // };

  throw new Error("MIDTRANS_SERVER_KEY terisi tapi integrasi belum diaktifkan. Uncomment skeleton di paymentService.js.");
}

/**
 * Verifikasi signature webhook Midtrans.
 * signature = sha512(order_id + status_code + gross_amount + serverKey)
 */
function verifyMidtransSignature(body) {
  if (config.midtrans.mockMode) return true;
  const { order_id, status_code, gross_amount, signature_key } = body;
  const expected = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + config.midtrans.serverKey)
    .digest("hex");
  return expected === signature_key;
}

module.exports = { createQrisCharge, verifyMidtransSignature };
