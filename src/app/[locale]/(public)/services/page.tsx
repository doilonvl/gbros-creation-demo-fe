import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import type { Service } from "@/types/service";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import { fetchPublicServices } from "@/lib/api/services.public";
import ServicesAccordion from "@/components/sections/public/ServicesAccordion";
import ServicesCreativeHero from "@/components/sections/public/ServicesCreativeHero";
import ServicesCreativeShowcase from "@/components/sections/public/ServicesCreativeShowcase";

const BASE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE = `${BASE_URL}/Home/hero.jpg`;
const SAMPLE_WALL = [
  "/Home/case-study-1.jpg",
  "/Home/case-study-2.jpg",
  "/Home/case-study-3.jpg",
  "/Home/prompt-1.jpg",
  "/Home/prompt-2.jpg",
  "/Home/prompt-eg-1.jpg",
  "/Home/prompt-eg-2.jpg",
  "/Home/hero.jpg",
];

type PageParams = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ category?: string }>;
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

const CATEGORY_PRESETS = {
  photo: {
    title: { en: "Photo stories", vi: "Photo story" },
    subtitle: {
      en: "Editorial imagery with crisp light, layered styling, and cinematic composition.",
      vi: "Hinh anh bien tap voi anh sang ro, styling tinh te, va bo cuc dien anh.",
    },
    collage: [
      "/Home/prompt-eg-1.jpg",
      "/Home/case-study-1.jpg",
      "/Home/prompt-1.jpg",
      "/Home/case-study-3.jpg",
      "/Home/hero.jpg",
    ],
  },
  styling: {
    title: { en: "Styling + set design", vi: "Styling + set design" },
    subtitle: {
      en: "Props, surfaces, and tactile palettes that elevate the entire frame.",
      vi: "Dao cu, chat lieu va palette giup khung hinh sang trong.",
    },
    collage: [
      "/Home/prompt-2.jpg",
      "/Home/case-study-2.jpg",
      "/Home/prompt-eg-2.jpg",
      "/Home/case-study-1.jpg",
      "/Home/hero.jpg",
    ],
  },
  design: {
    title: { en: "Design direction", vi: "Design direction" },
    subtitle: {
      en: "Key visuals, print systems, and premium layouts with bold typographic rhythm.",
      vi: "Key visual, he thong in an, va bo cuc cao cap voi nhip typography.",
    },
    collage: [
      "/Home/case-study-3.jpg",
      "/Home/prompt-1.jpg",
      "/Home/prompt-2.jpg",
      "/Home/case-study-2.jpg",
      "/Home/hero.jpg",
    ],
  },
  video: {
    title: { en: "Motion campaigns", vi: "Motion campaign" },
    subtitle: {
      en: "Showreels and campaigns designed for pace, mood, and story impact.",
      vi: "Showreel va campaign duoc thiet ke de giu nhip va cam xuc.",
    },
    collage: [
      "/Home/prompt-1.jpg",
      "/Home/prompt-eg-2.jpg",
      "/Home/case-study-2.jpg",
      "/Home/case-study-1.jpg",
      "/Home/hero.jpg",
    ],
  },
} as const;

export default async function ServicesPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const category = sp.category || "";
  const t = await getTranslations({ locale, namespace: "services" });
  const prefix = getLocalePrefix(locale);
  const withPrefix = (path: string) => (prefix ? `${prefix}${path}` : path);

  let items: Service[] = [];

  try {
    const data = await fetchPublicServices({
      locale,
      page: 1,
      limit: 50,
      sort: "-publishedAt",
    });
    items = data.items || [];
  } catch (error) {
    console.error("FETCH_SERVICES_FAILED", error);
  }

  let filtered = items;
  if (category) {
    filtered = items.filter((item) => item.tags?.includes(category));
  }
  const sorted = sortServices(filtered);
  const preset =
    CATEGORY_PRESETS[category as keyof typeof CATEGORY_PRESETS] || null;
  const heroTitle =
    preset && locale === "en"
      ? preset.title.en
      : preset && locale === "vi"
        ? preset.title.vi
        : locale === "en"
          ? "Services"
          : "Dich vu";
  const heroSubtitle =
    preset && locale === "en"
      ? preset.subtitle.en
      : preset && locale === "vi"
        ? preset.subtitle.vi
        : t("subtitle");
  return (
    <main className="min-h-screen bg-[#f7f4ff] text-[#120b2f]">
      <ServicesCreativeHero
        locale={locale}
        title={heroTitle}
        subtitle={heroSubtitle}
        eyebrow={locale === "en" ? "Services" : "Dich vu"}
        videoSrc="/video/exp.mp4"
        ctaHref={withPrefix("/contact")}
        portfolioHref={withPrefix("/portfolios")}
      />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#7a6bb0]">
              {locale === "en" ? "Capability grid" : "Nang luc"}
            </p>
            <h2 className="mt-4 font-[var(--font-caladea)] text-3xl uppercase tracking-[0.18em] md:text-5xl">
              {locale === "en" ? "Signature services" : "Dich vu chu dao"}
            </h2>
          </div>
          <span className="text-[11px] uppercase tracking-[0.35em] text-[#8a79c9]">
            {sorted.length} {locale === "en" ? "entries" : "muc"}
          </span>
        </div>

        {sorted.length ? (
          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 backdrop-blur-xl shadow-[0_24px_60px_-45px_rgba(106,88,170,0.45)]">
            <ServicesAccordion locale={locale} items={sorted} />
          </div>
        ) : (
          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 text-sm text-[#6d5ea8] backdrop-blur-xl">
            {t("empty")}
          </div>
        )}
      </section>

      <ServicesCreativeShowcase
        locale={locale}
        title={locale === "en" ? "Studio preview" : "Khung hinh mau"}
        subtitle={
          locale === "en"
            ? "Bento studies of light, surface, and narrative motion."
            : "Bento ve anh sang, be mat va chuyen dong."
        }
        images={preset?.collage || SAMPLE_WALL}
      />
    </main>
  );
}
