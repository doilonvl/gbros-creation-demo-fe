/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/unsupported-syntax */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type ParticleConfig = {
  gravity: number;
  friction: number;
  imageSize: number;
  horizontalForce: number;
  verticalForce: number;
  rotationSpeed: number;
  resetDelay: number;
};

type FooterExplosionProps = {
  title?: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  isOpenLabel?: string;
  recommendation?: string;
  images?: string[];
  config?: Partial<ParticleConfig>;
};

const defaultImages = Array.from(
  { length: 3 },
  (_, i) => `/Home/case-study-${i + 1}.jpg`
);

const defaultConfig: ParticleConfig = {
  gravity: 0.25,
  friction: 0.99,
  imageSize: 120,
  horizontalForce: 16,
  verticalForce: 12,
  rotationSpeed: 8,
  resetDelay: 500,
};

export function FooterExplosion({
  title,
  addressLine1,
  addressLine2,
  phone,
  isOpenLabel,
  recommendation,
  images = defaultImages,
  config: overrides = {},
}: FooterExplosionProps) {
  const t = useTranslations("footer");
  const resolvedTitle = title ?? t("title");
  const resolvedAddressLine1 = addressLine1 ?? t("addressLine1");
  const resolvedAddressLine2 = addressLine2 ?? t("addressLine2");
  const resolvedPhone = phone ?? t("phone");
  const resolvedIsOpenLabel = isOpenLabel ?? t("isOpenLabel");
  const resolvedRecommendation = recommendation ?? t("recommendation");
  const copyName = t("copyName");
  const copyLocation = t("copyLocation");
  const copySince = t("copySince");
  const hours = useMemo(
    () => [
      { day: t("hours.mon"), time: "09:00 - 17:00" },
      { day: t("hours.tue"), time: "09:00 - 17:00" },
      { day: t("hours.wed"), time: "09:00 - 17:00" },
      { day: t("hours.thu"), time: "09:00 - 17:00" },
      { day: t("hours.fri"), time: "09:00 - 17:00" },
      { day: t("hours.sat"), time: "09:00 - 17:00" },
      { day: t("hours.sun"), time: "09:00 - 17:00" },
    ],
    [t]
  );

  const config = { ...defaultConfig, ...overrides };
  const footerRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const explosionTriggered = useRef(false);
  const animationId = useRef<number | null>(null);
  const [isHoursOpen, setIsHoursOpen] = useState(false);
  const lastScrollY = useRef(0);

  const createParticles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    images.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.className = "cg-explosion-particle";
      img.style.width = `${config.imageSize}px`;
      container.appendChild(img);
    });
  }, [config.imageSize, images]);

  const explode = useCallback(() => {
    if (explosionTriggered.current) return;
    explosionTriggered.current = true;

    createParticles();

    const container = containerRef.current;
    if (!container) return;
    const elements = Array.from(
      container.querySelectorAll<HTMLImageElement>(".cg-explosion-particle")
    );

    class Particle {
      constructor(public el: HTMLImageElement) {
        this.x = 0;
        this.y = 0;
        this.vx = (Math.random() - 0.5) * config.horizontalForce;
        this.vy = -config.verticalForce - Math.random() * 8;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed;
      }
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      rotationSpeed: number;

      update() {
        this.vy += config.gravity;
        this.vx *= config.friction;
        this.vy *= config.friction;
        this.rotationSpeed *= config.friction;

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
      }
    }

    const particles = elements.map((el) => new Particle(el));

    const animate = () => {
      particles.forEach((p) => p.update());
      animationId.current = requestAnimationFrame(animate);

      const containerHeight = container.offsetHeight;
      if (particles.every((p) => p.y > containerHeight / 2)) {
        if (animationId.current) cancelAnimationFrame(animationId.current);
        setTimeout(() => {
          explosionTriggered.current = false;
        }, config.resetDelay);
      }
    };

    animate();
  }, [config, createParticles]);

  const checkFooterPosition = useCallback(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const rect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY || window.pageYOffset;
    const isScrollingDown = currentScrollY >= lastScrollY.current;
    lastScrollY.current = currentScrollY;

    if (
      !explosionTriggered.current &&
      isScrollingDown &&
      rect.top <= viewportHeight - rect.height * 0.5
    ) {
      explode();
    }
  }, [explode]);

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    createParticles();
    const handleScroll = () => checkFooterPosition();
    const handleResize = () => {
      explosionTriggered.current = false;
      createParticles();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    setTimeout(checkFooterPosition, 500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [checkFooterPosition, createParticles, images]);

  const closeHours = useCallback(() => {
    setIsHoursOpen(false);
    explosionTriggered.current = false;
    createParticles();
  }, [createParticles]);

  return (
    <footer
      ref={footerRef}
      className="cg-footer relative w-full bg-neutral-900 text-white px-6 py-5 flex flex-col items-center gap-4 overflow-hidden md:py-4 md:gap-3 md:max-h-[360px]"
      data-nav-theme="dark"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center">
        <p className="text-sm uppercase tracking-[0.12em] text-amber-200/80">
          {resolvedAddressLine1}
        </p>
        <h1 className="cg-footer-title text-3xl md:text-4xl font-semibold">
          {resolvedTitle}
        </h1>
        <a
          href="https://www.google.com/maps/search/?api=1&query=20%20Duong%20Thanh%2C%20Hoan%20Kiem%2C%20Hanoi%2C%20Vietnam"
          target="_blank"
          rel="noreferrer"
          className="text-base md:text-lg text-white/80 underline-offset-4 hover:text-amber-200/90 hover:underline"
        >
          {resolvedAddressLine2}
        </a>
        <a
          href={`tel:${resolvedPhone.replace(/\s+/g, "")}`}
          className="text-base md:text-lg font-semibold text-white hover:text-emerald-200"
        >
          {resolvedPhone}
        </a>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base mt-3">
          <button
            type="button"
            onClick={() => setIsHoursOpen(true)}
            className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            {resolvedIsOpenLabel}
          </button>
          <span className="text-amber-200/80">{resolvedRecommendation}</span>
        </div>
        <div className="cg-footer-copy mt-4 grid grid-cols-1 gap-3 text-sm uppercase text-white/70 text-center md:grid-cols-3 md:text-left">
          <p>{copyName}</p>
          <p>{copyLocation}</p>
          <p className="md:text-right">{copySince}</p>
        </div>
      </div>
      <div
        ref={containerRef}
        className="cg-explosion-container absolute inset-0 pointer-events-none"
      />

      {isHoursOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={closeHours}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white text-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-lg font-semibold">{t("hoursTitle")}</h2>
              <button
                type="button"
                onClick={closeHours}
                className="h-9 w-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xl leading-none flex items-center justify-center"
              >
                X
              </button>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t("openStatus")}
              </div>
              <div className="mt-3 space-y-2">
                {hours.map((item) => (
                  <div
                    key={item.day}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{item.day}</span>
                    <span className="text-neutral-600">{item.time}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                {t("updatedLabel")}
              </p>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
