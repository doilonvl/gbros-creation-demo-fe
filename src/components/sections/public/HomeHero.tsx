"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  image: string;
  heading: string;
  subheading: string;
};

export type ServiceTile = {
  id: string;
  label: string;
  tagline: string;
  accent?: string;
  link?: string;
  slideId?: string;
};

type HomeHeroProps = {
  slides: HeroSlide[];
  tiles: ServiceTile[];
};

export default function HomeHero({ slides, tiles }: HomeHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const activeSlide = slides[activeIndex] || slides[0];
  const slideIndexById = useMemo(
    () => new Map(slides.map((slide, index) => [slide.id, index])),
    [slides]
  );

  useEffect(() => {
    if (!slides.length || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused]);

  const tileList = useMemo(() => tiles.slice(0, 6), [tiles]);
  const resolveTileIndex = (tile: ServiceTile, fallbackIndex: number) => {
    if (!slides.length) return 0;
    if (tile.slideId && slideIndexById.has(tile.slideId)) {
      return slideIndexById.get(tile.slideId) ?? 0;
    }
    return fallbackIndex % slides.length;
  };

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-neutral-950 text-white"
      data-nav-theme="dark"
    >
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          src="/video/exp.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 pb-16 pt-32 md:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/70">
            G-Bros Creation Studio
          </p>
          <motion.h1
            className="mt-5 flex flex-wrap items-baseline gap-x-4 text-5xl font-black uppercase leading-[0.9] tracking-[0.08em] md:text-7xl lg:text-8xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="font-sans">Luxury</span>
            <span className="font-[var(--font-caladea)] text-white/90 italic">
              Narratives
            </span>
          </motion.h1>
          <motion.p
            className="mt-6 max-w-2xl text-sm text-white/75 md:text-base"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            {activeSlide?.heading}
          </motion.p>
          <p className="mt-4 max-w-2xl text-xs text-white/70 md:text-sm">
            {activeSlide?.subheading}
          </p>
        </div>

        <div
          className="mt-10 grid gap-3 md:grid-cols-3 lg:grid-cols-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            setActiveTileIndex(null);
          }}
        >
          {tileList.map((tile, index) => {
            const isTileActive =
              activeTileIndex === index ||
              (activeTileIndex === null && index === activeIndex);
            return (
              <button
                key={tile.id}
                type="button"
                onMouseEnter={() => {
                  setActiveIndex(resolveTileIndex(tile, index));
                  setActiveTileIndex(index);
                }}
                onFocus={() => {
                  setActiveIndex(resolveTileIndex(tile, index));
                  setActiveTileIndex(index);
                }}
                className={cn(
                  "group rounded-2xl border border-white/20 bg-white/5 px-4 py-4 text-left text-white/70 transition duration-300 ease-out hover:border-white/60 hover:bg-white/15",
                  isTileActive ? "border-white/60 bg-white/15 text-white" : ""
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em]">
                  {tile.label}
                </p>
                <p className="mt-2 text-xs text-white/60">{tile.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="nf-scroll-indicator">
        <span>Scroll Down</span>
        <span className="nf-scroll-line" />
      </div>
    </section>
  );
}
