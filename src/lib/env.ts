const PROD_SITE_URL = "https://www.gmediavietnam.com";
const PROD_API_URL = "https://api.gmediavietnam.com/api/v1";
const LOCAL_SITE_URL = "http://localhost:3000";
const LOCAL_API_URL = "http://localhost:5001/api/v1";

function readEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function getSiteUrl() {
  const envUrl = readEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (envUrl) return normalizeUrl(envUrl);
  const fallback =
    process.env.NODE_ENV === "production" ? PROD_SITE_URL : LOCAL_SITE_URL;
  return normalizeUrl(fallback);
}

export function getApiBaseUrl() {
  const envUrl =
    readEnv(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    readEnv(process.env.NEXT_PUBLIC_API_URL);
  if (envUrl) return normalizeUrl(envUrl);
  const fallback =
    process.env.NODE_ENV === "production" ? PROD_API_URL : LOCAL_API_URL;
  return normalizeUrl(fallback);
}
