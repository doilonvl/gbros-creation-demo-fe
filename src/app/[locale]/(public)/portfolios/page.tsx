import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { PortfolioItem } from "@/types/portfolio";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { fetchPublicPortfolios } from "@/lib/api/portfolios.public";
import { resolveLocalizedString } from "@/lib/i18n";
import { SERVICE_CATEGORIES, INDUSTRIES } from "@/data/publicTaxonomy";
import QueryFilterPopover from "@/components/common/QueryFilterPopover";
import QuerySearchBox from "@/components/common/QuerySearchBox";
import PortfolioListGrid from "@/components/sections/public/PortfolioListGrid";
import SectionHeading from "@/components/sections/public/SectionHeading";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;
const PORTFOLIO_COLLAGE = [
  "/Home/case-study-1.jpg",
  "/Home/case-study-2.jpg",
  "/Home/case-study-3.jpg",
  "/Home/prompt-1.jpg",
  "/Home/prompt-2.jpg",
  "/Home/prompt-eg-1.jpg",
  "/Home/prompt-eg-2.jpg",
  "/Home/hero.jpg",
];
const PORTFOLIO_LAYOUT = [
  "col-span-5 row-span-6 rotate-1",
  "col-span-4 row-span-4 -rotate-1",
  "col-span-3 row-span-5 rotate-2",
  "col-span-4 row-span-5 -rotate-2",
  "col-span-5 row-span-4 rotate-1",
];

const TYPE_TABS = [
  { value: undefined, label: { vi: "Tat ca", en: "All" } },
  { value: "album", label: { vi: "Album", en: "Album" } },
  { value: "case_study", label: { vi: "Case study", en: "Case study" } },
  { value: "showreel", label: { vi: "Showreel", en: "Showreel" } },
];

type PageParams = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    page?: string;
    type?: string;
    service?: string;
    industry?: string;
    search?: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolios" });
  const prefix = getLocalePrefix(locale);
  const canonical = prefix
    ? `${BASE_URL}${prefix}/portfolios`
    : `${BASE_URL}/portfolios`;

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/portfolios`,
        en: `${BASE_URL}/en/portfolios`,
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

export default async function PortfoliosPage({
  params,
  searchParams,
}: PageParams) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(sp.page || 1));
  const type = sp.type || undefined;
  const service = sp.service || "";
  const industry = sp.industry || "";
  const search = sp.search || "";
  const limit = 9;
  const t = await getTranslations({ locale, namespace: "portfolios" });

  let items: PortfolioItem[] = [];
  let total = 0;

  try {
    const data = await fetchPublicPortfolios({
      locale,
      page,
      limit,
      sort: "-publishedAt",
      type: type || undefined,
      serviceId: isObjectId(service) ? service : undefined,
      industryId: isObjectId(industry) ? industry : undefined,
    });
    items = data.items || [];
    total = data.total || 0;
  } catch (error) {
    console.error("FETCH_PORTFOLIOS_FAILED", error);
  }

  let filtered = items;
  const hasTags = items.some((item) => (item.tags || []).length > 0);
  if (service && !isObjectId(service) && hasTags) {
    filtered = filtered.filter((item) => item.tags?.includes(service));
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
      return title.includes(needle);
    });
  }

  const hasNext = page * limit < total;
  const tagCounts = new Map<string, number>();
  filtered.forEach((item) => {
    (item.tags || []).forEach((tag) => {
      if (!tag) return;
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const tagTabs = Array.from(tagCounts.entries())
    .sort((a, b) => {
      const countDelta = b[1] - a[1];
      if (countDelta !== 0) return countDelta;
      return a[0].localeCompare(b[0]);
    })
    .map(([tag]) => tag)
    .slice(0, 8);
  const nextParams = new URLSearchParams();
  if (type) nextParams.set("type", type);
  if (service) nextParams.set("service", service);
  if (industry) nextParams.set("industry", industry);
  if (search) nextParams.set("search", search);
  nextParams.set("page", String(page + 1));
  const nextHref = `?${nextParams.toString()}`;

  return (
    <main className="min-h-screen bg-neutral-50">
      <section
        className="relative overflow-hidden"
        data-nav-theme="light"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-white to-neutral-100" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-28 md:grid-cols-[1.1fr_0.9fr] md:px-6 lg:px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-neutral-400">
              {locale === "en" ? "Portfolio" : "Portfolio"}
            </p>
            <h1 className="mt-5 text-4xl font-[var(--font-caladea)] uppercase tracking-[0.22em] text-neutral-900 md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-neutral-600">
              {t("subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-12 grid-rows-10 gap-4">
            {PORTFOLIO_COLLAGE.slice(0, 5).map((src, index) => (
              <div
                key={`${src}-${index}`}
                className={`relative overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)] ${PORTFOLIO_LAYOUT[index % PORTFOLIO_LAYOUT.length]}`}
              >
                <img src={src} alt="Portfolio" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/70 bg-white/95 p-4 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)]">
          <QueryFilterPopover
            label={locale === "en" ? "Type" : "Loai"}
            param="type"
            options={TYPE_TABS.map((tab) => ({
              value: tab.value,
              label: locale === "en" ? tab.label.en : tab.label.vi,
            }))}
          />
          <QueryFilterPopover
            label={locale === "en" ? "Service" : "Dich vu"}
            param="service"
            options={[
              { label: locale === "en" ? "All services" : "Tat ca" },
              ...SERVICE_CATEGORIES.map((cat) => ({
                label: locale === "en" ? cat.label.en : cat.label.vi,
                value: cat.key,
              })),
            ]}
          />
          <QueryFilterPopover
            label={locale === "en" ? "Industry" : "Nganh"}
            param="industry"
            options={[
              { label: locale === "en" ? "All industries" : "Tat ca" },
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
              {total} {locale === "en" ? "projects" : "bo suu tap"}
            </p>
            <QuerySearchBox
              param="search"
              placeholder={
                locale === "en" ? "Search portfolios" : "Tim portfolio"
              }
              variant="collapse"
            />
          </div>
        </div>

        <PortfolioListGrid
          items={filtered}
          locale={locale}
          tagTabs={tagTabs}
          emptyLabel={t("empty")}
        />

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
