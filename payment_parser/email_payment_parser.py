"""
Medax Payment Parser — 1-bosqich: Email orqali to'lovlarni avtomatlashtirish
Muallif: Medax Dev
Vazifasi:
  1. IMAP (Gmail, Yandex va h.k.) orqali bankdan kelgan xatlarni o'qish
  2. Xat matnidan Summa, Sana/Vaqt, Karta va Tranzaksiya raqamini Regex bilan ajratib olish
  3. Kelgusida Medax buyurtmasi bilan solishtirish (Match)
"""

import imaplib
import email
from email.header import decode_header
import re
import sys
from datetime import datetime
from typing import Optional, Dict, Any

# Windows konsolida UTF-8 belgilari xatosiz chiqishi uchun
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


# ==============================================================================
# 1. PARSER MANTIQI (Regex orqali summa, vaqt va rekvizitlarni ajratish)
# ==============================================================================

class BankEmailParser:
    """
    O'zbekiston banklari va to'lov tizimlari (Click, Payme, Uzum, Kapitalbank,
    Ipak Yo'li, Humo/Uzcard) xatlaridan ma'lumotlarni ajratib oluvchi klass.
    """

    # Summani aniqlovchi regex patternlari:
    # Masalan: "1 250 000 UZS", "500,000.00 so'm", "Summa: +450 000", "1500000 sum"
    AMOUNT_PATTERNS = [
      r"(?:summa|to['`]?lov|miqdor|popolnenie|sum)\s*[:=-]?\s*([+]?\d[\d\s,.]*)\s*(?:uzs|so['`]?m|sum|rub)?",
      r"([+]?\d[\d\s,.]*)\s*(?:uzs|so['`]?m|sum)",
      r"(?:[+]|\b)(\d{1,3}(?:[\s,.]\d{3})*(?:\.\d{2})?)\s*(?:uzs|so['`]?m)",
    ]

    # Vaqt va sanani aniqlovchi regex patternlari:
    # Masalan: "12.10.2026 18:45:00", "2026-10-12 18:45", "12/10/2026 18:45"
    DATETIME_PATTERNS = [
      r"(\d{2}[./-]\d{2}[./-]\d{4}\s+\d{2}:\d{2}(?::\d{2})?)",
      r"(\d{4}[./-]\d{2}[./-]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)",
    ]

    # Karta raqami oxirgi 4 ta raqami:
    # Masalan: "*1234", "karta: 8600 **** 5678"
    CARD_PATTERN = r"(?:karta|card|schet|pan)[^\d]*(\*{2,4}\d{4}|\d{4}\*{4,8}\d{4}|\*{0,4}\d{4})"

    # Medax kodi (Mijoz ID kodi: MDX-1, Sessiya kodi: MDX-T1029 yoki Buyurtma kodi: MDX-PAYTEST1)
    ORDER_CODE_PATTERN = r"\b(MDX-(?:T\d{4,8}|\d{1,8}|[A-Z0-9]{4,10}))\b"

    @classmethod
    def clean_amount(cls, raw: str) -> Optional[float]:
        """Matndan olingan sonni toza float raqamga aylantiradi"""
        if not raw:
            return None
        cleaned = raw.replace(" ", "").replace("+", "").replace("UZS", "").replace("so'm", "").strip()
        # Agar "1,250,000.00" yoki "1.250.000,00" bo'lsa:
        if "," in cleaned and "." in cleaned:
            cleaned = cleaned.replace(",", "")
        elif "," in cleaned and "." not in cleaned:
            cleaned = cleaned.replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return None

    @classmethod
    def parse_text(cls, text: str, email_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Email matnini qabul qilib, undagi ma'lumotlarni lug'at (dict) shaklida qaytaradi.
        """
        result = {
            "amount": None,
            "raw_amount": None,
            "currency": "UZS",
            "datetime": email_date or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "card_last4": None,
            "order_code": None,
            "raw_snippet": text[:200].strip(),
        }

        # 1. Summani qidirish
        for pattern in cls.AMOUNT_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw_amt = match.group(1).strip()
                parsed_amt = cls.clean_amount(raw_amt)
                if parsed_amt and parsed_amt > 0:
                    result["amount"] = parsed_amt
                    result["raw_amount"] = raw_amt
                    break

        # 2. Vaqtni qidirish
        for pattern in cls.DATETIME_PATTERNS:
            match = re.search(pattern, text)
            if match:
                result["datetime"] = match.group(1).strip()
                break

        # 3. Karta raqamini qidirish
        card_match = re.search(cls.CARD_PATTERN, text, re.IGNORECASE)
        if card_match:
            result["card_last4"] = card_match.group(1)

        # 4. Buyurtma kodini qidirish
        order_match = re.search(cls.ORDER_CODE_PATTERN, text, re.IGNORECASE)
        if order_match:
            result["order_code"] = order_match.group(1).upper()

        return result


# ==============================================================================
# 2. EMAIL SERVER (IMAP) BILAN ISHLASH
# ==============================================================================

class EmailPaymentFetcher:
    """
    Pochta qutisini (Gmail / Yandex / Corp email) tekshiruvchi klass.
    """
    def __init__(self, imap_host: str, username: str, password: str, port: int = 993):
        self.imap_host = imap_host
        self.port = port
        self.username = username
        self.password = password

    def fetch_unseen_emails(self, folder: str = "INBOX"):
        """
        O'qilmagan (UNSEEN) xatlarni oladi va parse qiladi.
        """
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.imap_host} pochtasiga ulanmoqda...")
        mail = imaplib.IMAP4_SSL(self.imap_host, self.port)
        mail.login(self.username, self.password)
        mail.select(folder)

        # O'qilmagan xatlarni qidirish
        status, response = mail.search(None, "UNSEEN")
        if status != "OK":
            print("Xatlarni olishda xatolik yuz berdi.")
            mail.logout()
            return []

        email_ids = response[0].split()
        total_unseen = len(email_ids)
        # So'nggi 15 ta o'qilmagan xatni tekshiramiz (eski xatlarni tekshirib qotib qolmasligi uchun)
        recent_ids = email_ids[-15:]
        print(f"O'qilmagan xatlar: jami {total_unseen} ta, eng so'nggi {len(recent_ids)} tasi tekshirilmoqda...")

        parsed_payments = []

        for e_id in recent_ids:
            _, msg_data = mail.fetch(e_id, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])

                    # Xat sarlavhasi
                    subject, encoding = decode_header(msg.get("Subject", ""))[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding or "utf-8", errors="ignore")

                    sender = msg.get("From", "")
                    date_header = msg.get("Date", "")

                    # Xat matnini olish
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode(errors="ignore")
                                break
                    else:
                        body = msg.get_payload(decode=True).decode(errors="ignore")

                    # Parsing qilish
                    payment_info = BankEmailParser.parse_text(f"{subject}\n{body}", email_date=date_header)
                    payment_info["sender"] = sender
                    payment_info["subject"] = subject

                    parsed_payments.append(payment_info)

        mail.logout()
        return parsed_payments


# ==============================================================================
# 3. TEST / DEMO REJIMI (Haqiqiy email ulanmasdan darhol sinab ko'rish uchun)
# ==============================================================================

def run_test_demo():
    print("=" * 70)
    print("MEDAX: EMAIL TO'LOV PARSERINI SINASH (TEST REJIMI)")
    print("=" * 70)

    # Banklardan kelishi mumkin bo'lgan namunaviy xatlar matni:
    sample_emails = [
        {
            "bank": "Kapitalbank (Karta to'lovi)",
            "subject": "Hisobingizga mablag' kelib tushdi",
            "body": """Hurmatli mijoz!
Karta: *4589
Summa: +1 250 000 UZS
Vaqt: 12.10.2026 19:35:12
Izoh: To'lov uchun MDX-9482
Muvaffaqiyatli amalga oshirildi.""",
        },
        {
            "bank": "Click.uz (Chek)",
            "subject": "Muvaffaqiyatli to'lov: Medax Medical Servis",
            "body": """Click cheki #783921.
To'lov miqdori: 3 800 000 so'm
Sana: 12.10.2026 18:14:00
Qabul qiluvchi: Medax tibbiy asboblar MCHJ
Buyurtma: MDX-1029""",
        },
        {
            "bank": "Ipak Yo'li Banki (SMS/Email xabarnoma)",
            "subject": "Kartangiz to'ldirildi",
            "body": """Popolnenie karty 8600****1234
Summa: 450000.00 UZS
Data: 2026-10-12 17:50:30
Balans: 5 120 000 UZS""",
        },
    ]

    for i, item in enumerate(sample_emails, start=1):
        print(f"\n--- {i}-NAMUNA: {item['bank']} ---")
        raw_text = f"{item['subject']}\n{item['body']}"
        parsed = BankEmailParser.parse_text(raw_text)

        print(f"📌 Xat mavzusi : {item['subject']}")
        print(f"💰 Summa       : {parsed['amount']:,} {parsed['currency']}" if parsed['amount'] else "❌ Summa topilmadi")
        print(f"🕒 Vaqt        : {parsed['datetime']}")
        print(f"💳 Karta       : {parsed['card_last4']}")
        print(f"📦 Buyurtma    : {parsed['order_code'] or 'Topilmadi'}")

    print("\n" + "=" * 70)
    print("✓ Test muvaffaqiyatli yakunlandi!")
    print("=" * 70)


if __name__ == "__main__":
    # Testni ishga tushirish:
    run_test_demo()
