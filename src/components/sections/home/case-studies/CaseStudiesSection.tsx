"use client";

import ShuffleText from "@/components/animation/ShuffleText";
import styles from "./CaseStudiesSection.module.css";

export type CaseStudiesSectionProps = {
  heading?: string;
  label?: string;
  title?: string;
  description?: string;
  id?: string;
  className?: string;
};

export default function CaseStudiesSection({
  heading = "Core Services",
  label = "[ What We Do ]",
  title = "End-to-end production for brands and products.",
  description = "From photo and video to styling and print design, we handle the full pipeline to keep visuals consistent and professional.",
  id = "case-studies",
  className = "",
}: CaseStudiesSectionProps) {
  const rootClassName = className
    ? `${styles.section} ${className}`
    : styles.section;

  return (
    <section className={rootClassName} id={id} data-nav-theme="dark">
      <div className={styles.header}>
        <div className={styles.container}>
          <ShuffleText
            as="h2"
            text={heading}
            triggerOnScroll
            className={styles.headerTitle}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.col}>
            <p className={styles.primary}>{label}</p>
          </div>
          <div className={styles.col}>
            <div className={styles.copy}>
              <h2 className={styles.copyTitle}>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
