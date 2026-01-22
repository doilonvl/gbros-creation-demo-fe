import { getApiBaseUrl } from "@/lib/env";
import type { Locale } from "@/types/content";
import type { Blog, BlogListResponse } from "@/types/blog";

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
      `Public blogs request failed: ${res.status}`
    ) as ApiError;
    error.status = res.status;
    error.payload = await readErrorPayload(res);
    throw error;
  }
  return (await res.json()) as T;
}

export async function fetchPublicBlogs(params: {
  locale: Locale;
  page?: number;
  limit?: number;
  sort?: string;
  tag?: string;
  signal?: AbortSignal;
}) {
  const url = new URL(`${API_BASE_URL}/public/blogs`);
  url.searchParams.set("locale", params.locale);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.tag) url.searchParams.set("tag", params.tag);

  return fetchPublicJson<BlogListResponse>(url.toString(), {
    signal: params.signal,
  });
}

export async function fetchPublicBlogBySlug(
  slug: string,
  locale: Locale
): Promise<Blog | null> {
  const url = new URL(`${API_BASE_URL}/public/blogs/${slug}`);
  url.searchParams.set("locale", locale);

  const res = await fetch(url.toString(), {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const error = new Error(
      `Public blog request failed: ${res.status}`
    ) as ApiError;
    error.status = res.status;
    error.payload = await readErrorPayload(res);
    throw error;
  }

  return (await res.json()) as Blog;
}

export async function incrementBlogView(blogId: string) {
  const url = `${API_BASE_URL}/public/blogs/${blogId}/view`;
  await fetch(url, { method: "POST" });
}
