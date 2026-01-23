"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Locale } from "@/types/content";
import { getLocalePrefix } from "@/lib/routes";
import { cn } from "@/lib/utils";

type NavLink = {
  label: { vi: string; en: string };
  href: string;
};

type NavItem = NavLink & {
  key: string;
  children?: NavLink[];
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "photo",
    label: { vi: "Photo", en: "Photo" },
    href: "/services?category=photo",
    children: [
      { label: { vi: "Album", en: "Album" }, href: "/portfolios?type=album" },
      {
        label: { vi: "Bang gia", en: "Packages" },
        href: "/services?category=photo",
      },
      { label: { vi: "Blog", en: "Blog" }, href: "/blogs?tag=photo" },
    ],
  },
  {
    key: "video",
    label: { vi: "Video", en: "Video" },
    href: "/services?category=video",
    children: [
      { label: { vi: "Showreel", en: "Showreel" }, href: "/portfolios" },
      {
        label: { vi: "Case study", en: "Case studies" },
        href: "/portfolios?type=case_study",
      },
      {
        label: { vi: "Bang gia", en: "Packages" },
        href: "/services?category=video",
      },
    ],
  },
  {
    key: "styling",
    label: { vi: "Styling", en: "Styling" },
    href: "/services?category=styling",
  },
  {
    key: "design",
    label: { vi: "Design", en: "Design" },
    href: "/services?category=design",
  },
  {
    key: "about",
    label: { vi: "Ve chung toi", en: "About" },
    href: "/about",
  },
  {
    key: "portfolio",
    label: { vi: "Portfolio", en: "Portfolio" },
    href: "/portfolios",
  },
  { key: "blog", label: { vi: "Blog", en: "Blog" }, href: "/blogs" },
  { key: "contact", label: { vi: "Lien he", en: "Contact" }, href: "/contact" },
];

function resolveLabel(label: NavLink["label"], locale: Locale) {
  return locale === "en" ? label.en : label.vi;
}

function withPrefix(locale: Locale, href: string) {
  if (href.startsWith("http")) return href;
  const prefix = getLocalePrefix(locale);
  return `${prefix}${href}`;
}

export default function SiteHeader({ locale }: { locale: Locale }) {
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);
  const initRef = useRef<number | null>(null);

  useEffect(() => {
    const updateTheme = () => {
      const marker = 84;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-nav-theme]")
      );
      let theme: "dark" | "light" = "light";
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom >= marker) {
          theme = section.dataset.navTheme === "dark" ? "dark" : "light";
          break;
        }
      }
      setNavTheme(theme);
    };

    const updateVisibility = () => {
      const current = window.scrollY;
      setIsScrolled(current > 32);
      updateTheme();

      const delta = current - lastScrollY.current;
      const threshold = 8;
      if (Math.abs(delta) < threshold) return;

      if (current <= 64 || isMenuOpen) {
        setHidden(false);
      } else {
        setHidden(delta > 0);
      }

      lastScrollY.current = current;
    };
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        updateVisibility();
        rafRef.current = null;
      });
    };

    lastScrollY.current = window.scrollY;
    initRef.current = window.requestAnimationFrame(() => {
      updateVisibility();
      initRef.current = null;
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateVisibility);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (initRef.current !== null) {
        window.cancelAnimationFrame(initRef.current);
        initRef.current = null;
      }
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        labelText: resolveLabel(item.label, locale),
        href: withPrefix(locale, item.href),
        children: item.children?.map((child) => ({
          ...child,
          labelText: resolveLabel(child.label, locale),
          href: withPrefix(locale, child.href),
        })),
      })),
    [locale]
  );

  useEffect(() => {
    if (!isMenuOpen) return;
    if (!activeKey && navItems.length) {
      const first = navItems.find((item) => item.children?.length) ?? navItems[0];
      setActiveKey(first?.key ?? null);
    }
  }, [isMenuOpen, activeKey, navItems]);

  const isDark = navTheme === "dark" && !isScrolled;
  const ctaLabel = locale === "en" ? "Get consultation" : "Dang ky dich vu";
  const activeItem = navItems.find((item) => item.key === activeKey) ?? navItems[0];
  const activeLabel = activeItem?.labelText ?? "";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300 will-change-transform",
          hidden ? "-translate-y-full" : "translate-y-0",
          isScrolled
            ? "backdrop-blur-md bg-white/80"
            : "bg-transparent",
          isScrolled ? "border-b border-neutral-200/70" : "border-b border-transparent"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between px-4 py-4 transition-all duration-300 md:px-6 lg:px-8",
            isScrolled ? "lg:py-3" : "lg:py-5"
          )}
        >
          <Link
            href={withPrefix(locale, "/")}
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.35em]",
              isDark ? "text-white" : "text-neutral-900"
            )}
          >
            G-Bros
          </Link>

          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
              isDark
                ? "border-white/30 text-white hover:border-white"
                : "border-neutral-900/30 text-neutral-900 hover:border-neutral-900",
              isMenuOpen ? "bg-white text-neutral-900" : "bg-transparent"
            )}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="site-menu"
          >
            <span>Menu</span>
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div
        id="site-menu"
        className={cn(
          "fixed inset-0 z-40 bg-neutral-950 text-white transition duration-500",
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        )}
        aria-hidden={!isMenuOpen}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(0,0,0,0.9))]" />

        <div className="relative h-full overflow-y-auto px-6 pb-12 pt-28 md:px-12">
          <div className="absolute inset-x-0 top-1/2 hidden -translate-y-1/2 opacity-10 lg:block">
            <div className="nf-marquee">
              <div className="nf-marquee-track">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={`${activeLabel}-${index}`}
                    className="text-7xl font-[var(--font-caladea)] uppercase tracking-[0.25em]"
                  >
                    {activeLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[2.2fr_1fr]">
            <div className="space-y-6">
              {navItems.map((item) => {
                const isActive = activeItem?.key === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    onMouseEnter={() => setActiveKey(item.key)}
                    onFocus={() => setActiveKey(item.key)}
                    className={cn(
                      "block text-5xl font-[var(--font-caladea)] uppercase tracking-[0.18em] transition md:text-6xl lg:text-7xl",
                      isActive ? "text-white" : "text-white/40 hover:text-white"
                    )}
                  >
                    {item.labelText}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
                  Explore
                </p>
                <div className="mt-4 space-y-3">
                  {activeItem?.children?.length ? (
                    activeItem.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-sm uppercase tracking-[0.28em] text-white/70 transition hover:text-white"
                      >
                        {child.labelText}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-white/60">
                      {locale === "en"
                        ? "Selected services & editorial work."
                        : "Tap trung vao dich vu va bo suu tap noi bat."}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <Link
                  href={withPrefix(locale, "/contact")}
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white hover:bg-white hover:text-neutral-900"
                >
                  {ctaLabel}
                </Link>
                <div className="mt-6 flex flex-wrap gap-6 text-[10px] uppercase tracking-[0.3em] text-white/60">
                  <Link
                    href="https://www.facebook.com/gbros.creation"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Facebook
                  </Link>
                  <Link
                    href="https://www.instagram.com/gbros.creation"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Instagram
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
