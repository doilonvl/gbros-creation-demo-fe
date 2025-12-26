"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import styles from "./NfPageTransition.module.css";

type TransitionContextValue = {
  navigate: (href: string, opts?: { onBefore?: () => void }) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function NfTransitionProvider({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    gsap.set(overlay, { scaleY: 1, transformOrigin: "top" });
    gsap.to(overlay, {
      scaleY: 0,
      duration: 0.6,
      delay: 0.1,
      ease: "power2.inOut",
    });
  }, [pathname]);

  const navigate = (href: string, opts?: { onBefore?: () => void }) => {
    if (!href || href === "#" || href === pathname) return;

    if (
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      window.location.href = href;
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      router.push(href);
      return;
    }

    opts?.onBefore?.();

    pendingHrefRef.current = href;
    gsap.set(overlay, { scaleY: 0, transformOrigin: "bottom" });
    gsap.to(overlay, {
      scaleY: 1,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        const next = pendingHrefRef.current;
        pendingHrefRef.current = null;
        if (next) router.push(next);
      },
    });
  };

  return (
    <TransitionContext.Provider value={{ navigate }}>
      <div className={styles.transition} aria-hidden="true">
        <div ref={overlayRef} className={styles.overlay} />
      </div>
      {children}
    </TransitionContext.Provider>
  );
}

export function useNfTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("useNfTransition must be used within NfTransitionProvider");
  }
  return ctx;
}
