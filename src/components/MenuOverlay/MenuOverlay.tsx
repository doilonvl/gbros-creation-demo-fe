"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import gsap from "gsap";
import Link from "next/link";
import { useNfTransition } from "@/components/NfPageTransition";
import styles from "./MenuOverlay.module.css";

type ScrambleSpan = HTMLSpanElement & {
  nfScrambleInterval?: number;
  nfScrambleTimeout?: number;
  nfStaggerTimeout?: number;
};

type ScrambleInstance = {
  element: HTMLElement;
  chars: ScrambleSpan[];
  revert: () => void;
};

type ScrambleOptions = {
  duration?: number;
  charDelay?: number;
  stagger?: number;
  skipChars?: number;
  maxIterations?: number | null;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
const DEFAULTS = { duration: 0.25, charDelay: 50, stagger: 50 };
const CHAR_SELECTOR = `.${styles.char} > span`;

function splitToChars(element: HTMLElement): ScrambleInstance {
  const original = element.dataset.nfOriginalText ?? element.textContent ?? "";
  element.dataset.nfOriginalText = original;
  element.dataset.nfSplit = "true";
  element.textContent = "";

  const fragment = document.createDocumentFragment();
  const wordSpans: HTMLSpanElement[] = [];
  const parts = original.split(/(\s+)/);

  parts.forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      fragment.appendChild(document.createTextNode(part));
      return;
    }

    const word = document.createElement("span");
    word.className = styles.word;

    for (const ch of part) {
      const charWrap = document.createElement("span");
      charWrap.className = styles.char;
      const char = document.createElement("span");
      char.textContent = ch;
      charWrap.appendChild(char);
      word.appendChild(charWrap);
    }

    fragment.appendChild(word);
    wordSpans.push(word);
  });

  element.appendChild(fragment);

  wordSpans.forEach((word) => {
    const { width } = word.getBoundingClientRect();
    if (width > 0) {
      word.style.width = `${width}px`;
    }
  });

  const chars = Array.from(
    element.querySelectorAll<HTMLSpanElement>(CHAR_SELECTOR)
  );

  const revert = () => {
    element.textContent = original;
    element.removeAttribute("data-nf-split");
  };

  return { element, chars, revert };
}

function scrambleChar(
  char: ScrambleSpan,
  showAfter = true,
  duration = DEFAULTS.duration,
  charDelay = DEFAULTS.charDelay,
  maxIterations: number | null = null
) {
  if (!char.dataset.nfOriginalText) {
    char.dataset.nfOriginalText = char.textContent ?? "";
  }
  const originalText = char.dataset.nfOriginalText;
  let iterations = 0;
  const iterationsCount = maxIterations ?? Math.floor(Math.random() * 6) + 3;

  if (showAfter) gsap.set(char, { opacity: 1 });

  if (char.nfScrambleInterval) clearInterval(char.nfScrambleInterval);
  if (char.nfScrambleTimeout) clearTimeout(char.nfScrambleTimeout);

  const interval = window.setInterval(() => {
    char.textContent =
      originalText === " "
        ? " "
        : CHARS[Math.floor(Math.random() * CHARS.length)];
    iterations += 1;

    if (iterations >= iterationsCount) {
      clearInterval(interval);
      char.nfScrambleInterval = undefined;
      char.textContent = originalText;
      if (!showAfter) gsap.set(char, { opacity: 0 });
    }
  }, charDelay);

  char.nfScrambleInterval = interval;

  const timeout = window.setTimeout(() => {
    clearInterval(interval);
    char.nfScrambleInterval = undefined;
    char.nfScrambleTimeout = undefined;
    char.textContent = originalText;
    if (!showAfter) gsap.set(char, { opacity: 0 });
  }, duration * 1000);

  char.nfScrambleTimeout = timeout;
}

function scrambleText(
  chars: ScrambleSpan[],
  showAfter = true,
  duration = DEFAULTS.duration,
  charDelay = DEFAULTS.charDelay,
  stagger = DEFAULTS.stagger,
  skipChars = 0,
  maxIterations: number | null = null
) {
  chars.forEach((char, index) => {
    if (index < skipChars) {
      if (showAfter) gsap.set(char, { opacity: 1 });
      return;
    }

    if (char.nfStaggerTimeout) clearTimeout(char.nfStaggerTimeout);

    const timeout = window.setTimeout(() => {
      scrambleChar(char, showAfter, duration, charDelay, maxIterations);
      char.nfStaggerTimeout = undefined;
    }, (index - skipChars) * stagger);

    char.nfStaggerTimeout = timeout;
  });
}

function scrambleIn(
  element: HTMLElement,
  delay = 0,
  options: ScrambleOptions = {}
): ScrambleInstance {
  if (!element.textContent?.trim()) {
    return { element, chars: [], revert: () => {} };
  }

  const {
    duration = DEFAULTS.duration,
    charDelay = DEFAULTS.charDelay,
    stagger = DEFAULTS.stagger,
    skipChars = 0,
    maxIterations = null,
  } = options;

  const split = splitToChars(element);
  gsap.set(split.chars, { opacity: 0 });

  window.setTimeout(() => {
    scrambleText(
      split.chars,
      true,
      duration,
      charDelay,
      stagger,
      skipChars,
      maxIterations
    );
  }, delay * 1000);

  return split;
}

