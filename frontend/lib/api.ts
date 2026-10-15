export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: Record<string, string[]> | null;
};

export type LoginData = {
  requires_verification?: boolean;
  development_otp?: string;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError("Unable to reach the authentication service. Please try again.", 0);
  }
  const result = await response.json() as ApiResponse<T>;
  if (!response.ok || !result.success) {
    throw new ApiError(result.message || "The request could not be completed.", response.status);
  }
  return result;
}
