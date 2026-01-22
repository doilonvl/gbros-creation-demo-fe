import type { Locale } from "@/types/content";
import type { LocalizedString, TocItem } from "@/types/blog";

export function resolveI18nValue(
  value: LocalizedString | string | undefined,
  locale: Locale,
  fallback = ""
) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (locale === "en") return value.en || value.vi || fallback;
  return value.vi || value.en || fallback;
}

export function resolveSlug(
  value: LocalizedString | string | undefined,
  locale: Locale
) {
  return resolveI18nValue(value, locale, "");
}

export function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function normalizeTocIds(items: TocItem[]) {
  const counts = new Map<string, number>();
  return items.map((item) => {
    const base = item.id || "section";
    const next = (counts.get(base) || 0) + 1;
    counts.set(base, next);
    const id = next === 1 ? base : `${base}-${next}`;
    return { ...item, id };
  });
}
