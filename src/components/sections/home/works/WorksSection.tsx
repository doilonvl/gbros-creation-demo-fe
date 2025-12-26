"use client";

import ShuffleText from "@/components/animation/ShuffleText";
import styles from "./WorksSection.module.css";

export type WorksSectionProps = {
  heading?: string;
  label?: string;
  title?: string;
  description?: string;
  id?: string;
  className?: string;
};

export default function WorksSection({
  heading = "Process & Capability",
  label = "[ How We Work ]",
  title = "From brief to final delivery.",
  description = "We plan, produce, style, shoot, edit, and deliver assets ready for marketing across platforms.",
  id = "works",
  className = "",
}: WorksSectionProps) {
  const rootClassName = className
    ? `${styles.worksSection} ${className}`
    : styles.worksSection;

  return (
    <section className={rootClassName} id={id} data-nav-theme="light">
      <div className={styles.worksSectionHeader}>
        <div className={styles.worksSectionContainer}>
          <ShuffleText
            as="h2"
            text={heading}
            triggerOnScroll
            className={styles.worksSectionHeaderTitle}
          />
        </div>
      </div>

      <div className={styles.worksSectionContent}>
        <div className={styles.worksSectionContainer}>
          <div className={styles.worksSectionCol}>
            <p className={styles.worksSectionPrimary}>{label}</p>
          </div>
          <div className={styles.worksSectionCol}>
            <div className={styles.worksSectionCopy}>
              <h2 className={styles.worksSectionCopyTitle}>{title}</h2>
              <p className={styles.worksSectionBody}>{description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
