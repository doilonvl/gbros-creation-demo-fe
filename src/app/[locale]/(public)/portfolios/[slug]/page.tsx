import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { PortfolioItem } from "@/types/portfolio";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { getCloudinarySizedUrl } from "@/lib/media";
import {
  fetchPublicPortfolioBySlug,
  fetchPublicPortfolios,
} from "@/lib/api/portfolios.public";
import { resolveLocalizedString } from "@/lib/i18n";
import { formatDate } from "@/lib/blogs";
import PortfolioStory, {
  type StoryMedia,
} from "@/components/sections/public/PortfolioStory";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

const DEFAULT_GALLERY = [
  "/Home/case-study-1.jpg",
  "/Home/case-study-2.jpg",
  "/Home/case-study-3.jpg",
  "/Home/prompt-1.jpg",
  "/Home/prompt-2.jpg",
  "/Home/prompt-eg-1.jpg",
  "/Home/prompt-eg-2.jpg",
  "/Home/hero.jpg",
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

  const portfolio = await fetchPublicPortfolioBySlug(slug, locale);
  if (!portfolio) notFound();

  let related: PortfolioItem[] = [];

  try {
    const relatedRes = await fetchPublicPortfolios({
      locale,
      page: 1,
      limit: 4,
      sort: "-publishedAt",
      type: portfolio.type,
    });

    related = (relatedRes.items || []).filter(
      (item) => item._id !== portfolio._id
    );
  } catch (error) {
    console.error("FETCH_PORTFOLIO_RELATED_FAILED", error);
  }

  const heroAsset = portfolio.coverAsset || portfolio.assets?.[0];
  const heroSrc = heroAsset?.url || heroAsset?.thumbnailUrl || DEFAULT_OG_IMAGE;

  const hero: { kind: "video" | "image"; src: string } | null = heroSrc
    ? {
        kind: heroAsset?.kind === "video" ? "video" : "image",
        src: heroSrc,
      }
    : null;

  const galleryBase: StoryMedia[] = portfolio.assets?.length
    ? portfolio.assets
        .filter((asset) => asset.kind === "image")
        .map((asset) => {
          const rawFull = asset.url || asset.thumbnailUrl || "";
          const fullSrc =
            asset.provider === "cloudinary" && rawFull
              ? getCloudinarySizedUrl(rawFull, 2000, 88)
              : rawFull;
          return {
            src: fullSrc || rawFull,
            alt:
              resolveLocalizedString(
                portfolio.title_i18n ?? (portfolio as { title?: string }).title,
                locale
              ) || "Portfolio",
            width: asset.width,
            height: asset.height,
          };
        })
    : DEFAULT_GALLERY.map((src) => ({ src, alt: "Portfolio" }));
  const gallery: StoryMedia[] =
    galleryBase.length >= 16
      ? galleryBase
      : Array.from({ length: Math.ceil(16 / galleryBase.length) })
          .flatMap((_, index) =>
            galleryBase.map((item) => ({
              ...item,
              src: item.src,
              alt: item.alt,
            }))
          )
          .slice(0, 16);

  const dateLabel = formatDate(
    portfolio.publishedAt || portfolio.createdAt,
    locale
  );
  const typeLabelMap: Record<PortfolioItem["type"], string> = {
    album: locale === "en" ? "Album" : "Album",
    case_study: locale === "en" ? "Case study" : "Case study",
    showreel: locale === "en" ? "Showreel" : "Showreel",
  };
  const categoryLabel =
    portfolio.tags?.[0] || typeLabelMap[portfolio.type] || "Portfolio";
  const concept = resolveLocalizedString(
    portfolio.seoDescription_i18n,
    locale,
    ""
  );

  return (
    <PortfolioStory
      locale={locale}
      portfolio={portfolio}
      hero={hero}
      gallery={gallery}
      dateLabel={dateLabel}
      categoryLabel={categoryLabel}
      concept={concept}
      nextProject={related[0]}
    />
  );
}
