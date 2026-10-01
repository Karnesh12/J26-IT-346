import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
  const accessToken = cookies().get("bv_access")?.value;
  if (!accessToken) return NextResponse.json({ success: false, message: "Authentication required.", data: null, errors: null }, { status: 401 });
  try {
    const upstream = await fetch(`${backend}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to reach the authentication service.", data: null, errors: null }, { status: 502 });
  }
}
