"use client";

import ShuffleText from "@/components/animation/ShuffleText";
import styles from "./HeroSection.module.css";

export type HeroSectionProps = {
  title?: string;
  subtitle?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  iconSrc?: string;
  iconAlt?: string;
  className?: string;
};

export default function HeroSection({
  title = "Gmedia Vietnam",
  subtitle = "Photo - Video - Styling - Print Design",
  heroImageSrc = "/Logo/Logo1.jpg",
  heroImageAlt = "",
  iconSrc = "/Home/hero-abstract-icon.png",
  iconAlt = "",
  className = "",
}: HeroSectionProps) {
  const rootClassName = className
    ? `${styles.heroSection} ${className}`
    : styles.heroSection;

  return (
    <section className={rootClassName} data-nav-theme="dark">
      <div className={styles.heroSectionImage}>
        <img src={heroImageSrc} alt={heroImageAlt} />
      </div>
      <div className={styles.heroSectionOverlay} aria-hidden="true" />
      <div className={styles.heroSectionGradient} aria-hidden="true" />
      <div className={styles.heroSectionContainer}>
        <div className={styles.heroSectionCopy}>
          <div className={styles.heroSectionCopyMain}>
            <ShuffleText
              as="h3"
              text={subtitle}
              className={styles.heroSectionSubtitle}
            />
            <ShuffleText
              as="h1"
              text={title}
              className={styles.heroSectionTitle}
            />
          </div>
          <div className={styles.heroSectionCopyAside}>
            <div className={styles.heroSectionIcon}>
              <img src={iconSrc} alt={iconAlt} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
