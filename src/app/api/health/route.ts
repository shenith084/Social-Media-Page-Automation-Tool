import { NextResponse } from "next/server";

export async function GET() {
  // Health endpoint — public, used by uptime monitors and load balancers
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
  };

  return NextResponse.json(status, { status: 200 });
}
