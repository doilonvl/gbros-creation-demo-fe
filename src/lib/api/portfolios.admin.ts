import { fetchAdminJson } from "@/lib/api/adminFetch";
import type { PortfolioItem, PortfolioUpsertPayload } from "@/types/portfolio";
import type { AdminListResponse } from "@/types/taxonomy";

export async function fetchAdminPortfolios(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  sort?: string;
  q?: string;
  deleted?: boolean;
  signal?: AbortSignal;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.type && params.type !== "all") {
    query.set("type", params.type);
  }
  if (params.sort) query.set("sort", params.sort);
  if (params.q) query.set("q", params.q);
  if (typeof params.deleted === "boolean") {
    query.set("deleted", params.deleted ? "true" : "false");
  }
  const path = query.toString()
    ? `/portfolios?${query.toString()}`
    : "/portfolios";

  return fetchAdminJson<AdminListResponse<PortfolioItem>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminPortfolioById(id: string) {
  return fetchAdminJson<PortfolioItem>(`/portfolios/${id}`);
}

export async function createAdminPortfolio(payload: PortfolioUpsertPayload) {
  return fetchAdminJson<PortfolioItem>(`/portfolios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPortfolio(
  id: string,
  patch: Partial<PortfolioUpsertPayload>
) {
  return fetchAdminJson<PortfolioItem>(`/portfolios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminPortfolio(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/portfolios/${id}`, {
    method: "DELETE",
  });
}

export async function publishAdminPortfolio(id: string) {
  return fetchAdminJson<PortfolioItem>(`/portfolios/${id}/publish`, {
    method: "PATCH",
  });
}

export async function scheduleAdminPortfolio(id: string, scheduledAt: string) {
  return fetchAdminJson<PortfolioItem>(`/portfolios/${id}/schedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export async function archiveAdminPortfolio(id: string) {
  return fetchAdminJson<PortfolioItem>(`/portfolios/${id}/archive`, {
    method: "PATCH",
  });
}
