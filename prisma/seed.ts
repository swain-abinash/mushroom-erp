import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  moduleOf,
  PERMISSION_DESCRIPTIONS,
  PERMISSIONS,
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS,
  ROLES,
  type RoleName,
} from "../lib/auth/permissions";

const prisma = new PrismaClient();

async function seedRbac() {
  for (const code of Object.values(PERMISSIONS)) {
    const data = { module: moduleOf(code), description: PERMISSION_DESCRIPTIONS[code] };
    await prisma.permission.upsert({ where: { code }, update: data, create: { code, ...data } });
  }

  const permissionIds = new Map(
    (await prisma.permission.findMany({ select: { id: true, code: true } })).map((p) => [
      p.code,
      p.id,
    ]),
  );

  for (const [name, definition] of Object.entries(ROLE_DEFINITIONS) as [
    RoleName,
    (typeof ROLE_DEFINITIONS)[RoleName],
  ][]) {
    const role = await prisma.role.upsert({
      where: { name },
      update: definition,
      create: { name, ...definition },
    });

    // Resync the role's grants with the matrix so that re-running the seed applies matrix edits.
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: ROLE_PERMISSIONS[name].map((code) => ({
          roleId: role.id,
          permissionId: permissionIds.get(code)!,
        })),
      }),
    ]);
  }

  console.log(
    `Seeded ${permissionIds.size} permissions and ${Object.keys(ROLE_DEFINITIONS).length} roles.`,
  );
}

async function seedFounderAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping founder admin account.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.log(`Founder admin ${email} already exists — leaving password unchanged.`);
    return;
  }

  await prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "Founder Admin",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      employee: {
        create: { designation: "Co-Founder", department: "Management", joiningDate: new Date() },
      },
      userRoles: { create: { role: { connect: { name: ROLES.FOUNDER_ADMIN } } } },
    },
  });
  console.log(`Created founder admin ${email}.`);
}

// Base taxonomy from DOC-00 Sprint 3 (Fresh / Processed / Supplies). Existing rows are left as-is.
const CATEGORY_TREE = [
  {
    name: "Fresh Mushrooms",
    slug: "fresh-mushrooms",
    description: "Oyster, Milky, and Paddy Straw varieties harvested daily.",
    children: [],
  },
  {
    name: "Processed Products",
    slug: "processed-products",
    description: "Dried mushrooms and mushroom powders with a long shelf life.",
    children: [
      {
        name: "Dry Mushrooms",
        slug: "dry-mushrooms",
        description: "Sun- and air-dried mushrooms.",
      },
      {
        name: "Mushroom Powders",
        slug: "mushroom-powders",
        description: "Fine powders for soups and supplements.",
      },
    ],
  },
  {
    name: "Cultivation Supplies",
    slug: "cultivation-supplies",
    description: "Everything to grow mushrooms at home or on the farm.",
    children: [
      { name: "Spawn", slug: "spawn", description: "Grain spawn for oyster and milky mushrooms." },
      { name: "Grow Kits", slug: "grow-kits", description: "Ready-to-fruit home grow kits." },
    ],
  },
];

async function seedCategories() {
  for (const { children, ...parent } of CATEGORY_TREE) {
    const { id: parentId } = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: {},
      create: parent,
    });
    for (const child of children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: { ...child, parentId },
      });
    }
  }
}

async function main() {
  await prisma.businessSetting.upsert({
    where: { key: "store_name" },
    update: {},
    create: {
      key: "store_name",
      value: "SporeERP",
      description: "Display name used across invoices and the storefront.",
    },
  });

  // Storefront contact details shown in the footer/FAQ; left empty (hidden) until the founder fills them in.
  const storeSettings: Array<[string, string]> = [
    ["contact_phone", "Customer support phone number (footer)."],
    ["contact_whatsapp", "WhatsApp number with country code, e.g. +91 98765 43210 (footer)."],
    ["contact_email", "Customer support email (footer)."],
    ["contact_address", "Farm / pickup address (footer, multi-line)."],
    ["service_area", "Delivery coverage, e.g. 'Bhubaneswar and Cuttack' (FAQ)."],
  ];
  for (const [key, description] of storeSettings) {
    await prisma.businessSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: "", description },
    });
  }

  await seedCategories();
  await seedRbac();
  await seedFounderAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
