import { fetchAdminJson } from "@/lib/api/adminFetch";
import type { Service, ServiceUpsertPayload } from "@/types/service";
import type { AdminListResponse } from "@/types/taxonomy";

export async function fetchAdminServices(params: {
  page?: number;
  limit?: number;
  status?: string;
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
  if (params.sort) query.set("sort", params.sort);
  if (params.q) query.set("q", params.q);
  if (typeof params.deleted === "boolean") {
    query.set("deleted", params.deleted ? "true" : "false");
  }
  const path = query.toString() ? `/services?${query.toString()}` : "/services";

  return fetchAdminJson<AdminListResponse<Service>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminServiceById(id: string) {
  return fetchAdminJson<Service>(`/services/${id}`);
}

export async function createAdminService(payload: ServiceUpsertPayload) {
  return fetchAdminJson<Service>(`/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminService(
  id: string,
  patch: Partial<ServiceUpsertPayload>
) {
  return fetchAdminJson<Service>(`/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminService(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/services/${id}`, {
    method: "DELETE",
  });
}

export async function publishAdminService(id: string) {
  return fetchAdminJson<Service>(`/services/${id}/publish`, {
    method: "PATCH",
  });
}

export async function scheduleAdminService(id: string, scheduledAt: string) {
  return fetchAdminJson<Service>(`/services/${id}/schedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export async function archiveAdminService(id: string) {
  return fetchAdminJson<Service>(`/services/${id}/archive`, {
    method: "PATCH",
  });
}
