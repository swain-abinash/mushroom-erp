import { spawn, execSync } from "child_process";
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

function ensurePortIsFree(targetPort: number) {
  if (process.platform !== "win32") return;
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const lines = output.trim().split("\n");
    for (const line of lines) {
      if (line.includes("LISTENING")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0" && Number(pid) !== process.pid) {
          console.log(`🧹 Port ${targetPort} was in use by PID ${pid}. Freeing port...`);
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
            console.log(`✅ Port ${targetPort} is now free.`);
          } catch {}
        }
      }
    }
  } catch {}
}

if (action === "dev" || action === "start") {
  ensurePortIsFree(Number(port));
}

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

const nextBin = process.platform === "win32"
  ? path.resolve(process.cwd(), "node_modules", ".bin", "next.cmd")
  : path.resolve(process.cwd(), "node_modules", ".bin", "next");

const child = spawn(nextBin, commandArgs.slice(1), {
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
