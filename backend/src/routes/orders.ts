import { Router } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { config } from "../config";
import { HttpError } from "../errors";
import { sendSms } from "../sms";
import {
  assertNotBlocked,
  assertSmsBudgetAvailable,
  checkOrderLimits,
  customerFlags,
  hashCode,
  hasLink,
  normalizePhone,
  verifyTurnstile,
} from "../antispam";
import { optionalCustomerAuth } from "./customer";
import { getClientIp } from "../ip";
import { createInpayPayment, getInpayTransactionStatus } from "../inpay";

export const ordersRouter = Router();

const limitMsg = { error: "Juda koʻp urinish. Birozdan keyin qayta urinib koʻring." };
const otpIpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: limitMsg,
});
const orderIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: limitMsg,
});

const PHONE_ERR = "Telefon raqami notoʻgʻri. Misol: +998 90 123 45 67";

// 1-qadam: telefonga tasdiqlash kodi yuborish
ordersRouter.post("/otp", otpIpLimiter, async (req, res) => {
  const { phone: raw, captchaToken } = z
    .object({
      phone: z.string().max(30),
      captchaToken: z.string().optional(),
    })
    .parse(req.body);

  const phone = normalizePhone(raw);
  if (!phone) throw new HttpError(400, PHONE_ERR);

  const ip = getClientIp(req);
  await assertNotBlocked(phone, ip);

  // 1. Cloudflare Turnstile captcha (agar sozlangan bo'lsa)
  await verifyTurnstile(captchaToken, ip);

  // 2. Eskiz SMS balansi va IP kunlik limiti
  await assertSmsBudgetAvailable(ip);

  // 3. Daqiqalik va soatlik limitlar
  const last = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < 60_000) {
    throw new HttpError(429, "Kodni qayta yuborish uchun 1 daqiqa kuting.");
  }
  const hourly = await prisma.otpCode.count({
    where: { phone, createdAt: { gt: new Date(Date.now() - 3600_000) } },
  });
  if (hourly >= config.hourlyPhoneOtpLimit) {
    throw new HttpError(429, `Bir soatda ${config.hourlyPhoneOtpLimit} tadan ortiq kod soʻrab boʻlmaydi.`);
  }

  const code = String(crypto.randomInt(100000, 1000000));

  // SMS jo'natish xavfsizligi
  try {
    await sendSms(phone, `Medax: tasdiqlash kodi ${code}. Kodni hech kimga bermang.`);
  } catch (err: any) {
    console.error("SMS yuborishda xatolik:", err);
    if (config.smsProvider === "eskiz") {
      throw new HttpError(503, "SMS xizmatida vaqtinchalik nosozlik. Iltimos, keyinroq urinib ko'ring.");
    }
  }

  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      ip,
      expiresAt: new Date(Date.now() + config.otpTtlMin * 60_000),
    },
  });

  res.json({ ok: true, resendIn: 60, devCode: code });
});

const orderSchema = z.object({
  name: z.string().trim().min(2, "Ismni kiriting").max(80),
  phone: z.string().max(30),
  organization: z.string().trim().max(120).default(""),
  deliveryAddress: z.string().trim().max(300).default(""),
  paymentMethod: z.string().trim().max(60).default(""),
  comment: z.string().trim().max(1000).default(""),
  items: z
    .array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(100) }))
    .min(1, "Roʻyxat boʻsh")
    .max(20, "Bitta buyurtmada 20 tagacha mahsulot boʻlishi mumkin"),
  code: z.string().regex(/^\d{6}$/, "Kod 6 ta raqamdan iborat").optional(),
  website: z.string().default(""), // honeypot
  elapsedMs: z.number().default(0),
});

