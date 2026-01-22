import Link from "next/link";
import type { Locale } from "@/types/content";
import { getLocalePrefix } from "@/lib/routes";
import SectionHeading from "@/components/sections/public/SectionHeading";

type IntroCalloutProps = {
  locale: Locale;
};

function withPrefix(locale: Locale, href: string) {
  return `${getLocalePrefix(locale)}${href}`;
}

export default function IntroCallout({ locale }: IntroCalloutProps) {
  return (
    <section className="py-16" data-nav-theme="light">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)] md:p-12">
          <SectionHeading
            kicker="About"
            title={locale === "en" ? "Discover G-Bros" : "Kham pha G-Bros"}
            description={
              locale === "en"
                ? "We build full-funnel creative production for brands, from concept to final delivery."
                : "Xay dung giai phap sang tao toan dien, tu y tuong den san xuat."
            }
          />
          <div className="mt-6">
            <Link
              href={withPrefix(locale, "/contact")}
              className="inline-flex rounded-full bg-neutral-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
            >
              {locale === "en" ? "Book service" : "Dang ky dich vu"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
