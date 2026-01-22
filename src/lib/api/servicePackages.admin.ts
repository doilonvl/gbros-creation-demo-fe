import { fetchAdminJson } from "@/lib/api/adminFetch";
import type {
  ServicePackage,
  ServicePackageUpsertPayload,
} from "@/types/service";
import type { AdminListResponse } from "@/types/taxonomy";

export async function fetchAdminServicePackages(params: {
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
    ? `/service-packages?${query.toString()}`
    : "/service-packages";

  return fetchAdminJson<AdminListResponse<ServicePackage>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminServicePackageById(id: string) {
  return fetchAdminJson<ServicePackage>(`/service-packages/${id}`);
}

export async function createAdminServicePackage(
  payload: ServicePackageUpsertPayload
) {
  return fetchAdminJson<ServicePackage>(`/service-packages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminServicePackage(
  id: string,
  patch: Partial<ServicePackageUpsertPayload>
) {
  return fetchAdminJson<ServicePackage>(`/service-packages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminServicePackage(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/service-packages/${id}`, {
    method: "DELETE",
  });
}
