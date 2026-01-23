"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { Transition } from "framer-motion";
import type { Locale } from "@/types/content";
import type { PortfolioItem } from "@/types/portfolio";
import { resolveLocalizedString } from "@/lib/i18n";
import { resolveSlug } from "@/lib/blogs";
import { getLocalePrefix } from "@/lib/routes";
import { getCloudinarySizedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type PortfolioListGridProps = {
  items: PortfolioItem[];
  locale: Locale;
  tagTabs: string[];
  emptyLabel: string;
};

const FILTER_TRANSITION: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export default function PortfolioListGrid({
  items,
  locale,
  tagTabs,
  emptyLabel,
}: PortfolioListGridProps) {
  const [activeTag, setActiveTag] = useState<string>("");
  const allLabel = locale === "en" ? "All works" : "Tat ca";
  const countLabel = locale === "en" ? "projects" : "bo suu tap";

  const visibleItems = useMemo(() => {
    if (!activeTag) return items;
    return items.filter((item) => item.tags?.includes(activeTag));
  }, [items, activeTag]);

  const summaryLabel =
    locale === "en"
      ? `Showing ${visibleItems.length} / ${items.length}`
      : `Hien thi ${visibleItems.length} / ${items.length}`;

  const tagButtons = useMemo(
    () => [
      { label: allLabel, value: "" },
      ...tagTabs.map((tag) => ({ label: tag, value: tag })),
    ],
    [allLabel, tagTabs]
  );

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tagButtons.map((tag) => {
            const isActive = activeTag === tag.value;
            return (
              <button
                key={tag.value || "all"}
                type="button"
                className={cn(
                  "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] transition",
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                )}
                onClick={() => setActiveTag(tag.value)}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
          {summaryLabel} {countLabel}
        </p>
      </div>

      <LayoutGroup>
        <motion.div className="mt-8 columns-1 gap-6 md:columns-2 lg:columns-3 [column-fill:_balance]">
          {visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              {emptyLabel}
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {visibleItems.map((item) => {
                const title = resolveLocalizedString(
                  item.title_i18n ?? (item as { title?: string }).title,
                  locale
                );
                const href = `${getLocalePrefix(locale)}/portfolios/${
                  item.slug || resolveSlug(item.slug_i18n, locale)
                }`;
                const tags = item.tags || [];
                const rawFull =
                  item.coverAsset?.url ||
                  item.coverAsset?.thumbnailUrl ||
                  item.ogImageUrl ||
                  "/Home/case-study-3.jpg";
                const rawThumb =
                  item.coverAsset?.thumbnailUrl || item.coverAsset?.url || rawFull;
                const isCloudinary = item.coverAsset?.provider === "cloudinary";
                const fullCover = isCloudinary
                  ? getCloudinarySizedUrl(rawFull, 1600, 85)
                  : rawFull;
                const thumbCover =
                  isCloudinary && rawThumb
                    ? getCloudinarySizedUrl(rawThumb, 900, 82)
                    : rawThumb;
                const coverSrcSet =
                  fullCover && thumbCover && fullCover !== thumbCover
                    ? `${thumbCover} 900w, ${fullCover} 1600w`
                    : undefined;
                const aspectRatio =
                  item.coverAsset?.width && item.coverAsset?.height
                    ? `${item.coverAsset.width}/${item.coverAsset.height}`
                    : "4/3";

                return (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={FILTER_TRANSITION}
                    className="mb-6 break-inside-avoid"
                  >
                    <Link
                      href={href}
                      data-cursor="view"
                      className={cn(
                        "group block overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_70px_-55px_rgba(15,23,42,0.6)] transition",
                        "hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      )}
                    >
                      <div
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio }}
                      >
                        <img
                          src={thumbCover || fullCover}
                          alt={title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:saturate-110"
                          srcSet={coverSrcSet}
                          sizes={
                            coverSrcSet
                              ? "(min-width: 1280px) 32vw, (min-width: 1024px) 33vw, 100vw"
                              : undefined
                          }
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                        <div className="absolute inset-0 flex items-end px-5 pb-5">
                          <div className="translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75">
                              {tags[0] || "Portfolio"}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                              {title}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 px-4 pb-4 pt-3">
                        <h3 className="text-base font-semibold text-neutral-900 line-clamp-2">
                          {title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
