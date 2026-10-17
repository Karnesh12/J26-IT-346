import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const cookieSecure = process.env.NODE_ENV === "production";

export async function POST() {
  const tempToken = cookies().get("bv_temp")?.value;
  if (!tempToken) return NextResponse.json({ success: false, message: "Your sign-in session expired. Please sign in again.", data: null, errors: null }, { status: 401 });
  try {
    const upstream = await fetch(`${backend}/api/auth/resend-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tempToken}` },
      cache: "no-store",
    });
    const result = await upstream.json();
    const response = NextResponse.json(result, { status: upstream.status });
    if (upstream.ok && result.success && result.data?.temp_token) {
      response.cookies.set("bv_temp", result.data.temp_token, { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 300 });
      delete result.data.temp_token;
      return NextResponse.json(result, { status: upstream.status, headers: response.headers });
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Unable to reach the authentication service.", data: null, errors: null }, { status: 502 });
  }
}
