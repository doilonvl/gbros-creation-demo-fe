"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";
import styles from "./ProgressBar.module.css";

export default function ProgressBar() {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const animatingRef = useRef(false);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const progressBar = progressRef.current;
    if (!progressBar) return;

    if (isFirstLoadRef.current) {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const initialProgress = scrollTop / (documentHeight - windowHeight);
      gsap.set(progressBar, { scaleX: initialProgress });
      isFirstLoadRef.current = false;
    }

    const updateProgress = () => {
      if (animatingRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = scrollTop / (documentHeight - windowHeight);

      gsap.to(progressBar, {
        scaleX: progress,
        duration: 0.1,
        ease: "none",
        overwrite: true,
      });
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  useEffect(() => {
    const progressBar = progressRef.current;
    if (!progressBar || isFirstLoadRef.current) return;

    animatingRef.current = true;

    gsap.to(progressBar, {
      scaleX: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        animatingRef.current = false;
      },
    });
  }, [pathname, searchParams]);

  return <div ref={progressRef} className={styles.bar} />;
}
