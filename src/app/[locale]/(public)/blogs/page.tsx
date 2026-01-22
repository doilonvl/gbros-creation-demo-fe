import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { fetchPublicBlogs } from "@/lib/api/blogs.public";
import { resolveSlug } from "@/lib/blogs";
import { resolveLocalizedString } from "@/lib/i18n";
import type { Blog } from "@/types/blog";
import TabsFilter from "@/components/common/TabsFilter";
import SectionHeading from "@/components/sections/public/SectionHeading";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

type PageParams = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ page?: string; tag?: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const prefix = getLocalePrefix(locale);
  const canonical = prefix ? `${BASE_URL}${prefix}/blogs` : `${BASE_URL}/blogs`;

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/blogs`,
        en: `${BASE_URL}/en/blogs`,
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

function buildDetailHref(locale: Locale, slug: string) {
  const prefix = getLocalePrefix(locale);
  return `${prefix}/blogs/${slug}` || `/blogs/${slug}`;
}

function getCoverAlt(blog: Blog, locale: Locale) {
  return resolveLocalizedString(blog.coverImage?.alt_i18n, locale, "");
}

export default async function BlogsPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(sp.page || 1));
  const tag = sp.tag?.trim() || undefined;
  const limit = 9;
  const t = await getTranslations({ locale, namespace: "blog" });

  let listData: { items: Blog[]; total: number } | null = null;

  try {
    listData = await fetchPublicBlogs({
      locale,
      page,
      limit,
      sort: "-publishedAt",
      tag,
    });
  } catch (error) {
    console.error("FETCH_BLOGS_FAILED", error);
  }

  const items = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const hasNext = page * limit < total;

  const tagOptions = Array.from(
    new Set(items.flatMap((item) => item.tags || []))
  ).slice(0, 6);

  const featured = items.slice(0, 3);
  const list = items.slice(3);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 md:px-6 lg:px-8">
        <SectionHeading
          kicker="Blog"
          title={t("title")}
          description={t("subtitle")}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featured.map((item, index) => {
            const slug = item.slug || resolveSlug(item.slug_i18n, locale);
            const href = buildDetailHref(locale, slug);
            const title = resolveLocalizedString(
              item.title_i18n ?? (item as { title?: string }).title,
              locale
            );
            const excerpt = resolveLocalizedString(
              item.excerpt_i18n ?? (item as { excerpt?: string }).excerpt,
              locale
            );
            return (
              <Link
                key={item._id}
                href={href}
                className={`group relative overflow-hidden rounded-3xl border border-white/60 bg-neutral-900 text-white shadow-[0_30px_70px_-60px_rgba(15,23,42,0.6)] ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <img
                  src={item.coverImage?.url || "/Home/hero.jpg"}
                  alt={getCoverAlt(item, locale) || title}
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
                />
                <div className="relative z-10 flex h-full flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    {t("featuredLabel")}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
                  {excerpt ? (
                    <p className="mt-2 text-sm text-white/80 line-clamp-2">
                      {excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <TabsFilter
            param="tag"
            tabs={[
              { label: locale === "en" ? "All" : "Tat ca" },
              ...tagOptions.map((value) => ({ label: value, value })),
            ]}
          />
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            {total} {locale === "en" ? "posts" : "bai viet"}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              {t("emptyBody")}
            </div>
          ) : (
            list.map((item) => {
              const slug = item.slug || resolveSlug(item.slug_i18n, locale);
              const href = buildDetailHref(locale, slug);
              const title = resolveLocalizedString(
                item.title_i18n ?? (item as { title?: string }).title,
                locale
              );
              const excerpt = resolveLocalizedString(
                item.excerpt_i18n ?? (item as { excerpt?: string }).excerpt,
                locale
              );
              return (
                <Link
                  key={item._id}
                  href={href}
                  className="group overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_70px_-55px_rgba(15,23,42,0.6)] transition hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={item.coverImage?.url || "/Home/case-study-1.jpg"}
                      alt={getCoverAlt(item, locale) || title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-2 px-4 pb-4 pt-3">
                    <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">
                      {title}
                    </h3>
                    {excerpt ? (
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {excerpt}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {hasNext ? (
          <div className="mt-10 flex justify-center">
            <Link
              href={`?page=${page + 1}${tag ? `&tag=${tag}` : ""}`}
              className="inline-flex rounded-full border border-neutral-300 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {locale === "en" ? "Load more" : "Xem them"}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