function scrambleOut(element: HTMLElement, delay = 0) {
  const chars = Array.from(
    element.querySelectorAll<HTMLSpanElement>(CHAR_SELECTOR)
  ) as ScrambleSpan[];
  if (!chars.length) return;

  gsap.set(chars, { opacity: 1 });

  window.setTimeout(() => {
    scrambleText([...chars].reverse(), false);
  }, delay * 1000);
}

function scrambleVisible(
  element: HTMLElement,
  delay = 0,
  options: ScrambleOptions = {}
): ScrambleInstance {
  if (!element.textContent?.trim()) {
    return { element, chars: [], revert: () => {} };
  }

  const {
    duration = DEFAULTS.duration,
    charDelay = DEFAULTS.charDelay,
    stagger = DEFAULTS.stagger,
    skipChars = 0,
    maxIterations = null,
  } = options;

  const split = splitToChars(element);
  gsap.set(split.chars, { opacity: 1 });

  window.setTimeout(() => {
    scrambleText(
      split.chars,
      true,
      duration,
      charDelay,
      stagger,
      skipChars,
      maxIterations
    );
  }, delay * 1000);

  return split;
}

const scrambleConfigs = {
  nav: { duration: 0.2, charDelay: 50, stagger: 25, maxIterations: 10 },
  footer: { duration: 0.1, charDelay: 25, stagger: 15, maxIterations: 5 },
};

