import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { config } from "./config";
import { HttpError } from "./errors";

/** +998901234567 koʻrinishiga keltiradi, notoʻgʻri boʻlsa null */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 9) d = "998" + d;
  if (!/^998\d{9}$/.test(d)) return null;
  return "+" + d;
}

export function hashCode(phone: string, code: string): string {
  return crypto.createHmac("sha256", config.jwtSecret).update(`${phone}:${code}`).digest("hex");
}

export async function assertNotBlocked(phone: string, ip: string) {
  const hit = await prisma.blocked.findFirst({
    where: { OR: [{ type: "PHONE", value: phone }, { type: "IP", value: ip }] },
  });
  if (hit) {
    throw new HttpError(403, "Buyurtma qabul qilinmadi. Iltimos, doʻkon bilan telefon orqali bogʻlaning.");
  }
}

export function hasLink(text: string): boolean {
  return /(https?:\/\/|www\.|t\.me\/|\.(com|ru|uz|net|org|ly)\b)/i.test(text);
}

/**
 * SMS byudjeti va IP kunlik limiti tekshiruvi.
 * Eskiz hisobidagi balansni botlar va spammerlardan himoya qiladi.
 */
export async function assertSmsBudgetAvailable(ip?: string) {
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);

  // 1. Tizim bo'yicha umumiy kunlik SMS byudjeti
  const dailyTotal = await prisma.otpCode.count({
    where: { createdAt: { gt: dayAgo } },
  });
  if (dailyTotal >= config.dailySmsBudget) {
    throw new HttpError(
      429,
      "Bugungi kunlik SMS xavfsizlik limiti to'lgan. Iltimos, to'g'ridan-to'g'ri operatorimiz bilan bog'laning."
    );
  }

  // 2. Ushbu IP manzildan kunlik SMS limiti
  if (ip) {
    const ipDaily = await prisma.otpCode.count({
      where: { ip, createdAt: { gt: dayAgo } },
    });
    if (ipDaily >= config.dailyIpSmsLimit) {
      throw new HttpError(
        429,
        "Ushbu tarmoqdan (IP) kunlik SMS so'rovlar limiti oshib ketdi. Keyinroq urinib ko'ring."
      );
    }
  }
}

/**
 * Cloudflare Turnstile Captcha tekshiruvi.
 * Agar TURNSTILE_SECRET_KEY sozlanmagan bo'lsa (dev yoki to'g'ridan-to'g'ri server), ruxsat beriladi.
 */
export async function verifyTurnstile(token?: string, ip?: string): Promise<boolean> {
  if (!config.turnstileSecretKey) {
    return true; // Captcha sozlanmagan bo'lsa, o'tkazib yuboriladi
  }
  if (!token) {
    throw new HttpError(400, "Xavfsizlik tekshiruvi (Captcha) talab qilinadi.");
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", config.turnstileSecretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(6000),
    });
    const outcome = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (!outcome.success) {
      throw new HttpError(400, "Xavfsizlik tekshiruvidan (Captcha) o'tilmadi.");
    }
    return true;
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(500, "Captcha tekshiruvida xatolik yuz berdi.");
  }
}

/**
 * Telefon boʻyicha limitlar (Atomar tranzaksiya ichida chaqirilishi mumkin).
 * Xato boʻlsa HttpError tashlaydi.
 */
export async function checkOrderLimits(
  phone: string,
  items: { productId: number; quantity: number }[],
  client: Prisma.TransactionClient = prisma
) {
  const day = new Date(Date.now() - 24 * 3600 * 1000);

  const pending = await client.order.count({ where: { phone, status: "NEW" } });
  if (pending >= 2) {
    throw new HttpError(429, "Oldingi buyurtmalaringiz hali koʻrib chiqilmoqda. Menejer tez orada qoʻngʻiroq qiladi.");
  }

  const today = await client.order.count({ where: { phone, createdAt: { gt: day } } });
  if (today >= 3) {
    throw new HttpError(429, "Bir kunda 3 tadan ortiq buyurtma berish mumkin emas.");
  }

  // Bir xil tarkibdagi takroriy buyurtma
  const key = [...items].sort((a, b) => a.productId - b.productId).map((i) => `${i.productId}x${i.quantity}`).join(",");
  const recent = await client.order.findMany({
    where: { phone, createdAt: { gt: day }, status: { in: ["NEW", "CONFIRMED"] } },
    include: { items: true },
  });
  for (const o of recent) {
    const k = [...o.items]
      .sort((a, b) => (a.productId ?? 0) - (b.productId ?? 0))
      .map((i) => `${i.productId ?? 0}x${i.quantity}`)
      .join(",");
    if (k === key) throw new HttpError(409, "Bu buyurtma allaqachon yuborilgan.");
  }
}

/** Mijoz tarixidan belgilar */
export async function customerFlags(phone: string, client: Prisma.TransactionClient = prisma): Promise<string[]> {
  const [total, done] = await Promise.all([
    client.order.count({ where: { phone } }),
    client.order.count({ where: { phone, status: "DONE" } }),
  ]);
  const flags: string[] = [];
  if (total === 0) flags.push("FIRST");
  if (done > 0) flags.push("TRUSTED");
  return flags;
}

/** Soxta deb belgilangandan keyin limitga yetsa raqamni bloklaydi */
export async function applyFakeStrike(phone: string) {
  const strikes = await prisma.order.count({ where: { phone, status: "FAKE" } });
  if (strikes >= config.fakeStrikeLimit) {
    await prisma.blocked.upsert({
      where: { type_value: { type: "PHONE", value: phone } },
      create: { type: "PHONE", value: phone, reason: `Avtomatik: ${strikes} ta soxta buyurtma` },
      update: {},
    });
    return true;
  }
  return false;
}
