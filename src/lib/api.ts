import { clearSession, getStoredToken } from "@/lib/frontend-auth";
import type { LoginResponse } from "@/types/auth";

type ApiErrorPayload = {
  error?: string;
  details?: unknown;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getStoredToken();

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
      errorPayload?.error ?? "No se pudo completar la operacion.",
      response.status,
      errorPayload?.details,
    );
  }

  return payload as T;
}

export function loginRequest(email: string, password: string) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
