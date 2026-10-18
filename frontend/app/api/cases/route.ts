import { proxyAuthenticatedBackend } from "@/lib/backendProxy";

export async function GET() {
  return proxyAuthenticatedBackend("/api/cases", "GET");
}

export async function POST(request: Request) {
  return proxyAuthenticatedBackend("/api/cases", "POST", await request.text());
}
