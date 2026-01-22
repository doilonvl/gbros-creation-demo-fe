import { getApiBaseUrl } from "@/lib/env";
import { refreshAccessToken } from "@/lib/auth";

const API_BASE_URL = getApiBaseUrl();

export type AdminApiError = Error & { status?: number; payload?: unknown };

function getClientToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function readErrorPayload(res: Response) {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

export async function fetchAdminJson<T>(
  path: string,
  init?: RequestInit,
  retry = true
): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getClientToken();
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const nextHeaders = new Headers(init?.headers);
      nextHeaders.set("authorization", `Bearer ${newToken}`);
      return fetchAdminJson<T>(path, { ...init, headers: nextHeaders }, false);
    }
  }

  if (!res.ok) {
    const error = new Error(
      `Admin request failed: ${res.status}`
    ) as AdminApiError;
    error.status = res.status;
    error.payload = await readErrorPayload(res);
    throw error;
  }

  if (res.status === 204) {
    return null as T;
  }

  return (await res.json()) as T;
}
