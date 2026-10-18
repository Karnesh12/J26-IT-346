import { proxyAuthenticatedBackend } from "@/lib/backendProxy";

type Context = { params: { caseId: string } };

export async function POST(_request: Request, { params }: Context) {
  return proxyAuthenticatedBackend(
    `/api/cases/${encodeURIComponent(params.caseId)}/analyze`,
    "POST",
  );
}
