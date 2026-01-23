"use client";

import { motion, useScroll, useTransform } from "framer-motion";

type ServicesCreativeShowcaseProps = {
  locale: "en" | "vi";
  title: string;
  subtitle: string;
  images: readonly string[];
};

const BENTO_LAYOUT = [
  "col-span-6 row-span-7",
  "col-span-4 row-span-4",
  "col-span-5 row-span-5",
  "col-span-3 row-span-4",
  "col-span-4 row-span-6",
  "col-span-5 row-span-4",
];

export default function ServicesCreativeShowcase({
  locale,
  title,
  subtitle,
  images,
}: ServicesCreativeShowcaseProps) {
  const { scrollY } = useScroll();
  const maskX = useTransform(scrollY, [200, 1200], ["0%", "100%"]);
  const parallaxY = useTransform(scrollY, [0, 1200], [0, -60]);

  return (
    <section className="relative overflow-hidden bg-[#f7f4ff] px-4 pb-24 pt-16 text-[#120b2f] md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="font-[var(--font-caladea)] text-4xl uppercase tracking-[0.18em] text-transparent md:text-6xl"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(18,11,47,0.15), rgba(18,11,47,0.9))",
            backgroundSize: "200% 100%",
            backgroundPositionX: maskX,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          {title}
        </motion.h2>
        <p className="mt-4 max-w-2xl text-[11px] uppercase tracking-[0.35em] text-[#7a6bb0]">
          {subtitle}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl auto-rows-[90px] grid-cols-12 gap-4">
        {images.slice(0, 12).map((src, index) => {
          const staticOffset = index % 2 ? "translateY(22px)" : "translateY(-18px)";
          return (
            <div
              key={`${src}-${index}`}
              style={{ transform: staticOffset }}
              className={BENTO_LAYOUT[index % BENTO_LAYOUT.length]}
            >
              <motion.div
              style={{ y: parallaxY }}
              className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_18px_45px_-35px_rgba(106,88,170,0.55)]"
              initial={{ opacity: 0, clipPath: "inset(20% 0% 30% 0% round 32px)" }}
              whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 32px)" }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img
                src={src}
                alt={locale === "en" ? "Studio preview" : "Khung hinh mau"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#fef0d8]/60 via-transparent to-transparent" />
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
