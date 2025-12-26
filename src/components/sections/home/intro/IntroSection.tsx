"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import Marquee from "./Marquee";
import GeometricBackground from "./GeometricBackground";
import styles from "./IntroSection.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type PromptItem = {
  imageSrc: string;
  imageAlt?: string;
  title: string;
};

export type IntroSectionProps = {
  label?: string;
  paragraphs?: string[];
  promptTitle?: string;
  promptItems?: PromptItem[];
  className?: string;
};

const defaultParagraphs = [
  "Gmedia Vietnam delivers end-to-end photo production for all product categories and industries.",
  "We also handle full video production for F&B, cosmetics, accessories, and jewelry, with styling support for both shoots and filming.",
  "The team designs brand collateral such as menus, price lists, sales kits, and cards to keep everything consistent.",
];

const defaultPromptItems: PromptItem[] = [
  {
    imageSrc: "/Home/prompt-1.jpg",
    title: "End-to-end product and brand photography",
  },
  {
    imageSrc: "/Home/prompt-2.jpg",
    title: "Full video production for key industries",
  },
];

export default function IntroSection({
  label = "[ About ]",
  paragraphs = defaultParagraphs,
  promptTitle = "// CORE SERVICES: Photo - Video - Styling - Print Design",
  promptItems = defaultPromptItems,
  className = "",
}: IntroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const geoRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !geoRef.current) return;

      gsap.set(geoRef.current, { y: 0, rotation: 0, force3D: true });

      const tween = gsap.fromTo(
        geoRef.current,
        { y: 0, rotation: 0 },
        {
          y: -600,
          rotation: 240,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef }
  );

  const rootClassName = className
    ? `${styles.introSection} ${className}`
    : styles.introSection;

  return (
    <section
      className={rootClassName}
      id="intro"
      ref={sectionRef}
      data-nav-theme="dark"
    >
      <div className={styles.introSectionGeoBg} aria-hidden="true" ref={geoRef}>
        <GeometricBackground />
      </div>

      <Marquee />

      <div className={styles.introSectionContent}>
        <div className={styles.introSectionContainer}>
          <div className={styles.introSectionCol}>
            <p className={styles.introSectionPrimary}>{label}</p>
          </div>

          <div className={styles.introSectionCol}>
            <div className={styles.introSectionCopy}>
              {paragraphs.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </div>

            <div className={styles.introSectionPrompt}>
              <div className={styles.introSectionPromptHeader}>
                <h4>{promptTitle}</h4>
              </div>

              <div className={styles.introSectionPromptResults}>
                {promptItems.map((item, index) => (
                  <div className={styles.introSectionPromptItem} key={index}>
                    <div className={styles.introSectionPromptItemImage}>
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt ?? ""}
                        fill
                        sizes="(max-width: 900px) 100vw, 35vw"
                        className={styles.introSectionPromptItemImageImg}
                      />
                      <div
                        className={styles.introSectionScanOverlay}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={styles.introSectionPromptItemTitle}>
                      <h4>{item.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
