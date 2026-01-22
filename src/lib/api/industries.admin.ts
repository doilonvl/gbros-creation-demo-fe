import { fetchAdminJson } from "@/lib/api/adminFetch";
import type { AdminListResponse, Industry } from "@/types/taxonomy";

export async function fetchAdminIndustries(params: {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  deleted?: boolean;
  isActive?: boolean;
  signal?: AbortSignal;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  if (params.q) query.set("q", params.q);
  if (typeof params.deleted === "boolean") {
    query.set("deleted", params.deleted ? "true" : "false");
  }
  if (typeof params.isActive === "boolean") {
    query.set("isActive", params.isActive ? "true" : "false");
  }
  const path = query.toString()
    ? `/industries?${query.toString()}`
    : "/industries";

  return fetchAdminJson<AdminListResponse<Industry>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminIndustryById(id: string) {
  return fetchAdminJson<Industry>(`/industries/${id}`);
}

export async function createAdminIndustry(payload: Partial<Industry>) {
  return fetchAdminJson<Industry>(`/industries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminIndustry(
  id: string,
  patch: Partial<Industry>
) {
  return fetchAdminJson<Industry>(`/industries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminIndustry(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/industries/${id}`, {
    method: "DELETE",
  });
}