export default function NfMenuOverlay() {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeMenuRef = useRef<(() => void) | null>(null);
  const { navigate } = useNfTransition();

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const navItems = Array.from(
      overlay.querySelectorAll<HTMLElement>(`.${styles.item}`)
    );
    const footerItems = Array.from(
      overlay.querySelectorAll<HTMLElement>(`.${styles.footerItem}`)
    );

    let isMenuOpen = false;
    let isAnimating = false;
    let scrambleInstances: ScrambleInstance[] = [];
    const hoverCleanups: Array<() => void> = [];

    const setAria = (open: boolean) => {
      overlay.setAttribute("aria-hidden", String(!open));
      window.dispatchEvent(
        new CustomEvent("nf-menu-state", { detail: { open } })
      );
    };

    const cleanupScrambleInstances = () => {
      scrambleInstances.forEach((instance) => instance?.revert());
      scrambleInstances = [];
    };

    const resetAllTextToOriginal = () => {
      const allLinks = overlay.querySelectorAll<HTMLAnchorElement>(
        `.${styles.link}`
      );
      allLinks.forEach((link) => {
        link.style.color = link.dataset.nfOriginalColor ?? "";
        const original = link.dataset.nfOriginalText ?? link.textContent ?? "";
        link.textContent = original;
      });
    };

    const addHoverScrambleEffect = (
      link: HTMLAnchorElement,
      type: "nav" | "footer"
    ) => {
      let isHoverAnimating = false;
      let currentSplit: ScrambleInstance | null = null;
      const config = scrambleConfigs[type];

      const onEnter = () => {
        if (isHoverAnimating) return;
        isHoverAnimating = true;

        if (!link.dataset.nfOriginalColor) {
          link.dataset.nfOriginalColor = getComputedStyle(link).color;
        }
        link.style.color = "var(--nf-menu-accent)";

        if (currentSplit) currentSplit.revert();
        currentSplit = scrambleVisible(link, 0, config);

        window.setTimeout(() => {
          isHoverAnimating = false;
        }, config.duration * 1000 + 50);
      };

      const onLeave = () => {
        link.style.color = link.dataset.nfOriginalColor ?? "";
      };

      link.addEventListener("mouseenter", onEnter);
      link.addEventListener("mouseleave", onLeave);

      hoverCleanups.push(() => {
        link.removeEventListener("mouseenter", onEnter);
        link.removeEventListener("mouseleave", onLeave);
      });
    };

    const addNavItemHoverEffects = () => {
      if (window.innerWidth < 1000) return;

      navItems.forEach((item) => {
        const link = item.querySelector<HTMLAnchorElement>(`.${styles.link}`);
        if (link) addHoverScrambleEffect(link, "nav");
      });

      footerItems.forEach((item) => {
        const links = item.querySelectorAll<HTMLAnchorElement>(
          `.${styles.link}`
        );
        links.forEach((link) => addHoverScrambleEffect(link, "footer"));
      });
    };

    const openMenu = () => {
      isAnimating = true;
      overlay.style.pointerEvents = "all";

      gsap.to(overlay, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 0.3,
        onComplete: () => {
          isAnimating = false;
        },
      });

      cleanupScrambleInstances();
      resetAllTextToOriginal();

      navItems.forEach((item, index) => {
        const link = item.querySelector<HTMLAnchorElement>(`.${styles.link}`);
        if (!link) return;
        gsap.set(item, { opacity: 1, yPercent: 0 });
        const instance = scrambleIn(link, index * 0.1, {
          duration: 0.15,
          charDelay: 50,
          stagger: 25,
          maxIterations: 5,
        });
        scrambleInstances.push(instance);
      });

      let footerLinkIndex = 0;
      footerItems.forEach((footerItem) => {
        const links = footerItem.querySelectorAll<HTMLAnchorElement>(
          `.${styles.link}`
        );
        links.forEach((link) => {
          const instance = scrambleIn(
            link,
            navItems.length * 0.1 + footerLinkIndex * 0.1,
            { duration: 0.15, charDelay: 50, stagger: 25, maxIterations: 5 }
          );
          scrambleInstances.push(instance);
          footerLinkIndex += 1;
        });
      });

      addNavItemHoverEffects();
      isMenuOpen = true;
      setAria(true);
    };

    const closeMenu = () => {
      isAnimating = true;
      overlay.style.pointerEvents = "none";

      navItems.forEach((item, index) => {
        const link = item.querySelector<HTMLAnchorElement>(`.${styles.link}`);
        if (link) scrambleOut(link, index * 0.1);
      });

      let footerLinkIndex = 0;
      footerItems.forEach((footerItem) => {
        const links = footerItem.querySelectorAll<HTMLAnchorElement>(
          `.${styles.link}`
        );
        links.forEach((link) => {
          scrambleOut(link, navItems.length * 0.1 + footerLinkIndex * 0.1);
          footerLinkIndex += 1;
        });
      });

      gsap.to(overlay, {
        clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
        duration: 0.3,
        onComplete: () => {
          gsap.set(navItems, { opacity: 0, yPercent: 100 });
          isAnimating = false;
        },
      });

      isMenuOpen = false;
      setAria(false);
    };

    const onToggle = () => {
      if (isAnimating) {
        gsap.killTweensOf([overlay, ...navItems]);
        cleanupScrambleInstances();
        resetAllTextToOriginal();
        isAnimating = false;
      }
      if (!isMenuOpen) openMenu();
      else closeMenu();
    };

    setAria(false);
    gsap.set(navItems, { opacity: 0, yPercent: 100 });
    closeMenuRef.current = closeMenu;

    const onToggleEvent = () => onToggle();
    const onScrollClose = () => {
      if (!isMenuOpen || isAnimating) return;
      closeMenu();
    };

    window.addEventListener("nf-menu-toggle", onToggleEvent as EventListener);
    window.addEventListener("scroll", onScrollClose, { passive: true });

    return () => {
      window.removeEventListener(
        "nf-menu-toggle",
        onToggleEvent as EventListener
      );
      window.removeEventListener("scroll", onScrollClose);
      hoverCleanups.forEach((fn) => fn());
      cleanupScrambleInstances();
    };
  }, []);

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    event.preventDefault();
    navigate(href, {
      onBefore: () => {
        closeMenuRef.current?.();
      },
    });
  };

  return (
    <div className={styles.menu}>
      <div
        ref={overlayRef}
        id="nf-menu-overlay"
        className={styles.overlay}
        aria-hidden="true"
      >
        <div className={styles.top} />

        <nav className={styles.nav}>
          <div className={styles.item}>
            <Link
              className={styles.link}
              href="/"
              onClick={(event) => handleNavClick(event, "/")}
            >
              HOME
            </Link>
          </div>
          {/* <div className={styles.item}>
            <Link
              className={styles.link}
              href="/work"
              onClick={(event) => handleNavClick(event, "/work")}
            >
              SHOWCASE
            </Link>
          </div> */}
          <div className={styles.item}>
            <Link
              className={styles.link}
              href="/services"
              onClick={(event) => handleNavClick(event, "/services")}
            >
              Service
            </Link>
          </div>
          <div className={styles.item}>
            <Link
              className={styles.link}
              href="/contact"
              onClick={(event) => handleNavClick(event, "/contact")}
            >
              CONTACT
            </Link>
          </div>
        </nav>

        <div className={styles.footer}>
          <div className={`${styles.footerItem} ${styles.footerLeft}`}>
            <a
              className={styles.link}
              href="https://www.facebook.com/gbros.creation?rdid=FuLafaKGrJPYl6XN&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17dZLvoMAF%2F#"
              target="_blank"
              rel="noopener noreferrer"
            >
              FACEBOOK
            </a>
            <a
              className={styles.link}
              href="https://www.instagram.com/gbros.creation?igsh=MWRtZjg3MHZxMGcwZQ%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
            >
              INSTAGRAM
            </a>
          </div>
          <div className={`${styles.footerItem} ${styles.footerRight}`}>
            <Link
              className={styles.link}
              href="/contact"
              onClick={(event) => handleNavClick(event, "/contact")}
            >
              [ DROP A LINE ]
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
