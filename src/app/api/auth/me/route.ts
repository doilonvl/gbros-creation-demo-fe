/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/env";

const API_BASE = getApiBaseUrl();

export async function GET(req: Request) {
  const api = API_BASE.replace(/\/$/, "");
  let upstream: Response;

  try {
    upstream = await fetch(`${api}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
      credentials: "include",
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Upstream unavailable" },
      { status: 502 }
    );
  }

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message = (data as any)?.message ?? "Unauthorized";
    return NextResponse.json({ message }, { status: upstream.status || 401 });
  }

  const res = NextResponse.json(data ?? { ok: true }, {
    status: upstream.status,
  });

  const setCookies =
    (upstream.headers as any).getSetCookie?.() ??
    upstream.headers.get("set-cookie")?.split(/,(?=[^;]+=[^;]+;)/g) ??
    [];

  for (const cookie of setCookies) {
    res.headers.append("set-cookie", cookie);
  }

  return res;
}
