import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const cookieSecure = process.env.NODE_ENV === "production";

export async function POST(request: Request) {
  try {
    const upstream = await fetch(`${backend}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
    const result = await upstream.json();
    const response = NextResponse.json(result, { status: upstream.status });
    response.cookies.set("bv_temp", "", { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 0 });
    if (upstream.ok && result.success && result.data) {
      if (result.data.temp_token) {
        response.cookies.set("bv_access", "", { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 0 });
        response.cookies.set("bv_refresh", "", { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 0 });
        response.cookies.set("bv_temp", result.data.temp_token, { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 300 });
        delete result.data.temp_token;
        response.headers.set("Content-Type", "application/json");
        return NextResponse.json(result, { status: upstream.status, headers: response.headers });
      }
      if (result.data.access_token) {
        response.cookies.set("bv_access", result.data.access_token, { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 900 });
        if (result.data.refresh_token) response.cookies.set("bv_refresh", result.data.refresh_token, { httpOnly: true, secure: cookieSecure, sameSite: "lax", path: "/", maxAge: 2592000 });
        delete result.data.access_token;
        delete result.data.refresh_token;
        return NextResponse.json(result, { status: upstream.status, headers: response.headers });
      }
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Unable to reach the authentication service.", data: null, errors: null }, { status: 502 });
  }
}
