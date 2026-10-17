import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const cookieSecure = process.env.NODE_ENV === "production";

export async function POST() {
  const refreshToken = cookies().get("bv_refresh")?.value;
  if (!refreshToken) return NextResponse.json({ success: false, message: "Your session has expired.", data: null, errors: null }, { status: 401 });
  try {
    const upstream = await fetch(`${backend}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: "no-store",
    });
    const result = await upstream.json();
    const response = NextResponse.json(result, { status: upstream.status });
    if (upstream.ok && result.success && result.data?.access_token && result.data?.refresh_token) {
      response.cookies.set("bv_access", result.data.access_token, { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 900 });
      response.cookies.set("bv_refresh", result.data.refresh_token, { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 2592000 });
      delete result.data.access_token;
      delete result.data.refresh_token;
      return NextResponse.json(result, { status: upstream.status, headers: response.headers });
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Unable to reach the authentication service.", data: null, errors: null }, { status: 502 });
  }
}
