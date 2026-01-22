import { fetchAdminJson } from "@/lib/api/adminFetch";
import type { AddOn, AddOnUpsertPayload } from "@/types/service";
import type { AdminListResponse } from "@/types/taxonomy";

export async function fetchAdminAddOns(params: {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  serviceId?: string;
  deleted?: boolean;
  signal?: AbortSignal;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  if (params.q) query.set("q", params.q);
  if (params.serviceId) query.set("serviceId", params.serviceId);
  if (typeof params.deleted === "boolean") {
    query.set("deleted", params.deleted ? "true" : "false");
  }
  const path = query.toString()
    ? `/service-addons?${query.toString()}`
    : "/service-addons";

  return fetchAdminJson<AdminListResponse<AddOn>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminAddOnById(id: string) {
  return fetchAdminJson<AddOn>(`/service-addons/${id}`);
}

export async function createAdminAddOn(payload: AddOnUpsertPayload) {
  return fetchAdminJson<AddOn>(`/service-addons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminAddOn(
  id: string,
  patch: Partial<AddOnUpsertPayload>
) {
  return fetchAdminJson<AddOn>(`/service-addons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminAddOn(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/service-addons/${id}`, {
    method: "DELETE",
  });
}
