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

  await prisma.category.upsert({
    where: { slug: "fresh-mushrooms" },
    update: {},
    create: {
      name: "Fresh Mushrooms",
      slug: "fresh-mushrooms",
      description: "Oyster, Milky, and Paddy Straw varieties harvested daily.",
    },
  });

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