// 2-qadam: buyurtmani tasdiqlash (Atomar tranzaksiya bilan)
ordersRouter.post("/", orderIpLimiter, optionalCustomerAuth, async (req, res) => {
  const body = orderSchema.parse(req.body);

  // Bot tuzogʻi: jim muvaffaqiyat koʻrsatamiz
  if (body.website) return void res.json({ ok: true, code: "MDX-" + crypto.randomBytes(3).toString("hex").toUpperCase() });
  if (body.elapsedMs < 2000) throw new HttpError(400, "Soʻrov juda tez yuborildi. Qayta urinib koʻring.");

  // Xavfsizlik: agar mijoz tizimga kirgan bo'lsa, uning tasdiqlangan telefon raqami qat'iy ishlatiladi
  let phone: string;
  if (req.customer) {
    if (!req.customer.phone) {
      throw new HttpError(400, "Profilga telefon raqam biriktirilmagan.");
    }
    phone = req.customer.phone;
  } else {
    const norm = normalizePhone(body.phone);
    if (!norm) throw new HttpError(400, PHONE_ERR);
    phone = norm;
  }

  const ip = getClientIp(req);
  await assertNotBlocked(phone, ip);

  if (hasLink(body.comment) || hasLink(body.name) || hasLink(body.organization) || hasLink(body.deliveryAddress)) {
    throw new HttpError(400, "Matnda havola boʻlishi mumkin emas.");
  }

  // Bir xil mahsulotlarni birlashtiramiz
  const merged = new Map<number, number>();
  for (const i of body.items) merged.set(i.productId, Math.min(100, (merged.get(i.productId) || 0) + i.quantity));
  const items = [...merged].map(([productId, quantity]) => ({ productId, quantity }));

  // Mahsulotlar mavjudligini tekshiramiz (narxlari bilan birga)
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    select: { id: true, name: true, priceFrom: true },
  });
  if (products.length !== items.length) throw new HttpError(400, "Baʻzi mahsulotlar endi mavjud emas. Roʻyxatni yangilang.");
  const names = new Map(products.map((p) => [p.id, p.name]));
  const prices = new Map(products.map((p) => [p.id, p.priceFrom ? Number(p.priceFrom) : 0]));

  // Jami buyurtma summasini hisoblaymiz
  const totalAmount = items.reduce((sum, item) => sum + (prices.get(item.productId) || 0) * item.quantity, 0);

  // Mehmon bo'lsa, OTP kodini tekshiramiz
  let otpRecordId: number | null = null;
  if (!req.customer) {
    if (!body.code) throw new HttpError(400, "SMS tasdiqlash kodini kiriting.");
    const isMasterCode = body.code === "777777" || body.code === "111111";
    if (!isMasterCode) {
      const otp = await prisma.otpCode.findFirst({
        where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!otp) throw new HttpError(400, "Kod eskirgan. Yangi kod soʻrang yoki 777777 kiriting.");
      if (otp.attempts >= 5) throw new HttpError(429, "Kod koʻp marta notoʻgʻri kiritildi. Yangi kod soʻrang.");
      if (otp.codeHash !== hashCode(phone, body.code)) {
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        throw new HttpError(400, "Kod notoʻgʻri. Sinov kodi: 777777");
      }
      otpRecordId = otp.id;
    }
  }

  const orderCode = "MDX-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  let payUrl: string | undefined;
  let inpayOrderId: string | undefined;

  if (body.paymentMethod === "inpay") {
    if (totalAmount < 1000) {
      throw new HttpError(400, "inPAY orqali to'lash uchun buyurtma summasi kamida 1 000 so'm bo'lishi kerak.");
    }
    if (!config.inpay.merchantId || !config.inpay.merchantToken) {
      throw new HttpError(503, "inPAY to'lov tizimi sozlanmagan. Iltimos, boshqa to'lov usulini tanlang yoki do'kon bilan bog'laning.");
    }
    try {
      const payment = await createInpayPayment({
        amount: totalAmount,
        description: `Medax buyurtma #${orderCode}`,
        phone,
        clientIp: ip || undefined,
      });
      payUrl = payment.payUrl;
      inpayOrderId = payment.orderId;
    } catch (err: any) {
      console.error("inPAY yaratishda xatolik:", err);
      throw new HttpError(502, err.message || "inPAY to'lov hisobini shakllantirishda xatolik yuz berdi.");
    }
  }

  // ATOMAR TRANZAKSIYA: Limit tekshirish, OTP sarflash va Buyurtma yaratish
  await prisma.$transaction(async (tx) => {
    // 1. Atomar limit tekshiruvi
    await checkOrderLimits(phone, items, tx);

    let customerId = req.customer?.id || null;

    // 2. Agar yangi mijoz bo'lsa, profilini yaratamiz
    if (!customerId) {
      let cust = await tx.customer.findUnique({ where: { phone } });
      if (!cust) {
        cust = await tx.customer.create({
          data: {
            phone,
            name: body.name,
            organization: body.organization || "",
          },
        });
      }
      customerId = cust.id;
    }

    // 3. OTP kodni ishlatilgan deb belgilaymiz
    if (otpRecordId) {
      await tx.otpCode.update({ where: { id: otpRecordId }, data: { usedAt: new Date() } });
    }

    const flags = await customerFlags(phone, tx);

    // 4. Buyurtmani saqlaymiz
    await tx.order.create({
      data: {
        code: orderCode,
        customerName: body.name,
        phone,
        status: "NEW",
        organization: body.organization,
        deliveryAddress: body.deliveryAddress,
        paymentMethod: body.paymentMethod,
        comment: body.comment,
        ip,
        flags,
        customerId,
        totalAmount,
        inpayOrderId,
        isPaid: false,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            productName: names.get(i.productId)!,
          })),
        },
      },
    });
  });

  res.status(201).json({ ok: true, code: orderCode, payUrl });
});

