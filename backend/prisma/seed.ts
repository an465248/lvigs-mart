import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "mobiles" },
      update: {},
      create: { slug: "mobiles", name: "Mobiles", icon: "Smartphone", order: 1, featured: true },
    }),
    prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: { slug: "electronics", name: "Electronics", icon: "Cpu", order: 2, featured: true },
    }),
    prisma.category.upsert({
      where: { slug: "fashion" },
      update: {},
      create: { slug: "fashion", name: "Fashion", icon: "Shirt", order: 3, featured: true },
    }),
    prisma.category.upsert({
      where: { slug: "grocery" },
      update: {},
      create: { slug: "grocery", name: "Grocery", icon: "Apple", order: 4, featured: true },
    }),
    prisma.category.upsert({
      where: { slug: "beauty" },
      update: {},
      create: { slug: "beauty", name: "Beauty", icon: "Sparkles", order: 5, featured: true },
    }),
    prisma.category.upsert({
      where: { slug: "home-furniture" },
      update: {},
      create: { slug: "home-furniture", name: "Home & Furniture", icon: "Sofa", order: 6 },
    }),
    prisma.category.upsert({
      where: { slug: "appliances" },
      update: {},
      create: { slug: "appliances", name: "Appliances", icon: "WashingMachine", order: 7 },
    }),
    prisma.category.upsert({
      where: { slug: "sports" },
      update: {},
      create: { slug: "sports", name: "Sports", icon: "Dumbbell", order: 8 },
    }),
    prisma.category.upsert({
      where: { slug: "books" },
      update: {},
      create: { slug: "books", name: "Books", icon: "Book", order: 9 },
    }),
    prisma.category.upsert({
      where: { slug: "toys" },
      update: {},
      create: { slug: "toys", name: "Toys", icon: "Blocks", order: 10 },
    }),
    prisma.category.upsert({
      where: { slug: "automotive" },
      update: {},
      create: { slug: "automotive", name: "Automotive", icon: "Car", order: 11 },
    }),
    prisma.category.upsert({
      where: { slug: "accessories" },
      update: {},
      create: { slug: "accessories", name: "Accessories", icon: "Watch", order: 12 },
    }),
  ]);

  const catMobiles = categories[0];
  const catElectronics = categories[1];
  const catFashion = categories[2];
  const catGrocery = categories[3];
  const catBeauty = categories[4];

  // Subcategories
  await Promise.all([
    prisma.category.upsert({ where: { slug: "smartphones" }, update: {}, create: { slug: "smartphones", name: "Smartphones", parentId: catMobiles.id, order: 1 } }),
    prisma.category.upsert({ where: { slug: "mobile-accessories" }, update: {}, create: { slug: "mobile-accessories", name: "Mobile Accessories", parentId: catMobiles.id, order: 2 } }),
    prisma.category.upsert({ where: { slug: "tablets" }, update: {}, create: { slug: "tablets", name: "Tablets", parentId: catMobiles.id, order: 3 } }),
    prisma.category.upsert({ where: { slug: "wearables" }, update: {}, create: { slug: "wearables", name: "Smart Wearables", parentId: catMobiles.id, order: 4 } }),
    prisma.category.upsert({ where: { slug: "televisions" }, update: {}, create: { slug: "televisions", name: "Televisions", parentId: catElectronics.id, order: 1 } }),
    prisma.category.upsert({ where: { slug: "audio" }, update: {}, create: { slug: "audio", name: "Audio & Headphones", parentId: catElectronics.id, order: 2 } }),
    prisma.category.upsert({ where: { slug: "cameras" }, update: {}, create: { slug: "cameras", name: "Cameras", parentId: catElectronics.id, order: 3 } }),
    prisma.category.upsert({ where: { slug: "laptops" }, update: {}, create: { slug: "laptops", name: "Laptops", parentId: catElectronics.id, order: 4 } }),
    prisma.category.upsert({ where: { slug: "mens-fashion" }, update: {}, create: { slug: "mens-fashion", name: "Men", parentId: catFashion.id, order: 1 } }),
    prisma.category.upsert({ where: { slug: "womens-fashion" }, update: {}, create: { slug: "womens-fashion", name: "Women", parentId: catFashion.id, order: 2 } }),
    prisma.category.upsert({ where: { slug: "kids-fashion" }, update: {}, create: { slug: "kids-fashion", name: "Kids", parentId: catFashion.id, order: 3 } }),
    prisma.category.upsert({ where: { slug: "footwear" }, update: {}, create: { slug: "footwear", name: "Footwear", parentId: catFashion.id, order: 4 } }),
  ]);

  // Brands
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { slug: "novatech" }, update: {}, create: { slug: "novatech", name: "NovaTech" } }),
    prisma.brand.upsert({ where: { slug: "aurora" }, update: {}, create: { slug: "aurora", name: "Aurora" } }),
    prisma.brand.upsert({ where: { slug: "voltrix" }, update: {}, create: { slug: "voltrix", name: "Voltrix" } }),
    prisma.brand.upsert({ where: { slug: "lumen" }, update: {}, create: { slug: "lumen", name: "Lumen" } }),
    prisma.brand.upsert({ where: { slug: "vega" }, update: {}, create: { slug: "vega", name: "Vega" } }),
    prisma.brand.upsert({ where: { slug: "saffronwear" }, update: {}, create: { slug: "saffronwear", name: "SaffronWear" } }),
    prisma.brand.upsert({ where: { slug: "freshkart" }, update: {}, create: { slug: "freshkart", name: "FreshKart" } }),
    prisma.brand.upsert({ where: { slug: "zenith" }, update: {}, create: { slug: "zenith", name: "Zenith" } }),
    prisma.brand.upsert({ where: { slug: "vela" }, update: {}, create: { slug: "vela", name: "Vela" } }),
    prisma.brand.upsert({ where: { slug: "roshni" }, update: {}, create: { slug: "roshni", name: "Roshni" } }),
    prisma.brand.upsert({ where: { slug: "nirmaan" }, update: {}, create: { slug: "nirmaan", name: "Nirmaan" } }),
    prisma.brand.upsert({ where: { slug: "dhruv" }, update: {}, create: { slug: "dhruv", name: "Dhruv" } }),
  ]);

  // Coupons
  await Promise.all([
    prisma.coupon.upsert({
      where: { code: "WELCOME10" },
      update: {},
      create: { code: "WELCOME10", description: "10% off up to ₹500 on first order", type: "PERCENT", value: 10, maxDiscount: 500, minOrder: 999, scope: "ALL", expiresAt: new Date(Date.now() + 30 * 86400_000), firstOrderOnly: true },
    }),
    prisma.coupon.upsert({
      where: { code: "LVIGS200" },
      update: {},
      create: { code: "LVIGS200", description: "Flat ₹200 off on orders above ₹1499", type: "FLAT", value: 200, minOrder: 1499, scope: "ALL", expiresAt: new Date(Date.now() + 30 * 86400_000) },
    }),
    prisma.coupon.upsert({
      where: { code: "FESTIVE25" },
      update: {},
      create: { code: "FESTIVE25", description: "25% off on Electronics up to ₹3000", type: "PERCENT", value: 25, maxDiscount: 3000, minOrder: 9999, scope: "CATEGORY", scopeIds: [catElectronics.id, catMobiles.id], expiresAt: new Date(Date.now() + 30 * 86400_000) },
    }),
  ]);

  // Default seller user + seller
  const sellerUser = await prisma.user.upsert({
    where: { id: "seller-system-user" },
    update: {},
    create: {
      id: "seller-system-user",
      name: "LVIGS Mart Admin",
      role: "SELLER",
      email: "seller@lvigs.in",
      isActive: true,
    },
  });
  const seller = await prisma.seller.upsert({
    where: { id: "system" },
    update: {},
    create: {
      id: "system",
      userId: sellerUser.id,
      storeName: "LVIGS Mart",
      slug: "lvigs-mart",
      status: "ACTIVE",
    },
  });

  // Sample products
  const brandNova = brands[0];
  const brandAurora = brands[1];
  const brandVoltrix = brands[2];
  const brandLumen = brands[3];

  const products = [
    { slug: "novaphone-x9-pro", title: "NovaPhone X9 Pro 5G (256 GB)", brandId: brandNova.id, categoryId: catMobiles.id, mrp: 54999, price: 34999, rating: 4.6, ratingCount: 8432, reviewCount: 5612, stock: 100, isBestseller: true, fastDelivery: true, description: "Flagship-grade performance with NovaCore G3 chip, 6.7\" AMOLED display, 50 MP triple camera.", tags: ["trending", "deal"], images: ["https://picsum.photos/seed/lvigs-101/800/800", "https://picsum.photos/seed/lvigs-102/800/800"] },
    { slug: "aurora-buds-pro", title: "Aurora Buds Pro with ANC", brandId: brandAurora.id, categoryId: catMobiles.id, mrp: 6999, price: 2999, rating: 4.4, ratingCount: 4102, reviewCount: 2890, stock: 200, fastDelivery: true, description: "Active noise cancellation, 38h playback, IPX5 and Hi-Res LDAC audio.", tags: ["trending"], images: ["https://picsum.photos/seed/lvigs-201/800/800"] },
    { slug: "voltrix-tv-55qled", title: "Voltrix 55\" QLED 4K Smart TV", brandId: brandVoltrix.id, categoryId: catElectronics.id, mrp: 79999, price: 39999, rating: 4.5, ratingCount: 1980, reviewCount: 1100, stock: 50, description: "QLED quantum dot panel with Dolby Vision IQ, 60W speakers.", tags: ["deal"], images: ["https://picsum.photos/seed/lvigs-301/800/800"] },
    { slug: "lumen-laptop-air-14", title: "Lumen Air 14 Laptop (i7, 16GB, 512GB)", brandId: brandLumen.id, categoryId: catElectronics.id, mrp: 89999, price: 62999, rating: 4.7, ratingCount: 1108, reviewCount: 820, stock: 30, isNewArrival: true, description: "Ultralight 1.1 kg chassis, 14\" 2.8K OLED, 12th Gen Intel Core i7.", tags: ["new"], images: ["https://picsum.photos/seed/lvigs-401/800/800"] },
    { slug: "freshkart-atta-10kg", title: "FreshKart Chakki Atta 10 kg", brandId: brands[6].id, categoryId: catGrocery.id, mrp: 599, price: 399, rating: 4.4, ratingCount: 8200, reviewCount: 6100, stock: 500, fastDelivery: true, description: "100% whole wheat atta ground in traditional chakki.", tags: ["grocery", "daily-need"], images: ["https://picsum.photos/seed/lvigs-701/800/800"] },
  ];

  for (const p of products) {
    const { images, ...productData } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...productData, sellerId: "system", freeDelivery: true, deliveryCharge: 0 },
    });
    const created = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (created && images?.length) {
      await prisma.productImage.createMany({
        data: images.map((url: string, idx: number) => ({ productId: created.id, url, order: idx })),
        skipDuplicates: true,
      });
    }
  }

  // Banners
  await Promise.all([
    prisma.banner.upsert({ where: { id: "bn-1" }, update: {}, create: { id: "bn-1", title: "Festive Electronics Sale", subtitle: "Up to 60% off on smartphones & laptops", image: "https://picsum.photos/seed/lvigs-bn1/1200/480", bg: "from-brand-700 to-brand-950", fg: "text-white", link: "/category/electronics", ctaLabel: "Shop now", ctaLink: "/category/electronics" } }),
    prisma.banner.upsert({ where: { id: "bn-2" }, update: {}, create: { id: "bn-2", title: "Fashion Week Special", subtitle: "Buy 2 Get 1 Free on selected styles", image: "https://picsum.photos/seed/lvigs-bn2/1200/480", bg: "from-accent-500 to-accent-700", fg: "text-white", link: "/category/fashion", ctaLabel: "Explore fashion", ctaLink: "/category/fashion" } }),
  ]);

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });