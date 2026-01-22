import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { ServicePackage, AddOn } from "@/types/service";
import type { Blog } from "@/types/blog";
import type { PortfolioItem } from "@/types/portfolio";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { getCloudinarySizedUrl } from "@/lib/media";
import { fetchPublicServiceBySlug } from "@/lib/api/services.public";
import { fetchPublicBlogs } from "@/lib/api/blogs.public";
import { fetchPublicPortfolios } from "@/lib/api/portfolios.public";
import { resolveLocalizedString } from "@/lib/i18n";
import { resolveSlug } from "@/lib/blogs";
import MediaLightbox from "@/components/common/MediaLightbox";
import type { LightboxItem } from "@/components/common/MediaLightbox";
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

const FALLBACK_PACKAGES: ServicePackage[] = [
  {
    name_i18n: { vi: "Starter", en: "Starter" },
    price: { currency: "VND", amount: 8500000, isFrom: true, unit: "project" },
    included_i18n: [
      { vi: "2 concept", en: "2 concepts" },
      { vi: "10 final edits", en: "10 final edits" },
    ],
    turnaroundDays: 5,
    revisionsIncluded: 2,
  },
  {
    name_i18n: { vi: "Signature", en: "Signature" },
    price: { currency: "VND", amount: 15000000, isFrom: true, unit: "project" },
    included_i18n: [
      { vi: "4 concept", en: "4 concepts" },
      { vi: "20 final edits", en: "20 final edits" },
    ],
    turnaroundDays: 7,
    revisionsIncluded: 3,
  },
];

const FALLBACK_ADDONS: AddOn[] = [
  {
    name_i18n: { vi: "Styling support", en: "Styling support" },
    price: { currency: "VND", amount: 2000000, isFrom: true, unit: "day" },
    conditions_i18n: { vi: "On-set support", en: "On-set support" },
  },
  {
    name_i18n: { vi: "Extra retouch", en: "Extra retouch" },
    price: { currency: "VND", amount: 350000, isFrom: false, unit: "image" },
    conditions_i18n: { vi: "Per approved image", en: "Per approved image" },
  },
];

