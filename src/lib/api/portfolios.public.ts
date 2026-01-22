import { getApiBaseUrl } from "@/lib/env";
import type { Locale } from "@/types/content";
import type { PortfolioItem, PortfolioListResponse } from "@/types/portfolio";

const API_BASE_URL = getApiBaseUrl();
const PUBLIC_REVALIDATE_SECONDS = 60;

type ApiError = Error & { status?: number; payload?: unknown };

async function readErrorPayload(res: Response) {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

async function fetchPublicJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    const error = new Error(
      `Public portfolios request failed: ${res.status}`
    ) as ApiError;
    error.status = res.status;
    error.payload = await readErrorPayload(res);
    throw error;
  }
  return (await res.json()) as T;
}

export async function fetchPublicPortfolios(params: {
  locale: Locale;
  page?: number;
  limit?: number;
  sort?: string;
  type?: string;
  serviceId?: string;
  industryId?: string;
  tag?: string;
  signal?: AbortSignal;
}) {
  const url = new URL(`${API_BASE_URL}/public/portfolios`);
  url.searchParams.set("locale", params.locale);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.type) url.searchParams.set("type", params.type);
  if (params.tag) url.searchParams.set("tag", params.tag);
  if (params.serviceId) url.searchParams.set("serviceId", params.serviceId);
  if (params.industryId) url.searchParams.set("industryId", params.industryId);

  return fetchPublicJson<PortfolioListResponse>(url.toString(), {
    signal: params.signal,
  });
}

export async function fetchPublicPortfolioBySlug(
  slug: string,
  locale: Locale
): Promise<PortfolioItem | null> {
  const url = new URL(`${API_BASE_URL}/public/portfolios/${slug}`);
  url.searchParams.set("locale", locale);

  const res = await fetch(url.toString(), {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const error = new Error(
      `Public portfolio request failed: ${res.status}`
    ) as ApiError;
    error.status = res.status;
    error.payload = await readErrorPayload(res);
    throw error;
  }

  return (await res.json()) as PortfolioItem;
}
