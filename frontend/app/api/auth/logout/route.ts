import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(request: Request) {
  const token = cookies().get("bv_access")?.value;
  const refreshToken = cookies().get("bv_refresh")?.value;
  if (token) {
    try {
      await fetch(`${backend}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Clear local credentials even if the API is unavailable.
    }
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  for (const name of ["bv_access", "bv_refresh", "bv_temp"]) response.cookies.set(name, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
