import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { slugify } from "./utils";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@medtex.uz").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  await prisma.user.upsert({
    where: { email },
    create: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
    update: {},
  });

  const cats = [
    "Reanimatsiya va anesteziologiya",
    "Ultratovush diagnostikasi",
    "Jarrohlik",
    "Tibbiy mebel",
    "Operatsion raqamli integratsiya",
  ];

  const catMap: Record<string, number> = {};
  for (const [i, name] of cats.entries()) {
    const slug = slugify(name);
    const c = await prisma.category.upsert({
      where: { slug },
      create: { name, slug, sortOrder: i },
      update: { name, sortOrder: i },
    });
    catMap[name] = c.id;
  }

  const brands: [string, string][] = [
    ["Dirui", "Xitoy"],
    ["Rayto", "Xitoy"],
    ["Chison", "Xitoy"],
    ["Human", "Germaniya"],
    ["Cypress", "Belgiya"],
    ["Mindray", "Xitoy"],
    ["Philips", "Niderlandiya"],
    ["Siemens", "Germaniya"],
    ["Dräger", "Germaniya"],
    ["GE Healthcare", "AQSH"],
    ["Samsung", "Janubiy Koreya"],
    ["Olympus", "Yaponiya"],
    ["Nihon Kohden", "Yaponiya"],
  ];

  const brandMap: Record<string, number> = {};
  for (const [name, country] of brands) {
    const slug = slugify(name);
    const b = await prisma.brand.upsert({
      where: { slug },
      create: { name, slug, country },
      update: { name, country },
    });
    brandMap[name] = b.id;
  }

  interface SeedItem {
    name: string;
    cat: string;
    brand: string;
    country: string;
    sku: string;
    price: number;
    isHit: boolean;
    isNew: boolean;
    desc: string;
    specs: { name: string; value: string }[];
  }

  const items: SeedItem[] = [
    // 1. Reanimatsiya va anesteziologiya
    {
      name: "Sun'iy nafas apparati Dräger Evita V300",
      cat: "Reanimatsiya va anesteziologiya",
      brand: "Dräger",
      country: "Germaniya",
      sku: "DRG-EV-300",
      price: 24700000,
      isHit: true,
      isNew: false,
      desc: "Kattalar va bolalar uchun invaziv va noinvaziv yuqori aniqlikdagi IVL apparati. Smart ventilation rejimlari mavjud.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Dräger (Germaniya)" },
        { name: "Ventilyatsiya turlari", value: "Invaziv, noinvaziv, O2 terapiya" },
        { name: "Ekran", value: "15.4 dyuymli sensorli TFT" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.9" },
      ],
    },
    {
      name: "Bemor monitori Mindray BeneVision N17",
      cat: "Reanimatsiya va anesteziologiya",
      brand: "Mindray",
      country: "Xitoy",
      sku: "MND-BV-N17",
      price: 3800000,
      isHit: true,
      isNew: false,
      desc: "Reanimatsiya va intensiv terapiya uchun ko'p parametrli yuqori texnologiyali bemor monitori. EKG, SpO2, NIBP, harorat.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Mindray" },
        { name: "Ekran", value: "17 dyuymli HD Multi-touch" },
        { name: "Parametrlar", value: "EKG, Resp, SpO2, NIBP, 2-Temp, IBP" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.8" },
      ],
    },
    {
      name: "Anesteziya apparati Dräger Fabius GS",
      cat: "Reanimatsiya va anesteziologiya",
      brand: "Dräger",
      country: "Germaniya",
      sku: "DRG-FB-GS",
      price: 31000000,
      isHit: false,
      isNew: true,
      desc: "Zamonaviy operatsiya xonalari uchun xavfsiz va tejamkor anesteziya tizimi. E-vent elektr porshenli ventilyator.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Dräger" },
        { name: "Texnologiya", value: "E-vent porshenli intellektual ventilyatsiya" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.9" },
      ],
    },
    {
      name: "Defibrillyator-monitor Nihon Kohden TEC-5600",
      cat: "Reanimatsiya va anesteziologiya",
      brand: "Nihon Kohden",
      country: "Yaponiya",
      sku: "NK-TEC-56",
      price: 15200000,
      isHit: true,
      isNew: false,
      desc: "Tezkor bifurkatsiyali defibrillyatsiya va kardiomonitoring tizimi. ActiBiphasic patentlangan texnologiya.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Nihon Kohden (Yaponiya)" },
        { name: "Zaryadlanish vaqti", value: "< 3 soniya (200J)" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.9" },
      ],
    },
    {
      name: "Shpritsli infuzion nasos Mindray BeneFusion SP5",
      cat: "Reanimatsiya va anesteziologiya",
      brand: "Mindray",
      country: "Xitoy",
      sku: "MND-BF-SP5",
      price: 2100000,
      isHit: false,
      isNew: true,
      desc: "Dori vositalarini yuqori aniqlikda kiritish uchun professional shpritsli dozator. O'rnatilgan dori kutubxonasi.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Mindray" },
        { name: "Aniqlik", value: "±2%" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.7" },
      ],
    },

    // 2. Ultratovush diagnostikasi
    {
      name: "Ultratovush apparati Samsung HS70A",
      cat: "Ultratovush diagnostikasi",
      brand: "Samsung",
      country: "Janubiy Koreya",
      sku: "SMS-HS70",
      price: 18400000,
      isHit: false,
      isNew: true,
      desc: "Radiologiya, akusherlik va ginekologiya uchun universal premium sinf ultratovush diagnostika stansiyasi.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Samsung Medison" },
        { name: "Ekran", value: "23 dyuymli LED monitor + 10.1 sensorli ekran" },
        { name: "Texnologiya", value: "S-Vision arxitekturasi, S-Vue datchiklar" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.8" },
      ],
    },
    {
      name: "Ultratovush apparati GE Voluson E10",
      cat: "Ultratovush diagnostikasi",
      brand: "GE Healthcare",
      country: "AQSH",
      sku: "GE-VOL-E10",
      price: 41000000,
      isHit: true,
      isNew: false,
      desc: "Ayollar salomatligi va prenatal diagnostikada jahon standarti. HDlive va Radiance System arxitekturasi.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "GE Healthcare (AQSH)" },
        { name: "Rejimlar", value: "3D/4D HDlive Silhouette, Electronic 4D" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "5.0" },
      ],
    },
    {
      name: "Portativ UZI skaneri Mindray M9",
      cat: "Ultratovush diagnostikasi",
      brand: "Mindray",
      country: "Xitoy",
      sku: "MND-M9-PRT",
      price: 14500000,
      isHit: true,
      isNew: false,
      desc: "Kardiologiya va shoshilinch yordam uchun portativ premium UZI apparati. Single crystal 3T datchiklar.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Mindray" },
        { name: "Vazni", value: "5.8 kg, batareyada 3.5 soat ishlaydi" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.8" },
      ],
    },
    {
      name: "Kardiologik UZI apparati Philips EPIQ 7",
      cat: "Ultratovush diagnostikasi",
      brand: "Philips",
      country: "Niderlandiya",
      sku: "PH-EP-7",
      price: 48000000,
      isHit: true,
      isNew: true,
      desc: "Murakkab kardiologiya va tomir tadqiqotlari uchun nSIGHT arxitekturasi bilan jihozlangan flagman tizim.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Philips (Niderlandiya)" },
        { name: "Texnologiya", value: "nSIGHT Imaging + xMATRIX datchiklar" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Buyurtma asosida" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.9" },
      ],
    },

    // 3. Jarrohlik
    {
      name: "Operatsion stol Maquet Alphamaxx",
      cat: "Jarrohlik",
      brand: "Siemens",
      country: "Germaniya",
      sku: "MQ-ALPHA-M",
      price: 12900000,
      isHit: true,
      isNew: false,
      desc: "Barcha turdagi jarrohlik amaliyotlari uchun ko'p funksiyali elektro-gidravlik universal operatsion stol.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Getinge / Maquet" },
        { name: "Yuk ko'tarish", value: "450 kg gacha" },
        { name: "Kafolat", value: "18 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.8" },
      ],
    },
    {
      name: "Kompyuter tomografi Philips Brilliance CT Big Bore",
      cat: "Jarrohlik",
      brand: "Philips",
      country: "AQSH",
      sku: "PH-BR-CT",
      price: 59000000,
      isHit: true,
      isNew: false,
      desc: "Onkologiya va intervension jarrohlik uchun 85 sm keng gantry apertureli 16-kesimli kompyuter tomografi.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Philips (AQSH)" },
        { name: "Gantry diametri", value: "85 sm" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Buyurtma asosida" },
        { name: "Holati", value: "Ishlatilgan (Refurbished)" },
        { name: "Reyting", value: "4.9" },
      ],
    },
    {
      name: "Jarrohlik ko'lankasiz chirog'i Dräger Polaris 600",
      cat: "Jarrohlik",
      brand: "Dräger",
      country: "Germaniya",
      sku: "DRG-POL-600",
      price: 8900000,
      isHit: false,
      isNew: true,
      desc: "Rang haroratini sozlash imkoniyatiga ega shiftga o'rnatiluvchi yuqori yorug'likli LED jarrohlik chirog'i.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Dräger (Germaniya)" },
        { name: "Yoritish darajasi", value: "160 000 Lux" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.9" },
      ],
    },
    {
      name: "Laparoskopik jarrohlik minorasi Olympus VISERA Elite II",
      cat: "Jarrohlik",
      brand: "Olympus",
      country: "Yaponiya",
      sku: "OLY-VIS-E2",
      price: 37000000,
      isHit: true,
      isNew: true,
      desc: "4K va 3D vizualizatsiyali, NBI tomir kontrastli endoskopik va laparoskopik video-jarrohlik majmuasi.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Olympus (Yaponiya)" },
        { name: "Format", value: "4K UHD, 3D vizualizatsiya va NBI" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "5.0" },
      ],
    },

    // 4. Tibbiy mebel
    {
      name: "Funksional reanimatsiya karavoti Progressa",
      cat: "Tibbiy mebel",
      brand: "Philips",
      country: "AQSH",
      sku: "HIL-PRG-01",
      price: 6200000,
      isHit: false,
      isNew: false,
      desc: "Og'ir bemorlarni parvarishlash, o'pka terapiyasi va erta reabilitatsiya uchun 4-motorli aqlli karavot.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Hill-Rom / Philips" },
        { name: "Xususiyatlari", value: "Integratsiyalangan tarozilar, perkussiya" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.6" },
      ],
    },
    {
      name: "Ko'p funksiyali bemor aravachasi Stryker Prime",
      cat: "Tibbiy mebel",
      brand: "GE Healthcare",
      country: "AQSH",
      sku: "STK-PRM-10",
      price: 4300000,
      isHit: true,
      isNew: true,
      desc: "Shoshilinch tibbiy yordam va reanimatsiyaga bemorlarni qulay tashish uchun gidravlik aravacha (katalka).",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Stryker (AQSH)" },
        { name: "G'ildiraklar", value: "Big Wheel yo'naltiruvchi tizim" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.8" },
      ],
    },
    {
      name: "Tibbiy anesteziolog aravachasi Merivaara",
      cat: "Tibbiy mebel",
      brand: "Mindray",
      country: "Xitoy",
      sku: "MER-CART-04",
      price: 1850000,
      isHit: false,
      isNew: false,
      desc: "Dori-darmonlar va tibbiy asboblarni saqlash uchun zanglamas po'latdan ishlangan qulflanuvchi anesteziolog aravachasi.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Merivaara" },
        { name: "Material", value: "Antibakterial kompozit va zanglamas po'lat" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.7" },
      ],
    },

    // 5. Operatsion raqamli integratsiya
    {
      name: "Operatsiya xonasi integratsiya tizimi Olympus EndoALPHA",
      cat: "Operatsion raqamli integratsiya",
      brand: "Olympus",
      country: "Yaponiya",
      sku: "OLY-EA-4K",
      price: 65000000,
      isHit: true,
      isNew: true,
      desc: "Video oqimlarini boshqarish, telemeditsina, yoritish va asboblarni markazlashgan sensorli konsol orqali boshqarish.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Olympus Medical (Yaponiya)" },
        { name: "Interfeys", value: "Markaziy sensorli boshqaruv devori" },
        { name: "Telemeditsina", value: "Jonli translatsiya va DICOM/PACS arxivi" },
        { name: "Kafolat", value: "36 oy rasmiy kafolat va servis" },
        { name: "Mavjudligi", value: "Buyurtma asosida" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "5.0" },
      ],
    },
    {
      name: "4K Jarrohlik monitori Barco MDSC-8232",
      cat: "Operatsion raqamli integratsiya",
      brand: "Siemens",
      country: "Germaniya",
      sku: "BRC-MDSC-82",
      price: 9800000,
      isHit: true,
      isNew: false,
      desc: "31 dyuymli 4K UHD tibbiy sertifikatlangan optik laminatsiyalangan yorqin jarrohlik monitori. Kechikishsiz tasvir.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Barco Healthcare" },
        { name: "Ruxsat", value: "3840 x 2160 (4K UHD)" },
        { name: "Kafolat", value: "24 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.9" },
      ],
    },
    {
      name: "Tibbiy video yozuvchi tizim Sony HVO-4000MT",
      cat: "Operatsion raqamli integratsiya",
      brand: "Samsung",
      country: "Yaponiya",
      sku: "SNY-HVO-4K",
      price: 7600000,
      isHit: false,
      isNew: true,
      desc: "Operatsiyalarni 4K 2D va 3D formatda uzluksiz yozib olish va kasalxona arxivida saqlash uchun mo'ljallangan rekorder.",
      specs: [
        { name: "Ishlab chiqaruvchi", value: "Sony Medical" },
        { name: "Ichki xotira", value: "4TB tibbiy RAID drayver" },
        { name: "Kafolat", value: "12 oy rasmiy kafolat" },
        { name: "Mavjudligi", value: "Omborda mavjud" },
        { name: "Holati", value: "Yangi" },
        { name: "Reyting", value: "4.8" },
      ],
    },
  ];

  for (const item of items) {
    const slug = slugify(item.name);
    const prod = await prisma.product.upsert({
      where: { slug },
      create: {
        name: item.name,
        slug,
        sku: item.sku,
        country: item.country,
        priceFrom: item.price,
        isHit: item.isHit,
        isNew: item.isNew,
        isActive: true,
        categoryId: catMap[item.cat],
        brandId: brandMap[item.brand],
        description: item.desc,
        specs: item.specs,
      },
      update: {
        name: item.name,
        sku: item.sku,
        country: item.country,
        priceFrom: item.price,
        isHit: item.isHit,
        isNew: item.isNew,
        categoryId: catMap[item.cat],
        brandId: brandMap[item.brand],
        description: item.desc,
        specs: item.specs,
      },
    });

    const imgMap: Record<string, string> = {
      "Reanimatsiya va anesteziologiya": "/uploads/products/medical-icu.jpg",
      "Ultratovush diagnostikasi": "/uploads/products/medical-diag.jpg",
      "Jarrohlik": "/uploads/products/medical-surgery.jpg",
      "Tibbiy mebel": "/uploads/products/medical-bed.jpg",
      "Operatsion raqamli integratsiya": "/uploads/products/medical-recorder.jpg",
    };
    const imgUrl = imgMap[item.cat] || "/uploads/products/medical-diag.jpg";
    const existingImg = await prisma.productImage.findFirst({ where: { productId: prod.id } });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: prod.id,
          url: imgUrl,
          thumbUrl: imgUrl,
          sortOrder: 0,
        },
      });
    }
  }

  console.log(`Katalog muvaffaqiyatli to'ldirildi: ${items.length} ta tibbiy uskuna mavjud.`);
}

main().finally(() => prisma.$disconnect());
