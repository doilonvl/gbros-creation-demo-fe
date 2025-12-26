"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./CarouselSection.module.css";

gsap.registerPlugin(ScrollTrigger);

export type CarouselItem = {
  id: string;
  title: string;
  bg: string;
  main: string;
  url: string;
};

export type CarouselSectionProps = {
  items?: CarouselItem[];
  className?: string;
};

const defaultItems: CarouselItem[] = [
  {
    id: "101",
    title: "Premium Product Set",
    bg: "/carousel/carousel1.jpg",
    main: "/carousel/carousel1.jpg",
    url: "/archive",
  },
  {
    id: "102",
    title: "F&B Video Series",
    bg: "/carousel/carousel2.jpg",
    main: "/carousel/carousel2.jpg",
    url: "/archive",
  },
  {
    id: "103",
    title: "Brand Collateral System",
    bg: "/carousel/carousel3.jpg",
    main: "/carousel/carousel3.jpg",
    url: "/archive",
  },
];

const CLIP_VISIBLE = "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)";
const CLIP_HIDDEN = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";

export default function CarouselSection({
  items = defaultItems,
  className = "",
}: CarouselSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;
      const root = rootRef.current;
      if (!root) return;

      const projects = Array.from(
        root.querySelectorAll(`.${styles.carouselProject}`)
      ) as HTMLElement[];

      if (!projects.length) return;

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: `+=${window.innerHeight * (projects.length - 1)}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress * (projects.length - 1);
          const currentSlide = Math.floor(progress);
          const slideProgress = progress - currentSlide;

          if (currentSlide < projects.length - 1) {
            gsap.set(projects[currentSlide], { clipPath: CLIP_VISIBLE });

            const nextSlideProgress = gsap.utils.interpolate(
              CLIP_HIDDEN,
              CLIP_VISIBLE,
              slideProgress
            );

            gsap.set(projects[currentSlide + 1], {
              clipPath: nextSlideProgress,
            });
          }

          projects.forEach((project, index) => {
            if (index < currentSlide) {
              gsap.set(project, { clipPath: CLIP_VISIBLE });
            } else if (index > currentSlide + 1) {
              gsap.set(project, { clipPath: CLIP_HIDDEN });
            }
          });
        },
      });

      gsap.set(projects[0], { clipPath: CLIP_VISIBLE });

      return () => {
        trigger.kill();
      };
    },
    { scope: rootRef }
  );

  const rootClassName = className
    ? `${styles.carouselSection} ${className}`
    : styles.carouselSection;

  return (
    <section className={rootClassName} ref={rootRef}>
      {items.map((item, index) => (
        <div
          key={item.id}
          id={`project-${item.id}`}
          className={styles.carouselProject}
          style={{ clipPath: index === 0 ? CLIP_VISIBLE : CLIP_HIDDEN }}
        >
          <div className={styles.carouselProjectBg}>
            <Image
              src={item.bg}
              alt=""
              fill
              sizes="100vw"
              className={styles.carouselProjectBgImage}
            />
            <div className={styles.carouselOverlay} aria-hidden="true" />
            <div className={styles.carouselGradient} aria-hidden="true" />
          </div>

          <div className={styles.carouselProjectMain}>
            <Image
              src={item.main}
              alt=""
              fill
              sizes="(max-width: 900px) 50vw, 25vw"
              className={styles.carouselProjectMainImage}
            />
          </div>

          <div className={styles.carouselProjectHeader}>
            <div className={styles.carouselProjectId}>
              <h2>Project {item.id}</h2>
            </div>
            <div className={styles.carouselProjectSpacer} />
            <div className={styles.carouselProjectTitle}>
              <h2>{item.title}</h2>
            </div>
          </div>

          <div className={styles.carouselProjectInfo}>
            <div className={styles.carouselProjectUrl}>
              <Link href={item.url}>( View Project )</Link>
            </div>
          </div>

          <Link
            href={item.url}
            className={styles.carouselProjectOverlayLink}
            aria-label={`View ${item.title} project`}
          />
        </div>
      ))}
    </section>
  );
}
