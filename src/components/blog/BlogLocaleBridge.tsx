"use client";

import { useEffect } from "react";
import type { I18nString } from "@/types/blog";

type LocaleSlugMap = { vi?: string; en?: string };

function normalizeSlugI18n(slugI18n?: I18nString | string): LocaleSlugMap {
  if (!slugI18n) return {};
  if (typeof slugI18n === "string") {
    return { vi: slugI18n, en: slugI18n };
  }
  return { vi: slugI18n.vi, en: slugI18n.en };
}

export default function BlogLocaleBridge({
  slug,
  slugI18n,
}: {
  slug?: string;
  slugI18n?: I18nString | string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const slugs = normalizeSlugI18n(slugI18n);
    if (!slugs.vi && slug) slugs.vi = slug;
    if (!slugs.en && slug) slugs.en = slug;

    const win = window as typeof window & {
      __BLOG_SLUGS__?: LocaleSlugMap;
    };
    win.__BLOG_SLUGS__ = slugs;
    return () => {
      if (win.__BLOG_SLUGS__ === slugs) {
        delete win.__BLOG_SLUGS__;
      }
    };
  }, [slug, slugI18n]);

  return null;
}
