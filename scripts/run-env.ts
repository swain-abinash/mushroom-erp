import { spawn } from "child_process";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const targetEnv = process.argv[2] || "dev";
const action = process.argv[3] || "dev"; // dev | build | start

const envFiles: Record<string, string> = {
  dev: ".env.development",
  uat: ".env.uat",
  prod: ".env.production",
};

const defaultPorts: Record<string, number> = {
  dev: 3000,
  uat: 3001,
  prod: 3000,
};

const envFileName = envFiles[targetEnv] || ".env";
const envPath = path.resolve(process.cwd(), envFileName);

if (!fs.existsSync(envPath)) {
  console.error(`❌ Env file not found: ${envFileName}`);
  process.exit(1);
}

const parsedEnv = dotenv.parse(fs.readFileSync(envPath));
const port = process.env.PORT || defaultPorts[targetEnv] || 3000;

console.log("=========================================================");
console.log(`🍄 SPORE ERP — LAUNCHING [${targetEnv.toUpperCase()}] MODE`);
console.log(`📁 Config File : ${envFileName}`);
console.log(`🌐 Target Port : ${port}`);
console.log(`🗄️  Database    : ${parsedEnv.DATABASE_URL?.split("@")[1] || "configured"}`);
console.log("=========================================================\n");

let commandArgs: string[] = [];
if (action === "dev") {
  commandArgs = ["next", "dev", "-p", String(port)];
} else if (action === "build") {
  commandArgs = ["next", "build"];
} else if (action === "start") {
  commandArgs = ["next", "start", "-p", String(port)];
} else {
  commandArgs = [action, ...process.argv.slice(4)];
}

const child = spawn("npx", commandArgs, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    ...parsedEnv,
    PORT: String(port),
  },
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
