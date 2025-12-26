import type { Locale } from "@/types/content";

const LOCALE_PREFIX: Record<Locale, string> = {
  vi: "",
  en: "/en",
};

// const PRODUCTS_BASE: Record<Locale, string> = {
//   vi: "/san-pham",
//   en: "/products",
// };

// export function getProductsListingPath(locale: Locale) {
//   return `${LOCALE_PREFIX[locale]}${PRODUCTS_BASE[locale]}`;
// }

// export function getProductDetailPath(locale: Locale, slug: string) {
//   const safeSlug = encodeURIComponent(slug);
//   return `${getProductsListingPath(locale)}/${safeSlug}`;
// }

export function getLocalePrefix(locale: Locale) {
  return LOCALE_PREFIX[locale];
}
