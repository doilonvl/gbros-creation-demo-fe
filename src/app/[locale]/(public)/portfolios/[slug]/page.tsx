import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { PortfolioItem } from "@/types/portfolio";
import type { Blog } from "@/types/blog";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { getCloudinarySizedUrl } from "@/lib/media";
import {
  fetchPublicPortfolioBySlug,
  fetchPublicPortfolios,
} from "@/lib/api/portfolios.public";
import { fetchPublicBlogs } from "@/lib/api/blogs.public";
import { resolveLocalizedString } from "@/lib/i18n";
import { formatDate, resolveSlug } from "@/lib/blogs";
import MediaLightbox from "@/components/common/MediaLightbox";
import type { LightboxItem } from "@/components/common/MediaLightbox";
import VideoPopup from "@/components/common/VideoPopup";
import SectionHeading from "@/components/sections/public/SectionHeading";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

const DEFAULT_GALLERY = [
  "/Home/case-study-1.jpg",
  "/Home/case-study-2.jpg",
  "/Home/case-study-3.jpg",
  "/Home/prompt-1.jpg",
  "/Home/prompt-2.jpg",
];

const DEFAULT_VIDEOS = [
  {
    id: "pv1",
    title: "Showreel",
    provider: "youtube" as const,
    url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    thumbnail: "/Home/prompt-1.jpg",
  },
];