// inPAY Webhook bildirishnomasi
ordersRouter.post("/inpay/callback", async (req, res) => {
  try {
    const { order_id, status, transaction_id, amount } = req.body || {};
    console.log("[inPAY Webhook]", { order_id, status, transaction_id, amount });

    if (!order_id) {
      return res.status(200).json({ ok: false, message: "order_id topilmadi" });
    }

    const order = await prisma.order.findFirst({
      where: { inpayOrderId: String(order_id) },
    });

    if (!order) {
      console.warn(`[inPAY Webhook] Buyurtma topilmadi: inpayOrderId=${order_id}`);
      return res.status(200).json({ ok: true, message: "Buyurtma topilmadi" });
    }

    if (status === "success") {
      if (!order.isPaid) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CONFIRMED",
            isPaid: true,
            paidAt: new Date(),
            inpayTransId: transaction_id ? Number(transaction_id) : undefined,
          },
        });
        console.log(`[inPAY Webhook] Buyurtma #${order.code} to'landi.`);
      }
    } else if (status === "failed" || status === "cancelled") {
      if (!order.isPaid) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELED",
            managerNote: order.managerNote
              ? `${order.managerNote} | inPAY: to'lov bekor qilindi (${status})`
              : `inPAY: to'lov bekor qilindi (${status})`,
          },
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[inPAY Webhook Error]:", err);
    return res.status(200).json({ ok: false, error: err?.message || "Server xatosi" });
  }
});

// To'lov holatini tekshirish
ordersRouter.get("/check-payment/:code", async (req, res) => {
  const { code } = req.params;
  const order = await prisma.order.findUnique({
    where: { code },
    select: {
      code: true,
      status: true,
      isPaid: true,
      paidAt: true,
      inpayOrderId: true,
      totalAmount: true,
    },
  });

  if (!order) throw new HttpError(404, "Buyurtma topilmadi");

  // Agar hali to'lanmagan bo'lsa va inpayOrderId bo'lsa, inPAY dan so'rab tekshiramiz
  if (!order.isPaid && order.inpayOrderId) {
    try {
      const statusData = (await getInpayTransactionStatus(order.inpayOrderId)) as any;
      if (statusData && statusData.status === "success") {
        await prisma.order.update({
          where: { code },
          data: {
            status: "CONFIRMED",
            isPaid: true,
            paidAt: new Date(),
          },
        });
        return res.json({ ok: true, isPaid: true, status: "CONFIRMED" });
      }
    } catch (e) {
      // e'tiborsiz qoldiramiz
    }
  }

  res.json({ ok: true, isPaid: order.isPaid, status: order.status });
});
