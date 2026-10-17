import { PrismaClient, ProductStatus, UnitType, CustomerType, ItemCategory, InventoryTxType } from "@prisma/client";

const SAMPLE_PRODUCTS = [
  {
    name: "Fresh Blue Oyster Mushroom",
    slug: "blue-oyster-mushroom",
    sku: "MUSH-OYS-BLU-001",
    variety: "Blue Oyster",
    categorySlug: "fresh-mushrooms",
    shortDescription: "Tender, velvety caps harvested fresh daily at dawn.",
    description: "Premium organic Blue Oyster mushrooms (Pleurotus ostreatus) grown on pasteurized straw substrate under carefully controlled micro-climate conditions. Exceptional umami flavor, perfect for stir-fries, soups, pastas, and curries.",
    nutritionInfo: "High in protein (3.3g/100g), dietary fiber, Vitamin D, Vitamin B-complex, potassium, and antioxidants. Zero cholesterol.",
    storageTips: "Store unwashed in a paper bag in the main refrigerator compartment (3-5°C). Consumed best within 3-4 days of harvest.",
    unitType: UnitType.KG,
    retailPrice: 220,
    minOrderQty: 1,
    shelfLifeDays: 3,
    isFeatured: true,
    allowBackorder: false,
    status: ProductStatus.PUBLISHED,
    stock: 45,
    b2bPrice: 190,
    imageUrl: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Milky White Mushroom (Calocybe indica)",
    slug: "milky-mushroom",
    sku: "MUSH-MLK-001",
    variety: "Milky Mushroom",
    categorySlug: "fresh-mushrooms",
    shortDescription: "Large, firm, snow-white caps with extended shelf life.",
    description: "Farm-fresh Milky Mushrooms with meaty texture that holds up beautifully in Indian curries, gravies, and tandoori preparations. Naturally robust with longer room-temperature shelf life.",
    nutritionInfo: "Rich in bioactive polysaccharides, minerals, phosphorus, and essential amino acids. Low calorie and diabetic friendly.",
    storageTips: "Refrigerate in breathable packaging. Shelf life of up to 6 days under refrigeration.",
    unitType: UnitType.KG,
    retailPrice: 240,
    minOrderQty: 1,
    shelfLifeDays: 5,
    isFeatured: true,
    allowBackorder: false,
    status: ProductStatus.PUBLISHED,
    stock: 35,
    b2bPrice: 205,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Fresh White Button Mushrooms",
    slug: "white-button-mushroom",
    sku: "MUSH-BTN-001",
    variety: "White Button",
    categorySlug: "fresh-mushrooms",
    shortDescription: "Crisp, closed-cup button mushrooms for everyday cooking.",
    description: "Hand-picked closed cup button mushrooms (Agaricus bisporus). Mild earthy flavor and pleasing crunch, ideal for pizzas, salads, omelets, and mushroom butter masala.",
    nutritionInfo: "Good source of selenium, copper, niacin, and riboflavin. Supports immunity and heart health.",
    storageTips: "Keep dry in original perforated punnet in vegetable crisper.",
    unitType: UnitType.GRAMS_200,
    retailPrice: 65,
    minOrderQty: 1,
    shelfLifeDays: 4,
    isFeatured: true,
    allowBackorder: false,
    status: ProductStatus.PUBLISHED,
    stock: 80,
    b2bPrice: 50,
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Fresh Exotic Shiitake Mushrooms",
    slug: "shiitake-mushroom",
    sku: "MUSH-SHI-001",
    variety: "Shiitake",
    categorySlug: "fresh-mushrooms",
    shortDescription: "Intensely savory, rich aromatic gourmet caps.",
    description: "Grown on sterilized hardwood sawdust blocks. Deep savory woodsy flavor packed with natural lentinan and guanylate for extraordinary culinary depth.",
    nutritionInfo: "Natural source of lentinan, copper, zinc, and beta-glucans. Powerful immune booster.",
    storageTips: "Wrap gently in a dry paper towel inside a ventilated container at 2-4°C.",
    unitType: UnitType.KG,
    retailPrice: 480,
    minOrderQty: 1,
    shelfLifeDays: 4,
    isFeatured: true,
    allowBackorder: false,
    status: ProductStatus.PUBLISHED,
    stock: 20,
    b2bPrice: 420,
    imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Sun-Dried Oyster Mushrooms (Pack of 100g)",
    slug: "dry-oyster-mushrooms",
    sku: "MUSH-DRY-OYS-100G",
    variety: "Oyster",
    categorySlug: "dry-mushrooms",
    shortDescription: "Concentrated umami aroma with 12-month pantry shelf life.",
    description: "Dehydrated at low temperatures to preserve delicate amino acids and concentrated savory flavor. Rehydrate in warm water for 15 minutes before adding to risottos, gravies, or broths.",
    nutritionInfo: "Dense source of plant protein, dietary fiber, and ergothioneine antioxidant.",
    storageTips: "Store in an airtight jar in a cool, dry pantry away from direct sunlight.",
    unitType: UnitType.PACK,
    retailPrice: 180,
    minOrderQty: 1,
    shelfLifeDays: 365,
    isFeatured: false,
    allowBackorder: true,
    status: ProductStatus.PUBLISHED,
    stock: 50,
    b2bPrice: 150,
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Ready-to-Fruit Home Grow Kit (Oyster)",
    slug: "oyster-grow-kit",
    sku: "KIT-OYS-001",
    variety: "Blue Oyster",
    categorySlug: "grow-kits",
    shortDescription: "Spray water daily and harvest your own fresh mushrooms in 10 days!",
    description: "Fully colonized, living oyster mushroom substrate block with a fine-mist spray bottle and illustrated growing handbook. Guaranteed 2-3 flushes of delicious fresh mushrooms on your kitchen counter.",
    nutritionInfo: "Fun educational family kit, 100% natural and pesticide-free.",
    storageTips: "Open the box immediately upon arrival and place in indirect ambient daylight.",
    unitType: UnitType.PACK,
    retailPrice: 299,
    minOrderQty: 1,
    shelfLifeDays: 30,
    isFeatured: true,
    allowBackorder: false,
    status: ProductStatus.PUBLISHED,
    stock: 30,
    b2bPrice: 250,
    imageUrl: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80",
  },
];

