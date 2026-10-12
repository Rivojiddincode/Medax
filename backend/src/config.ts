import "dotenv/config";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";

// Xavfsizlik: ishlab chiqarish muhitida alohida, kuchli sirlar talab qilinadi
const jwtSecret = process.env.JWT_SECRET || (isProd ? "" : "dev-admin-jwt-secret-key-32charsmin!!");
const customerJwtSecret =
  process.env.CUSTOMER_JWT_SECRET ||
  (isProd ? "" : "dev-customer-jwt-secret-key-32chars!!");

export function validateStartupConfig() {
  if (isProd) {
    if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes("dev-") || jwtSecret.includes("change-me")) {
      throw new Error(
        "XAVFSIZLIK XATOSI: Production muhitida JWT_SECRET kamida 32 ta belgidan iborat tasodifiy kalit bo'lishi shart!"
      );
    }
    if (!customerJwtSecret || customerJwtSecret.length < 32 || customerJwtSecret.includes("dev-") || customerJwtSecret.includes("change-me")) {
      throw new Error(
        "XAVFSIZLIK XATOSI: Production muhitida CUSTOMER_JWT_SECRET kamida 32 ta belgidan iborat alohida kalit bo'lishi shart!"
      );
    }
    if (jwtSecret === customerJwtSecret) {
      throw new Error(
        "XAVFSIZLIK XATOSI: Admin JWT_SECRET va CUSTOMER_JWT_SECRET bir xil bo'lishi mumkin emas!"
      );
    }
    if (config.smsProvider === "console") {
      console.warn(
        "OGOHLANTIRISH: Production muhitida SMS_PROVIDER=console sozlagansiz! Haqiqiy mijozlar SMS kod ololmaydi. Eskiz SMS provayderini sozlang."
      );
    }
  }
}

const smsProvider = process.env.SMS_PROVIDER || "console";

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  jwtSecret,
  customerJwtSecret,
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  smsProvider,
  eskiz: {
    email: process.env.ESKIZ_EMAIL || "",
    password: process.env.ESKIZ_PASSWORD || "",
    from: process.env.ESKIZ_FROM || "4546",
  },
  otpTtlMin: 5,
  // console rejimida kod javobda qaytadi (faqat test/dev uchun)
  exposeOtp: smsProvider === "console" && !isProd,
  fakeStrikeLimit: Number(process.env.FAKE_STRIKE_LIMIT || 2),

  // Xavfsizlik va limitlar
  behindCloudflare: process.env.BEHIND_CLOUDFLARE === "true",
  trustProxy: process.env.TRUST_PROXY || (isProd ? "loopback, linklocal, uniquelocal" : "1"),
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || "",
  dailySmsBudget: Number(process.env.DAILY_SMS_BUDGET || 250), // butun server bo'yicha kunlik max SMS
  dailyIpSmsLimit: Number(process.env.DAILY_IP_SMS_LIMIT || 8), // 1 ta IP dan kunlik max SMS
  hourlyPhoneOtpLimit: Number(process.env.HOURLY_PHONE_OTP_LIMIT || 4), // 1 ta raqamga soatlik max OTP
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "medax_payment_secret_2026",
};
