type RefreshPayload = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  refreshToken?: string;
  refresh_token?: string;
  refresh?: string;
};

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const pattern = new RegExp(`(?:^|; )${name}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

export function hasRefreshTokenCookie() {
  return !!(readCookie("refresh_token") || readCookie("refresh_token_public"));
}

export async function refreshAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as RefreshPayload | null;
    const access =
      data?.accessToken || data?.access_token || data?.token || null;
    if (access) {
      localStorage.setItem("access_token", access);
      return access;
    }
  } catch {
    return null;
  }
  return null;
}
