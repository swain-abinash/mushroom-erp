import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const start = performance.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const dbLatencyMs = Math.round(performance.now() - start);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      dbLatencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: error instanceof Error ? error.message : "Unknown database error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
