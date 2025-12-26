import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./request";

export const pathnames = {
  "/": "/",
  "/products": {
    vi: "/san-pham",
    en: "/products",
  },
  "/products/[slug]": {
    vi: "/san-pham/[slug]",
    en: "/products/[slug]",
  },
  "/admin": {
    vi: "/admin",
    en: "/admin",
  },
  "/admin/products": {
    vi: "/admin/products",
    en: "/admin/products",
  },
} as const;

export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
    pathnames,
    localePrefix: "as-needed",
  });
