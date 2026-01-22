import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import { fetchPublicBlogs } from "@/lib/api/blogs.public";
import { fetchPublicPortfolios } from "@/lib/api/portfolios.public";
import HomeHero from "@/components/sections/public/HomeHero";
import PortfolioHighlight from "@/components/sections/public/PortfolioHighlight";
import IntroCallout from "@/components/sections/public/IntroCallout";
import VideoShowcase from "@/components/sections/public/VideoShowcase";
import FeaturedBlogs from "@/components/sections/public/FeaturedBlogs";
import { SERVICE_CATEGORIES } from "@/data/publicTaxonomy";
import type { PortfolioItem } from "@/types/portfolio";
import type { Blog } from "@/types/blog";

export const revalidate = 300;

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;

const HOME_META = {
  vi: {
    title: "G-Bros Creation | Photo, Video, Styling, Design",
    description:
      "Studio creative production for photo, video, styling, and design campaigns.",
  },
  en: {
    title: "G-Bros Creation | Photo, Video, Styling, Design",
    description:
      "Studio creative production for photo, video, styling, and design campaigns.",
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

const HERO_SLIDES = [
  {
    id: "photo",
    image: "/Home/prompt-eg-1.jpg",
    heading: "Luxury photo narratives for modern brands.",
    subheading:
      "Editorial-grade visuals with lighting, composition, and styling that elevate every campaign.",
  },
  {
    id: "video",
    image: "/Home/prompt-1.jpg",
    heading: "Video stories that move with your audience.",
    subheading:
      "From showreels to case studies, we choreograph motion, sound, and pace.",
  },
  {
    id: "styling",
    image: "/Home/prompt-eg-2.jpg",
    heading: "Styling crafted for taste, mood, and balance.",
    subheading:
      "Props, surfaces, and set design curated to feel tactile and premium.",
  },
  {
    id: "design",
    image: "/Home/case-study-1.jpg",
    heading: "Design systems with sharp visual hierarchy.",
    subheading:
      "Key visuals, print, and layout direction that keeps every detail intentional.",
  },
  {
    id: "other",
    image: "/Home/case-study-2.jpg",
    heading: "Creative support for complex launches.",
    subheading:
      "A flexible production partner for campaigns that demand precision.",
  },
  {
    id: "portfolio",
    image: "/Home/case-study-3.jpg",
    heading: "Selected works across photo, video, and design.",
    subheading:
      "Explore a curated portfolio of studio-led concepts and collaborations.",
  },
];

const SERVICE_TILES = [
  {
    id: "photo",
    label: "Photo",
    tagline: "Campaign and catalog",
    slideId: "photo",
  },
  {
    id: "video",
    label: "Video",
    tagline: "Showreel and case study",
    slideId: "video",
  },
  {
    id: "styling",
    label: "Styling",
    tagline: "Props and set design",
    slideId: "styling",
  },
  {
    id: "design",
    label: "Design",
    tagline: "Print and key visual",
    slideId: "design",
  },
  {
    id: "other",
    label: "Other",
    tagline: "Creative support",
    slideId: "other",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    tagline: "Featured works",
    slideId: "portfolio",
  },
];

const HOME_VIDEOS = [
  {
    id: "v1",
    title: "Showreel",
    provider: "youtube" as const,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/Home/prompt-1.jpg",
  },
  {
    id: "v2",
    title: "Behind the scenes",
    provider: "youtube" as const,
    url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    thumbnail: "/Home/prompt-2.jpg",
  },
  {
    id: "v3",
    title: "Case study",
    provider: "vimeo" as const,
    url: "https://vimeo.com/76979871",
    thumbnail: "/Home/case-study-2.jpg",
  },
];

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;

  const pageUrl = `${BASE_URL}${getLocalePrefix(locale)}`;

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${pageUrl}#studio`,
        name: "G-Bros Creation",
        url: pageUrl,
        description:
          "Creative studio for photo, video, styling, and design production.",
        image: `${BASE_URL}/Logo/Logo1.jpg`,
        address: {
          addressLocality: "Ho Chi Minh City",
          addressCountry: "VN",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        name: "G-Bros Creation",
        url: pageUrl,
        inLanguage: locale === "en" ? "en" : "vi-VN",
      },
    ],
  };

  let portfolios: PortfolioItem[] = [];
  let blogs: Blog[] = [];

  try {
    const [portfolioRes, blogRes] = await Promise.all([
      fetchPublicPortfolios({
        locale,
        limit: 12,
        page: 1,
        sort: "-publishedAt",
      }),
      fetchPublicBlogs({
        locale,
        limit: 4,
        page: 1,
        sort: "-publishedAt",
      }),
    ]);
    portfolios = portfolioRes.items || [];
    blogs = blogRes.items || [];
  } catch (error) {
    console.error("HOME_PUBLIC_FETCH_FAILED", error);
  }

  const tabs = [
    { key: "all", label: locale === "en" ? "All" : "Tat ca" },
    ...SERVICE_CATEGORIES.map((cat) => ({
      key: cat.key,
      label: locale === "en" ? cat.label.en : cat.label.vi,
    })),
  ];

  return (
    <main className="min-h-screen bg-neutral-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomeHero slides={HERO_SLIDES} tiles={SERVICE_TILES} />
      <PortfolioHighlight locale={locale} items={portfolios} tabs={tabs} />
      <IntroCallout locale={locale} />
      <VideoShowcase locale={locale} videos={HOME_VIDEOS} />
      <FeaturedBlogs locale={locale} items={blogs} />
    </main>
  );
}
