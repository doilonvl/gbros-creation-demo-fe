"use client";

import { useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import MagneticButton from "@/components/ui/MagneticButton";

type ServicesCreativeHeroProps = {
  locale: "en" | "vi";
  title: string;
  subtitle: string;
  eyebrow: string;
  videoSrc: string;
  ctaHref: string;
  portfolioHref: string;
};

export default function ServicesCreativeHero({
  locale,
  title,
  subtitle,
  eyebrow,
  videoSrc,
  ctaHref,
  portfolioHref,
}: ServicesCreativeHeroProps) {
  const { scrollY } = useScroll();
  const kineticY = useTransform(scrollY, [0, 800], [0, 140]);
  const kineticX = useTransform(scrollY, [0, 800], [0, -80]);

  const ctaText = useMemo(
    () => (locale === "en" ? "Start a project" : "Bat dau du an"),
    [locale],
  );

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7f4ff] text-[#120b2f]">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-25"
        autoPlay
        muted
        loop
        playsInline
        src={videoSrc}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-[#fef6ea]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(130,87,229,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,110,136,0.18),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 pb-14 pt-24 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.5em] text-[#5b4b93]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#ff6e88]" />
            <span>{eyebrow}</span>
          </div>
        </div>

        <div className="pt-16">
          <motion.h1
            style={{ y: kineticY, x: kineticX }}
            className="max-w-4xl font-[var(--font-caladea)] text-5xl uppercase tracking-[0.18em] text-[#120b2f] md:text-7xl lg:text-9xl"
          >
            {title}
          </motion.h1>
          <motion.p
            style={{ y: kineticY }}
            className="mt-6 max-w-xl text-sm uppercase tracking-[0.32em] text-[#5b4b93]"
          >
            {subtitle}
          </motion.p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href={ctaHref}>
              {ctaText}
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6e88]" />
            </MagneticButton>
            <MagneticButton href={portfolioHref} className="text-[#5b4b93]">
              {locale === "en" ? "View portfolio" : "Xem portfolio"}
            </MagneticButton>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.5em] text-[#8a79c9]">
          <span>{locale === "en" ? "Scroll for services" : "Cuon de xem"}</span>
          <span>GBROS MEDIA</span>
        </div>
      </div>
    </section>
  );
}
