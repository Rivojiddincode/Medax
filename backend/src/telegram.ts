import crypto from "crypto";
import { config } from "./config";
import { prisma } from "./db";

// Telegram login sessiyalarini xotirada saqlash
export interface TelegramSession {
  sessionId: string;
  code: string;
  status: "pending" | "confirmed" | "expired";
  phone?: string;
  name?: string;
  customerToken?: string;
  customer?: any;
  createdAt: number;
}

const sessions = new Map<string, TelegramSession>();

// Eskirgan sessiyalarni har 5 daqiqada tozalash (10 daqiqa yashaydi)
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > 10 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

export function createTelegramSession(): { sessionId: string; code: string; botUsername: string; startUrl: string } {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const code = String(crypto.randomInt(100000, 999999));
  const botUsername = config.telegram.botUsername.replace(/^@/, "");

  sessions.set(sessionId, {
    sessionId,
    code,
    status: "pending",
    createdAt: Date.now(),
  });

  const startUrl = `https://t.me/${botUsername}?start=auth_${sessionId}`;

  return { sessionId, code, botUsername, startUrl };
}

export function getTelegramSession(sessionId: string): TelegramSession | null {
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Date.now() - s.createdAt > 10 * 60 * 1000) {
    s.status = "expired";
  }
  return s;
}

export function confirmTelegramSession(
  sessionId: string,
  data: { phone: string; name: string; customerToken: string; customer: any }
) {
  const s = sessions.get(sessionId);
  if (!s) return false;
  s.status = "confirmed";
  s.phone = data.phone;
  s.name = data.name;
  s.customerToken = data.customerToken;
  s.customer = data.customer;
  return true;
}

// Telegram rasmiy Login Widget tekshiruvi (HMAC-SHA256)
export function verifyTelegramAuth(data: Record<string, any>): boolean {
  const { hash, ...rest } = data;
  if (!hash || !config.telegram.botToken) return false;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(config.telegram.botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
  return hmac === hash;
}

// Telegram Bot orqali xabar yuborish
export async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any): Promise<boolean> {
  if (!config.telegram.botToken) {
    console.log(`[Telegram:console] chat ${chatId} -> ${text}`);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err) {
    console.error("Telegram xabar yuborishda xatolik:", err);
    return false;
  }
}
