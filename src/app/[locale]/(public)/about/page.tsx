import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types/content";
import { getSiteUrl } from "@/lib/env";
import { getLocalePrefix } from "@/lib/routes";
import AboutTeamReveal from "@/components/sections/public/AboutTeamReveal";

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
  const canonical = prefix ? `${BASE_URL}${prefix}/about` : `${BASE_URL}/about`;

  return {
    title: { absolute: locale === "en" ? "About G-Bros" : "Ve G-Bros" },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        "vi-VN": `${BASE_URL}/about`,
        en: `${BASE_URL}/en/about`,
      },
    },
    openGraph: {
      title: locale === "en" ? "About G-Bros" : "Ve G-Bros",
      description: t("metaDescription"),
      url: canonical,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: locale === "en" ? "About G-Bros" : "Ve G-Bros",
      description: t("metaDescription"),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

const TEAM = [
  {
    name: "Minh Tran",
    role: "Creative Director",
    image: "/Home/prompt-eg-1.jpg",
  },
  {
    name: "Linh Dao",
    role: "Producer",
    image: "/Home/prompt-eg-2.jpg",
  },
  {
    name: "Khoa Nguyen",
    role: "Photographer",
    image: "/Home/case-study-2.jpg",
  },
  {
    name: "Anh Vo",
    role: "Stylist",
    image: "/Home/case-study-3.jpg",
  },
];
const ABOUT_WALL = [
  "/Home/case-study-1.jpg",
  "/Home/case-study-2.jpg",
  "/Home/case-study-3.jpg",
  "/Home/prompt-1.jpg",
  "/Home/prompt-2.jpg",
  "/Home/prompt-eg-1.jpg",
  "/Home/prompt-eg-2.jpg",
  "/Home/hero.jpg",
];

export default async function AboutPage({ params }: PageParams) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 overflow-x-hidden">
      <section
        className="mx-auto max-w-6xl px-4 pb-16 pt-28 md:px-6 lg:px-8"
        data-nav-theme="light"
      >
        <p className="text-[11px] uppercase tracking-[0.45em] text-neutral-400">
          {locale === "en" ? "About" : "Ve chung toi"}
        </p>
        <h1 className="mt-6 text-4xl font-[var(--font-caladea)] uppercase tracking-[0.22em] md:text-6xl">
          {locale === "en" ? "The artist's profile" : "Chan dung nghe si"}
        </h1>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20 md:px-6 lg:px-8 overflow-hidden">
        <div className="nf-grain" />
        <div className="space-y-10">
          <div className="text-4xl leading-tight text-neutral-900 md:text-5xl md:leading-tight">
            <p className="text-justify">
              {locale === "en" ? (
                <>
                  We craft <span className="font-[var(--font-caladea)] italic">luxury</span> visual narratives that
                  feel tactile, intimate, and cinematic. Every frame is a deliberate balance between
                  <span className="font-[var(--font-caladea)] italic"> light</span>, composition, and emotion.
                </>
              ) : (
                <>
                  Chung toi tao ra <span className="font-[var(--font-caladea)] italic">nhung cau chuyen</span> thi giac sang trong,
                  de cham, va dien anh. Moi khung hinh la su can bang giua
                  <span className="font-[var(--font-caladea)] italic"> anh sang</span>, bo cuc va cam xuc.
                </>
              )}
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 text-sm text-neutral-600">
              <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">
                {locale === "en" ? "Manifesto" : "Tuyen ngon"}
              </p>
              <p>
                {locale === "en"
                  ? "Our studio operates like an editorial desk: we research, art-direct, and produce with clarity. We believe restraint is as powerful as spectacle."
                  : "Studio van hanh nhu mot ban bien tap: nghien cuu, art-direct, va san xuat ro rang. Su tiet che manh me nhu su phu dien."}
              </p>
              <p>
                {locale === "en"
                  ? "We collaborate with brands that value narrative, culture, and craft."
                  : "Chung toi dong hanh cung cac thuong hieu coi trong cau chuyen, van hoa va tay nghe."}
              </p>
            </div>
            <div>
              <AboutTeamReveal members={TEAM} />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <p className="text-[11px] uppercase tracking-[0.45em] text-neutral-400">
            {locale === "en" ? "Studio wall" : "Khung hinh studio"}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => {
              const src = ABOUT_WALL[index % ABOUT_WALL.length];
              return (
                <div
                  key={`${src}-${index}`}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_20px_60px_-50px_rgba(15,23,42,0.2)]"
                >
                  <img src={src} alt="Studio" className="h-full w-full object-cover" />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
