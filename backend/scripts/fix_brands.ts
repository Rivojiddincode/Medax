import { prisma } from "./db";

async function fixBrands() {
  const brandDefs = [
    { name: "Sony", slug: "sony", country: "Yaponiya" },
    { name: "Olympus", slug: "olympus", country: "Yaponiya" },
    { name: "Barco", slug: "barco", country: "Belgiya" },
    { name: "Maquet", slug: "maquet", country: "Germaniya" },
    { name: "Stryker", slug: "stryker", country: "AQSH" },
    { name: "Hill-Rom", slug: "hill-rom", country: "AQSH" },
    { name: "Erbe", slug: "erbe", country: "Germaniya" },
  ];

  const map: Record<string, number> = {};
  for (const b of brandDefs) {
    const rec = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: b,
      update: { name: b.name, country: b.country },
    });
    map[b.name] = rec.id;
  }

  // Update Sony
  await prisma.product.updateMany({
    where: { name: { contains: "Sony" } },
    data: { brandId: map["Sony"], country: "Yaponiya" },
  });

  // Update Olympus
  await prisma.product.updateMany({
    where: { name: { contains: "Olympus" } },
    data: { brandId: map["Olympus"], country: "Yaponiya" },
  });

  // Update Barco
  await prisma.product.updateMany({
    where: { name: { contains: "Barco" } },
    data: { brandId: map["Barco"], country: "Belgiya" },
  });

  // Update Maquet
  await prisma.product.updateMany({
    where: { name: { contains: "Maquet" } },
    data: { brandId: map["Maquet"], country: "Germaniya" },
  });

  // Update Stryker
  await prisma.product.updateMany({
    where: { name: { contains: "Stryker" } },
    data: { brandId: map["Stryker"], country: "AQSH" },
  });

  // Update Progressa
  await prisma.product.updateMany({
    where: { name: { contains: "Progressa" } },
    data: { brandId: map["Hill-Rom"], country: "AQSH" },
  });

  console.log("Brands fixed successfully!");
}

fixBrands().finally(() => prisma.$disconnect());
