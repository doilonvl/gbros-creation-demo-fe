"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type SyntheticEvent,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxItem = {
  src: string;
  alt?: string;
  thumbSrc?: string;
  fullSrc?: string;
};

type MediaLightboxProps = {
  items: LightboxItem[];
  className?: string;
  columns?: number;
};

export default function MediaLightbox({
  items,
  className,
  columns = 3,
}: MediaLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [layout, setLayout] = useState<{
    frameWidth: number;
    frameHeight: number;
    sideOffset: number;
    sideScale: number;
    showSides: boolean;
  }>({
    frameWidth: 0,
    frameHeight: 0,
    sideOffset: 0,
    sideScale: 0.9,
    showSides: false,
  });
  const dragRef = useRef<{
    pointerId: number | null;
    startX: number;
    lastX: number;
    active: boolean;
  }>({
    pointerId: null,
    startX: 0,
    lastX: 0,
    active: false,
  });
  const activeItem = useMemo(
    () => (activeIndex === null ? null : items[activeIndex]),
    [activeIndex, items]
  );
  const hasMultiple = items.length > 1;
  const prevIndex =
    activeIndex === null
      ? null
      : (activeIndex + items.length - 1) % items.length;
  const nextIndex =
    activeIndex === null ? null : (activeIndex + 1) % items.length;
  const visibleIndexes = useMemo(() => {
    if (activeIndex === null) return [];
    if (!layout.showSides || !hasMultiple) return [activeIndex];
    const set = new Set<number>();
    [prevIndex, activeIndex, nextIndex].forEach((index) => {
      if (typeof index === "number") set.add(index);
    });
    return Array.from(set);
  }, [activeIndex, layout.showSides, hasMultiple, prevIndex, nextIndex]);
  const gridSizes = useMemo(() => {
    if (columns === 4) {
      return "(min-width: 1280px) 24vw, (min-width: 1024px) 25vw, 100vw";
    }
    if (columns === 2) {
      return "(min-width: 1024px) 50vw, 100vw";
    }
    return "(min-width: 1280px) 32vw, (min-width: 1024px) 33vw, 100vw";
  }, [columns]);

  const showPrev = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + items.length - 1) % items.length);
  }, [activeIndex, items.length]);

  const showNext = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % items.length);
  }, [activeIndex, items.length]);

  const handleImageLoad =
    (src: string) => (event: SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = event.currentTarget;
      if (!naturalWidth || !naturalHeight) return;
      setDimensions((prev) =>
        prev[src]
          ? prev
          : { ...prev, [src]: { width: naturalWidth, height: naturalHeight } }
      );
    };

  useEffect(() => {
    if (activeIndex === null) return;
    let rafId: number | null = null;

    const updateLayout = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const active = items[activeIndex];
      const dims = dimensions[active.src];
      const ratio = dims ? dims.width / dims.height : 1.25;
      const maxActiveWidth = Math.min(viewportWidth * 0.68, 1200);
      const maxActiveHeight = Math.min(viewportHeight * 0.8, 860);
      const frameWidth = Math.min(maxActiveWidth, maxActiveHeight * ratio);
      const frameHeight = Math.min(maxActiveHeight, maxActiveWidth / ratio);
      const sideScale = 0.9;
      const visibleRatio = 0.26;
      const desiredVisible = frameWidth * sideScale * visibleRatio;
      const sideOffset = desiredVisible + (frameWidth * (1 - sideScale)) / 2;
      const showSides =
        hasMultiple && viewportWidth >= 768 && desiredVisible >= 90;

      setLayout({
        frameWidth,
        frameHeight,
        sideOffset,
        sideScale,
        showSides,
      });
    };

    const onResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateLayout();
        rafId = null;
      });
    };

    updateLayout();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [activeIndex, dimensions, items, hasMultiple]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        showPrev();
      }
      if (event.key === "ArrowRight") {
        showNext();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, showPrev, showNext]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (activeIndex === null) return;
    dragRef.current.pointerId = event.pointerId;
    dragRef.current.startX = event.clientX;
    dragRef.current.lastX = event.clientX;
    dragRef.current.active = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.lastX = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.pointerId !== event.pointerId) return;
    const delta = dragRef.current.lastX - dragRef.current.startX;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) {
      showPrev();
    } else {
      showNext();
    }
  };

  return (
    <>
      <div
        className={cn(
          "grid gap-4",
          columns === 2 && "md:grid-cols-2",
          columns === 3 && "md:grid-cols-3",
          columns === 4 && "md:grid-cols-4",
          className
        )}
      >
        {items.map((item, index) => {
          const indexLabel = String(index + 1).padStart(2, "0");
          const totalLabel = String(items.length).padStart(2, "0");
          const gridSrc = item.thumbSrc || item.src;
          const fullSrc = item.fullSrc || item.src;
          const gridSrcSet =
            item.thumbSrc && item.fullSrc && item.thumbSrc !== item.fullSrc
              ? `${gridSrc} 900w, ${fullSrc} 2000w`
              : undefined;
          return (
            <button
              key={`${item.src}-${index}`}
              type="button"
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-neutral-100 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] transition hover:-translate-y-1"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open image ${index + 1} of ${items.length}`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={gridSrc}
                  alt={item.alt || ""}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  srcSet={gridSrcSet}
                  sizes={gridSrcSet ? gridSizes : undefined}
                  loading="lazy"
                  decoding="async"
                  onLoad={handleImageLoad(item.src)}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-neutral-950/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-4 pb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/90 opacity-0 transition duration-300 group-hover:opacity-100">
                <span>View</span>
                <span>
                  {indexLabel}/{totalLabel}
                </span>
              </div>
          </button>
        );
      })}
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/75 p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/15"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={showPrev}
            className="absolute left-6 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/15"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="absolute right-6 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/15"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            className="nf-lightbox-frame touch-none select-none"
            style={
              layout.frameWidth && layout.frameHeight
                ? {
                    width: `${layout.frameWidth}px`,
                    height: `${layout.frameHeight}px`,
                  }
                : undefined
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {visibleIndexes.map((index) => {
              const role =
                index === activeIndex
                  ? "active"
                  : index === prevIndex
                  ? "prev"
                  : "next";
              const offset =
                role === "active"
                  ? 0
                  : role === "prev"
                  ? -layout.sideOffset
                  : layout.sideOffset;
              const scale = role === "active" ? 1 : layout.sideScale;
              const lightboxItem = items[index];
              const lightboxSrc = lightboxItem.fullSrc || lightboxItem.src;
              const lightboxSrcSet =
                lightboxItem.thumbSrc &&
                lightboxItem.fullSrc &&
                lightboxItem.thumbSrc !== lightboxItem.fullSrc
                  ? `${lightboxItem.thumbSrc} 900w, ${lightboxSrc} 2200w`
                  : undefined;
              return (
                <div
                  key={items[index].src}
                  className={cn(
                    "nf-lightbox-card",
                    role === "active" ? "nf-lightbox-card--active" : ""
                  )}
                  style={{
                    transform: `translate3d(-50%, -50%, 0) translate3d(${offset}px, 0, 0) scale(${scale})`,
                    opacity: role === "active" ? 1 : 0.5,
                    filter: role === "active" ? "none" : "blur(0.8px)",
                    zIndex: role === "active" ? 3 : 1,
                  }}
                >
                  <img
                    src={lightboxSrc}
                    alt={lightboxItem.alt || ""}
                    className="nf-lightbox-image"
                    srcSet={lightboxSrcSet}
                    sizes={
                      lightboxSrcSet
                        ? "(min-width: 1280px) 70vw, 100vw"
                        : undefined
                    }
                    onLoad={handleImageLoad(items[index].src)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
