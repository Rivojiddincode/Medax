"""
Medax Payment Parser Service (24/7 Avtomatlashtirilgan to'lov qorovuli)
Vazifasi:
  - Bankdan kelgan to'lov xatlarini avtomatik ushlaydi
  - Medax backend API siga xavfsiz webhook yuboradi
  - Buyurtma holatini "CONFIRMED" (To'langan) ga o'tkazadi
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
from datetime import datetime
from email_payment_parser import BankEmailParser, EmailPaymentFetcher

# Windows konsolida UTF-8 belgilari xatosiz chiqishi uchun
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def load_env_file(filepath: str):
    """Oddiy .env faylini o'qiydi (qo'shimcha kutubxonalarsiz)"""
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


# .env fayllarini yuklash
current_dir = os.path.dirname(os.path.abspath(__file__))
load_env_file(os.path.join(current_dir, ".env"))
load_env_file(os.path.join(current_dir, "..", "backend", ".env"))
load_env_file(os.path.join(current_dir, "..", ".env"))

# Konfiguratsiya parametrlarini olish
IMAP_HOST = os.environ.get("EMAIL_IMAP_HOST", "imap.gmail.com")
IMAP_PORT = int(os.environ.get("EMAIL_IMAP_PORT", "993"))
EMAIL_USER = os.environ.get("EMAIL_USER", "")
EMAIL_PASS = os.environ.get("EMAIL_PASS", "")

MEDAX_API_URL = os.environ.get("MEDAX_API_URL", "http://localhost:4000/api/orders/payment-webhook")
WEBHOOK_SECRET = os.environ.get("MEDAX_WEBHOOK_SECRET", "medax_payment_secret_2026")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "30"))


def notify_medax_backend(payment_info: dict) -> dict:
    """
    To'lov ma'lumotlarini Medax backendiga POST webhook orqali jo'natadi.
    """
    payload = {
        "secret": WEBHOOK_SECRET,
        "orderCode": payment_info.get("order_code"),
        "amount": payment_info.get("amount"),
        "currency": payment_info.get("currency", "UZS"),
        "paidAt": payment_info.get("datetime"),
        "cardLast4": payment_info.get("card_last4"),
        "rawSender": payment_info.get("sender", "Bank Email Notification"),
    }

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        MEDAX_API_URL,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "MedaxPaymentWatcher/1.0"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            return json.loads(resp_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return {"ok": False, "status": e.code, "error": json.loads(err_body).get("error", err_body)}
        except Exception:
            return {"ok": False, "status": e.code, "error": err_body}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def process_payment(payment: dict):
    """
    Bitta aniqlangan to'lovni qayta ishlash va Medax bilan bog'lash.
    """
    code = payment.get("order_code")
    amount = payment.get("amount")

    print("\n" + "-" * 60)
    print(f"📩 Yangi to'lov xati aniqlandi:")
    print(f"   Summa    : {amount:,} UZS" if amount else "   Summa: Aniqlanmadi")
    print(f"   Vaqt     : {payment.get('datetime')}")
    print(f"   Karta    : {payment.get('card_last4') or 'Noma\'lum'}")
    print(f"   Buyurtma : {code or 'Topilmadi'}")

    if not code:
        print("⚠️ Ogohlantirish: Xat matnida Medax buyurtma kodi (MDX-...) topilmadi. Avto-tasdiqlash o'tkazib yuborildi.")
        return

    print(f"🚀 Medax serveriga so'rov yuborilmoqda: {MEDAX_API_URL} ...")
    res = notify_medax_backend(payment)

    if res.get("ok"):
        print(f"✅ MUVAFFAQIShIYAT: Buyurtma {code} avtomatik to'landi va tasdiqlandi!")
        print(f"   Mijoz: {res.get('customerName')} | Yangi holati: {res.get('status')}")
    else:
        print(f"❌ Xatolik: {res.get('error') or res.get('message') or res}")


def run_live_loop():
    """
    Pochtani har N soniyada tekshirib turuvchi asosiy tsikl.
    """
    if not EMAIL_USER or not EMAIL_PASS or "xxxx" in EMAIL_PASS:
        print("\n" + "=" * 70)
        print("OGOHLANTIRISH: Haqiqiy pochta rekvizitlari kiritilmagan!")
        print("Pochtani ulash uchun payment_parser/.env faylini to'ldiring:")
        print("  EMAIL_USER=pochta@gmail.com")
        print("  EMAIL_PASS=xxxx xxxx xxxx xxxx (Google App Password)")
        print("=" * 70)
        print("\nTest/Simulyatsiya rejimini ishga tushirish uchun:")
        print("  python payment_parser/service.py --demo\n")
        return

    fetcher = EmailPaymentFetcher(IMAP_HOST, EMAIL_USER, EMAIL_PASS, IMAP_PORT)
    print(f"\n[INFO] Medax To'lov Qorovuli ishga tushdi ({EMAIL_USER})!")
    print(f"Har {POLL_INTERVAL}s da pochtani tekshiradi. To'xtatish uchun: Ctrl + C bosing.\n")

    while True:
        try:
            payments = fetcher.fetch_unseen_emails()
            for p in payments:
                process_payment(p)
        except Exception as e:
            print(f"[XATO] Pochtani tekshirishda xatolik: {e}")

        time.sleep(POLL_INTERVAL)


def run_once():
    """Bitta tekshirish o'tkazib natijani chiqaradi"""
    fetcher = EmailPaymentFetcher(IMAP_HOST, EMAIL_USER, EMAIL_PASS, IMAP_PORT)
    print(f"\n[INFO] Pochta tekshirilmoqda ({EMAIL_USER})...")
    payments = fetcher.fetch_unseen_emails()
    if not payments:
        print("[OK] Hozircha o'qilmagan yangi to'lov xatlari yo'q.")
    for p in payments:
        process_payment(p)


