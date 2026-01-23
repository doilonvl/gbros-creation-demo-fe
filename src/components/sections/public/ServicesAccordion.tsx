"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/types/content";
import type { Service } from "@/types/service";
import { resolveLocalizedString } from "@/lib/i18n";
import { getLocalePrefix } from "@/lib/routes";
import { resolveSlug } from "@/lib/blogs";
import { cn } from "@/lib/utils";

const PANEL_TRANSITION = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as const,
};

type ServicesAccordionProps = {
  locale: Locale;
  items: Service[];
};

export default function ServicesAccordion({
  locale,
  items,
}: ServicesAccordionProps) {
  const [activeId, setActiveId] = useState<string | null>(
    items[0]?._id ?? null,
  );
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(
    null,
  );
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const resolvedItems = useMemo(
    () =>
      items.map((item) => {
        const title = resolveLocalizedString(
          item.title_i18n ?? (item as { title?: string }).title,
          locale,
        );
        const excerpt = resolveLocalizedString(
          item.excerpt_i18n ?? (item as { excerpt?: string }).excerpt,
          locale,
        );
        const href = `${getLocalePrefix(locale)}/services/${
          item.slug || resolveSlug(item.slug_i18n, locale)
        }`;
        const cover =
          item.coverAsset?.url ||
          item.coverAsset?.thumbnailUrl ||
          item.ogImageUrl ||
          "/Home/hero.jpg";
        return { item, title, excerpt, href, cover };
      }),
    [items, locale],
  );

  return (
    <div className="relative">
      <div className="space-y-2">
        {resolvedItems.map(({ item, title, excerpt, href, cover }) => {
          const isOpen = activeId === item._id;
          return (
            <div
              key={item._id}
              className={cn(
                "group border-b border-neutral-200 pb-6 transition",
                "hover:border-neutral-400",
              )}
              onMouseEnter={() => setPreview({ src: cover, title })}
              onMouseLeave={() => setPreview(null)}
              onMouseMove={(event) =>
                setCursor({ x: event.clientX, y: event.clientY })
              }
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-6 rounded-3xl px-4 py-6 text-left transition",
                  "hover:bg-neutral-900 hover:text-white",
                )}
                onClick={() => setActiveId(isOpen ? null : item._id)}
              >
                <span className="text-2xl font-[var(--font-caladea)] uppercase tracking-[0.18em] md:text-4xl">
                  {title}
                </span>
                <span className="text-xs uppercase tracking-[0.35em] text-neutral-500 group-hover:text-white/70">
                  {locale === "en" ? "From" : "Tu"}{" "}
                  {locale === "en" ? "Contact" : "Lien he"}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={PANEL_TRANSITION}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-6 pb-6 pt-2 md:grid-cols-[1.2fr_1fr]">
                      <div>
                        <p className="text-sm text-neutral-600 font-[var(--font-caladea)]">
                          {excerpt ||
                            (locale === "en"
                              ? "Signature visual storytelling with precision lighting, styling, and post-production."
                              : "Ke chuyen bang hinh anh voi anh sang, styling va hau ky tinh te.")}
                        </p>
                        {(item.includedSteps_i18n || []).length ? (
                          <ul className="mt-4 space-y-2 text-xs uppercase tracking-[0.25em] text-neutral-500">
                            {item.includedSteps_i18n
                              ?.slice(0, 5)
                              .map((step, index) => (
                                <li key={`${item._id}-step-${index}`}>
                                  {resolveLocalizedString(step, locale)}
                                </li>
                              ))}
                          </ul>
                        ) : null}
                      </div>
                      <div className="flex items-end justify-start md:justify-end">
                        <Link
                          href={`${getLocalePrefix(locale)}/contact?service=${encodeURIComponent(item.slug)}`}
                          className="inline-flex items-center justify-center rounded-full border border-neutral-900 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
                        >
                          {locale === "en" ? "Book now" : "Dat lich"}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none fixed left-0 top-0 z-40 hidden lg:block">
        <AnimatePresence>
          {preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                transform: `translate3d(${cursor.x + 32}px, ${cursor.y - 120}px, 0)`,
              }}
              className="h-48 w-72 overflow-hidden rounded-2xl border border-white/20 bg-neutral-900 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]"
            >
              <img
                src={preview.src}
                alt={preview.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
