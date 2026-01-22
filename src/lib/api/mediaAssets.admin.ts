import { fetchAdminJson } from "@/lib/api/adminFetch";
import type { MediaAsset, MediaAssetUpsertPayload } from "@/types/media";
import type { AdminListResponse } from "@/types/taxonomy";

export async function fetchAdminMediaAssets(params: {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  kind?: string;
  provider?: string;
  deleted?: boolean;
  isActive?: boolean;
  signal?: AbortSignal;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  if (params.q) query.set("q", params.q);
  if (params.kind) query.set("kind", params.kind);
  if (params.provider) query.set("provider", params.provider);
  if (typeof params.deleted === "boolean") {
    query.set("deleted", params.deleted ? "true" : "false");
  }
  if (typeof params.isActive === "boolean") {
    query.set("isActive", params.isActive ? "true" : "false");
  }
  const path = query.toString()
    ? `/media-assets?${query.toString()}`
    : "/media-assets";

  return fetchAdminJson<AdminListResponse<MediaAsset>>(path, {
    signal: params.signal,
  });
}

export async function fetchAdminMediaAssetById(id: string) {
  return fetchAdminJson<MediaAsset>(`/media-assets/${id}`);
}

export async function createAdminMediaAsset(payload: MediaAssetUpsertPayload) {
  return fetchAdminJson<MediaAsset>(`/media-assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminMediaAsset(
  id: string,
  patch: Partial<MediaAssetUpsertPayload>
) {
  return fetchAdminJson<MediaAsset>(`/media-assets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminMediaAsset(id: string) {
  return fetchAdminJson<{ success?: boolean }>(`/media-assets/${id}`, {
    method: "DELETE",
  });
}

type UploadMediaResult = {
  url: string;
  secure_url?: string;
  public_id?: string;
  publicId?: string;
  width?: number;
  height?: number;
  durationSec?: number;
};

function normalizeUploadMediaResponse(payload: unknown): UploadMediaResult[] {
  if (Array.isArray(payload)) {
    return payload as UploadMediaResult[];
  }
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  const candidates =
    (data.items as unknown[]) ||
    (data.data as unknown[]) ||
    (data.results as unknown[]) ||
    (data.files as unknown[]) ||
    (data.images as unknown[]);
  if (Array.isArray(candidates)) {
    return candidates as UploadMediaResult[];
  }
  const urls = data.urls as unknown;
  if (Array.isArray(urls)) {
    return urls
      .filter((value): value is string => typeof value === "string")
      .map((value) => ({ url: value }));
  }
  const url = data.secure_url || data.url;
  if (typeof url === "string") {
    return [{ url: url }];
  }
  return [];
}

export async function uploadMediaAsset(file: File, folder = "media-assets") {
  const formData = new FormData();
  formData.append("file", file);
  return fetchAdminJson<UploadMediaResult>(
    `/upload/single?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export async function uploadMediaAssets(
  files: File[],
  folder = "media-assets"
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const payload = await fetchAdminJson<unknown>(
    `/upload/multi?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      body: formData,
    }
  );
  return normalizeUploadMediaResponse(payload);
}
