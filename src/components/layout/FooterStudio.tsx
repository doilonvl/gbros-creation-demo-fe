"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function FooterStudio() {
  const t = useTranslations("footer");
  const hours = useMemo(
    () => [
      { day: t("hours.mon"), time: "09:00 - 17:00" },
      { day: t("hours.tue"), time: "09:00 - 17:00" },
      { day: t("hours.wed"), time: "09:00 - 17:00" },
      { day: t("hours.thu"), time: "09:00 - 17:00" },
      { day: t("hours.fri"), time: "09:00 - 17:00" },
    ],
    [t]
  );

  return (
    <footer className="relative w-full border-t border-neutral-200 bg-neutral-50" data-nav-theme="light">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-16 md:grid-cols-[1.2fr_0.8fr] md:px-6 lg:px-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-neutral-400">
            {t("addressLine1")}
          </p>
          <h2 className="mt-4 text-3xl font-[var(--font-caladea)] uppercase tracking-[0.18em] text-neutral-900 md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-sm text-neutral-600">
            {t("recommendation")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-neutral-900 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            >
              {t("isOpenLabel")}
            </Link>
            <a
              href={`tel:${t("phone").replace(/\s+/g, "")}`}
              className="text-sm font-semibold text-neutral-900"
            >
              {t("phone")}
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">Studio</p>
            <p className="mt-2 text-sm text-neutral-600">{t("addressLine2")}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">Hours</p>
            <div className="mt-3 space-y-2 text-xs uppercase tracking-[0.25em] text-neutral-600">
              {hours.map((item) => (
                <div key={item.day} className="flex items-center justify-between">
                  <span>{item.day}</span>
                  <span>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            <a href="https://www.facebook.com/gbros.creation" target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href="https://www.instagram.com/gbros.creation" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <span>{t("copySince")}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs uppercase tracking-[0.3em] text-neutral-400 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <span>{t("copyName")}</span>
          <span>{t("copyLocation")}</span>
        </div>
      </div>
    </footer>
  );
}
