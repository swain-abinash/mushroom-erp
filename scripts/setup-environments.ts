import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Initialize with current .env to access MariaDB root
dotenv.config();

const rootPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:root@localhost:3306/sporeerp",
    },
  },
});

async function main() {
  const targetEnv = process.argv[2] || "all";
  console.log("=========================================================");
  console.log(`🍄 SPORE ERP — ENVIRONMENT SETUP TOOL (Target: ${targetEnv})`);
  console.log("=========================================================\n");

  const envs = [
    { name: "dev", dbName: "sporeerp_dev", envFile: ".env.development" },
    { name: "uat", dbName: "sporeerp_uat", envFile: ".env.uat" },
    { name: "prod", dbName: "sporeerp_prod", envFile: ".env.production" },
  ];

  try {
    // 1. Create MariaDB databases if they don't exist
    for (const env of envs) {
      if (targetEnv !== "all" && targetEnv !== env.name) continue;

      console.log(`[1/3] Creating MariaDB Database: \`${env.dbName}\`...`);
      await rootPrisma.$executeRawUnsafe(
        `CREATE DATABASE IF NOT EXISTS \`${env.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      console.log(`  ✅ Database \`${env.dbName}\` is ready.`);
    }

    // 2. Run Prisma migrations and seed for each env
    for (const env of envs) {
      if (targetEnv !== "all" && targetEnv !== env.name) continue;

      const fullEnvPath = path.resolve(process.cwd(), env.envFile);
      if (!fs.existsSync(fullEnvPath)) {
        console.warn(`  ⚠️ Env file ${env.envFile} not found, skipping migrations.`);
        continue;
      }

      console.log(`\n[2/3] Applying Prisma Migrations to \`${env.dbName}\`...`);
      const envConfig = dotenv.parse(fs.readFileSync(fullEnvPath));
      const dbUrl = envConfig.DATABASE_URL;

      if (!dbUrl) {
        console.warn(`  ⚠️ DATABASE_URL not found in ${env.envFile}`);
        continue;
      }

      // Run prisma migrate deploy with the target DATABASE_URL
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
      });
      console.log(`  ✅ Migrations applied cleanly to \`${env.dbName}\`.`);

      // 3. Run seeds for DEV and UAT (Prod should be seeded carefully or on first run)
      if (env.name === "dev" || env.name === "uat") {
        console.log(`\n[3/3] Seeding Default Roles, Permissions & Founder Admin into \`${env.dbName}\`...`);
        execSync("npx tsx prisma/seed.ts", {
          stdio: "inherit",
          env: {
            ...process.env,
            DATABASE_URL: dbUrl,
          },
        });
        console.log(`  ✅ Seeded successfully into \`${env.dbName}\`.`);
      } else {
        console.log(`\n[3/3] Production database \`${env.dbName}\` schema is migrated. Seeding omitted to preserve production data hygiene.`);
        console.log(`  💡 Run 'npm run seed:prod' if you wish to seed initial Founder Admin into Production.`);
      }
    }

    console.log("\n=========================================================");
    console.log("🎉 ALL ENVIRONMENT DATABASES AND SCHEMAS SUCCESSFULLY INITIALIZED!");
    console.log("=========================================================");
  } catch (err) {
    console.error("❌ Environment setup failed:", err);
    process.exit(1);
  } finally {
    await rootPrisma.$disconnect();
  }
}

main();
