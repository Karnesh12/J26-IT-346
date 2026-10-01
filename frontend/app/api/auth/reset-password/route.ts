import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Password reset session is invalid or expired.", data: null, errors: null }, { status: 401 });
  }
  try {
    const upstream = await fetch(`${backend}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: await request.text(),
      cache: "no-store",
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to reach the authentication service.", data: null, errors: null }, { status: 502 });
  }
}
