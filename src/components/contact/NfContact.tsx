"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useNfPixelatedVideo } from "@/components/effects/useNfPixelatedVideo";
import styles from "./NfContact.module.css";

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

  if (showAfter) {
    gsap.to(char, { opacity: 1, duration: 0.2, ease: "power1.out" });
  }

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
      if (!showAfter) {
        gsap.to(char, { opacity: 0, duration: 0.2, ease: "power1.out" });
      }
    }
  }, charDelay);

  char.nfScrambleInterval = interval;

  const timeout = window.setTimeout(() => {
    clearInterval(interval);
    char.nfScrambleInterval = undefined;
    char.nfScrambleTimeout = undefined;
    char.textContent = originalText;
    if (!showAfter) {
      gsap.to(char, { opacity: 0, duration: 0.2, ease: "power1.out" });
    }
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

export default function NfContact() {
  const rootRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useNfPixelatedVideo(rootRef, videoRef, styles.canvas);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const elements = root.querySelectorAll<HTMLElement>(
      `.${styles.copy} h4, .${styles.footer} p`
    );

    const instances: ScrambleInstance[] = [];
    const baseDelay = 0.35;
    const lineDelay = 0.06;

    elements.forEach((el, index) => {
      if (!el.textContent?.trim()) return;
      const instance = scrambleIn(el, baseDelay + index * lineDelay, {
        duration: 0.35,
        charDelay: 90,
        stagger: 40,
        maxIterations: 2,
      });
      instances.push(instance);
    });

    return () => {
      instances.forEach((instance) => instance?.revert());
    };
  }, []);

  return (
    <section className={styles.root} ref={rootRef} data-nav-theme="dark">
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/contact/contact-hero.mp4" type="video/mp4" />
      </video>

      <div className={styles.copy}>
        <div className={styles.main}>
          <div className={styles.col}>
            <h4 className={styles.header}>Giới thiệu</h4>
            <h4>
              G-Bros. Creation chuyên cung cấp các dịch vụ quay phim, chụp ảnh
              sản phẩm cho các doanh nghiệp.
            </h4>
            <h4>Trang · Sản phẩm/Dịch vụ</h4>
          </div>

          <div className={styles.col}>
            <h4>Hanoi, Vietnam</h4>
            <h4>091 552 57 25</h4>
            <h4>gbros.creation@gmail.com</h4>
            <h4>flickr.com/photos/154261091@N04/albums</h4>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInner}>
            <p>G-Bros. Creation</p>
            <p>{"\u00A9"} 2025 G-Bros. Creation</p>
          </div>
        </div>
      </div>
    </section>
  );
}
