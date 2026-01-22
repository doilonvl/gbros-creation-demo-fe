"use client";

import { useEffect, useMemo, useState } from "react";
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
      className="relative min-h-screen overflow-hidden bg-neutral-900"
      data-nav-theme="dark"
    >
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out will-change-[opacity]",
              index === activeIndex ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-4 pb-16 pt-32 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
            G-Bros Creation Studio
          </p>
          <h1 className="mt-4 font-[var(--font-caladea)] text-4xl text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.5)] md:text-6xl">
            {activeSlide?.heading}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] md:text-base">
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
                  "group rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-left text-white/80 transition-colors duration-300 ease-out hover:bg-white/20",
                  isTileActive ? "bg-white/25 text-white" : ""
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                  {tile.label}
                </p>
                <p className="mt-2 text-xs text-white/70">{tile.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
