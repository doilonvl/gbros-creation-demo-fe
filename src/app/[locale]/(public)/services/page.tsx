import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { Service } from "@/types/service";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { fetchPublicServices } from "@/lib/api/services.public";
import { resolveLocalizedString } from "@/lib/i18n";
import { resolveSlug } from "@/lib/blogs";
import { SERVICE_CATEGORIES, INDUSTRIES } from "@/data/publicTaxonomy";
import QueryFilterPopover from "@/components/common/QueryFilterPopover";
import QuerySearchBox from "@/components/common/QuerySearchBox";
import SectionHeading from "@/components/sections/public/SectionHeading";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

const CATEGORY_TABS = [
  { key: "", label: { vi: "Tat ca", en: "All" } },
  ...SERVICE_CATEGORIES,
];

type PageParams = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    page?: string;
    category?: string;
    industry?: string;
    search?: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  const prefix = getLocalePrefix(locale);
  const canonical = prefix
    ? `${BASE_URL}${prefix}/services`
    : `${BASE_URL}/services`;

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/services`,
        en: `${BASE_URL}/en/services`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

function isObjectId(value?: string) {
  return Boolean(value && /^[a-fA-F0-9]{24}$/.test(value));
}

function sortServices(items: Service[]) {
  return [...items].sort((a, b) => {
    const featuredScore =
      Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    if (featuredScore !== 0) return featuredScore;
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });
}

export default async function ServicesPage({
  params,
  searchParams,
}: PageParams) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(sp.page || 1));
  const category = sp.category || "";
  const industry = sp.industry || "";
  const search = sp.search || "";
  const limit = 9;
  const t = await getTranslations({ locale, namespace: "services" });

  let items: Service[] = [];
  let total = 0;

  try {
    const categoryId = isObjectId(category) ? category : undefined;
    const industryId = isObjectId(industry) ? industry : undefined;
    const data = await fetchPublicServices({
      locale,
      page,
      limit,
      sort: "-publishedAt",
      categoryId,
      industryId,
    });
    items = data.items || [];
    total = data.total || 0;
  } catch (error) {
    console.error("FETCH_SERVICES_FAILED", error);
  }

  let filtered = items;
  const hasTags = items.some((item) => (item.tags || []).length > 0);
  if (category && !isObjectId(category) && hasTags) {
    filtered = filtered.filter((item) => item.tags?.includes(category));
  }
  if (industry && !isObjectId(industry) && hasTags) {
    filtered = filtered.filter((item) => item.tags?.includes(industry));
  }
  if (search) {
    const needle = search.toLowerCase();
    filtered = filtered.filter((item) => {
      const title = resolveLocalizedString(
        item.title_i18n ?? (item as { title?: string }).title,
        locale
      ).toLowerCase();
      const excerpt = resolveLocalizedString(
        item.excerpt_i18n ?? (item as { excerpt?: string }).excerpt,
        locale
      ).toLowerCase();
      return title.includes(needle) || excerpt.includes(needle);
    });
  }

  const sorted = sortServices(filtered);
  const hasNext = page * limit < total;
  const nextParams = new URLSearchParams();
  if (category) nextParams.set("category", category);
  if (industry) nextParams.set("industry", industry);
  if (search) nextParams.set("search", search);
  nextParams.set("page", String(page + 1));
  const nextHref = `?${nextParams.toString()}`;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="relative overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0">
          <img
            src="/Home/hero.jpg"
            alt="Services"
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 md:px-6 lg:px-8">
          <SectionHeading
            kicker={locale === "en" ? "Services" : "Dich vu"}
            title={t("title")}
            description={t("subtitle")}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/60 bg-white/95 p-4 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)]">
          <QueryFilterPopover
            label={locale === "en" ? "Category" : "Dich vu"}
            param="category"
            options={CATEGORY_TABS.map((tab) => ({
              value: tab.key || undefined,
              label: locale === "en" ? tab.label.en : tab.label.vi,
            }))}
          />
          <QueryFilterPopover
            label={locale === "en" ? "Industry" : "Nganh"}
            param="industry"
            options={[
              { label: locale === "en" ? "All" : "Tat ca" },
              ...INDUSTRIES.map((industryItem) => ({
                label:
                  locale === "en"
                    ? industryItem.label.en
                    : industryItem.label.vi,
                value: industryItem.id,
              })),
            ]}
          />
          <div className="ml-auto flex items-center gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              {total} {locale === "en" ? "services" : "dich vu"}
            </p>
            <QuerySearchBox
              param="search"
              placeholder={locale === "en" ? "Search services" : "Tim dich vu"}
              variant="collapse"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              {t("empty")}
            </div>
          ) : (
            sorted.map((item) => {
              const title = resolveLocalizedString(
                item.title_i18n ?? (item as { title?: string }).title,
                locale
              );
              const excerpt = resolveLocalizedString(
                item.excerpt_i18n ?? (item as { excerpt?: string }).excerpt,
                locale
              );
              const href = `${getLocalePrefix(locale)}/services/${
                item.slug || resolveSlug(item.slug_i18n, locale)
              }`;
              const priceLabel =
                locale === "en" ? "Contact for price" : "Lien he bao gia";
              return (
                <article
                  key={item._id}
                  className="group overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_70px_-60px_rgba(15,23,42,0.6)] transition hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    <img
                      src={
                        item.coverAsset?.url ||
                        item.coverAsset?.thumbnailUrl ||
                        item.ogImageUrl ||
                        "/Home/hero.jpg"
                      }
                      alt={title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-3 px-5 pb-5 pt-4">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {title}
                    </h3>
                    {excerpt ? (
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {excerpt}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {(item.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
                      <span>{priceLabel}</span>
                      <Link
                        href={href}
                        className="rounded-full border border-neutral-300 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
                      >
                        {locale === "en" ? "View" : "Xem chi tiet"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {hasNext ? (
          <div className="mt-10 flex justify-center">
            <Link
              href={nextHref}
              className="inline-flex rounded-full border border-neutral-300 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {locale === "en" ? "Load more" : "Xem them"}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
