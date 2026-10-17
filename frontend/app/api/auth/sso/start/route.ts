import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
  try {
    const upstream = await fetch(`${backend}/api/auth/sso/start`, { cache: "no-store" });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to reach the authentication service.", data: null, errors: null }, { status: 502 });
  }
}
