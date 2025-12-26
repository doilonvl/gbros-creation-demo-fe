"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ElementType,
} from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./ShuffleText.module.css";

gsap.registerPlugin(ScrollTrigger);

type SplitTypeInstance = {
  chars: HTMLElement[];
  revert: () => void;
};

export type ShuffleTextProps<T extends ElementType = "div"> = {
  text: string;
  as?: T;
  className?: string;
  triggerOnScroll?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "children" | "className">;

export default function ShuffleText<T extends ElementType = "div">({
  text,
  as,
  className = "",
  triggerOnScroll = false,
  ...props
}: ShuffleTextProps<T>) {
  const containerRef = useRef<HTMLElement | null>(null);
  const splitInstance = useRef<SplitTypeInstance | null>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth > 900);
    };

    checkSize();
    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isDesktop) {
      if (splitInstance.current) {
        splitInstance.current.revert();
        splitInstance.current = null;
      }
      gsap.set(container, { opacity: 1 });
    } else {
      const init = async () => {
        const { default: SplitType } = await import("split-type");
        const activeContainer = containerRef.current;
        if (!activeContainer) return;

        if (splitInstance.current) {
          splitInstance.current.revert();
          splitInstance.current = null;
        }

        splitInstance.current = new SplitType(activeContainer, {
          types: "lines,words,chars",
          tagName: "span",
        }) as SplitTypeInstance;

        const chars = splitInstance.current.chars;
        const signs = ["+", "-"];

        gsap.set(chars, { opacity: 0 });

        const animateChars = () => {
          chars.forEach((char) => {
            const originalLetter = char.textContent ?? "";
            let shuffleCount = 0;
            const maxShuffles = 5;

            gsap.to(char, {
              opacity: 1,
              duration: 0.1,
              delay: gsap.utils.random(0, 0.75),
              onStart: () => {
                const shuffle = () => {
                  if (shuffleCount < maxShuffles) {
                    char.textContent =
                      signs[Math.floor(Math.random() * signs.length)];
                    shuffleCount++;
                    requestAnimationFrame(() => setTimeout(shuffle, 75));
                  } else {
                    char.textContent = originalLetter;
                  }
                };
                shuffle();
              },
            });
          });
        };

        if (triggerOnScroll) {
          const trigger = ScrollTrigger.create({
            trigger: activeContainer,
            start: "top bottom-=100",
            onEnter: () => {
              animateChars();
            },
            once: true,
          });
          triggersRef.current.push(trigger);
        } else {
          animateChars();
        }
      };

      void init();
    }

    return () => {
      triggersRef.current.forEach((trigger) => trigger.kill());
      triggersRef.current = [];

      if (splitInstance.current) {
        splitInstance.current.revert();
        splitInstance.current = null;
      }
    };
  }, [text, triggerOnScroll, isDesktop]);

  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      ref={containerRef as unknown as ComponentPropsWithRef<T>["ref"]}
      className={`${styles.root} ${className}`.trim()}
      {...(props as ComponentPropsWithoutRef<T>)}
    >
      {text}
    </Component>
  );
}
