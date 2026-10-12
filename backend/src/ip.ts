import { Request } from "express";
import { config } from "./config";

/**
 * Xavfsiz mijoz IP manzilini aniqlash.
 * IP Spoofing himoyasi:
 * - Mijoz tomonidan soxtalashtirilgan sarlavhalarga (CF-Connecting-IP, X-Forwarded-For) ISHONMAYDI.
 * - Faqat server administratori BEHIND_CLOUDFLARE=true qilib belgilaganidagina va so'rov
 *   ishonchli proksidan (loopback/Nginx) kelgandagina CF-Connecting-IP ishlatiladi.
 * - Aks holda faqat Express trust proxy orqali tekshirilgan req.ip yoki socket remoteAddress ishlatiladi.
 */
export function getClientIp(req: Request): string {
  let ip = "";

  // Faqat qat'iy Cloudflare rejimi yoqilgan bo'lsa
  if (config.behindCloudflare) {
    const cfIp = req.headers["cf-connecting-ip"];
    if (typeof cfIp === "string" && cfIp.trim()) {
      ip = cfIp.trim();
    }
  }

  // Agar Cloudflare bo'lmasa yoki sarlavha topilmasa, Express trust-proxy sanitsiyalangan IP olinadi
  if (!ip) {
    ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  }

  // IPv6 mapped IPv4 tozalash (masalan: ::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  return ip;
}
