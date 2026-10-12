import { prisma } from "./db";

async function setOriginalBrands() {
  const newBrands = [
    { name: "Mindray", slug: "mindray", country: "Xitoy" },
    { name: "Dirui", slug: "dirui", country: "Xitoy" },
    { name: "Rayto", slug: "rayto", country: "Xitoy" },
    { name: "Chison", slug: "chison", country: "Xitoy" },
    { name: "Human Diagnostics", slug: "human", country: "Germaniya" },
    { name: "Cypress Diagnostics", slug: "cypress", country: "Belgiya" },
  ];

  console.log("Upserting 5 original brands...");
  const brandMap: Record<string, number> = {};

  for (const b of newBrands) {
    const rec = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: b,
      update: { name: b.name, country: b.country },
    });
    brandMap[b.slug] = rec.id;
  }

  // Mavjud mahsulotlarni ushbu 5 ta haqiqiy brendlarga bog'lash (boshqa eski brendlar qolmasligi uchun)
  // Masalan: UZI apparatlarini Chison va Mindray ga bog'laymiz
  await prisma.product.updateMany({
    where: {
      OR: [
        { name: { contains: "UZI" } },
        { name: { contains: "УЗИ" } },
        { name: { contains: "ultratovush" } },
      ],
    },
    data: { brandId: brandMap["chison"], country: "Xitoy" },
  });

  // Monitorlar va IVL / Reanimatsiyani Mindray ga bog'laymiz
  await prisma.product.updateMany({
    where: {
      OR: [
        { name: { contains: "monitor" } },
        { name: { contains: "reanimatsiya" } },
        { name: { contains: "IVL" } },
        { name: { contains: "Mindray" } },
      ],
    },
    data: { brandId: brandMap["mindray"], country: "Xitoy" },
  });

  // Laboratoriya va diagnostika uskunalarini Dirui va Human ga bog'laymiz
  await prisma.product.updateMany({
    where: {
      OR: [
        { name: { contains: "analizator" } },
        { name: { contains: "laboratoriya" } },
        { name: { contains: "test" } },
        { name: { contains: "Dirui" } },
      ],
    },
    data: { brandId: brandMap["dirui"], country: "Xitoy" },
  });

  // Biokimyo / koagulyator / Rayto
  await prisma.product.updateMany({
    where: {
      OR: [
        { name: { contains: "Rayto" } },
        { name: { contains: "qon" } },
      ],
    },
    data: { brandId: brandMap["rayto"], country: "Xitoy" },
  });

  // Qolgan barcha mahsulotlarni (agar hali brendi bo'lmasa yoki eski bo'lsa) shu 5 ta brendga taqsimlaymiz
  const allProds = await prisma.product.findMany();
  const validIds = Object.values(brandMap);

  for (let i = 0; i < allProds.length; i++) {
    const p = allProds[i];
    if (!p.brandId || !validIds.includes(p.brandId)) {
      const assignedBrandId = validIds[i % validIds.length];
      await prisma.product.update({
        where: { id: p.id },
        data: { brandId: assignedBrandId },
      });
    }
  }

  // Endi mahsuloti bo'lmagan eski brendlarni o'chirib tashlaymiz
  const activeSlugs = newBrands.map((b) => b.slug);
  const deleted = await prisma.brand.deleteMany({
    where: {
      slug: { notIn: activeSlugs },
    },
  });

  console.log(`Deleted old brands count: ${deleted.count}`);
  console.log("Successfully set only the 5 original brands!");
}

setOriginalBrands()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
