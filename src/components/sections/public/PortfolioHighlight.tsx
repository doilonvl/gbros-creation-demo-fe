"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/types/content";
import type { PortfolioItem } from "@/types/portfolio";
import { resolveLocalizedString } from "@/lib/i18n";
import { resolveSlug } from "@/lib/blogs";
import { getLocalePrefix } from "@/lib/routes";
import SectionHeading from "@/components/sections/public/SectionHeading";

type PortfolioHighlightProps = {
  locale: Locale;
  items: PortfolioItem[];
  tabs: { key: string; label: string }[];
};

const FALLBACK_IMAGES = [
  "/Home/prompt-1.jpg",
  "/Home/prompt-2.jpg",
  "/Home/prompt-eg-1.jpg",
  "/Home/prompt-eg-2.jpg",
  "/Home/case-study-1.jpg",
  "/Home/case-study-2.jpg",
  "/Home/case-study-3.jpg",
  "/Home/hero.jpg",
];

const ASPECTS = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/4]",
  "aspect-[16/9]",
  "aspect-[1/1]",
  "aspect-[2/3]",
];

function withPrefix(locale: Locale, href: string) {
  const prefix = getLocalePrefix(locale);
  return `${prefix}${href}`;
}

export default function PortfolioHighlight({
  locale,
  items,
  tabs,
}: PortfolioHighlightProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || "all");

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    const matches = items.filter((item) => item.tags?.includes(activeTab));
    return matches.length ? matches : items;
  }, [activeTab, items]);

  const visibleItems = useMemo(() => filtered.slice(0, 12), [filtered]);

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f2eb_0%,#ffffff_40%,#f3eee7_100%)] py-16"
      data-nav-theme="light"
    >
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-amber-200/40 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-orange-200/40 blur-[160px]" />
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            kicker="Portfolio"
            title={
              locale === "en" ? "Portfolio highlight" : "Bo suu tap noi bat"
            }
            description={
              locale === "en"
                ? "Browse work by industry or service category."
                : "Chon loc theo nganh hang va dich vu."
            }
          />
          <Link
            href={withPrefix(locale, "/portfolios")}
            className="inline-flex rounded-full border border-neutral-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            {locale === "en" ? "View all" : "Xem tat ca"}
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                activeTab === tab.key
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.6)]"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visibleItems.map((item, index) => {
            const title = resolveLocalizedString(
              item.title_i18n ?? (item as { title?: string }).title,
              locale
            );
            const href = withPrefix(
              locale,
              `/portfolios/${item.slug || resolveSlug(item.slug_i18n, locale)}`
            );
            const cover =
              item.coverAsset?.url ||
              item.coverAsset?.thumbnailUrl ||
              item.ogImageUrl ||
              FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
            return (
              <Link
                key={item._id}
                href={href}
                className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_35px_80px_-60px_rgba(15,23,42,0.55)] transition hover:-translate-y-1"
              >
                <div
                  className={`relative w-full overflow-hidden ${
                    ASPECTS[index % ASPECTS.length]
                  }`}
                >
                  <img
                    src={cover}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                </div>
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-2 px-4 py-4 opacity-0 transition duration-500 group-hover:opacity-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
                    {locale === "en" ? "Featured work" : "Du an noi bat"}
                  </p>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(item.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/40 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
