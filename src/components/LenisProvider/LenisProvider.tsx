"use client";

import { useEffect, type ReactNode } from "react";
import { ReactLenis, useLenis } from "lenis/react";

type LenisProviderProps = {
  children: ReactNode;
};

const lenisOptions = {
  duration: 1.5,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: "vertical" as const,
  smooth: true,
  smoothTouch: false,
  touchMultiplier: 2,
};

function LenisBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const win = window as Window & { lenis?: typeof lenis };
    win.lenis = lenis;
    return () => {
      if (win.lenis === lenis) {
        delete win.lenis;
      }
    };
  }, [lenis]);

  return null;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis root options={lenisOptions}>
      <LenisBridge />
      {children}
    </ReactLenis>
  );
}
