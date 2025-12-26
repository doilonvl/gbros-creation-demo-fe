"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

const MusicToggle = dynamic(() => import("../MusicToggle/MusicToggle"), {
  ssr: false,
});

type NavItem = {
  label: string;
  sectionId: string;
};

export type NavbarProps = {
  brand?: string;
  navItems?: NavItem[];
  className?: string;
};

const toggleThemes = {
  dark: {
    bg: "#fbf6c1",
    fg: "#182a2a",
    border: "rgba(251, 246, 193, 0.45)",
  },
  light: {
    bg: "#255956",
    fg: "#fbf6c1",
    border: "rgba(37, 89, 86, 0.5)",
  },
} as const;

type ToggleTheme = keyof typeof toggleThemes;

const defaultNavItems: NavItem[] = [
  { label: "About", sectionId: "intro" },
  { label: "Projects", sectionId: "case-studies" },
  { label: "Service Guide", sectionId: "works" },
];

type LenisLike = {
  scrollTo: (
    target: HTMLElement,
    options: { offset: number; immediate: boolean; duration: number }
  ) => void;
};

export default function Navbar({
  brand = "Gmedia Vietnam",
  navItems = defaultNavItems,
  className = "",
}: NavbarProps) {
  const [time, setTime] = useState("");
  const [toggleTheme, setToggleTheme] = useState<ToggleTheme>("dark");
  const toggleThemeRef = useRef<ToggleTheme>("dark");
  const [isHidden, setIsHidden] = useState(false);
  const isHiddenRef = useRef(false);
  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const isContactPage = pathname?.endsWith("/contact");
  const isWorkPage = pathname?.endsWith("/work");
  const isServicesPage = pathname?.endsWith("/services");
  const showTopRightMenu =
    isContactPage || isWorkPage || isServicesPage || isMenuOpen;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    const updateVisibility = () => {
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop;
      const delta = currentScrollY - lastScrollY.current;
      const threshold = 8;

      if (Math.abs(delta) < threshold) return;

      const shouldHide = delta > 0 && currentScrollY > 80;
      if (shouldHide !== isHiddenRef.current) {
        isHiddenRef.current = shouldHide;
        setIsHidden(shouldHide);
      }

      lastScrollY.current = currentScrollY;
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        updateVisibility();
        rafRef.current = null;
      });
    };

    lastScrollY.current = window.scrollY || document.documentElement.scrollTop;
    updateVisibility();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [pathname]);

  useEffect(() => {
    const onMenuState = (event: Event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      if (detail) setIsMenuOpen(detail.open);
    };

    window.addEventListener("nf-menu-state", onMenuState);
    return () => window.removeEventListener("nf-menu-state", onMenuState);
  }, []);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-nav-theme]")
    );

    if (!targets.length) return;

    const applyTheme = (theme?: string) => {
      const nextTheme: ToggleTheme = theme === "light" ? "light" : "dark";
      if (toggleThemeRef.current === nextTheme) return;
      toggleThemeRef.current = nextTheme;
      setToggleTheme(nextTheme);
    };

    const pickCurrent = () => {
      const viewportMarker = window.innerHeight * 0.35;
      const current = targets.find((target) => {
        const rect = target.getBoundingClientRect();
        return rect.top <= viewportMarker && rect.bottom >= viewportMarker;
      });
      applyTheme(current?.dataset.navTheme);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;
        applyTheme((visible[0].target as HTMLElement).dataset.navTheme);
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    targets.forEach((target) => observer.observe(target));
    pickCurrent();
    window.addEventListener("resize", pickCurrent);

    return () => {
      window.removeEventListener("resize", pickCurrent);
      observer.disconnect();
    };
  }, []);

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    event.preventDefault();

    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (!element) return;

      const lenis = (window as Window & { lenis?: LenisLike }).lenis;
      if (lenis) {
        lenis.scrollTo(element, {
          offset: 0,
          immediate: false,
          duration: 1.5,
        });
      } else {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    router.push(`/#${sectionId}`);
  };

  const handleMenuToggle = () => {
    window.dispatchEvent(new CustomEvent("nf-menu-toggle"));
  };

  const rootClassName = [
    styles.root,
    className,
    isHidden ? styles.rootHidden : "",
    showTopRightMenu ? styles.rootMenuTopRight : "",
    isServicesPage ? styles.rootLight : "",
    isServicesPage && isMenuOpen ? styles.rootDarkOverlay : "",
  ]
    .filter(Boolean)
    .join(" ");
  const toggleVars = toggleThemes[toggleTheme];
  const rootStyle = {
    "--music-toggle-bg": toggleVars.bg,
    "--music-toggle-fg": toggleVars.fg,
    "--music-toggle-border": toggleVars.border,
  } as CSSProperties;

  return (
    <nav className={rootClassName} style={rootStyle}>
      <div className={styles.col}>
        <div className={`${styles.subCol} ${styles.logo}`}>
          <Link href="/">
            <h3>{brand}</h3>
          </Link>
        </div>
        <div className={`${styles.subCol} ${styles.time}`}>
          <p>{time}</p>
        </div>
      </div>

      <div className={styles.col}>
        {!showTopRightMenu && (
          <div className={`${styles.subCol} ${styles.navItems}`}>
            {navItems.map((item) => (
              <a
                key={item.sectionId}
                href={`#${item.sectionId}`}
                onClick={(e) => handleNavigation(e, item.sectionId)}
              >
                <p>{item.label}</p>
              </a>
            ))}
            <button
              type="button"
              className={styles.menuButton}
              onClick={handleMenuToggle}
              aria-expanded={isMenuOpen}
              aria-controls="nf-menu-overlay"
            >
              <p>Menu</p>
            </button>
          </div>
        )}
        <div className={`${styles.subCol} ${styles.musicWrap}`}>
          {showTopRightMenu ? (
            <button
              type="button"
              className={`${styles.menuButton} ${styles.menuButtonContact}`}
              onClick={handleMenuToggle}
              aria-expanded={isMenuOpen}
              aria-controls="nf-menu-overlay"
            >
              <p>Menu</p>
            </button>
          ) : (
            <MusicToggle />
          )}
        </div>
      </div>
    </nav>
  );
}