type PageParams = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "portfolios" });
  const portfolio = await fetchPublicPortfolioBySlug(slug, locale);

  if (!portfolio) {
    return {
      title: { absolute: t("metaTitle") },
      description: t("metaDescription"),
    };
  }

  const title =
    resolveLocalizedString(portfolio.seoTitle_i18n, locale, "") ||
    resolveLocalizedString(portfolio.title_i18n, locale, t("metaTitle"));
  const description =
    resolveLocalizedString(portfolio.seoDescription_i18n, locale, "") ||
    t("metaDescription");
  const prefix = getLocalePrefix(locale);
  const canonical =
    portfolio.canonicalUrl ||
    (prefix
      ? `${BASE_URL}${prefix}/portfolios/${portfolio.slug}`
      : `${BASE_URL}/portfolios/${portfolio.slug}`);
  const ogImage =
    portfolio.coverAsset?.url ||
    portfolio.coverAsset?.thumbnailUrl ||
    portfolio.ogImageUrl ||
    DEFAULT_OG_IMAGE;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/portfolios/${portfolio.slug}`,
        en: `${BASE_URL}/en/portfolios/${portfolio.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PortfolioDetailPage({ params }: PageParams) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "portfolios" });

  const portfolio = await fetchPublicPortfolioBySlug(slug, locale);
  if (!portfolio) notFound();

  const title = resolveLocalizedString(
    portfolio.title_i18n ?? (portfolio as { title?: string }).title,
    locale
  );

  let related: PortfolioItem[] = [];
  let latestBlogs: Blog[] = [];

  try {
    const [relatedRes, blogRes] = await Promise.all([
      fetchPublicPortfolios({
        locale,
        page: 1,
        limit: 4,
        sort: "-publishedAt",
        type: portfolio.type,
      }),
      fetchPublicBlogs({
        locale,
        page: 1,
        limit: 3,
        sort: "-publishedAt",
      }),
    ]);

    related = (relatedRes.items || []).filter(
      (item) => item._id !== portfolio._id
    );
    latestBlogs = blogRes.items || [];
  } catch (error) {
    console.error("FETCH_PORTFOLIO_RELATED_FAILED", error);
  }

  const galleryItems: LightboxItem[] = portfolio.assets?.length
    ? portfolio.assets.flatMap((asset) => {
        const rawFull = asset.url || asset.thumbnailUrl || "";
        const rawThumb = asset.thumbnailUrl || asset.url || "";
        if (!rawFull && !rawThumb) return [];
        const fullSrc =
          asset.provider === "cloudinary" && rawFull
            ? getCloudinarySizedUrl(rawFull, 2200, 90)
            : rawFull;
        const thumbSrc =
          asset.provider === "cloudinary" && rawThumb
            ? getCloudinarySizedUrl(rawThumb, 1200, 85)
            : rawThumb;
        return [
          {
            src: rawFull || rawThumb,
            fullSrc,
            thumbSrc,
            alt: title,
          },
        ];
      })
    : DEFAULT_GALLERY.map((src) => ({
        src,
        fullSrc: src,
        thumbSrc: src,
        alt: title,
      }));
  const showVideo = portfolio.tags?.includes("video");
  const photoCount = galleryItems.length;
  const dateLabel = formatDate(
    portfolio.publishedAt || portfolio.createdAt,
    locale
  );
  const typeLabelMap: Record<PortfolioItem["type"], string> = {
    album: locale === "en" ? "Album" : "Album",
    case_study: locale === "en" ? "Case study" : "Case study",
    showreel: locale === "en" ? "Showreel" : "Showreel",
  };
  const categoryLabel = portfolio.tags?.[0] || typeLabelMap[portfolio.type];
  const breadcrumbLabel = categoryLabel
    ? `Portfolio / ${categoryLabel}`
    : "Portfolio";
  const photoLabel = locale === "en" ? "photos" : "anh";

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-28 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
            {breadcrumbLabel}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
            {t("title")}
          </p>
          <h1 className="mt-4 text-balance font-[var(--font-caladea)] text-4xl leading-[1.1] tracking-[0.02em] text-neutral-900 md:text-5xl">
            {title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <div className="flex flex-wrap items-center gap-2">
              {(portfolio.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            {dateLabel ? (
              <span className="flex items-center gap-2 uppercase tracking-[0.2em] text-neutral-400">
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                {dateLabel}
              </span>
            ) : null}
            {photoCount ? (
              <span className="flex items-center gap-2 uppercase tracking-[0.2em] text-neutral-400">
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                {photoCount} {photoLabel}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6 lg:px-8">
        <MediaLightbox items={galleryItems} className="gap-5" />

        {showVideo ? (
          <div className="mt-10">
            <SectionHeading title={locale === "en" ? "Video" : "Video"} />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {DEFAULT_VIDEOS.map((video) => (
                <VideoPopup key={video.id} video={video} />
              ))}
            </div>
          </div>
        ) : null}

        {related.length ? (
          <div className="mt-14">
            <SectionHeading
              title={locale === "en" ? "Related" : "Khac cho ban"}
            />
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((item) => (
                <Link
                  key={item._id}
                  href={`${getLocalePrefix(locale)}/portfolios/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_70px_-55px_rgba(15,23,42,0.6)] transition hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={
                          item.coverAsset?.url ||
                          item.coverAsset?.thumbnailUrl ||
                          item.ogImageUrl ||
                          "/Home/case-study-3.jpg"
                        }
                      alt={resolveLocalizedString(
                        item.title_i18n ?? (item as { title?: string }).title,
                        locale
                      )}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-4 py-3 text-sm font-semibold text-neutral-900">
                    {resolveLocalizedString(
                      item.title_i18n ?? (item as { title?: string }).title,
                      locale
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {latestBlogs.length ? (
          <div className="mt-14">
            <SectionHeading
              title={locale === "en" ? "Latest blogs" : "Blog moi"}
            />
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestBlogs.map((item) => {
                const blogSlug =
                  item.slug || resolveSlug(item.slug_i18n, locale);
                return (
                  <Link
                    key={item._id}
                    href={`${getLocalePrefix(locale)}/blogs/${blogSlug}`}
                    className="group overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_70px_-55px_rgba(15,23,42,0.6)] transition hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={item.coverImage?.url || "/Home/case-study-1.jpg"}
                        alt={resolveLocalizedString(
                          item.title_i18n ?? (item as { title?: string }).title,
                          locale
                        )}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      {resolveLocalizedString(
                        item.title_i18n ?? (item as { title?: string }).title,
                        locale
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
