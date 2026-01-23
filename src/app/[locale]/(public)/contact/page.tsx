import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
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

export default async function ContactPage({ params }: PageParams) {
  const { locale } = await params;
  const wall = [
    "/Home/case-study-1.jpg",
    "/Home/case-study-2.jpg",
    "/Home/case-study-3.jpg",
    "/Home/prompt-1.jpg",
    "/Home/prompt-2.jpg",
    "/Home/prompt-eg-1.jpg",
    "/Home/prompt-eg-2.jpg",
    "/Home/hero.jpg",
  ];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section
        className="mx-auto max-w-6xl px-4 pb-10 pt-28 md:px-6 lg:px-8"
        data-nav-theme="light"
      >
        <p className="text-[11px] uppercase tracking-[0.45em] text-neutral-400">
          {locale === "en" ? "Contact" : "Lien he"}
        </p>
        <h1 className="mt-6 text-4xl font-[var(--font-caladea)] uppercase tracking-[0.2em] md:text-6xl">
          {locale === "en" ? "Let's create magic together" : "Cung tao ra dieu ky dieu"}
        </h1>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 md:px-6 lg:px-8">
        <Link
          href="mailto:hello@gbros.vn"
          className="group flex flex-wrap items-center gap-4 text-[10vw] font-semibold leading-none tracking-tight text-neutral-900 md:text-[8vw]"
        >
          hello@gbros.vn
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-neutral-900/40">
            <ArrowUpRight className="h-5 w-5 translate-x-[-120%] text-neutral-900 transition duration-300 group-hover:translate-x-0" />
          </span>
        </Link>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 md:grid-cols-[1.2fr_0.8fr] md:px-6 lg:px-8">
        <ContactForm locale={locale} className="pt-4" />
        <div className="space-y-6 text-sm text-neutral-600">
          <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-400">
            {locale === "en" ? "Studio" : "Studio"}
          </p>
          <p>
            G-Bros Creation Studio<br />
            Ho Chi Minh City, Vietnam
          </p>
          <div className="space-y-2 text-[11px] uppercase tracking-[0.3em] text-neutral-600">
            <Link href="https://www.facebook.com/gbros.creation" target="_blank">
              Facebook
            </Link>
            <Link href="https://www.instagram.com/gbros.creation" target="_blank">
              Instagram
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.45em] text-neutral-400">
          {locale === "en" ? "Moodboard" : "Moodboard"}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => {
            const src = wall[index % wall.length];
            return (
              <div
                key={`${src}-${index}`}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
                <img src={src} alt="Moodboard" className="h-full w-full object-cover" />
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
