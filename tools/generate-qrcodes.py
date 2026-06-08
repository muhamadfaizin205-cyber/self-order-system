import qrcode
import jwt
import uuid
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# ============================================================
# KONFIGURASI — sesuaikan sebelum generate
# ============================================================
FRONTEND_URL = "https://self-order-system-phi.vercel.app"
JWT_SECRET = "dev-secret-change-me"  # harus sama dengan JWT_SECRET di backend .env
RESTAURANT_NAME = "Mie 99"
RESTAURANT_ID = str(uuid.uuid4())  # dalam produksi, pakai ID dari seed
TOTAL_TABLES = 40
OUTPUT_PATH = "/mnt/user-data/outputs/QR-Code-40-Meja-Mie99.pdf"

# Warna
GREEN = HexColor("#1b7a3d")
GREEN2 = HexColor("#25a550")
DARK = HexColor("#1a1a1a")
GRAY = HexColor("#888888")
WHITE = HexColor("#ffffff")
GREENL = HexColor("#e6f4ea")

# Layout: 2 kolom x 4 baris = 8 per halaman
COLS = 2
ROWS = 4
PER_PAGE = COLS * ROWS

W, H = A4  # 595 x 842 pt
MARGIN_X = 18 * mm
MARGIN_Y = 14 * mm
CARD_W = (W - 2 * MARGIN_X - 10 * mm) / COLS
CARD_H = (H - 2 * MARGIN_Y - 10 * mm) / ROWS
GAP_X = 10 * mm / (COLS - 1) if COLS > 1 else 0
GAP_Y = 10 * mm / (ROWS - 1) if ROWS > 1 else 0
QR_SIZE = 42 * mm

def generate_token(table_id, table_number):
    """Buat JWT token untuk meja (sama seperti backend signTableToken)."""
    payload = {
        "restaurantId": RESTAURANT_ID,
        "tableId": table_id,
        "tableNumber": table_number,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def make_qr_image(url):
    """Buat QR code sebagai PIL Image."""
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")

def draw_card(c, x, y, table_number, qr_img):
    """Gambar satu kartu QR code di posisi (x, y)."""
    # Background card
    c.setStrokeColor(HexColor("#dddddd"))
    c.setLineWidth(0.5)
    c.setFillColor(WHITE)
    c.roundRect(x, y, CARD_W, CARD_H, 8, fill=1, stroke=1)

    # Header hijau
    header_h = 18 * mm
    c.setFillColor(GREEN)
    # rounded top only - draw rect slightly overlapping
    c.roundRect(x, y + CARD_H - header_h, CARD_W, header_h, 8, fill=1, stroke=0)
    c.rect(x, y + CARD_H - header_h, CARD_W, 8, fill=1, stroke=0)  # fill bottom corners

    # Nama restoran
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H - 12 * mm, RESTAURANT_NAME)

    # Nomor meja besar
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H - header_h - 16 * mm, f"MEJA {table_number}")

    # QR code
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)
    qr_reader = ImageReader(qr_buf)
    qr_x = x + (CARD_W - QR_SIZE) / 2
    qr_y = y + 16 * mm
    c.drawImage(qr_reader, qr_x, qr_y, QR_SIZE, QR_SIZE)

    # Border di sekitar QR
    c.setStrokeColor(HexColor("#e0e0e0"))
    c.setLineWidth(0.5)
    c.rect(qr_x - 1, qr_y - 1, QR_SIZE + 2, QR_SIZE + 2, fill=0, stroke=1)

    # Instruksi
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(x + CARD_W / 2, y + 8 * mm, "Scan untuk pesan makanan")
    c.setFont("Helvetica", 6)
    c.drawCentredString(x + CARD_W / 2, y + 4 * mm, "Buka kamera HP, arahkan ke QR code")

def build_pdf():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)
    c.setTitle(f"QR Code {TOTAL_TABLES} Meja - {RESTAURANT_NAME}")
    c.setAuthor(RESTAURANT_NAME)

    tables = []
    for i in range(1, TOTAL_TABLES + 1):
        table_id = str(uuid.uuid4())
        token = generate_token(table_id, i)
        url = f"{FRONTEND_URL}/?restaurant={RESTAURANT_ID}&token={token}"
        qr_img = make_qr_image(url)
        tables.append((i, qr_img, url))

    # Cover page
    c.setFillColor(GREEN)
    c.rect(0, H - 200, W, 200, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(W / 2, H - 80, RESTAURANT_NAME)
    c.setFont("Helvetica", 16)
    c.drawCentredString(W / 2, H - 110, f"QR Code {TOTAL_TABLES} Meja")
    c.setFont("Helvetica", 11)
    c.drawCentredString(W / 2, H - 140, "Cetak, gunting, tempel di setiap meja")

    c.setFillColor(DARK)
    c.setFont("Helvetica", 11)
    y_info = H - 260
    info_lines = [
        f"Restaurant ID: {RESTAURANT_ID}",
        f"Frontend URL: {FRONTEND_URL}",
        f"Total Meja: {TOTAL_TABLES}",
        "",
        "Petunjuk:",
        "1. Cetak halaman-halaman berikut (bisa hitam-putih atau berwarna)",
        "2. Gunting setiap kartu QR code sesuai garis",
        "3. Tempel atau masukkan ke stand akrilik di setiap meja",
        "4. Pastikan backend sudah jalan agar QR berfungsi",
        "",
        "Catatan: QR code ini menggunakan JWT_SECRET default.",
        "Untuk produksi, generate ulang setelah mengubah JWT_SECRET di backend.",
    ]
    for line in info_lines:
        c.drawString(MARGIN_X + 10, y_info, line)
        y_info -= 18

    c.showPage()

    # QR pages
    for idx, (table_num, qr_img, url) in enumerate(tables):
        pos_in_page = idx % PER_PAGE
        if pos_in_page == 0 and idx > 0:
            c.showPage()

        col = pos_in_page % COLS
        row = ROWS - 1 - (pos_in_page // COLS)  # top to bottom

        card_x = MARGIN_X + col * (CARD_W + GAP_X)
        card_y = MARGIN_Y + row * (CARD_H + GAP_Y)

        draw_card(c, card_x, card_y, table_num, qr_img)

    # Last page footer
    c.showPage()
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, H / 2 + 20, f"{RESTAURANT_NAME} - Self-Order System")
    c.drawCentredString(W / 2, H / 2, f"Total {TOTAL_TABLES} QR code telah di-generate.")
    c.drawCentredString(W / 2, H / 2 - 20, "Dokumen ini dicetak otomatis oleh sistem.")

    c.save()
    print(f"PDF berhasil dibuat: {OUTPUT_PATH}")
    print(f"Restaurant ID: {RESTAURANT_ID}")
    print(f"Total meja: {TOTAL_TABLES}")
    print(f"Halaman QR: {-(-TOTAL_TABLES // PER_PAGE)} halaman")

build_pdf()
