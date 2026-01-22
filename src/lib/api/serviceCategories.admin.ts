import { fetchAdminJson } from "@/lib/api/adminFetch";
import type { AdminListResponse, ServiceCategory } from "@/types/taxonomy";

export async function fetchAdminServiceCategories(params: {
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
    ? `/service-categories?${query.toString()}`
    : "/service-categories";

  return fetchAdminJson<AdminListResponse<ServiceCategory>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminServiceCategoryById(id: string) {
  return fetchAdminJson<ServiceCategory>(`/service-categories/${id}`);
}

export async function createAdminServiceCategory(
  payload: Partial<ServiceCategory>
) {
  return fetchAdminJson<ServiceCategory>(`/service-categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminServiceCategory(
  id: string,
  patch: Partial<ServiceCategory>
) {
  return fetchAdminJson<ServiceCategory>(`/service-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminServiceCategory(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/service-categories/${id}`, {
    method: "DELETE",
  });
}
