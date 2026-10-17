import { prisma } from "./db";

/**
 * To'lov qilinmagan va muddati o'tgan (60 daqiqadan oshgan) inPAY buyurtmalarini
 * avtomatik bekor qilish vazifasi.
 */
export async function cleanupExpiredOrders(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 60 daqiqa oldin
    const expired = await prisma.order.findMany({
      where: {
        paymentMethod: "inpay",
        isPaid: false,
        status: "NEW",
        createdAt: { lt: cutoff },
      },
      select: { id: true, code: true },
      take: 50,
    });

    if (expired.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: expired.map((o) => o.id) } },
        data: {
          status: "CANCELED",
          managerNote: "inPAY: to'lov vaqti tugadi (avtomatik bekor qilindi)",
        },
      });
      console.log(`[AutoCancel] ${expired.length} ta to'lanmagan inPAY buyurtmasi bekor qilindi.`);
    }
  } catch (err) {
    console.error("[AutoCancel] Xatolik:", err);
  }
}

export function startBackgroundTasks(): void {
  // Har 10 daqiqada tekshirib turadi
  setInterval(cleanupExpiredOrders, 10 * 60 * 1000);
  // Server ko'tarilganidan 1 daqiqa o'tib ham bir marta tekshiradi
  setTimeout(cleanupExpiredOrders, 60 * 1000);
}
