import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { Blog } from "@/types/blog";
import type { Service } from "@/types/service";
import type { PortfolioItem } from "@/types/portfolio";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import {
  fetchPublicBlogBySlug,
  fetchPublicBlogs,
} from "@/lib/api/blogs.public";
import { fetchPublicServices } from "@/lib/api/services.public";
import { fetchPublicPortfolios } from "@/lib/api/portfolios.public";
import { formatDate, normalizeTocIds, resolveSlug } from "@/lib/blogs";
import { resolveLocalizedString } from "@/lib/i18n";
import LexicalContentRenderer, {
  extractHeadingsFromLexical,
} from "@/components/blog/LexicalContentRenderer";
import BlogViewTracker from "@/components/blog/BlogViewTracker";
import BlogDetailMotion from "@/components/blog/BlogDetailMotion";
import BlogLocaleBridge from "@/components/blog/BlogLocaleBridge";
import BlogTocPanel from "@/components/blog/BlogTocPanel";
import ShareRow from "@/components/blog/ShareRow";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

type PageParams = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const blog = await fetchPublicBlogBySlug(slug, locale);

  if (!blog) {
    return {
      title: { absolute: t("metaTitle") },
      description: t("metaDescription"),
    };
  }

  const title =
    blog.metaTitle ||
    resolveLocalizedString(blog.seoTitle_i18n, locale, "") ||
    resolveLocalizedString(blog.title_i18n, locale, t("metaTitle"));
  const description =
    blog.metaDescription ||
    resolveLocalizedString(blog.seoDescription_i18n, locale, "") ||
    resolveLocalizedString(blog.excerpt_i18n, locale, t("metaDescription"));
  const canonicalSlug = blog.slug || slug;
  const prefix = getLocalePrefix(locale);
  const canonical =
    blog.canonicalUrl ||
    (prefix
      ? `${BASE_URL}${prefix}/blogs/${canonicalSlug}`
      : `${BASE_URL}/blogs/${canonicalSlug}`);
  const ogImage =
    blog.ogImageUrl || blog.ogImage || blog.coverImage?.url || DEFAULT_OG_IMAGE;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/blogs/${canonicalSlug}`,
        en: `${BASE_URL}/en/blogs/${canonicalSlug}`,
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

function buildListHref(locale: Locale) {
  const prefix = getLocalePrefix(locale);
  return `${prefix}/blogs` || "/blogs";
}

function buildDetailHref(locale: Locale, slug: string) {
  const prefix = getLocalePrefix(locale);
  return `${prefix}/blogs/${slug}` || `/blogs/${slug}`;
}

function getCoverAlt(blog: Blog, locale: Locale) {
  return resolveLocalizedString(blog.coverImage?.alt_i18n, locale, "");
}

export default async function BlogDetailPage({ params }: PageParams) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const blog = await fetchPublicBlogBySlug(slug, locale);
  if (!blog) notFound();

  const title = resolveLocalizedString(
    blog.title_i18n ?? (blog as { title?: string }).title,
    locale
  );
  const excerpt = resolveLocalizedString(
    blog.excerpt_i18n ?? (blog as { excerpt?: string }).excerpt,
    locale
  );
  const cover = blog.coverImage?.url;
  const dateLabel = formatDate(blog.publishedAt || blog.createdAt, locale);
  const authorName = blog.authorName || "G-Bros";
  const viewCount = blog.stats?.viewCount;
  const rawContent =
    blog.content_i18n?.[locale] ||
    blog.content_i18n?.[locale === "vi" ? "en" : "vi"] ||
    blog.content ||
    null;
  const contentDoc =
    typeof rawContent === "string" ? safeParseDoc(rawContent) : rawContent;
  const tocRaw =
    blog.toc_i18n?.[locale] ||
    (contentDoc ? extractHeadingsFromLexical(contentDoc) : []);
  const tocItems = normalizeTocIds(tocRaw || []);
  const shareUrl = `${BASE_URL}${getLocalePrefix(locale)}/blogs/${
    blog.slug || slug
  }`;

  let latestPosts: Blog[] = [];
  let relatedServices: Service[] = [];
  let relatedPortfolios: PortfolioItem[] = [];
  try {
    const requests: Promise<unknown>[] = [
      fetchPublicBlogs({
        locale,
        page: 1,
        limit: 4,
        sort: "-publishedAt",
      }),
    ];
    if (blog.relatedServiceIds?.length) {
      requests.push(
        fetchPublicServices({
          locale,
          page: 1,
          limit: 12,
          sort: "-publishedAt",
        })
      );
    }
    if (blog.relatedPortfolioIds?.length) {
      requests.push(
        fetchPublicPortfolios({
          locale,
          page: 1,
          limit: 12,
          sort: "-publishedAt",
        })
      );
    }

    const [latestData, servicesData, portfoliosData] = (await Promise.all(
      requests
    )) as [
      { items: Blog[] },
      { items: Service[] } | undefined,
      { items: PortfolioItem[] } | undefined
    ];

    latestPosts = (latestData.items || [])
      .filter((item) => item._id !== blog._id)
      .slice(0, 3);

    if (servicesData?.items && blog.relatedServiceIds?.length) {
      relatedServices = servicesData.items.filter((item) =>
        blog.relatedServiceIds?.includes(item._id)
      );
    }
    if (portfoliosData?.items && blog.relatedPortfolioIds?.length) {
      relatedPortfolios = portfoliosData.items.filter((item) =>
        blog.relatedPortfolioIds?.includes(item._id)
      );
    }
  } catch (error) {
    console.error("FETCH_LATEST_BLOGS_FAILED", error);
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <BlogDetailMotion>
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 md:px-6 lg:px-8">
          <BlogLocaleBridge slug={blog.slug} slugI18n={blog.slug_i18n} />
          <BlogViewTracker blogId={blog._id} />
          <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-neutral-900 text-white shadow-[0_35px_90px_-60px_rgba(15,23,42,0.8)]">
            {cover ? (
              <img
                src={cover}
                alt={getCoverAlt(blog, locale) || title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative space-y-4 px-6 py-10 md:px-10 md:py-14">
              <Link
                href={buildListHref(locale)}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur"
              >
                {t("backToBlog")}
              </Link>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
                {title}
              </h1>
              {excerpt ? (
                <p className="max-w-2xl text-sm text-white/85 md:text-base">
                  {excerpt}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-4 text-xs text-white/80">
                {dateLabel ? (
                  <span>
                    {t("updatedLabel")} {dateLabel}
                  </span>
                ) : null}
                <span>
                  {t("byLabel")} {authorName}
                </span>
                {typeof viewCount === "number" ? (
                  <span>
                    {viewCount} {t("viewsLabel")}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <BlogTocPanel items={tocItems} title={t("tocTitle")} />
              <article className="prose prose-neutral max-w-none text-neutral-800 prose-headings:scroll-mt-24 prose-img:rounded-2xl prose-img:border">
                <LexicalContentRenderer
                  doc={contentDoc}
                  toc={tocItems}
                  locale={locale}
                />
              </article>
              <ShareRow url={shareUrl} />
              {relatedServices.length ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                    {locale === "en" ? "Related services" : "Related services"}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {relatedServices.slice(0, 4).map((item) => (
                      <Link
                        key={item._id}
                        href={`${getLocalePrefix(locale)}/services/${
                          item.slug
                        }`}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-semibold text-neutral-900 transition hover:border-neutral-900"
                      >
                        {resolveLocalizedString(
                          item.title_i18n ?? (item as { title?: string }).title,
                          locale
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {relatedPortfolios.length ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                    {locale === "en"
                      ? "Related portfolios"
                      : "Related portfolios"}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {relatedPortfolios.slice(0, 4).map((item) => (
                      <Link
                        key={item._id}
                        href={`${getLocalePrefix(locale)}/portfolios/${
                          item.slug
                        }`}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-semibold text-neutral-900 transition hover:border-neutral-900"
                      >
                        {resolveLocalizedString(
                          item.title_i18n ?? (item as { title?: string }).title,
                          locale
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  {t("latestTitle")}
                </p>
                <div className="mt-4 space-y-3">
                  {latestPosts.length === 0 ? (
                    <p className="text-sm text-neutral-500">{t("empty")}</p>
                  ) : (
                    latestPosts.map((item) => {
                      const itemSlug =
                        item.slug || resolveSlug(item.slug_i18n, locale);
                      const itemTitle = resolveLocalizedString(
                        item.title_i18n ?? (item as { title?: string }).title,
                        locale
                      );
                      const itemCover = item.coverImage?.url;
                      const detailHref = buildDetailHref(locale, itemSlug);
                      return (
                        <Link
                          key={item._id}
                          href={detailHref}
                          className="flex items-center gap-3 rounded-2xl border border-transparent p-2 transition hover:border-slate-200/70 hover:bg-neutral-100"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                            {itemCover ? (
                              <img
                                src={itemCover}
                                alt={getCoverAlt(item, locale) || itemTitle}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 line-clamp-2">
                              {itemTitle}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatDate(
                                item.publishedAt || item.createdAt,
                                locale
                              )}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </BlogDetailMotion>
    </main>
  );
}

function safeParseDoc(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