export async function seedCatalog(dbUrl: string, dbName: string) {
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  console.log(`\n🌱 Seeding rich catalog into database: ${dbName}...`);

  try {
    // 1. Ensure Categories Exist
    const categories = await prisma.category.findMany();
    const catMap = new Map(categories.map((c) => [c.slug, c.id]));

    // Find founder admin for audit
    const admin = await prisma.user.findFirst({
      where: { email: "admin@sporeerp.local" },
    });

    for (const item of SAMPLE_PRODUCTS) {
      let categoryId = catMap.get(item.categorySlug);
      if (!categoryId) {
        // Fallback to first available category
        const first = categories[0];
        if (!first) throw new Error("No categories found in database");
        categoryId = first.id;
      }

      const existing = await prisma.product.findUnique({
        where: { slug: item.slug },
      });

      let product;
      if (!existing) {
        product = await prisma.product.create({
          data: {
            name: item.name,
            slug: item.slug,
            sku: item.sku,
            variety: item.variety,
            shortDescription: item.shortDescription,
            description: item.description,
            nutritionInfo: item.nutritionInfo,
            storageTips: item.storageTips,
            unitType: item.unitType,
            retailPrice: item.retailPrice,
            minOrderQty: item.minOrderQty,
            shelfLifeDays: item.shelfLifeDays,
            isFeatured: item.isFeatured,
            allowBackorder: item.allowBackorder,
            status: item.status,
            categoryId,
            images: {
              create: [
                {
                  imageUrl: item.imageUrl,
                  altText: item.name,
                  isPrimary: true,
                  displayOrder: 0,
                },
              ],
            },
            pricingTiers: {
              create: [
                {
                  customerType: CustomerType.B2B_RESTAURANT,
                  price: item.b2bPrice,
                  minQty: 5,
                },
                {
                  customerType: CustomerType.WHOLESALE,
                  price: Math.round(item.b2bPrice * 0.9),
                  minQty: 20,
                },
              ],
            },
          },
        });
        console.log(`  ✨ Created product: ${item.name} (${item.sku})`);
      } else {
        product = existing;
        console.log(`  ℹ️ Product already exists: ${item.name}`);
      }

      // Ensure linked InventoryItem exists with healthy stock
      const existingInv = await prisma.inventoryItem.findFirst({
        where: { productId: product.id },
      });

      if (!existingInv) {
        const inv = await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            itemName: item.name,
            itemCategory: ItemCategory.FINISHED_PRODUCT,
            availableStock: item.stock,
            reservedStock: 0,
            unit: item.unitType,
            reorderThreshold: 5,
          },
        });

        await prisma.inventoryTransaction.create({
          data: {
            inventoryItemId: inv.id,
            transactionType: InventoryTxType.MANUAL_ADJUSTMENT,
            quantity: item.stock,
            balanceAfter: item.stock,
            reason: "Initial catalog stock seeding",
            performedBy: admin?.id,
          },
        });
        console.log(`  📦 Initialized Inventory: ${item.stock} ${item.unitType}`);
      } else if (Number(existingInv.availableStock) === 0) {
        await prisma.inventoryItem.update({
          where: { id: existingInv.id },
          data: { availableStock: item.stock },
        });
        console.log(`  📦 Restocked Inventory: ${item.stock} ${item.unitType}`);
      }
    }

    console.log(`✅ Catalog seeded successfully for ${dbName}!`);
  } catch (err) {
    console.error(`❌ Failed to seed catalog for ${dbName}:`, err);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await seedCatalog("mysql://root:root@localhost:3306/sporeerp_dev", "sporeerp_dev");
  await seedCatalog("mysql://root:root@localhost:3306/sporeerp_uat", "sporeerp_uat");
  await seedCatalog("mysql://root:root@localhost:3306/sporeerp", "sporeerp (default)");
}

if (require.main === module) {
  main();
}
