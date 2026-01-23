"use client";

import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import type { Locale } from "@/types/content";
import type { PortfolioItem } from "@/types/portfolio";
import { getLocalePrefix } from "@/lib/routes";
import { resolveLocalizedString } from "@/lib/i18n";
import { resolveSlug } from "@/lib/blogs";
import { cn } from "@/lib/utils";

export type StoryMedia = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type PortfolioStoryProps = {
  locale: Locale;
  portfolio: PortfolioItem;
  hero?: { kind: "image" | "video"; src: string } | null;
  gallery: StoryMedia[];
  dateLabel?: string | null;
  categoryLabel?: string | null;
  concept?: string | null;
  nextProject?: PortfolioItem | null;
};

function StoryImage({ media, index }: { media: StoryMedia; index: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallax = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const aspectRatio =
    media.width && media.height ? `${media.width}/${media.height}` : "4/3";

  return (
    <motion.div
      ref={ref}
      data-scroll
      className="relative overflow-hidden rounded-3xl bg-neutral-100"
      style={{ aspectRatio }}
    >
      <motion.img
        src={media.src}
        alt={media.alt}
        className="h-full w-full object-cover"
        style={{ y: parallax }}
        initial={{ scale: 1.05, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      <span className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.35em] text-white/60">
        0{index + 1}
      </span>
    </motion.div>
  );
}

export default function PortfolioStory({
  locale,
  portfolio,
  hero,
  gallery,
  dateLabel,
  categoryLabel,
  concept,
  nextProject,
}: PortfolioStoryProps) {
  const tags = portfolio.tags || [];
  const title = resolveLocalizedString(
    portfolio.title_i18n ?? (portfolio as { title?: string }).title,
    locale
  );

  const layout = useMemo(
    () =>
      gallery.map((media, index) => {
        const pattern = index % 6;
        if (pattern === 0) return { span: "col-span-12", media };
        if (pattern === 1 || pattern === 2)
          return { span: "col-span-12 md:col-span-6", media };
        if (pattern === 3) return { span: "col-span-12 md:col-span-7", media };
        if (pattern === 4) return { span: "col-span-12 md:col-span-5", media };
        return { span: "col-span-12", media };
      }),
    [gallery]
  );

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="relative h-[90vh] w-full" data-nav-theme="light">
        {hero?.kind === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={hero.src}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            className="h-full w-full object-cover"
            src={hero?.src || "/Home/hero.jpg"}
            alt={title}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/35 to-transparent" />
        <div className="absolute bottom-10 left-6 max-w-4xl md:left-12">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
            {categoryLabel || "Portfolio"}
          </p>
          <h1 className="mt-4 text-4xl font-[var(--font-caladea)] uppercase tracking-[0.08em] text-neutral-900 md:text-6xl lg:text-7xl">
            {title}
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[0.9fr_2.1fr] md:gap-12 md:px-6 lg:px-8">
        <div className="space-y-6 md:sticky md:top-20 md:self-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
              Client
            </p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {title}
            </p>
          </div>
          <div className="grid gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
                Year
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                {dateLabel || "2026"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
                Services
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                {tags.length ? tags.join(" / ") : "Photo, Video, Styling"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
              Concept
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {concept ||
                (locale === "en"
                  ? "A contemporary editorial narrative focused on texture, light, and movement across the full visual system."
                  : "Mot ban thiet ke mang tinh bien tap, tap trung vao chat lieu, anh sang va chuyen dong trong tong the." )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {layout.map((item, index) => (
            <div key={`${item.media.src}-${index}`} className={item.span}>
              <StoryImage media={item.media} index={index} />
            </div>
          ))}
        </div>
      </section>

      {nextProject ? (
        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6 lg:px-8">
          <Link
            href={`${getLocalePrefix(locale)}/portfolios/${ 
              nextProject.slug || resolveSlug(nextProject.slug_i18n, locale)
            }`}
            className={cn(
              "group relative block overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white p-10 text-neutral-900 transition",
              "hover:border-neutral-400"
            )}
          >
            <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
              <img
                src={
                  nextProject.coverAsset?.url ||
                  nextProject.coverAsset?.thumbnailUrl ||
                  nextProject.ogImageUrl ||
                  "/Home/case-study-2.jpg"
                }
                alt={resolveLocalizedString(
                  nextProject.title_i18n ??
                    (nextProject as { title?: string }).title,
                  locale
                )}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-white/65" />
            </div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
                {locale === "en" ? "Next project" : "Du an tiep theo"}
              </p>
              <h2 className="mt-4 text-4xl font-[var(--font-caladea)] uppercase tracking-[0.08em] md:text-6xl">
                {resolveLocalizedString(
                  nextProject.title_i18n ??
                    (nextProject as { title?: string }).title,
                  locale
                )}
              </h2>
              <span className="mt-6 inline-flex text-xs uppercase tracking-[0.4em] text-neutral-600">
                {locale === "en" ? "View project" : "Xem du an"}
              </span>
            </div>
          </Link>
        </section>
      ) : null}
    </main>
  );
}
