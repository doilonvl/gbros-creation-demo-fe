"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./CaseStudiesItems.module.css";

gsap.registerPlugin(ScrollTrigger);

export type CaseStudyItem = {
  id: string;
  title: string;
  label: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  url: string;
  ctaLabel?: string;
  imageLinkLabel?: string;
};

export type CaseStudiesItemsProps = {
  items?: CaseStudyItem[];
  className?: string;
};

const defaultItems: CaseStudyItem[] = [
  {
    id: "1",
    title: "End-to-end Photography",
    label: "[ All product categories ]",
    description:
      "Full production from brief to final delivery across every product type and industry.",
    imageSrc: "/Home/case-study-1.jpg",
    imageAlt: "End-to-end product photography",
    url: "/archive",
    ctaLabel: "View Project",
    imageLinkLabel: "View Project",
  },
  {
    id: "2",
    title: "Full Video Production",
    label: "[ F&B, cosmetics, accessories, jewelry ]",
    description:
      "Concept, shooting, editing, and finishing tailored for product and F&B brands.",
    imageSrc: "/Home/case-study-2.jpg",
    imageAlt: "Full video production",
    url: "/archive",
    ctaLabel: "View Project",
    imageLinkLabel: "View Project",
  },
  {
    id: "3",
    title: "Styling & Print Design",
    label: "[ Menu, price list, sales kit, cards ]",
    description:
      "Styling collaboration plus brand collateral design to keep visuals aligned.",
    imageSrc: "/Home/case-study-3.jpg",
    imageAlt: "Styling and print design",
    url: "/archive",
    ctaLabel: "View Project",
    imageLinkLabel: "View Project",
  },
];

export default function CaseStudiesItems({
  items = defaultItems,
  className = "",
}: CaseStudiesItemsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const imageWrappers = Array.from(
        root.querySelectorAll(`.${styles.image}`)
      ) as HTMLDivElement[];

      const triggers: ScrollTrigger[] = [];

      imageWrappers.forEach((wrapper, index) => {
        const imgElement = wrapper.querySelector("img");
        if (!imgElement) return;

        const scaleTrigger = ScrollTrigger.create({
          trigger: wrapper,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            gsap.to(imgElement, {
              scale: 2 - self.progress,
              duration: 0.1,
              ease: "none",
            });
          },
        });

        const pinTrigger = ScrollTrigger.create({
          trigger: wrapper,
          start: "top top",
          end: () => {
            const item = root.querySelector(
              `.${styles.item}`
            ) as HTMLElement | null;
            const itemHeight = item ? item.offsetHeight : 0;
            return `+=${itemHeight * (imageWrappers.length - index - 1)}`;
          },
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        triggers.push(scaleTrigger, pinTrigger);
      });

      return () => {
        triggers.forEach((trigger) => trigger.kill());
      };
    },
    { scope: rootRef }
  );

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <section className={rootClassName} ref={rootRef} data-nav-theme="dark">
      <div className={`${styles.col} ${styles.itemsContent}`}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemContainer}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.primary}>{item.label}</p>

              <div className={styles.itemInnerImage}>
                <img src={item.imageSrc} alt={item.imageAlt ?? ""} />
                <div className={styles.imageOverlay} aria-hidden="true" />
              </div>

              <p className={styles.itemDescription}>{item.description}</p>

              <div className={styles.itemInnerLink}>
                <Link href={item.url}>{item.ctaLabel ?? "View Project"}</Link>
                <span className={styles.linkIcon}>
                  <ArrowUpRight size={24} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${styles.col} ${styles.itemsImages}`}>
        {items.map((item) => (
          <div key={item.id} className={styles.image}>
            <img src={item.imageSrc} alt={item.imageAlt ?? ""} />
            <div className={styles.imageOverlay} aria-hidden="true" />
            <div className={styles.imageLink}>
              <Link href={item.url}>
                <span>
                  (&nbsp; {item.imageLinkLabel ?? "View Project"}{" "}
                  <ArrowUpRight />
                  &nbsp;)
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
