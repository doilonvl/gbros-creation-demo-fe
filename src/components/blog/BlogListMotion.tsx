"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type BlogListMotionProps = {
  children: ReactNode;
};

export default function BlogListMotion({ children }: BlogListMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const heroItems = gsap.utils.toArray<HTMLElement>("[data-hero]");
      if (heroItems.length) {
        gsap.fromTo(
          heroItems,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.1,
          }
        );
      }

      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            },
          }
        );
      });

      const latestItems = gsap.utils.toArray<HTMLElement>("[data-latest-item]");
      if (latestItems.length) {
        gsap.fromTo(
          latestItems,
          { x: 16, opacity: 0 },
          {
            x: 0,
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

      const pagination = gsap.utils.toArray<HTMLElement>("[data-pagination]");
      pagination.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
            },
          }
        );
      });
    },
    { scope: rootRef }
  );

  return <div ref={rootRef}>{children}</div>;
}