def run_demo_simulation():
    """
    Haqiqiy Medax backend API siga to'lov kelganini simulyatsiya qilib ko'rsatish
    """
    print("=" * 70)
    print("MEDAX: TO'LOV INTEGRATSIYASI SIMULYATSIYASI (DEMO REJIM)")
    print("=" * 70)

    # 1. Namunaviy bank xati
    sample_bank_email = """
Hurmatli mijoz!
Kartangiz: *9124
Muvaffaqiyatli to'lov: +2 450 000 UZS
Sana: 12.10.2026 20:10:00
Izoh: Buyurtma uchun to'lov MDX-PAYTEST1
Kapitalbank xizmati.
"""
    print("\n1. Bankdan quyidagi email keldi:")
    print(sample_bank_email.strip())

    # 2. Xatni parse qilish
    print("\n2. BankEmailParser matnni tahlil qilmoqda...")
    parsed = BankEmailParser.parse_text(sample_bank_email)
    print(f"   -> Topilgan summa: {parsed['amount']:,} {parsed['currency']}")
    print(f"   -> Topilgan vaqt : {parsed['datetime']}")
    print(f"   -> Topilgan kod  : {parsed['order_code']}")

    # 3. Medax API ga jo'natish
    print(f"\n3. Medax Backend API ({MEDAX_API_URL}) ga webhook yuborilmoqda...")
    res = notify_medax_backend(parsed)
    print("   Serverdan qaytgan javob:")
    print(f"   {json.dumps(res, indent=4, ensure_ascii=False)}")

    print("\n" + "=" * 70)
    if res.get("ok"):
        print("✓ TIZIM 100% ISHLAMOQDA: Buyurtma to'lovi avtomatik qabul qilindi!")
    else:
        print(f"ℹ️ Eslatma: Server javobi: {res.get('error') or res.get('message')}")
        print("  (Agar buyurtma bazada bo'lmasa 404 beradi, haqiqiy buyurtma kodi bilan esa darhol CONFIRMED ga o'tadi).")
    print("=" * 70)


if __name__ == "__main__":
    if "--demo" in sys.argv or "--test" in sys.argv:
        run_demo_simulation()
    elif "--once" in sys.argv:
        run_once()
    else:
        run_live_loop()
