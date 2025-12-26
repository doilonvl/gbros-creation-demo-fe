import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import HeroSection from "@/components/sections/home/hero/HeroSection";
import IntroSection from "@/components/sections/home/intro/IntroSection";
import CaseStudiesSection from "@/components/sections/home/case-studies/CaseStudiesSection";
import CaseStudiesItems from "@/components/sections/home/case-studies/CaseStudiesItems";
import AbstractStrips from "@/components/sections/home/works/AbstractStrips";
import WorksSection from "@/components/sections/home/works/WorksSection";
import CarouselSection from "@/components/sections/home/works/CarouselSection";

export const revalidate = 300;

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

const HOME_META = {
  vi: {
    title: "Gmedia Vietnam | Photo, Video, Styling & Print",
    description:
      "End-to-end photography for all product categories, full video production for F&B, cosmetics, accessories, jewelry, plus styling and print design.",
  },
  en: {
    title: "Gmedia Vietnam | Photo, Video, Styling & Print",
    description:
      "End-to-end photography for all product categories, full video production for F&B, cosmetics, accessories, jewelry, plus styling and print design.",
  },
} as const;

function getLocalePrefix(locale: Locale) {
  return locale === "en" ? "/en" : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = HOME_META[locale === "en" ? "en" : "vi"];
  const prefix = getLocalePrefix(locale);
  const canonical = prefix ? `${BASE_URL}${prefix}` : `${BASE_URL}/`;

  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/`,
        en: `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;

  const baseUrl = BASE_URL;
  const localePrefix = locale === "en" ? "/en" : "";
  const pageUrl = localePrefix ? `${baseUrl}${localePrefix}` : `${baseUrl}/`;

  const alternateNames = ["Gmedia Vietnam", "GmediaVietnam", "gmediavietnam"];

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${pageUrl}#studio`,
        name: "Gmedia Vietnam",
        alternateName: alternateNames,
        url: pageUrl,
        description:
          "End-to-end photography, full video production, styling, and print design for product and brand campaigns.",
        image: `${baseUrl}/Logo/Logo1.jpg`,
        address: {
          addressLocality: "Hanoi",
          addressCountry: "VN",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        name: "Gmedia Vietnam",
        alternateName: alternateNames,
        url: pageUrl,
        inLanguage: locale === "en" ? "en" : "vi-VN",
      },
    ],
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HeroSection />
      <IntroSection />
      <CaseStudiesSection />
      <CaseStudiesItems />
      <AbstractStrips />
      <WorksSection />
      <CarouselSection />
    </main>
  );
}
