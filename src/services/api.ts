/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { Locale, LocalizedString } from "@/types/content";
import { getApiBaseUrl } from "@/lib/env";

interface HomeContent {
  [key: string]: any;
}

const BASE_URL = getApiBaseUrl();

function getClientToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getClientToken();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        const data = await refreshRes
          .json()
          .catch(() => ({ accessToken: null as string | null }));
        const newAccess =
          (data as any)?.accessToken ||
          (data as any)?.access_token ||
          (data as any)?.token;
        if (newAccess && typeof window !== "undefined") {
          localStorage.setItem("access_token", newAccess);
        }
        result = await rawBaseQuery(args, api, extraOptions);
      }
    } catch (err) {
      console.error("REFRESH_TOKEN_FAILED", err);
    }
  }

  return result;
};

// ---- API ----

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Products", "Home"],
  endpoints: (builder) => ({}),
});

export const {} = api;