type PageParams = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  const service = await fetchPublicServiceBySlug(slug, locale);

  if (!service) {
    return {
      title: { absolute: t("metaTitle") },
      description: t("metaDescription"),
    };
  }

  const title =
    resolveLocalizedString(service.seoTitle_i18n, locale, "") ||
    resolveLocalizedString(service.title_i18n, locale, t("metaTitle"));
  const description =
    resolveLocalizedString(service.seoDescription_i18n, locale, "") ||
    resolveLocalizedString(service.excerpt_i18n, locale, t("metaDescription"));
  const prefix = getLocalePrefix(locale);
  const canonical =
    service.canonicalUrl ||
    (prefix
      ? `${BASE_URL}${prefix}/services/${service.slug}`
      : `${BASE_URL}/services/${service.slug}`);
  const ogImage =
    service.coverAsset?.url ||
    service.coverAsset?.thumbnailUrl ||
    service.ogImageUrl ||
    DEFAULT_OG_IMAGE;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/services/${service.slug}`,
        en: `${BASE_URL}/en/services/${service.slug}`,
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

function formatPrice(
  amount?: number,
  locale?: Locale,
  unit?: string,
  isFrom?: boolean
) {
  if (!amount) return locale === "en" ? "Contact" : "Lien he";
  const value = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "vi-VN"
  ).format(amount);
  const prefix = isFrom ? (locale === "en" ? "From" : "Tu") : "";
  const unitLabel = unit ? `/${unit}` : "";
  return `${prefix ? `${prefix} ` : ""}${value} VND${unitLabel}`;
}

export default async function ServiceDetailPage({ params }: PageParams) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "services" });

  const service = await fetchPublicServiceBySlug(slug, locale);
  if (!service) notFound();

  const title = resolveLocalizedString(
    service.title_i18n ?? (service as { title?: string }).title,
    locale
  );
  const excerpt = resolveLocalizedString(
    service.excerpt_i18n ?? (service as { excerpt?: string }).excerpt,
    locale
  );
  const highlights = (service.highlights_i18n || []).map((item) =>
    resolveLocalizedString(item, locale)
  );
  const scopeLabel = resolveLocalizedString(
    service.scopeLabel_i18n ?? (service as { scopeLabel?: string }).scopeLabel,
    locale
  );
  const steps = (service.includedSteps_i18n || []).map((item) =>
    resolveLocalizedString(item, locale)
  );

  let relatedPortfolios: PortfolioItem[] = [];
  let relatedBlogs: Blog[] = [];

  try {
    const [portfolioRes, blogRes] = await Promise.all([
      fetchPublicPortfolios({
        locale,
        page: 1,
        limit: 6,
        sort: "-publishedAt",
        serviceId: service._id ? service._id : undefined,
      }),
      fetchPublicBlogs({
        locale,
        page: 1,
        limit: 6,
        sort: "-publishedAt",
      }),
    ]);

    relatedPortfolios = portfolioRes.items || [];
    relatedBlogs = (blogRes.items || []).filter((blog) =>
      blog.relatedServiceIds?.includes(service._id)
    );
  } catch (error) {
    console.error("FETCH_RELATED_FAILED", error);
  }

  const packages = FALLBACK_PACKAGES;
  const addons = FALLBACK_ADDONS;
  const galleryItems: LightboxItem[] = service.galleryAssets?.length
    ? service.galleryAssets.flatMap((asset) => {
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

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="relative overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0">
          <img
            src={
              service.coverAsset?.url ||
              service.coverAsset?.thumbnailUrl ||
              service.ogImageUrl ||
              "/Home/hero.jpg"
            }
            alt={title}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 md:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            {locale === "en" ? "Service" : "Dich vu"}
          </p>
          <h1 className="mt-4 font-[var(--font-caladea)] text-4xl md:text-5xl">
            {title}
          </h1>
          {excerpt ? (
            <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">
              {excerpt}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${getLocalePrefix(
                locale
              )}/contact?service=${encodeURIComponent(service.slug)}`}
              className="rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900"
            >
              {locale === "en" ? "Book service" : "Dang ky dich vu"}
            </Link>
            <Link
              href={`${getLocalePrefix(locale)}/portfolios`}
              className="rounded-full border border-white/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/80"
            >
              {locale === "en" ? "View portfolio" : "Xem portfolio"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-12 px-4 py-16 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-10">
            {highlights.length ? (
              <div>
                <SectionHeading
                  title={locale === "en" ? "Highlights" : "Noi bat"}
                />
                <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                  {highlights.map((item, index) => (
                    <li key={`${item}-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {scopeLabel ? (
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  {locale === "en" ? "Scope" : "Pham vi"}
                </p>
                <p className="mt-3 text-sm text-neutral-700">{scopeLabel}</p>
              </div>
            ) : null}

            {steps.length ? (
              <div>
                <SectionHeading
                  title={locale === "en" ? "Included steps" : "Quy trinh"}
                />
                <ol className="mt-4 space-y-3 text-sm text-neutral-700">
                  {steps.map((step, index) => (
                    <li key={`${step}-${index}`} className="flex gap-3">
                      <span className="text-xs font-semibold text-neutral-500">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div>
              <SectionHeading title={locale === "en" ? "Gallery" : "Gallery"} />
              <MediaLightbox items={galleryItems} className="mt-6" />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                {locale === "en" ? "Tags" : "Tags"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(service.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div>
          <SectionHeading
            title={locale === "en" ? "Packages" : "Goi dich vu"}
            description={
              locale === "en"
                ? "Flexible tiers to match your production scope."
                : "Lua chon goi phu hop quy mo san xuat."
            }
          />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {packages.map((pkg) => {
              const name = resolveLocalizedString(pkg.name_i18n, locale);
              const price = formatPrice(
                pkg.price?.amount,
                locale,
                pkg.price?.unit,
                pkg.price?.isFrom
              );
              const serviceQuery = encodeURIComponent(service.slug);
              const packageQuery = encodeURIComponent(pkg.slug || name);
              return (
                <article
                  key={name}
                  className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {name}
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      {price}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                    {(pkg.included_i18n || []).map((item, index) => (
                      <li key={`${name}-${index}`}>
                        - {resolveLocalizedString(item, locale)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
                    {pkg.turnaroundDays ? (
                      <span>{pkg.turnaroundDays} days</span>
                    ) : null}
                    {pkg.revisionsIncluded ? (
                      <span>{pkg.revisionsIncluded} revisions</span>
                    ) : null}
                  </div>
                  {pkg.deliverables?.length ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
                      <table className="w-full text-left text-xs text-neutral-600">
                        <thead className="bg-neutral-50 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pkg.deliverables.map((item) => (
                            <tr
                              key={item.key}
                              className="border-t border-neutral-200"
                            >
                              <td className="px-3 py-2">
                                {resolveLocalizedString(
                                  item.label_i18n,
                                  locale
                                )}
                                {item.specs ? (
                                  <div className="mt-1 space-y-1 text-[10px] text-neutral-500">
                                    {Object.entries(item.specs).map(
                                      ([key, value]) => (
                                        <div key={key}>
                                          {key}: {String(value)}
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-3 py-2">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  <Link
                    href={`${getLocalePrefix(
                      locale
                    )}/contact?service=${serviceQuery}&package=${packageQuery}`}
                    className="mt-6 inline-flex rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
                  >
                    {locale === "en" ? "Book this package" : "Dang ky goi nay"}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <SectionHeading title={locale === "en" ? "Add-ons" : "Add-on"} />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {addons.map((addon) => {
              const name = resolveLocalizedString(addon.name_i18n, locale);
              const price = formatPrice(
                addon.price?.amount,
                locale,
                addon.price?.unit,
                addon.price?.isFrom
              );
              return (
                <article
                  key={name}
                  className="rounded-3xl border border-neutral-200 bg-white p-6"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {name}
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      {price}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-neutral-600">
                    {resolveLocalizedString(addon.conditions_i18n, locale)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {relatedPortfolios.length ? (
          <div>
            <SectionHeading
              title={
                locale === "en" ? "Related portfolio" : "Portfolio lien quan"
              }
            />
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedPortfolios.slice(0, 3).map((item) => (
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
                          "/Home/case-study-1.jpg"
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

        {relatedBlogs.length ? (
          <div>
            <SectionHeading
              title={locale === "en" ? "Related blogs" : "Blog lien quan"}
            />
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedBlogs.slice(0, 3).map((item) => {
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
                        src={item.coverImage?.url || "/Home/case-study-2.jpg"}
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

        {!relatedBlogs.length && !relatedPortfolios.length ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
            {t("empty")}
          </div>
        ) : null}
      </section>
    </main>
  );
}
