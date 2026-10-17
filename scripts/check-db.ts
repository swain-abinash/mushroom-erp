import { PrismaClient } from "@prisma/client";

async function check(name: string, url: string) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const products = await p.product.count();
    const categories = await p.category.count();
    const orders = await p.order.count();
    const batches = await p.productionBatch.count();
    console.log(`[${name}] Products: ${products}, Categories: ${categories}, Orders: ${orders}, Batches: ${batches}`);
  } catch (err) {
    console.error(`[${name}] Error:`, err);
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  await check("sporeerp (default)", "mysql://root:root@localhost:3306/sporeerp");
  await check("sporeerp_dev", "mysql://root:root@localhost:3306/sporeerp_dev");
  await check("sporeerp_uat", "mysql://root:root@localhost:3306/sporeerp_uat");
}

main();
