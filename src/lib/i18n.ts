import type { Locale, LocalizedString } from "@/types/content";

export function resolveLocalizedString(
  value: LocalizedString | string | undefined,
  locale: Locale,
  fallback = ""
) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (locale === "en") return value.en || value.vi || fallback;
  return value.vi || value.en || fallback;
}
