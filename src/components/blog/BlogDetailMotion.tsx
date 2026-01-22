"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type BlogDetailMotionProps = {
  children: ReactNode;
};

export default function BlogDetailMotion({ children }: BlogDetailMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const heroItems = gsap.utils.toArray<HTMLElement>("[data-hero]");
      if (heroItems.length) {
        gsap.fromTo(
          heroItems,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
          }
        );
      }

      const article = gsap.utils.toArray<HTMLElement>("[data-article]");
      article.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
          }
        );
      });

      const asideItems = gsap.utils.toArray<HTMLElement>("[data-aside]");
      asideItems.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
          }
        );
      });

      const latestCards = gsap.utils.toArray<HTMLElement>("[data-latest-card]");
      if (latestCards.length) {
        gsap.fromTo(
          latestCards,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: latestCards[0],
              start: "top 90%",
            },
          }
        );
      }

      const latestItems = gsap.utils.toArray<HTMLElement>("[data-latest-item]");
      if (latestItems.length) {
        gsap.fromTo(
          latestItems,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: latestItems[0],
              start: "top 90%",
            },
          }
        );
      }
    },
    { scope: rootRef }
  );

  return <div ref={rootRef}>{children}</div>;
}
