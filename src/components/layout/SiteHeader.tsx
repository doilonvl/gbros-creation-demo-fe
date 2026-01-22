"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);
  const initRef = useRef<number | null>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const updateVisibility = () => {
      const current = window.scrollY;
      setIsScrolled(current > 32);

      const delta = current - lastScrollY.current;
      const threshold = 8;
      if (Math.abs(delta) < threshold) return;

      if (current <= 64 || mobileOpen) {
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
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (initRef.current !== null) {
        window.cancelAnimationFrame(initRef.current);
        initRef.current = null;
      }
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!desktopOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopOpen(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [desktopOpen]);

  useEffect(
    () => () => {
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    },
    []
  );

  const clearDesktopTimers = () => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleDesktopOpen = (key: string) => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
    }
    openTimeoutRef.current = window.setTimeout(() => {
      setDesktopOpen(key);
    }, 120);
  };

  const scheduleDesktopClose = () => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setDesktopOpen(null);
    }, 160);
  };

  const openDesktopNow = (key: string) => {
    clearDesktopTimers();
    setDesktopOpen(key);
  };

  const closeDesktopNow = () => {
    clearDesktopTimers();
    setDesktopOpen(null);
  };

  const handleDesktopBlur = (
    event: FocusEvent<HTMLDivElement>,
    hasChildren: boolean
  ) => {
    if (!hasChildren) return;
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    scheduleDesktopClose();
  };

  const closeMenu = () => {
    clearDesktopTimers();
    setHidden(false);
    setMobileOpen(false);
    setOpenGroup(null);
  };

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

  const ctaLabel = locale === "en" ? "Get consultation" : "Dang ky dich vu";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300 will-change-transform",
          hidden ? "-translate-y-full" : "translate-y-0",
          isScrolled
            ? "bg-white/95 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.45)]"
            : "bg-white/70 shadow-[0_8px_24px_-22px_rgba(15,23,42,0.35)]",
          "backdrop-blur-lg"
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
            className="text-base font-semibold tracking-[0.35em] text-neutral-900"
          >
            G-Bros
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm font-medium tracking-[0.08em] text-neutral-700 lg:flex"
            onMouseLeave={scheduleDesktopClose}
          >
            {navItems.map((item) => {
              const isOpen = desktopOpen === item.key;
              const children = item.children ?? [];
              const hasChildren = children.length > 0;
              return (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() =>
                    hasChildren && scheduleDesktopOpen(item.key)
                  }
                  onMouseLeave={() => hasChildren && scheduleDesktopClose()}
                  onFocus={() => hasChildren && openDesktopNow(item.key)}
                  onBlur={(event) => handleDesktopBlur(event, hasChildren)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 text-[13px] transition-colors",
                      "after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:bg-amber-500 after:transition-[width] after:duration-300 after:content-['']",
                      "hover:text-amber-600 hover:after:w-full",
                      "focus-visible:outline-none focus-visible:text-amber-600 focus-visible:after:w-full"
                    )}
                    aria-haspopup={hasChildren ? "menu" : undefined}
                    aria-expanded={hasChildren ? isOpen : undefined}
                  >
                    {item.labelText}
                    {hasChildren ? (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 opacity-70 transition-transform duration-200",
                          isOpen ? "rotate-180" : ""
                        )}
                      />
                    ) : null}
                  </Link>
                  {hasChildren ? (
                    <div
                      className={cn(
                        "absolute left-0 top-full w-56 pt-4 transition duration-200",
                        isOpen
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1 opacity-0"
                      )}
                      id={`nav-dropdown-${item.key}`}
                      role="menu"
                    >
                      <div className="rounded-2xl border border-white/60 bg-white/98 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.55)]">
                        <div className="space-y-1">
                          {children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block rounded-xl px-3 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-amber-600"
                              role="menuitem"
                            >
                              {child.labelText}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={withPrefix(locale, "/contact")}
              className={cn(
                "hidden rounded-full bg-neutral-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition md:inline-flex",
                "hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2"
              )}
            >
              {ctaLabel}
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-800 transition hover:bg-neutral-100 lg:hidden"
              onClick={() =>
                setMobileOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setHidden(false);
                  }
                  if (!next) {
                    setOpenGroup(null);
                  }
                  return next;
                })
              }
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-x-4 top-24 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="space-y-4">
              {navItems.map((item) => (
                <div
                  key={item.key}
                  className="border-b border-neutral-100 pb-3"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      className="text-base font-semibold text-neutral-900"
                      onClick={closeMenu}
                    >
                      {item.labelText}
                    </Link>
                    {item.children?.length ? (
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-700"
                        onClick={() =>
                          setOpenGroup((prev) =>
                            prev === item.key ? null : item.key
                          )
                        }
                        aria-label={`Toggle ${item.labelText}`}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition",
                            openGroup === item.key ? "rotate-180" : ""
                          )}
                        />
                      </button>
                    ) : null}
                  </div>
                  {item.children?.length && openGroup === item.key ? (
                    <div className="mt-3 space-y-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
                          onClick={closeMenu}
                        >
                          {child.labelText}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <Link
              href={withPrefix(locale, "/contact")}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              onClick={closeMenu}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
