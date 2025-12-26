"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./Marquee.module.css";

export type MarqueeProps = {
  text?: string;
  repeatCount?: number;
  duration?: number;
  className?: string;
};

export default function Marquee({
  text = "Gmedia Vietnam - Photo & Video - Styling - Print Design -",
  repeatCount = 4,
  duration = 22,
  className = "",
}: MarqueeProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const directionRef = useRef<number>(-1);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const content = wrapper.querySelector(
      "[data-marquee-content]"
    ) as HTMLDivElement | null;

    if (!content) return;

    const clones: HTMLDivElement[] = [];
    for (let i = 0; i < 3; i++) {
      const clone = content.cloneNode(true) as HTMLDivElement;
      clone.setAttribute("aria-hidden", "true");
      wrapper.appendChild(clone);
      clones.push(clone);
    }

    const singleWidth = content.offsetWidth;
    const totalWidth = singleWidth * 2;

    const createAnimation = () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }

      let currentX = Number(gsap.getProperty(wrapper, "x"));

      if (currentX <= -totalWidth) {
        currentX = currentX % singleWidth;
        gsap.set(wrapper, { x: currentX });
      } else if (currentX >= 0) {
        currentX = -singleWidth + (currentX % singleWidth);
        gsap.set(wrapper, { x: currentX });
      }

      const targetX =
        directionRef.current === -1
          ? currentX - singleWidth
          : currentX + singleWidth;

      const remainingDistance = Math.abs(targetX - currentX);
      const remainingDuration = (remainingDistance / singleWidth) * duration;

      animationRef.current = gsap.to(wrapper, {
        x: targetX,
        duration: remainingDuration,
        ease: "none",
        repeat: -1,
        onRepeat: () => {
          let resetX = Number(gsap.getProperty(wrapper, "x"));

          if (directionRef.current === -1 && resetX <= -totalWidth) {
            resetX = resetX % singleWidth;
          } else if (directionRef.current === 1 && resetX >= 0) {
            resetX = -singleWidth + (resetX % singleWidth);
          }

          gsap.set(wrapper, { x: resetX });
        },
      });
    };

    createAnimation();

    let lastScrollTop = 0;
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      const newDirection = st > lastScrollTop ? -1 : 1;

      if (newDirection !== directionRef.current) {
        directionRef.current = newDirection;
        createAnimation();
      }

      lastScrollTop = st <= 0 ? 0 : st;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
      clones.forEach((clone) => clone.remove());
    };
  }, [text, repeatCount, duration]);

  const displayText = Array.from({ length: repeatCount })
    .map(() => text)
    .join(" ");

  const rootClassName = className
    ? `${styles.introMarquee} ${className}`
    : styles.introMarquee;

  return (
    <div className={rootClassName}>
      <div className={styles.introMarqueeWrapper} ref={wrapperRef}>
        <div className={styles.introMarqueeContent} data-marquee-content>
          <h1 className={styles.introMarqueeTitle}>{displayText}</h1>
        </div>
      </div>
    </div>
  );
}
