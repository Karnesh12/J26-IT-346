import { proxyAuthenticatedBackend } from "@/lib/backendProxy";

type Context = { params: { caseId: string; findingId: string } };

export async function PATCH(request: Request, { params }: Context) {
  return proxyAuthenticatedBackend(
    `/api/cases/${encodeURIComponent(params.caseId)}/findings/${encodeURIComponent(params.findingId)}`,
    "PATCH",
    await request.text(),
  );
}
