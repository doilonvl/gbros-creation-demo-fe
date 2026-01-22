import Link from "next/link";
import type { Locale } from "@/types/content";
import type { Blog } from "@/types/blog";
import { resolveLocalizedString } from "@/lib/i18n";
import { formatDate, resolveSlug } from "@/lib/blogs";
import { getLocalePrefix } from "@/lib/routes";
import SectionHeading from "@/components/sections/public/SectionHeading";

type FeaturedBlogsProps = {
  locale: Locale;
  items: Blog[];
};

function withPrefix(locale: Locale, href: string) {
  return `${getLocalePrefix(locale)}${href}`;
}

export default function FeaturedBlogs({ locale, items }: FeaturedBlogsProps) {
  const featured = items[0];
  const secondary = items.slice(1, 4);
  if (!featured) return null;
  const featuredSlug = featured.slug || resolveSlug(featured.slug_i18n, locale);

  return (
    <section className="py-16" data-nav-theme="light">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          kicker="Blog"
          title={locale === "en" ? "Studio journal" : "Tin tuc moi nhat"}
          description={
            locale === "en"
              ? "Thoughts, behind-the-scenes, and tips for creative production."
              : "Goc chia se, hau truong va y tuong san xuat."
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Link
            href={withPrefix(locale, `/blogs/${featuredSlug}`)}
            className="group relative overflow-hidden rounded-3xl border border-white/60 bg-neutral-900 text-white"
          >
            <img
              src={featured.coverImage?.url || "/Home/hero.jpg"}
              alt={resolveLocalizedString(
                featured.coverImage?.alt_i18n,
                locale
              )}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
            />
            <div className="relative z-10 flex h-full flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                {formatDate(featured.publishedAt || featured.createdAt, locale)}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                {resolveLocalizedString(
                  featured.title_i18n ?? (featured as { title?: string }).title,
                  locale
                )}
              </h3>
              <p className="mt-2 text-sm text-white/80 line-clamp-2">
                {resolveLocalizedString(
                  featured.excerpt_i18n ??
                    (featured as { excerpt?: string }).excerpt,
                  locale
                )}
              </p>
            </div>
          </Link>

          <div className="space-y-4">
            {secondary.map((item) => (
              <Link
                key={item._id}
                href={withPrefix(
                  locale,
                  `/blogs/${item.slug || resolveSlug(item.slug_i18n, locale)}`
                )}
                className="group flex gap-4 rounded-2xl border border-neutral-200 bg-white/90 p-4 transition hover:-translate-y-1"
              >
                <div className="h-20 w-24 overflow-hidden rounded-xl bg-neutral-100">
                  <img
                    src={item.coverImage?.url || "/Home/case-study-1.jpg"}
                    alt={resolveLocalizedString(
                      item.coverImage?.alt_i18n,
                      locale
                    )}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                    {formatDate(item.publishedAt || item.createdAt, locale)}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-neutral-900 line-clamp-2">
                    {resolveLocalizedString(
                      item.title_i18n ?? (item as { title?: string }).title,
                      locale
                    )}
                  </h4>
                </div>
              </Link>
            ))}
            <Link
              href={withPrefix(locale, "/blogs")}
              className="inline-flex rounded-full border border-neutral-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {locale === "en" ? "View all" : "Xem them tin tuc"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
