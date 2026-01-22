import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import SectionHeading from "@/components/sections/public/SectionHeading";
import ContactForm from "@/components/sections/public/ContactForm";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

type PageParams = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const prefix = getLocalePrefix(locale);
  const canonical = prefix ? `${BASE_URL}${prefix}/contact` : `${BASE_URL}/contact`;

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/contact`,
        en: `${BASE_URL}/en/contact`,
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

const SERVICE_BLOCKS = [
  {
    key: "photo",
    title: "Photo",
    phone: "0900 000 000",
    email: "hello@g-bros.com",
  },
  {
    key: "video",
    title: "Video",
    phone: "0900 000 111",
    email: "video@g-bros.com",
  },
  {
    key: "styling",
    title: "Styling",
    phone: "0900 000 222",
    email: "styling@g-bros.com",
  },
  {
    key: "design",
    title: "Design",
    phone: "0900 000 333",
    email: "design@g-bros.com",
  },
];

export default async function ContactPage({ params }: PageParams) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-28 md:px-6 lg:px-8">
        <SectionHeading
          kicker={locale === "en" ? "Contact" : "Lien he"}
          title={t("title")}
          description={t("subtitle")}
        />
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-2 md:px-6 lg:grid-cols-4 lg:px-8">
        {SERVICE_BLOCKS.map((block) => (
          <article
            key={block.key}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
              {block.title}
            </p>
            <p className="mt-3 text-sm text-neutral-700">{block.phone}</p>
            <p className="text-sm text-neutral-700">{block.email}</p>
            <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-neutral-500">
              <Link href={`${getLocalePrefix(locale)}/services?category=${block.key}`}>
                {locale === "en" ? "Packages" : "Bang gia"}
              </Link>
              <Link href={`${getLocalePrefix(locale)}/portfolios`}>
                {locale === "en" ? "Portfolio" : "Portfolio"}
              </Link>
              <Link href={`${getLocalePrefix(locale)}/blogs`}>
                {locale === "en" ? "Blog" : "Blog"}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6 lg:px-8">
        <ContactForm locale={locale} />
      </section>
    </main>
  );
}
